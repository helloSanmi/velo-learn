export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Organization {
  id: string;
  name: string;
  totalSeats: number;
  ownerId: string;
  createdAt: number;
}

export interface User {
  id: string;
  orgId: string;
  username: string;
  displayName: string;
  avatar?: string;
  email?: string;
  role?: 'admin' | 'member' | 'guest';
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string;
  color: string;
  members: string[];
  isArchived?: boolean;
  archivedAt?: number;
  isCompleted?: boolean;
  completedAt?: number;
  isDeleted?: boolean;
  deletedAt?: number;
  guestIds?: string[];
  isPublic?: boolean;
  publicToken?: string;
  integrations?: {
    slack?: { enabled: boolean; channel: string };
    github?: { enabled: boolean; repo: string };
    jira?: { enabled: boolean; projectKey: string };
  };
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: number;
}

export interface Comment {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: number;
}

export interface AuditEntry {
  id: string;
  userId: string;
  displayName: string;
  action: string; 
  timestamp: number;
}

export interface Task {
  id: string;
  orgId: string;
  userId: string;
  assigneeId?: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  order: number;
  subtasks: Subtask[];
  tags: string[];
  dueDate?: number;
  comments: Comment[];
  auditLog: AuditEntry[];
  isAtRisk?: boolean;
  timeLogged: number;
  isTimerRunning?: boolean;
  timerStartedAt?: number;
  // New: Dependency Tracking
  blockedByIds?: string[];
  blocksIds?: string[];
}

// Workflow Automation Types
export type WorkflowTrigger = 'TASK_CREATED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED';
export type WorkflowAction = 'SET_PRIORITY' | 'ASSIGN_USER' | 'ADD_TAG' | 'NOTIFY_OWNER';

export interface WorkflowRule {
  id: string;
  orgId: string;
  name: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  triggerValue?: string;
  action: WorkflowAction;
  actionValue?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    tags: string[];
  }>;
}

export type MainViewType = 'board' | 'projects' | 'analytics' | 'roadmap' | 'workflows' | 'templates' | 'resources' | 'integrations';
