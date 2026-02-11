import { Project, Task, User } from '../types';
import { DEFAULT_PROJECT_STAGES } from './projectService';

const SCHEMA_VERSION_KEY = 'velo_schema_version';
const CURRENT_SCHEMA_VERSION = 3;
const TASKS_KEY = 'velo_data';
const PROJECTS_KEY = 'velo_projects';
const USERS_KEY = 'velo_users';

const safeParse = <T>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeTask = (task: Task): Task => ({
  ...task,
  assigneeIds: Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0 ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : [],
  assigneeId: Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0 ? task.assigneeIds[0] : task.assigneeId,
  comments: task.comments || [],
  auditLog: task.auditLog || [],
  subtasks: task.subtasks || [],
  tags: task.tags || [],
  blockedByIds: task.blockedByIds || [],
  timeLogged: task.timeLogged || 0,
  updatedAt: task.updatedAt || task.createdAt || Date.now(),
  version: Number.isFinite(task.version as number) ? Math.max(1, Number(task.version)) : 1
});

const normalizeProject = (project: Project, users: User[]): Project => ({
  ...project,
  createdBy:
    project.createdBy ||
    project.members?.[0] ||
    users.find((user) => user.orgId === project.orgId && user.role === 'admin')?.id,
  members: project.members || [],
  stages: Array.isArray(project.stages) && project.stages.length > 0 ? project.stages : DEFAULT_PROJECT_STAGES,
  updatedAt: project.updatedAt || Date.now(),
  version: Number.isFinite(project.version as number) ? Math.max(1, Number(project.version)) : 1
});

const normalizeUser = (user: User): User => ({
  ...user,
  role: user.role || 'member'
});

export const migrationService = {
  run: () => {
    const currentVersion = Number(localStorage.getItem(SCHEMA_VERSION_KEY) || '0');
    if (currentVersion >= CURRENT_SCHEMA_VERSION) return;

    const users = safeParse<User[]>(localStorage.getItem(USERS_KEY), []).map(normalizeUser);
    const tasks = safeParse<Task[]>(localStorage.getItem(TASKS_KEY), []).map(normalizeTask);
    const projects = safeParse<Project[]>(localStorage.getItem(PROJECTS_KEY), []).map((project) =>
      normalizeProject(project, users)
    );

    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  }
};
