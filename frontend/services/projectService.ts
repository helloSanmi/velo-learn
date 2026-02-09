
import { Project } from '../types';

const PROJECTS_KEY = 'velo_projects';

export const projectService = {
  getProjects: (orgId?: string): Project[] => {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      if (!data) return [];
      const all: Project[] = JSON.parse(data) || [];
      if (!Array.isArray(all)) return [];
      if (orgId) return all.filter(p => p.orgId === orgId);
      return all;
    } catch (e) {
      console.error("Error parsing projects:", e);
      return [];
    }
  },

  getProjectByToken: (token: string): Project | undefined => {
    const all = projectService.getProjects();
    return all.find(p => p.publicToken === token && p.isPublic && !p.isArchived && !p.isCompleted && !p.isDeleted);
  },

  getProjectsForUser: (userId: string, orgId: string): Project[] => {
    const projects = projectService.getProjects(orgId);
    return projects.filter(
      p =>
        p.members &&
        p.members.includes(userId) &&
        !p.isArchived &&
        !p.isCompleted &&
        !p.isDeleted
    );
  },

  createProject: (orgId: string, name: string, description: string, color: string, members: string[]): Project => {
    const projects = projectService.getProjects();
    const newProject: Project = {
      id: crypto.randomUUID(),
      orgId,
      name,
      description,
      color,
      members,
      isArchived: false,
      isCompleted: false,
      isDeleted: false,
      isPublic: false,
      publicToken: crypto.randomUUID().slice(0, 8)
    };
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([...projects, newProject]));
    return newProject;
  },

  togglePublicAccess: (id: string): Project | undefined => {
    const projects = projectService.getProjects();
    let updated: Project | undefined;
    const newList = projects.map(p => {
      if (p.id === id) {
        updated = { ...p, isPublic: !p.isPublic, publicToken: p.publicToken || crypto.randomUUID().slice(0, 8) };
        return updated;
      }
      return p;
    });
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(newList));
    return updated;
  },

  updateProject: (id: string, updates: Partial<Project>) => {
    const projects = projectService.getProjects().map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return projects.find((p) => p.id === id);
  },

  renameProject: (id: string, name: string): Project | undefined => {
    return projectService.updateProject(id, { name: name.trim() });
  },

  archiveProject: (id: string): Project | undefined => {
    return projectService.updateProject(id, {
      isArchived: true,
      archivedAt: Date.now(),
      isCompleted: false,
      completedAt: undefined,
      isDeleted: false,
      deletedAt: undefined
    });
  },

  unarchiveProject: (id: string): Project | undefined => {
    return projectService.updateProject(id, { isArchived: false, archivedAt: undefined });
  },

  completeProject: (id: string): Project | undefined => {
    return projectService.updateProject(id, {
      isCompleted: true,
      completedAt: Date.now(),
      isArchived: false,
      archivedAt: undefined,
      isDeleted: false,
      deletedAt: undefined
    });
  },

  reopenProject: (id: string): Project | undefined => {
    return projectService.updateProject(id, { isCompleted: false, completedAt: undefined });
  },

  restoreProject: (id: string): Project | undefined => {
    return projectService.updateProject(id, {
      isArchived: false,
      archivedAt: undefined,
      isCompleted: false,
      completedAt: undefined,
      isDeleted: false,
      deletedAt: undefined
    });
  },

  deleteProject: (id: string) => {
    return projectService.updateProject(id, {
      isDeleted: true,
      deletedAt: Date.now(),
      isArchived: false,
      archivedAt: undefined,
      isCompleted: false,
      completedAt: undefined
    });
  },

  purgeProject: (id: string) => {
    const projects = projectService.getProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
};
