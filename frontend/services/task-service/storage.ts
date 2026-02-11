import { Task } from '../../types';

export const TASKS_STORAGE_KEY = 'velo_data';

export const getTaskAssigneeIds = (task: Task): string[] => {
  if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) return task.assigneeIds;
  if (task.assigneeId) return [task.assigneeId];
  return [];
};

export const withVersion = (task: Task): Task => ({
  ...task,
  version: Number.isFinite(task.version as number) ? Math.max(1, Number(task.version)) : 1,
  updatedAt: task.updatedAt || task.createdAt || Date.now()
});

export const normalizeTaskForRead = (task: Task): Task =>
  withVersion({
    ...task,
    assigneeIds: getTaskAssigneeIds(task),
    assigneeId: getTaskAssigneeIds(task)[0],
    comments: task.comments || [],
    auditLog: task.auditLog || [],
    subtasks: task.subtasks || [],
    tags: task.tags || [],
    timeLogged: task.timeLogged || 0,
    blockedByIds: task.blockedByIds || []
  });

export const readStoredTasks = (): Task[] => {
  const data = localStorage.getItem(TASKS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const writeStoredTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};
