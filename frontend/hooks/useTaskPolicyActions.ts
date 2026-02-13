import { useMemo, useState } from 'react';
import { Task, TaskPriority, TaskStatus, User, Project } from '../types';
import { toastService } from '../services/toastService';
import { dialogService } from '../services/dialogService';
import { estimationService } from '../services/estimationService';
import { isTaskAssignedToUser } from '../services/permissionService';

interface UseTaskPolicyActionsParams {
  user: User;
  tasks: Task[];
  projects: Project[];
  ensureTaskPermission: (taskId: string, action: 'complete' | 'rename' | 'delete' | 'assign') => boolean;
  canManageProject: (project?: Project) => boolean;
  moveTask: (taskId: string, targetStatus: string, targetTaskId?: string) => void;
  updateStatus: (id: string, status: string, username?: string) => void;
  updateTask: (
    id: string,
    updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>,
    username?: string
  ) => void;
  addComment: (taskId: string, text: string) => void;
  deleteTask: (id: string) => void;
  toggleTimer: (id: string) => void;
  createTask: (
    title: string,
    description: string,
    priority: TaskPriority,
    tags?: string[],
    dueDate?: number,
    projectId?: string,
    assigneeIds?: string[],
    securityGroupIds?: string[],
    estimateMinutes?: number,
    estimateProvidedBy?: string
  ) => void;
}

