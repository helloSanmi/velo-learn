import { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, User, Subtask } from '../types';
import { taskService } from '../services/taskService';
import { aiService } from '../services/aiService';
import { historyManager } from '../services/historyService';
import { projectService } from '../services/projectService';
import { toastService } from '../services/toastService';

export const useTasks = (user: User | null, activeProjectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<string | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'All'>('All');
  const getTaskAssigneeIds = (task: Task): string[] => {
    if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) return task.assigneeIds;
    if (task.assigneeId) return [task.assigneeId];
    return [];
  };

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

  const createTask = (
    title: string,
    description: string,
    priority: TaskPriority,
    tags: string[] = [],
    dueDate?: number,
    projectId: string = 'p1',
    assigneeIds: string[] = []
  ) => {
    if (!user) return;
    historyManager.push(tasks);
    taskService.createTask(user.id, user.orgId, projectId, title, description, priority, tags, dueDate, assigneeIds);
    refreshTasks();
  };

  const getDoneStageIds = () => {
    if (!user) return [TaskStatus.DONE];
    const projects = projectService.getProjects(user.orgId);
    const stageIds = projects
      .map((project) => project.stages?.[project.stages.length - 1]?.id)
      .filter(Boolean) as string[];
    return Array.from(new Set([TaskStatus.DONE, ...stageIds]));
  };

  const updateStatus = (id: string, status: string, username?: string) => {
    if (!user) return;
    historyManager.push(tasks);
    const isDone = getDoneStageIds().includes(status);
    if (isDone) setConfettiActive(true);
    const updated = taskService.updateTaskStatus(user.id, user.orgId, id, status, username);
    setTasks(updated);
    if (isDone) {
      const task = updated.find((item) => item.id === id);
      toastService.success('Task completed', task ? `"${task.title}" moved to done.` : 'Task moved to done.');
    }
  };

  const bulkUpdateTasks = (ids: string[], updates: Partial<Task>) => {
    if (!user) return;
    historyManager.push(tasks);
    let current = [...tasks];
    ids.forEach(id => {
      current = taskService.updateTask(user.id, user.orgId, id, updates, user.displayName);
    });
    setTasks(current);
    if (ids.length === 0) return;
    if (updates.status && getDoneStageIds().includes(updates.status)) {
      toastService.success('Tasks completed', `${ids.length} task${ids.length > 1 ? 's' : ''} moved to done.`);
      return;
    }
    if (Array.isArray(updates.assigneeIds) || typeof updates.assigneeId === 'string') {
      toastService.success('Assignees updated', `${ids.length} task${ids.length > 1 ? 's were' : ' was'} reassigned.`);
    }
  };

  const bulkDeleteTasks = (ids: string[]) => {
    if (!user) return;
    historyManager.push(tasks);
    let current = [...tasks];
    ids.forEach(id => {
      current = taskService.deleteTask(user.id, user.orgId, id);
    });
    setTasks(current);
    if (ids.length > 0) {
      toastService.warning('Tasks deleted', `${ids.length} task${ids.length > 1 ? 's were' : ' was'} removed.`);
    }
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>, username?: string) => {
    if (!user) return;
    historyManager.push(tasks);
    const previousTask = tasks.find((task) => task.id === id);
    const updated = taskService.updateTask(user.id, user.orgId, id, updates, username);
    setTasks(updated);
    const nextTask = updated.find((task) => task.id === id);
    if (!nextTask) return;
    if (Array.isArray(updates.assigneeIds) || typeof updates.assigneeId === 'string') {
      const previousAssignees =
        previousTask && Array.isArray(previousTask.assigneeIds) && previousTask.assigneeIds.length > 0
          ? previousTask.assigneeIds
          : previousTask?.assigneeId
            ? [previousTask.assigneeId]
            : [];
      const nextAssignees =
        Array.isArray(nextTask.assigneeIds) && nextTask.assigneeIds.length > 0
          ? nextTask.assigneeIds
          : nextTask.assigneeId
            ? [nextTask.assigneeId]
            : [];
      if (JSON.stringify(previousAssignees) !== JSON.stringify(nextAssignees)) {
        const assigneeCount = nextAssignees.length;
        toastService.success(
          assigneeCount > 0 ? 'Assignees updated' : 'Assignees cleared',
          assigneeCount > 0
            ? `"${nextTask.title}" now has ${assigneeCount} assignee${assigneeCount > 1 ? 's' : ''}.`
            : `"${nextTask.title}" has no assignee.`
        );
      }
    }
  };

  const addComment = (taskId: string, text: string) => {
    if (!user) return;
    const updated = taskService.addComment(user.id, user.orgId, taskId, text, user.displayName);
    setTasks(updated);
    return updated.find(t => t.id === taskId);
  };

  const moveTask = (taskId: string, targetStatus: string, targetTaskId?: string) => {
    if (!user) return;
    historyManager.push(tasks);
    if (getDoneStageIds().includes(targetStatus)) setConfettiActive(true);
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
    const removedTask = tasks.find((task) => task.id === id);
    const updated = taskService.deleteTask(user.id, user.orgId, id);
    setTasks(updated);
    toastService.warning('Task deleted', removedTask ? `"${removedTask.title}" was removed.` : 'Task removed.');
  };

  const toggleTimer = (id: string) => {
    if (!user) return;
    const task = tasks.find((item) => item.id === id);
    const wasRunning = Boolean(task?.isTimerRunning);
    const updated = taskService.toggleTimer(user.id, user.orgId, id);
    setTasks(updated);
    const nextTask = updated.find((item) => item.id === id);
    if (!task || !nextTask) return;
    if (wasRunning && !nextTask.isTimerRunning) {
      toastService.info('Timer stopped', `"${nextTask.title}" time saved.`);
    } else if (!wasRunning && nextTask.isTimerRunning) {
      toastService.info('Timer started', `"${nextTask.title}" is now tracking time.`);
    }
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
      const assigneeIds = getTaskAssigneeIds(task);
      const matchesAssignee =
        assigneeFilter === 'All' ||
        (assigneeFilter === 'Me' && assigneeIds.includes(user?.id || '')) ||
        assigneeIds.includes(assigneeFilter);
      return matchesPriority && matchesTag && matchesProject && matchesAssignee;
    });
  }, [tasks, priorityFilter, tagFilter, activeProjectId, assigneeFilter, user]);

  const categorizedTasks = useMemo(() => {
    const sortFn = (a: Task, b: Task) => a.order - b.order;
    const grouped = filteredTasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort(sortFn);
    });
    return grouped;
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
