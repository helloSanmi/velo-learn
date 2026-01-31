
import { Task } from '../types';

export interface HistoryState {
  tasks: Task[];
  timestamp: number;
}

const UNDO_STACK_LIMIT = 50;

export class HistoryManager {
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];

  push(tasks: Task[]) {
    // Save a deep copy of the current tasks
    this.undoStack.push({ tasks: JSON.parse(JSON.stringify(tasks)), timestamp: Date.now() });
    if (this.undoStack.length > UNDO_STACK_LIMIT) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo on new action
  }

  undo(currentTasks: Task[]): Task[] | null {
    if (this.undoStack.length === 0) return null;
    
    // Save current to redo stack
    this.redoStack.push({ tasks: JSON.parse(JSON.stringify(currentTasks)), timestamp: Date.now() });
    
    const previous = this.undoStack.pop();
    return previous ? previous.tasks : null;
  }

  redo(currentTasks: Task[]): Task[] | null {
    if (this.redoStack.length === 0) return null;
    
    this.undoStack.push({ tasks: JSON.parse(JSON.stringify(currentTasks)), timestamp: Date.now() });
    
    const next = this.redoStack.pop();
    return next ? next.tasks : null;
  }
}

export const historyManager = new HistoryManager();
