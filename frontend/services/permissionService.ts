import { Project, Task, User } from '../types';

export type TaskRestrictedAction = 'complete' | 'rename' | 'delete' | 'assign';

export const getProjectOwnerId = (project?: Project) => project?.createdBy || project?.members?.[0];

export const canManageProject = (user: User, project?: Project) => {
  if (!project) return false;
  return user.role === 'admin' || getProjectOwnerId(project) === user.id;
};

export const canManageTask = (user: User, projects: Project[], task?: Task) => {
  if (!task) return false;
  if (user.role === 'admin') return true;
  const project = projects.find((item) => item.id === task.projectId);
  if (!project) return task.userId === user.id;
  return getProjectOwnerId(project) === user.id;
};

export const isTaskAssignedToUser = (user: User, task?: Task) => {
  if (!task) return false;
  const assigneeIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
    ? task.assigneeIds
    : task.assigneeId
      ? [task.assigneeId]
      : [];
  return assigneeIds.includes(user.id);
};
