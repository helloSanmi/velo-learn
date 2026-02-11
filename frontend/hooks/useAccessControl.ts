import { useCallback } from 'react';
import { Project, Task, User } from '../types';
import { toastService } from '../services/toastService';
import {
  TaskRestrictedAction,
  canManageProject as canManageProjectBase,
  canManageTask as canManageTaskBase,
  getProjectOwnerId
} from '../services/permissionService';

interface UseAccessControlParams {
  user: User | null;
  projects: Project[];
  tasks: Task[];
}

export const useAccessControl = ({ user, projects, tasks }: UseAccessControlParams) => {
  const canManageProject = useCallback(
    (project?: Project) => (user ? canManageProjectBase(user, project) : false),
    [user]
  );

  const canManageTask = useCallback(
    (task?: Task) => (user ? canManageTaskBase(user, projects, task) : false),
    [user, projects]
  );

  const ensureTaskPermission = useCallback(
    (taskId: string, action: TaskRestrictedAction) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return false;
      if (canManageTask(task)) return true;
      const labels: Record<TaskRestrictedAction, string> = {
        complete: 'complete tasks',
        rename: 'rename tasks',
        delete: 'delete tasks',
        assign: 'assign task members'
      };
      toastService.warning('Permission denied', `Only admins or project creators can ${labels[action]}.`);
      return false;
    },
    [tasks, canManageTask]
  );

  return {
    getProjectOwnerId,
    canManageProject,
    canManageTask,
    ensureTaskPermission
  };
};
