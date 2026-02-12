import { Dispatch, SetStateAction, useEffect } from 'react';
import { Project, User } from '../types';
import { migrationService } from '../services/migrationService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';

interface UseWorkspaceBootstrapOptions {
  setUser: (user: User | null) => void;
  setAllUsers: (users: User[]) => void;
  setProjects: (projects: Project[]) => void;
  refreshTasks: () => void;
  setPublicProject: (project: Project | null) => void;
  setIsCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;
}

export const useWorkspaceBootstrap = ({
  setUser,
  setAllUsers,
  setProjects,
  refreshTasks,
  setPublicProject,
  setIsCommandPaletteOpen
}: UseWorkspaceBootstrapOptions) => {
  useEffect(() => {
    migrationService.run();
    const current = userService.getCurrentUser();
    if (!current) return;
    setUser(current);
    setAllUsers(userService.getUsers(current.orgId));
    setProjects(projectService.getProjects(current.orgId));
    refreshTasks();
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#public/')) {
      const token = hash.split('/')[1];
      const project = projectService.getProjectByToken(token);
      if (project) setPublicProject(project);
    }

    const currentUser = userService.getCurrentUser();
    if (currentUser && !hash.startsWith('#public/')) {
      setUser(currentUser);
      setAllUsers(userService.getUsers(currentUser.orgId));
      setProjects(projectService.getProjects(currentUser.orgId));
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
