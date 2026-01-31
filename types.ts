
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

export interface User {
  id: string;
  username: string; // The email prefix
  displayName: string; // The name shown in UI
  avatar?: string;
  email?: string;
  role?: 'admin' | 'member';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  members: string[]; // Array of User IDs
  isPublic?: boolean;
  publicToken?: string;
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
  userId: string; // Creator
  assigneeId?: string; // Assigned user
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
  // Time Tracking fields
  timeLogged: number; // in milliseconds
  isTimerRunning?: boolean;
  timerStartedAt?: number;
}

export interface AIResponse {
  suggestions: string[];
}
