
import { Task, TaskStatus, TaskPriority, Comment, Project, User } from '../types';
import { projectService } from './projectService';
import { notificationService } from './notificationService';
import { settingsService } from './settingsService';
import { userService } from './userService';
import { syncGuardService } from './syncGuardService';
import { realtimeService } from './realtimeService';
import { estimationService } from './estimationService';
import { groupService } from './groupService';
import { createId } from '../utils/id';
import {
  getTaskAssigneeIds,
  normalizeTaskForRead,
  readStoredTasks,
  TASKS_STORAGE_KEY,
  withVersion,
  writeStoredTasks
} from './task-service/storage';

const emitTasksUpdated = (orgId: string, actorId?: string, taskId?: string) => {
  realtimeService.publish({
    type: 'TASKS_UPDATED',
    orgId,
    actorId,
    payload: taskId ? { taskId } : undefined
  });
};

const stageLabel = (status?: string) =>
  (status || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase())
    .trim() || 'Unknown';

const formatDuration = (ms: number) => {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const resolveActorDisplayName = (orgId: string, userId: string, displayName?: string) => {
  if (displayName?.trim()) return displayName.trim();
  const user = userService.getUsers(orgId).find((candidate) => candidate.id === userId);
  return user?.displayName || 'Unknown user';
};

const createAuditEntry = (userId: string, displayName: string, action: string) => ({
  id: createId(),
  userId,
  displayName,
  action,
  timestamp: Date.now()
});

const isDoneStatusForProject = (orgId: string, projectId: string, status?: string) => {
  if (!status) return false;
  const normalized = status.toLowerCase();
  if (normalized === 'done' || normalized === 'completed') return true;
  const project = projectService.getProjects(orgId).find((item) => item.id === projectId);
  const doneStageId = project?.stages?.[project.stages.length - 1]?.id;
  if (doneStageId && status === doneStageId) return true;
  return normalized.includes('done');
};

const buildUpdateAuditActions = (
  task: Task,
  updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>,
  orgId: string
): string[] => {
  const actions: string[] = [];

  if (typeof updates.title === 'string' && updates.title !== task.title) {
    actions.push(`renamed task to "${updates.title}"`);
  }
  if (typeof updates.description === 'string' && updates.description !== task.description) {
    actions.push(updates.description.trim() ? 'updated description' : 'cleared description');
  }
  if (typeof updates.status === 'string' && updates.status !== task.status) {
    actions.push(`moved task to ${stageLabel(updates.status)}`);
  }
  if (updates.priority && updates.priority !== task.priority) {
    actions.push(`set priority to ${updates.priority}`);
  }
  if ('dueDate' in updates && updates.dueDate !== task.dueDate) {
    actions.push(updates.dueDate ? `set due date to ${new Date(updates.dueDate).toLocaleDateString()}` : 'cleared due date');
  }
  if (Array.isArray(updates.tags) && JSON.stringify(updates.tags) !== JSON.stringify(task.tags || [])) {
    actions.push(updates.tags.length > 0 ? `updated tags (${updates.tags.length})` : 'cleared tags');
  }
  if (Array.isArray(updates.blockedByIds) && JSON.stringify(updates.blockedByIds) !== JSON.stringify(task.blockedByIds || [])) {
    actions.push(`updated dependencies (${updates.blockedByIds.length})`);
  }
  if (Array.isArray(updates.subtasks) && JSON.stringify(updates.subtasks) !== JSON.stringify(task.subtasks || [])) {
    const completed = updates.subtasks.filter((subtask) => subtask.isCompleted).length;
    actions.push(`updated subtasks (${completed}/${updates.subtasks.length} complete)`);
  }
  if (typeof updates.timeLogged === 'number' && updates.timeLogged !== (task.timeLogged || 0)) {
    const delta = updates.timeLogged - (task.timeLogged || 0);
    actions.push(delta > 0 ? `logged ${formatDuration(delta)} manually` : 'updated tracked time');
  }
  if (typeof updates.estimateMinutes === 'number' && updates.estimateMinutes !== task.estimateMinutes) {
    actions.push(`updated estimate to ${updates.estimateMinutes}m`);
  }
  if ('estimateRiskApprovedAt' in updates && updates.estimateRiskApprovedAt && updates.estimateRiskApprovedAt !== task.estimateRiskApprovedAt) {
    actions.push('approved risk-adjusted completion');
  }
  if (typeof updates.isAtRisk === 'boolean' && updates.isAtRisk !== Boolean(task.isAtRisk)) {
    actions.push(updates.isAtRisk ? 'marked task at risk' : 'marked task on track');
  }
  if ('approvedAt' in updates && updates.approvedAt && updates.approvedAt !== task.approvedAt) {
    actions.push('approved this task');
  }
  if (typeof updates.movedBackReason === 'string' && updates.movedBackReason.trim()) {
    const fromStage = updates.movedBackFromStatus ? stageLabel(updates.movedBackFromStatus) : stageLabel(task.status);
    actions.push(`moved task backward from ${fromStage}: "${updates.movedBackReason.trim()}"`);
  }

  const previousAssigneeIds = getTaskAssigneeIds(task);
  const nextAssigneeIds =
    Array.isArray(updates.assigneeIds) && updates.assigneeIds.length > 0
      ? updates.assigneeIds
      : typeof updates.assigneeId === 'string'
        ? (updates.assigneeId ? [updates.assigneeId] : [])
        : previousAssigneeIds;
  if (JSON.stringify(previousAssigneeIds) !== JSON.stringify(nextAssigneeIds)) {
    const usersById = new Map(userService.getUsers(orgId).map((user) => [user.id, user.displayName]));
    const names = nextAssigneeIds.map((id) => usersById.get(id) || 'Unknown');
    actions.push(names.length > 0 ? `updated assignees: ${names.join(', ')}` : 'cleared assignees');
  }
  if (Array.isArray(updates.securityGroupIds) && JSON.stringify(updates.securityGroupIds) !== JSON.stringify(task.securityGroupIds || [])) {
    actions.push(updates.securityGroupIds.length > 0 ? `updated security groups (${updates.securityGroupIds.length})` : 'cleared security groups');
  }

  return actions;
};

export const taskService = {
  getAllTasksForOrg: (orgId: string): Task[] => {
    try {
      const allTasks = readStoredTasks();
      return allTasks
        .filter((t) => t.orgId === orgId)
        .map(normalizeTaskForRead)
        .sort((a, b) => a.order - b.order);
    } catch (e) {
      console.error('Error fetching all org tasks:', e);
      return [];
    }
  },

  getTasks: (userId: string, orgId: string): Task[] => {
    try {
      const allTasks = readStoredTasks();
      const activeProjectIds = new Set(
        projectService
          .getProjects(orgId)
          .filter((p) => !p.isArchived && !p.isCompleted && !p.isDeleted)
          .map((p) => p.id)
      );
      activeProjectIds.add('general');
      const allUsers = userService.getUsers(orgId);
      const currentUser = allUsers.find(u => u.id === userId);
      const isAdmin = currentUser?.role === 'admin';
      const userProjects = projectService.getProjectsForUser(userId, orgId);
      const userProjectIds = userProjects.map(p => p.id);
      
      return allTasks
        .filter(
          (t) =>
            t.orgId === orgId &&
            activeProjectIds.has(t.projectId) &&
            (
              isAdmin ||
              t.userId === userId ||
              getTaskAssigneeIds(t).includes(userId) ||
              userProjectIds.includes(t.projectId) ||
              t.projectId === 'general'
            )
        )
        .map(normalizeTaskForRead)
        .sort((a, b) => a.order - b.order);
    } catch (e) {
      console.error("Critical failure fetching Velo telemetry:", e);
      return [];
    }
  },

  createTask: (
    userId: string,
    orgId: string,
    projectId: string,
    title: string,
    description: string,
    priority: TaskPriority,
    tags: string[] = [],
    dueDate?: number,
    assigneeIds: string[] = [],
    securityGroupIds: string[] = [],
    estimateMinutes?: number,
    estimateProvidedBy?: string
  ): Task => {
    const allTasks = readStoredTasks();
    const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order)) : 0;
    const allUsers = userService.getUsers(orgId);
    const allProjects = projectService.getProjects(orgId);
    const resolvedAssignments = groupService.resolveAssigneeIdsFromGroups(
      orgId,
      projectId || 'general',
      assigneeIds,
      securityGroupIds,
      allUsers,
      allProjects
    );
    const normalizedAssigneeIds = resolvedAssignments.assigneeIds;
    const project = projectService.getProjects(orgId).find((item) => item.id === projectId);
    const defaultStage = project?.stages?.[0]?.id || TaskStatus.TODO;
    
    const actorDisplayName = resolveActorDisplayName(orgId, userId);
    const newTask: Task = {
      id: createId(),
      orgId,
      userId,
      assigneeId: normalizedAssigneeIds[0],
      assigneeIds: normalizedAssigneeIds,
      securityGroupIds: resolvedAssignments.securityGroupIds,
      projectId: projectId || 'general',
      title,
      description,
      status: defaultStage,
      priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      order: maxOrder + 1,
      subtasks: [],
      tags,
      dueDate,
      comments: [],
      auditLog: [{
        id: createId(),
        userId,
        displayName: actorDisplayName,
        action: 'created this task',
        timestamp: Date.now()
      }],
      timeLogged: 0,
      blockedByIds: [],
      estimateMinutes: estimateMinutes && estimateMinutes > 0 ? Math.round(estimateMinutes) : undefined,
      estimateProvidedBy: estimateProvidedBy || userId,
      estimateProvidedAt: estimateMinutes && estimateMinutes > 0 ? Date.now() : undefined
    };
    
    writeStoredTasks([...allTasks, newTask]);
    syncGuardService.markLocalMutation();
    estimationService.recomputeOrgProfiles(orgId, [...allTasks, newTask]);
    emitTasksUpdated(orgId, userId, newTask.id);
    const settings = settingsService.getSettings();
    if (settings.enableNotifications) {
      normalizedAssigneeIds
        .filter((assigneeId) => assigneeId !== userId)
        .forEach((assigneeId) =>
          notificationService.addNotification({
            userId: assigneeId,
            title: 'Node Provisioned',
            message: `Assigned: ${title}`,
            type: 'ASSIGNMENT',
            linkId: newTask.id
          })
        );
    }
    return newTask;
  },

  getTaskById: (id: string): Task | undefined => {
    const allTasks = readStoredTasks();
    const task = allTasks.find((item) => item.id === id);
    return task ? withVersion(task) : undefined;
  },

  updateTask: (userId: string, orgId: string, id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>, displayName?: string): Task[] => {
    const allTasks = readStoredTasks();
    let notifyAssigneeIds: string[] = [];
    let notifyTaskTitle: string = '';

    const actorDisplayName = resolveActorDisplayName(orgId, userId, displayName);
    const updatedTasks = allTasks.map(t => {
      if (t.id === id) {
        const previousAssignees = getTaskAssigneeIds(t);
        const normalizedUpdates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>> = { ...updates };

        const allUsers = userService.getUsers(orgId);
        const allProjects = projectService.getProjects(orgId);
        const hasAssigneeUpdates = Array.isArray(normalizedUpdates.assigneeIds) || typeof normalizedUpdates.assigneeId === 'string';
        const hasGroupUpdates = Array.isArray(normalizedUpdates.securityGroupIds);

        if (hasAssigneeUpdates || hasGroupUpdates) {
          const nextDirectAssigneeIds =
            Array.isArray(normalizedUpdates.assigneeIds)
              ? normalizedUpdates.assigneeIds
              : typeof normalizedUpdates.assigneeId === 'string'
                ? (normalizedUpdates.assigneeId ? [normalizedUpdates.assigneeId] : [])
                : previousAssignees;
          const nextGroupIds = Array.isArray(normalizedUpdates.securityGroupIds)
            ? normalizedUpdates.securityGroupIds
            : (Array.isArray(t.securityGroupIds) ? t.securityGroupIds : []);
          const resolvedAssignments = groupService.resolveAssigneeIdsFromGroups(
            orgId,
            t.projectId,
            nextDirectAssigneeIds,
            nextGroupIds,
            allUsers,
            allProjects
          );
          normalizedUpdates.assigneeIds = resolvedAssignments.assigneeIds;
          normalizedUpdates.assigneeId = resolvedAssignments.assigneeIds[0];
          normalizedUpdates.securityGroupIds = resolvedAssignments.securityGroupIds;
        }

        const nextAssignees = Array.isArray(normalizedUpdates.assigneeIds)
          ? normalizedUpdates.assigneeIds
          : previousAssignees;
        notifyAssigneeIds = nextAssignees.filter((assigneeId) => !previousAssignees.includes(assigneeId) && assigneeId !== userId);
        if (notifyAssigneeIds.length > 0) {
          notifyTaskTitle = normalizedUpdates.title || t.title;
        }

        const auditLog = [...(t.auditLog || [])];
        const auditActions = buildUpdateAuditActions(t, normalizedUpdates, orgId);
        auditActions.forEach((action) => {
          auditLog.push(createAuditEntry(userId, actorDisplayName, action));
        });
        const nextStatus = typeof normalizedUpdates.status === 'string' ? normalizedUpdates.status : t.status;
        const completedAt = isDoneStatusForProject(orgId, t.projectId, nextStatus)
          ? (t.completedAt || Date.now())
          : t.completedAt;
        const actualMinutes = isDoneStatusForProject(orgId, t.projectId, nextStatus)
          ? Math.max(1, Math.round(((typeof normalizedUpdates.timeLogged === 'number' ? normalizedUpdates.timeLogged : t.timeLogged) || 0) / 60000))
          : t.actualMinutes;
        const estimateProvidedBy =
          typeof normalizedUpdates.estimateMinutes === 'number'
            ? (normalizedUpdates.estimateProvidedBy || userId)
            : t.estimateProvidedBy;
        const estimateProvidedAt =
          typeof normalizedUpdates.estimateMinutes === 'number'
            ? Date.now()
            : t.estimateProvidedAt;
        return {
          ...t,
          ...normalizedUpdates,
          estimateProvidedBy,
          estimateProvidedAt,
          completedAt,
          actualMinutes,
          auditLog,
          updatedAt: Date.now(),
          version: (t.version || 1) + 1
        };
      }
      return t;
    });

    writeStoredTasks(updatedTasks);
    syncGuardService.markLocalMutation();
    estimationService.recomputeOrgProfiles(orgId, updatedTasks);
    emitTasksUpdated(orgId, userId, id);
    const settings = settingsService.getSettings();
    if (settings.enableNotifications && notifyAssigneeIds.length > 0) {
      notifyAssigneeIds.forEach((notifyAssigneeId) => {
        notificationService.addNotification({
          userId: notifyAssigneeId,
          title: 'Node Recalibrated',
          message: `Assigned: ${notifyTaskTitle}`,
          type: 'ASSIGNMENT',
          linkId: id
        });
      });
    }
    return taskService.getTasks(userId, orgId);
  },

  toggleTimer: (userId: string, orgId: string, id: string): Task[] => {
    const allTasks = readStoredTasks();
    const actorDisplayName = resolveActorDisplayName(orgId, userId);
    const updatedTasks = allTasks.map(t => {
      if (t.id === id) {
        const auditLog = [...(t.auditLog || [])];
        if (t.isTimerRunning) {
          const sessionTime = Date.now() - (t.timerStartedAt || Date.now());
          auditLog.push(createAuditEntry(userId, actorDisplayName, `stopped timer (+${formatDuration(sessionTime)})`));
          return {
            ...t,
            isTimerRunning: false,
            timeLogged: (t.timeLogged || 0) + sessionTime,
            timerStartedAt: undefined,
            auditLog
          };
        } else {
          auditLog.push(createAuditEntry(userId, actorDisplayName, 'started timer'));
          return { ...t, isTimerRunning: true, timerStartedAt: Date.now(), auditLog };
        }
      }
      return t;
    });
    writeStoredTasks(updatedTasks);
    syncGuardService.markLocalMutation();
    estimationService.recomputeOrgProfiles(orgId, updatedTasks);
    emitTasksUpdated(orgId, userId, id);
    return taskService.getTasks(userId, orgId);
  },

  updateTaskStatus: (userId: string, orgId: string, id: string, status: string, displayName?: string): Task[] => {
    return taskService.updateTask(userId, orgId, id, { status }, displayName);
  },

  addComment: (userId: string, orgId: string, taskId: string, text: string, displayName: string): Task[] => {
    const allTasks = readStoredTasks();
    const actorDisplayName = resolveActorDisplayName(orgId, userId, displayName);
    const updatedTasks = allTasks.map(t => {
      if (t.id === taskId) {
        const newComment: Comment = {
          id: createId(),
          userId,
          displayName: actorDisplayName,
          text,
          timestamp: Date.now()
        };
        const settings = settingsService.getSettings();
        const notifyAssigneeIds = getTaskAssigneeIds(t).filter((assigneeId) => assigneeId !== userId);
        if (settings.enableNotifications && notifyAssigneeIds.length > 0) {
          notifyAssigneeIds.forEach((assigneeId) => {
            notificationService.addNotification({
              userId: assigneeId,
              title: 'Velo Transmission',
              message: `${actorDisplayName} commented on "${t.title}"`,
              type: 'SYSTEM',
              linkId: taskId
            });
          });
        }
        return {
          ...t,
          comments: [...(t.comments || []), newComment],
          auditLog: [...(t.auditLog || []), createAuditEntry(userId, actorDisplayName, 'added a comment')],
          updatedAt: Date.now(),
          version: (t.version || 1) + 1
        };
      }
      return t;
    });
    writeStoredTasks(updatedTasks);
    syncGuardService.markLocalMutation();
    estimationService.recomputeOrgProfiles(orgId, updatedTasks);
    emitTasksUpdated(orgId, userId, taskId);
    return taskService.getTasks(userId, orgId);
  },

  deleteTask: (userId: string, orgId: string, id: string): Task[] => {
    const allTasks = readStoredTasks();
    const updated = allTasks.filter(t => t.id !== id);
    writeStoredTasks(updated);
    syncGuardService.markLocalMutation();
    estimationService.recomputeOrgProfiles(orgId, updated);
    emitTasksUpdated(orgId, userId, id);
    return taskService.getTasks(userId, orgId);
  },

  deleteTasksByProject: (userId: string, orgId: string, projectId: string): Task[] => {
    const allTasks = readStoredTasks();
    const updated = allTasks.filter((t) => t.projectId !== projectId);
    writeStoredTasks(updated);
    syncGuardService.markLocalMutation();
    estimationService.recomputeOrgProfiles(orgId, updated);
    emitTasksUpdated(orgId, userId);
    return taskService.getTasks(userId, orgId);
  },

  reorderTasks: (orgId: string, reorderedTasks: Task[], actorId?: string, actorDisplayName?: string): void => {
    const allTasks = readStoredTasks();
    const actorName = actorId ? resolveActorDisplayName(orgId, actorId, actorDisplayName) : 'System';
    const visibleTaskIds = reorderedTasks.map(t => t.id);
    const hiddenTasks = allTasks.filter(t => !visibleTaskIds.includes(t.id));
    const previousById = new Map(allTasks.map((task) => [task.id, task]));
    writeStoredTasks([
      ...hiddenTasks,
      ...reorderedTasks.map((task) => {
        const previous = previousById.get(task.id);
        const statusChanged = previous && previous.status !== task.status;
        const auditLog = [...(task.auditLog || [])];
        if (statusChanged) {
          auditLog.push(
            createAuditEntry(actorId || 'system', actorName, `moved task to ${stageLabel(task.status)}`)
          );
        }
        const completedAt = isDoneStatusForProject(orgId, task.projectId, task.status)
          ? (task.completedAt || Date.now())
          : task.completedAt;
        const actualMinutes = isDoneStatusForProject(orgId, task.projectId, task.status)
          ? Math.max(1, Math.round((task.timeLogged || 0) / 60000))
          : task.actualMinutes;
        return { ...task, completedAt, actualMinutes, auditLog, updatedAt: Date.now(), version: (task.version || 1) + 1 };
      })
    ]);
    syncGuardService.markLocalMutation();
    estimationService.recomputeOrgProfiles(orgId, [...hiddenTasks, ...reorderedTasks]);
    emitTasksUpdated(orgId);
  },

  clearData: () => {
    localStorage.removeItem(TASKS_STORAGE_KEY);
  }
};
