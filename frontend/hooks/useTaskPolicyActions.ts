import { useMemo, useState } from 'react';
import { Task, TaskPriority, TaskStatus, User, Project } from '../types';
import { toastService } from '../services/toastService';
import { dialogService } from '../services/dialogService';

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
  createTask: (
    title: string,
    description: string,
    priority: TaskPriority,
    tags?: string[],
    dueDate?: number,
    projectId?: string,
    assigneeIds?: string[]
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

  const requiresApproval = (task: Task, targetStatus: string) => {
    const doneStageId = getProjectDoneStageId(task.projectId);
    return targetStatus === doneStageId && task.priority === TaskPriority.HIGH && !task.approvedAt;
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
    const doneStageIdForPermission = getProjectDoneStageId(task.projectId);
    if ((targetStatus === doneStageIdForPermission || task.status === doneStageIdForPermission) && !ensureTaskPermission(taskId, 'complete')) return;
    if (requiresApproval(task, targetStatus)) {
      dialogService.notice('This high-priority task requires admin approval before moving to Done.', { title: 'Approval required' });
      return;
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
    const doneStageIdForPermission = getProjectDoneStageId(task.projectId);
    if ((targetStatus === doneStageIdForPermission || task.status === doneStageIdForPermission) && !ensureTaskPermission(taskId, 'complete')) return;
    if (requiresApproval(task, targetStatus)) {
      dialogService.notice('This high-priority task requires admin approval before moving to Done.', { title: 'Approval required' });
      return;
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
    const hasAssignmentUpdate = typeof updates.assigneeId === 'string' || Array.isArray(updates.assigneeIds);
    const hasRenameUpdate = typeof updates.title === 'string' && updates.title !== task.title;
    if (hasAssignmentUpdate && !ensureTaskPermission(id, 'assign')) return;
    if (hasRenameUpdate && !ensureTaskPermission(id, 'rename')) return;
    if (typeof updates.status === 'string' && updates.status !== task.status) {
      const doneStageId = getProjectDoneStageId(task.projectId);
      if ((updates.status === doneStageId || task.status === doneStageId) && !ensureTaskPermission(id, 'complete')) return;
    }
    updateTask(id, updates, user.displayName);
  };

  const handleDeleteTaskWithPolicy = (id: string) => {
    if (!ensureTaskPermission(id, 'delete')) return;
    deleteTask(id);
  };

  const handleCreateTaskWithPolicy = (
    title: string,
    description: string,
    priority: TaskPriority,
    tags: string[] = [],
    dueDate?: number,
    projectId: string = 'p1',
    assigneeIds: string[] = []
  ) => {
    const targetProject = projects.find((project) => project.id === projectId);
    if (assigneeIds.length > 0 && !canManageProject(targetProject)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can assign task members.');
      createTask(title, description, priority, tags, dueDate, projectId, []);
      return;
    }
    createTask(title, description, priority, tags, dueDate, projectId, assigneeIds);
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
    handleCreateTaskWithPolicy,
    doneStageIds
  };
};
