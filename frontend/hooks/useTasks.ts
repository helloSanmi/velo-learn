import { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, User, Subtask } from '../types';
import { taskService } from '../services/taskService';
import { aiService } from '../services/aiService';
import { historyManager } from '../services/historyService';

export const useTasks = (user: User | null, activeProjectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'All'>('All');

  const refreshTasks = useCallback(() => {
    if (user) {
      setTasks(taskService.getTasks(user.id, user.orgId));
    }
  }, [user]);

  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        const nextState = e.shiftKey ? historyManager.redo(tasks) : historyManager.undo(tasks);
        if (nextState) {
          setTasks(nextState);
          if (user) taskService.reorderTasks(user.orgId, nextState);
        }
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [tasks, user]);

  const createTask = (title: string, description: string, priority: TaskPriority, tags: string[] = [], dueDate?: number, projectId: string = 'p1', assigneeId?: string) => {
    if (!user) return;
    historyManager.push(tasks);
    taskService.createTask(user.id, user.orgId, projectId, title, description, priority, tags, dueDate, assigneeId);
    refreshTasks();
  };

  const updateStatus = (id: string, status: TaskStatus, username?: string) => {
    if (!user) return;
    historyManager.push(tasks);
    if (status === TaskStatus.DONE) setConfettiActive(true);
    const updated = taskService.updateTaskStatus(user.id, user.orgId, id, status, username);
    setTasks(updated);
  };

  const bulkUpdateTasks = (ids: string[], updates: Partial<Task>) => {
    if (!user) return;
    historyManager.push(tasks);
    let current = [...tasks];
    ids.forEach(id => {
      current = taskService.updateTask(user.id, user.orgId, id, updates, user.displayName);
    });
    setTasks(current);
  };

  const bulkDeleteTasks = (ids: string[]) => {
    if (!user) return;
    historyManager.push(tasks);
    let current = [...tasks];
    ids.forEach(id => {
      current = taskService.deleteTask(user.id, user.orgId, id);
    });
    setTasks(current);
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>, username?: string) => {
    if (!user) return;
    historyManager.push(tasks);
    const updated = taskService.updateTask(user.id, user.orgId, id, updates, username);
    setTasks(updated);
  };

  const addComment = (taskId: string, text: string) => {
    if (!user) return;
    const updated = taskService.addComment(user.id, user.orgId, taskId, text, user.displayName);
    setTasks(updated);
    return updated.find(t => t.id === taskId);
  };

  const moveTask = (taskId: string, targetStatus: TaskStatus, targetTaskId?: string) => {
    if (!user) return;
    historyManager.push(tasks);
    if (targetStatus === TaskStatus.DONE) setConfettiActive(true);
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks];
      const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;
      const [task] = updatedTasks.splice(taskIndex, 1);
      task.status = targetStatus;
      let insertionIndex = -1;
      if (targetTaskId) {
        insertionIndex = updatedTasks.findIndex(t => t.id === targetTaskId);
      } 
      if (insertionIndex === -1) {
        let lastInColumnIndex = -1;
        for (let i = updatedTasks.length - 1; i >= 0; i--) {
          if (updatedTasks[i].status === targetStatus) {
            lastInColumnIndex = i;
            break;
          }
        }
        insertionIndex = lastInColumnIndex === -1 ? updatedTasks.length : lastInColumnIndex + 1;
      }
      updatedTasks.splice(insertionIndex, 0, task);
      const reordered = updatedTasks.map((t, i) => ({ ...t, order: i }));
      taskService.reorderTasks(user.orgId, reordered);
      return reordered;
    });
  };

  const deleteTask = (id: string) => {
    if (!user) return;
    historyManager.push(tasks);
    const updated = taskService.deleteTask(user.id, user.orgId, id);
    setTasks(updated);
  };

  const toggleTimer = (id: string) => {
    if (!user) return;
    const updated = taskService.toggleTimer(user.id, user.orgId, id);
    setTasks(updated);
  };

  const assistWithAI = async (task: Task) => {
    setActiveTaskId(task.id);
    setActiveTaskTitle(task.title);
    setAiLoading(true);
    const steps = await aiService.breakDownTask(task.title, task.description);
    setAiSuggestions(steps);
    setAiLoading(false);
  };

  const applyAISuggestions = (finalSteps: string[]) => {
    if (!user || !activeTaskId || !finalSteps) return;
    historyManager.push(tasks);
    
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;

    const newSubtasks: Subtask[] = finalSteps.map(title => ({
      id: crypto.randomUUID(),
      title,
      isCompleted: false
    }));

    const updatedSubtasks = [...task.subtasks, ...newSubtasks];
    updateTask(activeTaskId, { subtasks: updatedSubtasks }, user.displayName);
    setAiSuggestions(null);
    setActiveTaskId(null);
  };

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => task.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      const matchesTag = tagFilter === 'All' || task.tags?.includes(tagFilter);
      const matchesProject = !activeProjectId || task.projectId === activeProjectId;
      const matchesAssignee = assigneeFilter === 'All' || (assigneeFilter === 'Me' && task.assigneeId === user?.id) || task.assigneeId === assigneeFilter;
      return matchesPriority && matchesTag && matchesProject && matchesAssignee;
    });
  }, [tasks, priorityFilter, tagFilter, activeProjectId, assigneeFilter, user]);

  const categorizedTasks = useMemo(() => {
    const sortFn = (a: Task, b: Task) => a.order - b.order;
    return {
      [TaskStatus.TODO]: filteredTasks.filter(t => t.status === TaskStatus.TODO).sort(sortFn),
      [TaskStatus.IN_PROGRESS]: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).sort(sortFn),
      [TaskStatus.DONE]: filteredTasks.filter(t => t.status === TaskStatus.DONE).sort(sortFn),
    };
  }, [filteredTasks]);

  return {
    tasks,
    categorizedTasks,
    aiLoading,
    aiSuggestions,
    activeTaskTitle,
    priorityFilter,
    statusFilter,
    tagFilter,
    assigneeFilter,
    uniqueTags,
    confettiActive,
    setConfettiActive,
    setPriorityFilter,
    setStatusFilter,
    setTagFilter,
    setAssigneeFilter,
    setAiSuggestions,
    refreshTasks,
    createTask,
    updateStatus,
    updateTask,
    addComment,
    moveTask,
    deleteTask,
    assistWithAI,
    applyAISuggestions,
    bulkUpdateTasks,
    bulkDeleteTasks,
    toggleTimer 
  };
};