export const useTaskPolicyActions = ({
  user,
  tasks,
  projects,
  ensureTaskPermission,
  canManageProject,
  moveTask,
  updateStatus,
  updateTask,
  addComment,
  deleteTask,
  toggleTimer,
  createTask
}: UseTaskPolicyActionsParams) => {
  const [moveBackRequest, setMoveBackRequest] = useState<{ taskId: string; targetStatus: string; targetTaskId?: string } | null>(null);
  const [moveBackReason, setMoveBackReason] = useState('');
  const [moveBackReasonError, setMoveBackReasonError] = useState('');

  const updateMoveBackReason = (value: string) => {
    setMoveBackReason(value);
    if (moveBackReasonError) setMoveBackReasonError('');
  };

  const getProjectDoneStageId = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    return project?.stages?.length ? project.stages[project.stages.length - 1].id : TaskStatus.DONE;
  };

  const isAssignedActor = (task?: Task) => {
    return isTaskAssignedToUser(user, task);
  };

  const requiresApproval = (task: Task, targetStatus: string) => {
    const doneStageId = getProjectDoneStageId(task.projectId);
    return targetStatus === doneStageId && task.priority === TaskPriority.HIGH && !task.approvedAt;
  };

  const requiresEstimateApproval = (task: Task, targetStatus: string) => {
    const doneStageId = getProjectDoneStageId(task.projectId);
    if (targetStatus !== doneStageId) return false;
    if (task.estimateRiskApprovedAt) return false;
    return estimationService.shouldRequireApprovalForDone(task);
  };

  const isBackwardFromDone = (task: Task, targetStatus: string) => {
    const doneStageId = getProjectDoneStageId(task.projectId);
    return task.status === doneStageId && targetStatus !== doneStageId;
  };

  const openMoveBackPrompt = (taskId: string, targetStatus: string, targetTaskId?: string) => {
    setMoveBackRequest({ taskId, targetStatus, targetTaskId });
    setMoveBackReason('');
    setMoveBackReasonError('');
  };

  const handleMoveTaskWithPolicy = (taskId: string, targetStatus: string, targetTaskId?: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!isAssignedActor(task)) {
      toastService.warning('Permission denied', 'Only assigned members can move this task.');
      return;
    }
    const doneStageIdForPermission = getProjectDoneStageId(task.projectId);
    if ((targetStatus === doneStageIdForPermission || task.status === doneStageIdForPermission) && !ensureTaskPermission(taskId, 'complete')) return;
    if (requiresApproval(task, targetStatus)) {
      dialogService.notice('This high-priority task requires admin approval before moving to Done.', { title: 'Approval required' });
      return;
    }
    if (requiresEstimateApproval(task, targetStatus)) {
      const project = projects.find((item) => item.id === task.projectId);
      if (!canManageProject(project)) {
        dialogService.notice('Risk-adjusted variance is high. Project owner/admin must approve before completion.', { title: 'Estimate approval required' });
        return;
      }
      updateTask(task.id, { estimateRiskApprovedAt: Date.now(), estimateRiskApprovedBy: user.displayName }, user.displayName);
    }
    if (isBackwardFromDone(task, targetStatus)) {
      openMoveBackPrompt(taskId, targetStatus, targetTaskId);
      return;
    }
    moveTask(taskId, targetStatus, targetTaskId);
    const doneStageId = getProjectDoneStageId(task.projectId);
    if (targetStatus === doneStageId && (task.movedBackAt || task.movedBackReason || task.movedBackFromStatus)) {
      updateTask(
        task.id,
        {
          movedBackAt: undefined,
          movedBackBy: undefined,
          movedBackReason: undefined,
          movedBackFromStatus: undefined
        },
        user.displayName
      );
    }
  };

  const handleStatusUpdateWithPolicy = (taskId: string, targetStatus: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!isAssignedActor(task)) {
      toastService.warning('Permission denied', 'Only assigned members can update status.');
      return;
    }
    const doneStageIdForPermission = getProjectDoneStageId(task.projectId);
    if ((targetStatus === doneStageIdForPermission || task.status === doneStageIdForPermission) && !ensureTaskPermission(taskId, 'complete')) return;
    if (requiresApproval(task, targetStatus)) {
      dialogService.notice('This high-priority task requires admin approval before moving to Done.', { title: 'Approval required' });
      return;
    }
    if (requiresEstimateApproval(task, targetStatus)) {
      const project = projects.find((item) => item.id === task.projectId);
      if (!canManageProject(project)) {
        dialogService.notice('Risk-adjusted variance is high. Project owner/admin must approve before completion.', { title: 'Estimate approval required' });
        return;
      }
      updateTask(task.id, { estimateRiskApprovedAt: Date.now(), estimateRiskApprovedBy: user.displayName }, user.displayName);
    }
    if (isBackwardFromDone(task, targetStatus)) {
      openMoveBackPrompt(taskId, targetStatus);
      return;
    }
    updateStatus(taskId, targetStatus, user.displayName);
    const doneStageId = getProjectDoneStageId(task.projectId);
    if (targetStatus === doneStageId && (task.movedBackAt || task.movedBackReason || task.movedBackFromStatus)) {
      updateTask(
        task.id,
        {
          movedBackAt: undefined,
          movedBackBy: undefined,
          movedBackReason: undefined,
          movedBackFromStatus: undefined
        },
        user.displayName
      );
    }
  };

  const submitMoveBackReason = () => {
    if (!moveBackRequest) return;
    if (!ensureTaskPermission(moveBackRequest.taskId, 'complete')) return;
    const reason = moveBackReason.trim();
    if (!reason) {
      setMoveBackReasonError('A comment is required before moving a completed task backward.');
      return;
    }
    const task = tasks.find((item) => item.id === moveBackRequest.taskId);
    if (!task) {
      setMoveBackRequest(null);
      setMoveBackReason('');
      setMoveBackReasonError('');
      return;
    }
    const fromStatus = task.status;
    updateTask(
      task.id,
      {
        status: moveBackRequest.targetStatus,
        movedBackAt: Date.now(),
        movedBackBy: user.displayName,
        movedBackReason: reason,
        movedBackFromStatus: fromStatus
      },
      user.displayName
    );
    addComment(task.id, `Moved backward from ${fromStatus} to ${moveBackRequest.targetStatus}: ${reason}`);
    toastService.info('Task moved backward', 'Reason saved on task history.');
    setMoveBackRequest(null);
    setMoveBackReason('');
    setMoveBackReasonError('');
  };

  const closeMoveBackPrompt = () => {
    setMoveBackRequest(null);
    setMoveBackReason('');
    setMoveBackReasonError('');
  };

  const handleUpdateTaskWithPolicy = (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const targetProject = projects.find((project) => project.id === task.projectId);
    const canManageTaskData = canManageProject(targetProject);
    const hasAssignmentUpdate =
      typeof updates.assigneeId === 'string' ||
      Array.isArray(updates.assigneeIds) ||
      Array.isArray(updates.securityGroupIds);
    const hasRenameUpdate = typeof updates.title === 'string' && updates.title !== task.title;
    const hasDescriptionUpdate = typeof updates.description === 'string' && updates.description !== task.description;
    const hasDependencyUpdate = Array.isArray(updates.blockedByIds);
    const hasSubtaskUpdate = Array.isArray(updates.subtasks);
    const hasAuditUpdate = typeof updates.isAtRisk === 'boolean';
    const hasEstimateUpdate =
      typeof updates.estimateMinutes === 'number' ||
      updates.estimateMinutes === undefined ||
      typeof updates.estimateProvidedBy === 'string' ||
      typeof updates.estimateRiskApprovedAt === 'number';
    const hasOwnerRestrictedUpdate =
      hasAssignmentUpdate || hasRenameUpdate || hasDescriptionUpdate || hasDependencyUpdate || hasSubtaskUpdate || hasAuditUpdate || hasEstimateUpdate;

    if (hasOwnerRestrictedUpdate && !canManageTaskData) {
      toastService.warning('Permission denied', 'Only project owners or admins can modify this part of the task.');
      return;
    }

    if (!hasAssignmentUpdate && !hasOwnerRestrictedUpdate && !isAssignedActor(task) && !canManageTaskData) {
      toastService.warning('Permission denied', 'Only assigned members can edit this task.');
      return;
    }
    if (hasAssignmentUpdate && !ensureTaskPermission(id, 'assign')) return;
    if (hasRenameUpdate && !ensureTaskPermission(id, 'rename')) return;
    if (typeof updates.status === 'string' && updates.status !== task.status) {
      const doneStageId = getProjectDoneStageId(task.projectId);
      if ((updates.status === doneStageId || task.status === doneStageId) && !ensureTaskPermission(id, 'complete')) return;
    }
    updateTask(id, updates, user.displayName);
  };

  const handleDeleteTaskWithPolicy = async (id: string) => {
    if (!ensureTaskPermission(id, 'delete')) return;
    const task = tasks.find((item) => item.id === id);
    const confirmed = await dialogService.confirm(`Delete task "${task?.title || 'this task'}"?`, {
      title: 'Delete task',
      confirmText: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    deleteTask(id);
  };

  const handleToggleTimerWithPolicy = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    if (!isAssignedActor(task)) {
      toastService.warning('Permission denied', 'Only assigned members can start or stop timer.');
      return;
    }
    toggleTimer(id);
  };

  const handleCommentOnTaskWithPolicy = (id: string, text: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    addComment(id, text);
  };

  const handleCreateTaskWithPolicy = (
    title: string,
    description: string,
    priority: TaskPriority,
    tags: string[] = [],
    dueDate?: number,
    projectId: string = 'p1',
    assigneeIds: string[] = [],
    securityGroupIds: string[] = [],
    estimateMinutes?: number,
    estimateProvidedBy?: string
  ) => {
    const targetProject = projects.find((project) => project.id === projectId);
    if ((assigneeIds.length > 0 || securityGroupIds.length > 0) && !canManageProject(targetProject)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can assign task members.');
      createTask(title, description, priority, tags, dueDate, projectId, [], [], estimateMinutes, estimateProvidedBy);
      return;
    }
    createTask(title, description, priority, tags, dueDate, projectId, assigneeIds, securityGroupIds, estimateMinutes, estimateProvidedBy);
  };

  const doneStageIds = useMemo(
    () => new Set(tasks.map((task) => getProjectDoneStageId(task.projectId))),
    [tasks, projects]
  );

  return {
    moveBackRequest,
    moveBackReason,
    moveBackReasonError,
    setMoveBackReason: updateMoveBackReason,
    closeMoveBackPrompt,
    submitMoveBackReason,
    handleMoveTaskWithPolicy,
    handleStatusUpdateWithPolicy,
    handleUpdateTaskWithPolicy,
    handleDeleteTaskWithPolicy,
    handleToggleTimerWithPolicy,
    handleCommentOnTaskWithPolicy,
    handleCreateTaskWithPolicy,
    doneStageIds
  };
};
