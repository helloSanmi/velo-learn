import { Dispatch, SetStateAction, useCallback } from 'react';
import { MainViewType, Project, Task, User } from '../types';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { toastService } from '../services/toastService';
import { userService } from '../services/userService';
import { mockDataService } from '../services/mockDataService';

interface UseProjectManagementOptions {
  user: User | null;
  allUsers: User[];
  projects: Project[];
  refreshTasks: () => void;
  canManageProject: (project: Project) => boolean;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setActiveProjectId: Dispatch<SetStateAction<string | null>>;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  setCurrentView: Dispatch<SetStateAction<MainViewType>>;
  setUser: Dispatch<SetStateAction<User | null>>;
  setAuthView: Dispatch<SetStateAction<'landing' | 'pricing' | 'support' | 'login' | 'register'>>;
}

export const useProjectManagement = ({
  user,
  allUsers,
  projects,
  refreshTasks,
  canManageProject,
  setProjects,
  setActiveProjectId,
  setSelectedTask,
  setCurrentView,
  setUser,
  setAuthView
}: UseProjectManagementOptions) => {
  const handleLogout = useCallback(() => {
    userService.logout();
    setActiveProjectId(null);
    setUser(null);
    setAuthView('landing');
  }, [setActiveProjectId, setAuthView, setUser]);

  const handleReset = useCallback(() => {
    mockDataService.init().then(() => refreshTasks());
  }, [refreshTasks]);

  const handleOpenTaskFromNotification = useCallback(
    (taskId: string) => {
      if (!user) return;
      const allOrgTasks = taskService.getAllTasksForOrg(user.orgId);
      const task = allOrgTasks.find((item) => item.id === taskId);
      if (!task) {
        toastService.warning('Notification unavailable', 'The related task no longer exists.');
        return;
      }
      const project = projects.find((item) => item.id === task.projectId);
      if (!project || project.isArchived || project.isCompleted || project.isDeleted) {
        setCurrentView('projects');
        toastService.info('Project not active', 'Open Projects to view this task in its lifecycle state.');
        return;
      }
      setCurrentView('board');
      setActiveProjectId(task.projectId);
      setSelectedTask(task);
    },
    [projects, setActiveProjectId, setCurrentView, setSelectedTask, user]
  );

  const handleUpdateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      const target = projects.find((project) => project.id === id);
      if (!target || !user) return;
      if (!canManageProject(target)) {
        toastService.warning('Permission denied', 'Only admins or project creators can edit project settings.');
        return;
      }
      const sanitizedUpdates: Partial<Project> = { ...updates };
      if ('createdBy' in sanitizedUpdates && user.role !== 'admin') {
        delete sanitizedUpdates.createdBy;
      }
      if (user.role === 'admin' && sanitizedUpdates.createdBy) {
        const nextOwnerId = sanitizedUpdates.createdBy;
        if (!allUsers.some((member) => member.id === nextOwnerId && member.orgId === user.orgId)) {
          toastService.error('Invalid owner', 'Selected owner is not a workspace user.');
          return;
        }
        const currentMembers = Array.isArray(sanitizedUpdates.members) ? sanitizedUpdates.members : target.members;
        if (!currentMembers.includes(nextOwnerId)) {
          sanitizedUpdates.members = [...currentMembers, nextOwnerId];
        }
      }
      projectService.updateProject(id, sanitizedUpdates);
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? { ...project, ...sanitizedUpdates } : project))
      );
    },
    [allUsers, canManageProject, projects, setProjects, user]
  );

  const handleChangeProjectOwner = useCallback(
    (id: string, ownerId: string) => {
      const target = projects.find((project) => project.id === id);
      if (!target || !user) return;
      if (user.role !== 'admin') {
        toastService.warning('Permission denied', 'Only admins can change project owner.');
        return;
      }
      const ownerExists = allUsers.some((member) => member.id === ownerId && member.orgId === user.orgId);
      if (!ownerExists) {
        toastService.error('Invalid owner', 'Selected owner is not a workspace user.');
        return;
      }
      const nextMembers = target.members.includes(ownerId) ? target.members : [...target.members, ownerId];
      projectService.updateProject(id, { createdBy: ownerId, members: nextMembers });
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? { ...project, createdBy: ownerId, members: nextMembers } : project))
      );
      const ownerName = allUsers.find((member) => member.id === ownerId)?.displayName || 'New owner';
      toastService.success('Owner updated', `${ownerName} is now project owner.`);
    },
    [allUsers, projects, setProjects, user]
  );

  return {
    handleLogout,
    handleReset,
    handleOpenTaskFromNotification,
    handleUpdateProject,
    handleChangeProjectOwner
  };
};
