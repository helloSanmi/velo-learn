import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, History, User as UserIcon, ListChecks, MessageSquare, Lock, Trash2 } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, User, Subtask } from '../types';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { aiService } from '../services/aiService';
import { userService } from '../services/userService';
import { dialogService } from '../services/dialogService';
import { realtimeService } from '../services/realtimeService';
import TaskDetailGeneralTab from './task-detail/TaskDetailGeneralTab';
import TaskDetailDependenciesTab from './task-detail/TaskDetailDependenciesTab';
import TaskDetailSubtasksTab from './task-detail/TaskDetailSubtasksTab';
import TaskDetailCommentsTab from './task-detail/TaskDetailCommentsTab';
import TaskDetailActivityTab from './task-detail/TaskDetailActivityTab';

interface TaskDetailModalProps {
  task: Task | null;
  tasks: Task[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>) => void;
  onAddComment: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  currentUser?: User;
  aiEnabled?: boolean;
  onToggleTimer?: (id: string) => void;
}

type TabType = 'general' | 'subtasks' | 'comments' | 'dependencies' | 'activity';

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, tasks, onClose, onUpdate, onAddComment, onDelete, currentUser, aiEnabled = true, onToggleTimer
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
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
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [activeTab, task?.comments]);

  useEffect(() => {
    if (task) {
      const normalizedAssignees =
        Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
          ? task.assigneeIds
          : task.assigneeId
            ? [task.assigneeId]
            : [];
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setAssigneeIds(normalizedAssignees);
      setRiskAssessment(task.isAtRisk ? { isAtRisk: true, reason: "Health scan previously flagged this node." } : null);
      setDependencyQuery('');
      setTypingUsers({});
    }
  }, [task]);

  useEffect(() => {
    if (!task || !currentUser) return undefined;

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
        const next = Object.fromEntries(
          Object.entries(prev).filter(([, value]) => now - value.lastSeen < 4000)
        );
        return next;
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
  }, [task?.id, currentUser?.id, currentUser?.orgId, currentUser?.displayName]);

  useEffect(() => {
    let interval: any;
    if (task?.isTimerRunning && task.timerStartedAt) {
      interval = setInterval(() => {
        setElapsed(Date.now() - task.timerStartedAt);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [task?.isTimerRunning, task?.timerStartedAt]);

  const potentialDependencies = useMemo(() => {
    return tasks.filter(t => t.id !== task?.id && t.projectId === task?.projectId);
  }, [tasks, task]);

  if (!task) return null;
  const totalTrackedMs = (task.timeLogged || 0) + elapsed;
  const canApprove = currentUser?.role === 'admin';

  const handleToggleDependency = (depId: string) => {
    const currentDeps = task.blockedByIds || [];
    const nextDeps = currentDeps.includes(depId) 
      ? currentDeps.filter(id => id !== depId) 
      : [...currentDeps, depId];
    onUpdate(task.id, { blockedByIds: nextDeps });
  };

  // Fix: Added missing 'handleAddComment' handler
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

  const handleRemoveSubtask = (subtaskId: string) => {
    const nextSubtasks = (task.subtasks || []).filter((subtask) => subtask.id !== subtaskId);
    onUpdate(task.id, { subtasks: nextSubtasks });
  };

  const addManualTime = (minutesToAdd?: number) => {
    const computedMinutes =
      minutesToAdd ??
      (Number(manualHours || 0) * 60 + Number(manualMinutes || 0));

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

  const renderTabContent = () => {
    if (activeTab === 'general') {
      return (
        <TaskDetailGeneralTab
          task={task}
          aiEnabled={aiEnabled}
          allUsers={allUsers}
          assigneeIds={assigneeIds}
          setAssigneeIds={setAssigneeIds}
          onUpdate={onUpdate}
          onAddComment={onAddComment}
          currentUser={currentUser}
          canApprove={canApprove}
          totalTrackedMs={totalTrackedMs}
          formatTrackedTime={formatTrackedTime}
          manualHours={manualHours}
          setManualHours={setManualHours}
          manualMinutes={manualMinutes}
          setManualMinutes={setManualMinutes}
          manualTimeError={manualTimeError}
          setManualTimeError={setManualTimeError}
          addManualTime={addManualTime}
          onToggleTimer={onToggleTimer}
          riskAssessment={riskAssessment}
          isAIThinking={isAIThinking}
          runAIAudit={runAIAudit}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          description={description}
          setDescription={setDescription}
        />
      );
    }
    if (activeTab === 'dependencies') {
      return (
        <TaskDetailDependenciesTab
          task={task}
          potentialDependencies={potentialDependencies}
          dependencyQuery={dependencyQuery}
          setDependencyQuery={setDependencyQuery}
          onToggleDependency={handleToggleDependency}
        />
      );
    }
    if (activeTab === 'subtasks') {
      return (
        <TaskDetailSubtasksTab
          task={task}
          newSubtaskTitle={newSubtaskTitle}
          setNewSubtaskTitle={setNewSubtaskTitle}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          onRemoveSubtask={handleRemoveSubtask}
        />
      );
    }
    if (activeTab === 'comments') {
      return (
        <TaskDetailCommentsTab
          task={task}
          currentUser={currentUser}
          allUsers={allUsers}
          typingUsers={typingUsers}
          commentText={commentText}
          setCommentText={setCommentText}
          onTypingStart={handleTypingStart}
          onAddComment={handleAddComment}
          commentsEndRef={commentsEndRef}
        />
      );
    }
    if (activeTab === 'activity') {
      return <TaskDetailActivityTab task={task} />;
    }
    return null;
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200 h-[88vh] md:h-[84vh] flex flex-col border border-slate-200">
        <div className="px-4 py-4 md:px-5 flex items-start justify-between border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex-1 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="indigo">{task.status.toUpperCase()}</Badge>
              {task.isAtRisk && <Badge variant="rose">AT RISK</Badge>}
              <Badge variant="amber">{task.priority.toUpperCase()}</Badge>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight truncate md:whitespace-normal">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition-all shrink-0 active:scale-95"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-4 md:px-5 py-3 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { id: 'general', label: 'Summary', icon: <UserIcon className="w-3.5 h-3.5" />, count: '' },
              { id: 'subtasks', label: 'Steps', icon: <ListChecks className="w-3.5 h-3.5" />, count: String(task.subtasks.length) },
              { id: 'dependencies', label: 'Deps', icon: <Lock className="w-3.5 h-3.5" />, count: String(task.blockedByIds?.length || 0) },
              { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-3.5 h-3.5" />, count: String(task.comments?.length || 0) },
              { id: 'activity', label: 'Activity', icon: <History className="w-3.5 h-3.5" />, count: String(task.auditLog?.length || 0) },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`h-10 rounded-lg px-2 inline-flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {tab.count && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-white/15 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar scroll-smooth">
          {renderTabContent()}
        </div>

        <div className="p-4 md:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2 flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>Edit Task</Button>
          <Button variant="danger" className="px-6" onClick={async () => { const confirmed = await dialogService.confirm('Delete this task?', { title: 'Delete task', confirmText: 'Delete', danger: true }); if (confirmed) { onDelete(task.id); onClose(); } }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
