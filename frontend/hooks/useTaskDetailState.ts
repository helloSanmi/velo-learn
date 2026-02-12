import { useEffect, useMemo, useRef, useState } from 'react';
import { Task, TaskPriority, TaskStatus, User, Subtask } from '../types';
import { aiService } from '../services/aiService';
import { userService } from '../services/userService';
import { realtimeService } from '../services/realtimeService';
import { TaskDetailTabType } from '../components/task-detail/types';
import { dialogService } from '../services/dialogService';

interface UseTaskDetailStateParams {
  task: Task;
  tasks: Task[];
  currentUser?: User;
  aiEnabled: boolean;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>) => void;
  onAddComment: (id: string, text: string) => void;
}

export const useTaskDetailState = ({
  task,
  tasks,
  currentUser,
  aiEnabled,
  onUpdate,
  onAddComment
}: UseTaskDetailStateParams) => {
  const [activeTab, setActiveTab] = useState<TaskDetailTabType>('general');
  const [description, setDescription] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<{ isAtRisk: boolean; reason: string } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; lastSeen: number }>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [dependencyQuery, setDependencyQuery] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualTimeError, setManualTimeError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const typingStopTimeoutRef = useRef<number | null>(null);
  const allUsers = userService.getUsers(currentUser?.orgId);

  useEffect(() => {
    if (activeTab === 'comments') {
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeTab, task.comments]);

  useEffect(() => {
    const normalizedAssignees =
      Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
        ? task.assigneeIds
        : task.assigneeId
          ? [task.assigneeId]
          : [];
    setDescription(task.description);
    setAssigneeIds(normalizedAssignees);
    setRiskAssessment(task.isAtRisk ? { isAtRisk: true, reason: 'Health scan previously flagged this node.' } : null);
    setDependencyQuery('');
    setTypingUsers({});
  }, [task]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const stopTyping = () => {
      realtimeService.publish({
        type: 'COMMENT_TYPING',
        orgId: currentUser.orgId,
        actorId: currentUser.id,
        payload: {
          taskId: task.id,
          displayName: currentUser.displayName,
          isTyping: false
        }
      });
    };

    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type !== 'COMMENT_TYPING') return;
      if (event.orgId !== currentUser.orgId) return;
      const taskId = typeof event.payload?.taskId === 'string' ? event.payload.taskId : '';
      if (taskId !== task.id) return;
      const actorId = event.actorId;
      if (!actorId || actorId === currentUser.id) return;
      const displayName = typeof event.payload?.displayName === 'string' ? event.payload.displayName : 'Someone';
      const isActorTyping = Boolean(event.payload?.isTyping);
      setTypingUsers((prev) => {
        if (isActorTyping) return { ...prev, [actorId]: { name: displayName, lastSeen: Date.now() } };
        const next = { ...prev };
        delete next[actorId];
        return next;
      });
    });

    const cleanupTimer = window.setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        return Object.fromEntries(Object.entries(prev).filter(([, value]) => now - value.lastSeen < 4000));
      });
    }, 4000);

    return () => {
      unsubscribe();
      stopTyping();
      if (typingStopTimeoutRef.current) {
        window.clearTimeout(typingStopTimeoutRef.current);
        typingStopTimeoutRef.current = null;
      }
      window.clearInterval(cleanupTimer);
    };
  }, [task.id, currentUser?.id, currentUser?.orgId, currentUser?.displayName]);

  useEffect(() => {
    let interval: number | undefined;
    if (task.isTimerRunning && task.timerStartedAt) {
      interval = window.setInterval(() => {
        setElapsed(Date.now() - task.timerStartedAt!);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [task.isTimerRunning, task.timerStartedAt]);

  const potentialDependencies = useMemo(
    () => tasks.filter((item) => item.id !== task.id && item.projectId === task.projectId),
    [tasks, task.id, task.projectId]
  );

  const totalTrackedMs = (task.timeLogged || 0) + elapsed;
  const canApprove = currentUser?.role === 'admin';

  const handleToggleDependency = (depId: string) => {
    const currentDeps = task.blockedByIds || [];
    const nextDeps = currentDeps.includes(depId)
      ? currentDeps.filter((id) => id !== depId)
      : [...currentDeps, depId];
    onUpdate(task.id, { blockedByIds: nextDeps });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    onAddComment(task.id, commentText);
    setCommentText('');
    setTypingUsers({});
    realtimeService.publish({
      type: 'COMMENT_TYPING',
      orgId: currentUser.orgId,
      actorId: currentUser.id,
      payload: {
        taskId: task.id,
        displayName: currentUser.displayName,
        isTyping: false
      }
    });
  };

  const handleTypingStart = () => {
    if (!currentUser) return;
    realtimeService.publish({
      type: 'COMMENT_TYPING',
      orgId: currentUser.orgId,
      actorId: currentUser.id,
      payload: {
        taskId: task.id,
        displayName: currentUser.displayName,
        isTyping: true
      }
    });
    if (typingStopTimeoutRef.current) window.clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = window.setTimeout(() => {
      realtimeService.publish({
        type: 'COMMENT_TYPING',
        orgId: currentUser.orgId,
        actorId: currentUser.id,
        payload: {
          taskId: task.id,
          displayName: currentUser.displayName,
          isTyping: false
        }
      });
      typingStopTimeoutRef.current = null;
    }, 1200);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const value = newSubtaskTitle.trim();
    if (!value) return;
    const nextSubtasks: Subtask[] = [
      ...(task.subtasks || []),
      { id: `sub-${Date.now()}`, title: value, isCompleted: false }
    ];
    onUpdate(task.id, { subtasks: nextSubtasks });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const nextSubtasks = (task.subtasks || []).map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, isCompleted: !subtask.isCompleted } : subtask
    );
    onUpdate(task.id, { subtasks: nextSubtasks });
  };

  const handleRemoveSubtask = async (subtaskId: string) => {
    const subtask = (task.subtasks || []).find((item) => item.id === subtaskId);
    const confirmed = await dialogService.confirm(`Delete subtask "${subtask?.title || 'this subtask'}"?`, {
      title: 'Delete subtask',
      confirmText: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    const nextSubtasks = (task.subtasks || []).filter((subtask) => subtask.id !== subtaskId);
    onUpdate(task.id, { subtasks: nextSubtasks });
  };

  const addManualTime = (minutesToAdd?: number) => {
    const computedMinutes = minutesToAdd ?? (Number(manualHours || 0) * 60 + Number(manualMinutes || 0));
    if (!Number.isFinite(computedMinutes) || computedMinutes <= 0) {
      setManualTimeError('Enter hours or minutes greater than zero.');
      return;
    }
    onUpdate(task.id, { timeLogged: (task.timeLogged || 0) + Math.round(computedMinutes) * 60000 });
    setManualHours('');
    setManualMinutes('');
    setManualTimeError('');
  };

  const formatTrackedTime = (ms: number) => {
    const totalMinutes = Math.floor((ms || 0) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const runAIAudit = async () => {
    if (!aiEnabled) return;
    setIsAIThinking(true);
    const assessment = await aiService.predictRisk(task);
    setRiskAssessment(assessment);
    onUpdate(task.id, { isAtRisk: assessment.isAtRisk });
    setIsAIThinking(false);
  };

  return {
    activeTab,
    setActiveTab,
    description,
    setDescription,
    assigneeIds,
    setAssigneeIds,
    commentText,
    setCommentText,
    isAIThinking,
    riskAssessment,
    typingUsers,
    newSubtaskTitle,
    setNewSubtaskTitle,
    dependencyQuery,
    setDependencyQuery,
    manualHours,
    setManualHours,
    manualMinutes,
    setManualMinutes,
    manualTimeError,
    setManualTimeError,
    commentsEndRef,
    allUsers,
    potentialDependencies,
    totalTrackedMs,
    canApprove,
    handleToggleDependency,
    handleAddComment,
    handleTypingStart,
    handleAddSubtask,
    handleToggleSubtask,
    handleRemoveSubtask,
    addManualTime,
    formatTrackedTime,
    runAIAudit
  };
};
