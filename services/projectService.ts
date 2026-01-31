
import { Project } from '../types';

const PROJECTS_KEY = 'cloudtasks_projects';

export const projectService = {
  getProjects: (): Project[] => {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  },

  getProjectByToken: (token: string): Project | undefined => {
    return projectService.getProjects().find(p => p.publicToken === token && p.isPublic);
  },

  getProjectsForUser: (userId: string): Project[] => {
    const projects = projectService.getProjects();
    return projects.filter(p => p.members.includes(userId));
  },

  createProject: (name: string, description: string, color: string, members: string[]): Project => {
    const projects = projectService.getProjects();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      color,
      members,
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
  },

  deleteProject: (id: string) => {
    const projects = projectService.getProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
};
