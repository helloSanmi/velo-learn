
import { Task, TaskStatus, TaskPriority, Comment, Project, User } from '../types';
import { projectService } from './projectService';
import { notificationService } from './notificationService';
import { settingsService } from './settingsService';
import { userService } from './userService';
import { syncGuardService } from './syncGuardService';

const STORAGE_KEY = 'velo_data';
const getTaskAssigneeIds = (task: Task): string[] => {
  if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) return task.assigneeIds;
  if (task.assigneeId) return [task.assigneeId];
  return [];
};

const withVersion = (task: Task): Task => ({
  ...task,
  version: Number.isFinite(task.version as number) ? Math.max(1, Number(task.version)) : 1,
  updatedAt: task.updatedAt || task.createdAt || Date.now()
});

export const taskService = {
  getAllTasksForOrg: (orgId: string): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const allTasks: Task[] = data ? JSON.parse(data) : [];
      return allTasks
        .filter((t) => t.orgId === orgId)
        .map((t) => withVersion({
          ...t,
          assigneeIds: getTaskAssigneeIds(t),
          assigneeId: getTaskAssigneeIds(t)[0],
          comments: t.comments || [],
          auditLog: t.auditLog || [],
          subtasks: t.subtasks || [],
          tags: t.tags || [],
          timeLogged: t.timeLogged || 0,
          blockedByIds: t.blockedByIds || []
        }))
        .sort((a, b) => a.order - b.order);
    } catch (e) {
      console.error('Error fetching all org tasks:', e);
      return [];
    }
  },

  getTasks: (userId: string, orgId: string): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const allTasks: Task[] = data ? JSON.parse(data) : [];
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
        .map(t => withVersion({
          ...t,
          assigneeIds: getTaskAssigneeIds(t),
          assigneeId: getTaskAssigneeIds(t)[0],
          comments: t.comments || [],
          auditLog: t.auditLog || [],
          subtasks: t.subtasks || [],
          tags: t.tags || [],
          timeLogged: t.timeLogged || 0,
          blockedByIds: t.blockedByIds || []
        }))
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
    assigneeIds: string[] = []
  ): Task => {
    const data = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = data ? JSON.parse(data) : [];
    const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order)) : 0;
    const normalizedAssigneeIds = Array.from(new Set(assigneeIds.filter(Boolean)));
    const project = projectService.getProjects(orgId).find((item) => item.id === projectId);
    const defaultStage = project?.stages?.[0]?.id || TaskStatus.TODO;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      orgId,
      userId,
      assigneeId: normalizedAssigneeIds[0],
      assigneeIds: normalizedAssigneeIds,
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
        id: crypto.randomUUID(),
        userId,
        displayName: 'System',
        action: 'Node initialized',
        timestamp: Date.now()
      }],
      timeLogged: 0,
      blockedByIds: []
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...allTasks, newTask]));
    syncGuardService.markLocalMutation();
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
    const allTasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const task = allTasks.find((item) => item.id === id);
    return task ? withVersion(task) : undefined;
  },

  updateTask: (userId: string, orgId: string, id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>, displayName?: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    let notifyAssigneeIds: string[] = [];
    let notifyTaskTitle: string = '';

    const updatedTasks = allTasks.map(t => {
      if (t.id === id) {
        const previousAssignees = getTaskAssigneeIds(t);
        const normalizedUpdates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>> = { ...updates };

        if (Array.isArray(normalizedUpdates.assigneeIds)) {
          const uniqueAssignees = Array.from(new Set(normalizedUpdates.assigneeIds.filter(Boolean)));
          normalizedUpdates.assigneeIds = uniqueAssignees;
          normalizedUpdates.assigneeId = uniqueAssignees[0];
        } else if (typeof normalizedUpdates.assigneeId === 'string') {
          const nextIds = normalizedUpdates.assigneeId ? [normalizedUpdates.assigneeId] : [];
          normalizedUpdates.assigneeIds = nextIds;
          normalizedUpdates.assigneeId = nextIds[0];
        }

        const nextAssignees = Array.isArray(normalizedUpdates.assigneeIds)
          ? normalizedUpdates.assigneeIds
          : previousAssignees;
        notifyAssigneeIds = nextAssignees.filter((assigneeId) => !previousAssignees.includes(assigneeId) && assigneeId !== userId);
        if (notifyAssigneeIds.length > 0) {
          notifyTaskTitle = normalizedUpdates.title || t.title;
        }

        const auditLog = [...(t.auditLog || [])];
        if (displayName) {
          Object.keys(normalizedUpdates).forEach(key => {
            const newVal = (normalizedUpdates as any)[key];
            const oldVal = (t as any)[key];
            if (newVal !== undefined && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
              auditLog.push({
                id: crypto.randomUUID(),
                userId,
                displayName,
                action: `Reconfigured ${key}`,
                timestamp: Date.now()
              });
            }
          });
        }
        return { ...t, ...normalizedUpdates, auditLog, updatedAt: Date.now(), version: (t.version || 1) + 1 };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    syncGuardService.markLocalMutation();
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
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    const updatedTasks = allTasks.map(t => {
      if (t.id === id) {
        if (t.isTimerRunning) {
          const sessionTime = Date.now() - (t.timerStartedAt || Date.now());
          return {
            ...t,
            isTimerRunning: false,
            timeLogged: (t.timeLogged || 0) + sessionTime,
            timerStartedAt: undefined
          };
        } else {
          return { ...t, isTimerRunning: true, timerStartedAt: Date.now() };
        }
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    syncGuardService.markLocalMutation();
    return taskService.getTasks(userId, orgId);
  },

  updateTaskStatus: (userId: string, orgId: string, id: string, status: string, displayName?: string): Task[] => {
    return taskService.updateTask(userId, orgId, id, { status }, displayName);
  },

  addComment: (userId: string, orgId: string, taskId: string, text: string, displayName: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    const updatedTasks = allTasks.map(t => {
      if (t.id === taskId) {
        const newComment: Comment = {
          id: crypto.randomUUID(),
          userId,
          displayName,
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
              message: `${displayName} commented on "${t.title}"`,
              type: 'SYSTEM',
              linkId: taskId
            });
          });
        }
        return { ...t, comments: [...(t.comments || []), newComment], updatedAt: Date.now(), version: (t.version || 1) + 1 };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    syncGuardService.markLocalMutation();
    return taskService.getTasks(userId, orgId);
  },

  deleteTask: (userId: string, orgId: string, id: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    const updated = allTasks.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    syncGuardService.markLocalMutation();
    return taskService.getTasks(userId, orgId);
  },

  deleteTasksByProject: (userId: string, orgId: string, projectId: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    const updated = allTasks.filter((t) => t.projectId !== projectId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    syncGuardService.markLocalMutation();
    return taskService.getTasks(userId, orgId);
  },

  reorderTasks: (orgId: string, reorderedTasks: Task[]): void => {
    const data = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = data ? JSON.parse(data) : [];
    const visibleTaskIds = reorderedTasks.map(t => t.id);
    const hiddenTasks = allTasks.filter(t => !visibleTaskIds.includes(t.id));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        ...hiddenTasks,
        ...reorderedTasks.map((task) => ({ ...task, updatedAt: Date.now(), version: (task.version || 1) + 1 }))
      ])
    );
    syncGuardService.markLocalMutation();
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
