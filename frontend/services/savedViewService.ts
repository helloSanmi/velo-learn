import { TaskPriority } from '../types';

export interface SavedBoardView {
  id: string;
  userId: string;
  orgId: string;
  name: string;
  searchQuery: string;
  statusFilter: string | 'All';
  priorityFilter: TaskPriority | 'All';
  tagFilter: string | 'All';
  assigneeFilter: string | 'All';
  dueFrom?: number;
  dueTo?: number;
  createdAt: number;
}

const KEY = 'velo_saved_views';

const read = (): SavedBoardView[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

const write = (views: SavedBoardView[]) => localStorage.setItem(KEY, JSON.stringify(views));

export const savedViewService = {
  list: (userId: string, orgId: string) => read().filter((v) => v.userId === userId && v.orgId === orgId),
  create: (view: Omit<SavedBoardView, 'id' | 'createdAt'>): SavedBoardView => {
    const next: SavedBoardView = { ...view, id: crypto.randomUUID(), createdAt: Date.now() };
    write([next, ...read()]);
    return next;
  },
  remove: (id: string) => {
    write(read().filter((v) => v.id !== id));
  }
};
