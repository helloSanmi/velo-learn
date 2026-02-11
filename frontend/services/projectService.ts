
import { Project, ProjectStage, TaskStatus } from '../types';
import { syncGuardService } from './syncGuardService';
import { realtimeService } from './realtimeService';

const PROJECTS_KEY = 'velo_projects';
export const DEFAULT_PROJECT_STAGES: ProjectStage[] = [
  { id: TaskStatus.TODO, name: 'To Do' },
  { id: TaskStatus.IN_PROGRESS, name: 'In Progress' },
  { id: TaskStatus.DONE, name: 'Done' }
];

const normalizeStages = (stages?: ProjectStage[]): ProjectStage[] => {
  if (!Array.isArray(stages) || stages.length === 0) return DEFAULT_PROJECT_STAGES;
  const normalized = stages
    .filter((stage) => stage?.id && stage?.name)
    .map((stage) => ({ id: stage.id.trim(), name: stage.name.trim() }))
    .filter((stage) => stage.id && stage.name);
  return normalized.length > 0 ? normalized : DEFAULT_PROJECT_STAGES;
};

const normalizeProjectMeta = (meta?: Partial<Project>) => {
  const startDate = meta?.startDate;
  const endDate = meta?.endDate;
  const budgetCost = typeof meta?.budgetCost === 'number' && Number.isFinite(meta.budgetCost) ? Math.max(0, meta.budgetCost) : undefined;
  const scopeSize = typeof meta?.scopeSize === 'number' && Number.isFinite(meta.scopeSize) ? Math.max(0, Math.round(meta.scopeSize)) : undefined;
  const scopeSummary = meta?.scopeSummary?.trim() || undefined;

  return {
    startDate,
    endDate: endDate && startDate && endDate < startDate ? startDate : endDate,
    budgetCost,
    scopeSummary,
    scopeSize
  };
};

const emitProjectsUpdated = (orgId?: string, actorId?: string, projectId?: string) => {
  realtimeService.publish({
    type: 'PROJECTS_UPDATED',
    orgId,
    actorId,
    payload: projectId ? { projectId } : undefined
  });
};

export const projectService = {
  getProjects: (orgId?: string): Project[] => {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      if (!data) return [];
      const all: Project[] = JSON.parse(data) || [];
      if (!Array.isArray(all)) return [];
      const normalizedProjects = all.map((project) => ({
        ...project,
        createdBy: project.createdBy || project.members?.[0],
        stages: normalizeStages(project.stages),
        version: Number.isFinite(project.version as number) ? Math.max(1, Number(project.version)) : 1,
        updatedAt: project.updatedAt || Date.now()
      }));
      if (orgId) return normalizedProjects.filter(p => p.orgId === orgId);
      return normalizedProjects;
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

  createProject: (
    orgId: string,
    name: string,
    description: string,
    color: string,
    members: string[],
    meta?: Partial<Project>,
    createdBy?: string
  ): Project => {
    const projects = projectService.getProjects();
    const normalizedMeta = normalizeProjectMeta(meta);
    const normalizedMembers = Array.from(new Set([...members, ...(createdBy ? [createdBy] : [])]));
    const newProject: Project = {
      id: crypto.randomUUID(),
      orgId,
      createdBy: createdBy || normalizedMembers[0],
      name,
      description,
      color,
      ...normalizedMeta,
      stages: DEFAULT_PROJECT_STAGES,
      members: normalizedMembers,
      version: 1,
      updatedAt: Date.now(),
      isArchived: false,
      isCompleted: false,
      isDeleted: false,
      isPublic: false,
      publicToken: crypto.randomUUID().slice(0, 8)
    };
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([...projects, newProject]));
    syncGuardService.markLocalMutation();
    emitProjectsUpdated(orgId, createdBy || normalizedMembers[0], newProject.id);
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
    syncGuardService.markLocalMutation();
    emitProjectsUpdated(updated?.orgId, undefined, id);
    return updated;
  },

  updateProject: (id: string, updates: Partial<Project>) => {
    const normalizedMeta = normalizeProjectMeta(updates);
    let updatedOrgId: string | undefined;
    const projects = projectService.getProjects().map(p => {
      if (p.id !== id) return p;
      updatedOrgId = p.orgId;
      return {
        ...p,
        ...updates,
        ...normalizedMeta,
        stages: normalizeStages(updates.stages || p.stages),
        version: (p.version || 1) + 1,
        updatedAt: Date.now()
      };
    });
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    syncGuardService.markLocalMutation();
    emitProjectsUpdated(updatedOrgId, undefined, id);
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
    const allProjects = projectService.getProjects();
    const target = allProjects.find((project) => project.id === id);
    const projects = allProjects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    syncGuardService.markLocalMutation();
    emitProjectsUpdated(target?.orgId, undefined, id);
  }
};
