
import { Project, ProjectStage, TaskStatus } from '../types';

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

export const projectService = {
  getProjects: (orgId?: string): Project[] => {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      if (!data) return [];
      const all: Project[] = JSON.parse(data) || [];
      if (!Array.isArray(all)) return [];
      const normalizedProjects = all.map((project) => ({ ...project, stages: normalizeStages(project.stages) }));
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
    meta?: Partial<Project>
  ): Project => {
    const projects = projectService.getProjects();
    const normalizedMeta = normalizeProjectMeta(meta);
    const newProject: Project = {
      id: crypto.randomUUID(),
      orgId,
      name,
      description,
      color,
      ...normalizedMeta,
      stages: DEFAULT_PROJECT_STAGES,
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
    const normalizedMeta = normalizeProjectMeta(updates);
    const projects = projectService.getProjects().map(p => 
      p.id === id ? { ...p, ...updates, ...normalizedMeta, stages: normalizeStages(updates.stages || p.stages) } : p
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
