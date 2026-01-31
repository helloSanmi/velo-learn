
import { Task, TaskStatus, TaskPriority, Subtask, AuditEntry, Comment, Project } from '../types';
import { projectService } from './projectService';
import { notificationService } from './notificationService';
import { settingsService } from './settingsService';

const STORAGE_KEY = 'cloudtasks_data';

export const taskService = {
  getTasks: (userId: string): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const allTasks: Task[] = data ? JSON.parse(data) : [];
      
      const userProjects = projectService.getProjectsForUser(userId);
      const userProjectIds = userProjects.map(p => p.id);
      
      return allTasks
        .filter(t => 
          t.userId === userId || 
          t.assigneeId === userId || 
          userProjectIds.includes(t.projectId) ||
          t.projectId === 'general'
        )
        .map(t => ({
          ...t,
          comments: t.comments || [],
          auditLog: t.auditLog || [],
          subtasks: t.subtasks || [],
          tags: t.tags || [],
          timeLogged: t.timeLogged || 0
        }))
        .sort((a, b) => a.order - b.order);
    } catch (e) {
      console.error("Error fetching tasks:", e);
      return [];
    }
  },

  createTask: (userId: string, projectId: string, title: string, description: string, priority: TaskPriority, tags: string[] = [], dueDate?: number, assigneeId?: string): Task => {
    const data = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = data ? JSON.parse(data) : [];
    const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order)) : 0;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      userId,
      assigneeId,
      projectId,
      title,
      description,
      status: TaskStatus.TODO,
      priority,
      createdAt: Date.now(),
      order: maxOrder + 1,
      subtasks: [],
      tags,
      dueDate,
      comments: [],
      auditLog: [{
        id: crypto.randomUUID(),
        userId,
        displayName: 'System',
        action: 'Task initialized',
        timestamp: Date.now()
      }],
      timeLogged: 0
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...allTasks, newTask]));

    const settings = settingsService.getSettings();
    if (settings.enableNotifications && assigneeId && assigneeId !== userId) {
      notificationService.addNotification({
        userId: assigneeId,
        title: 'New Task Assigned',
        message: `You have been assigned to: ${title}`,
        type: 'ASSIGNMENT',
        linkId: newTask.id
      });
    }

    return newTask;
  },

  updateTask: (userId: string, id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>, displayName?: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    
    let notifyAssigneeId: string | null = null;
    let notifyTaskTitle: string = '';

    const updatedTasks = allTasks.map(t => {
      if (t.id === id) {
        if (updates.assigneeId && updates.assigneeId !== t.assigneeId && updates.assigneeId !== userId) {
          notifyAssigneeId = updates.assigneeId;
          notifyTaskTitle = updates.title || t.title;
        }

        const auditLog = [...(t.auditLog || [])];
        if (displayName) {
          Object.keys(updates).forEach(key => {
            const newVal = (updates as any)[key];
            const oldVal = (t as any)[key];
            if (newVal !== undefined && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
              auditLog.push({
                id: crypto.randomUUID(),
                userId,
                displayName,
                action: `Updated ${key}`,
                timestamp: Date.now()
              });
            }
          });
        }
        return { ...t, ...updates, auditLog };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));

    const settings = settingsService.getSettings();
    if (settings.enableNotifications && notifyAssigneeId) {
      notificationService.addNotification({
        userId: notifyAssigneeId,
        title: 'Task Assigned',
        message: `You were assigned to: ${notifyTaskTitle}`,
        type: 'ASSIGNMENT',
        linkId: id
      });
    }

    return taskService.getTasks(userId);
  },

  toggleTimer: (userId: string, id: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    
    const updatedTasks = allTasks.map(t => {
      if (t.id === id) {
        if (t.isTimerRunning) {
          const sessionTime = Date.now() - (t.timerStartedAt || Date.now());
          return {
            ...t,
            isTimerRunning: false,
            timeLogged: (t.timeLogged || 0) + sessionTime,
            timerStartedAt: undefined
          };
        } else {
          return {
            ...t,
            isTimerRunning: true,
            timerStartedAt: Date.now()
          };
        }
      }
      return t;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    return taskService.getTasks(userId);
  },

  updateTaskStatus: (userId: string, id: string, status: TaskStatus, displayName?: string): Task[] => {
    return taskService.updateTask(userId, id, { status }, displayName);
  },

  addComment: (userId: string, taskId: string, text: string, displayName: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    const updatedTasks = allTasks.map(t => {
      if (t.id === taskId) {
        const newComment: Comment = {
          id: crypto.randomUUID(),
          userId,
          displayName,
          text,
          timestamp: Date.now()
        };
        
        const settings = settingsService.getSettings();
        if (settings.enableNotifications && t.assigneeId && t.assigneeId !== userId) {
           notificationService.addNotification({
             userId: t.assigneeId,
             title: 'New Comment',
             message: `${displayName} commented on "${t.title}"`,
             type: 'SYSTEM',
             linkId: taskId
           });
        }

        return { ...t, comments: [...(t.comments || []), newComment] };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    return taskService.getTasks(userId);
  },

  deleteTask: (userId: string, id: string): Task[] => {
    const allTasksStr = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = allTasksStr ? JSON.parse(allTasksStr) : [];
    const updated = allTasks.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return taskService.getTasks(userId);
  },

  reorderTasks: (userId: string, reorderedTasks: Task[]): void => {
    const data = localStorage.getItem(STORAGE_KEY);
    const allTasks: Task[] = data ? JSON.parse(data) : [];
    const visibleTaskIds = reorderedTasks.map(t => t.id);
    const hiddenTasks = allTasks.filter(t => !visibleTaskIds.includes(t.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenTasks, ...reorderedTasks]));
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
