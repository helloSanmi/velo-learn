import React, { useState, useEffect, useRef, useMemo } from 'react';
// Fix: Added missing 'CheckSquare' to lucide-react imports
import { X, Edit2, History, User as UserIcon, Send, Sparkles, Loader2, AlertTriangle, CheckCircle2, ListChecks, MessageSquare, Clock, Trash2, Plus, Check, Zap, Terminal, Link2, Lock, ShieldCheck, CheckSquare, Search, Play, Pause } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, User, Subtask } from '../types';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { aiService } from '../services/aiService';
import { userService } from '../services/userService';

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
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [commentText, setCommentText] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<{ isAtRisk: boolean; reason: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [dependencyQuery, setDependencyQuery] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualTimeError, setManualTimeError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const allUsers = userService.getUsers(currentUser?.orgId);

  useEffect(() => {
    if (activeTab === 'comments') {
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [activeTab, task?.comments]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setAssigneeId(task.assigneeId || '');
      setRiskAssessment(task.isAtRisk ? { isAtRisk: true, reason: "Health scan previously flagged this node." } : null);
      setDependencyQuery('');
    }
  }, [task]);

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
    setIsTyping(false);
  };

  // Fix: Added missing 'handleTypingStart' handler
  const handleTypingStart = () => {
    if (!isTyping) {
      const others = allUsers.filter(u => u.id !== currentUser?.id);
      const randomUser = others[Math.floor(Math.random() * others.length)];
      setTypingUser(randomUser?.displayName || 'Someone');
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 5000);
    }
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
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className={`grid grid-cols-1 ${aiEnabled ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assignee</h4>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setAssigneeId(newId);
                    onUpdate(task.id, { assigneeId: newId || undefined });
                  }}
                  className="h-9 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-300 appearance-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time Tracked</h4>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Clock className="w-3.5 h-3.5" />
                    <p className="text-sm font-semibold">Total tracked</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-emerald-800">{formatTrackedTime(totalTrackedMs)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleTimer?.(task.id)}
                  className={`h-8 rounded-lg border px-2.5 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors ${
                    task.isTimerRunning
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {task.isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {task.isTimerRunning ? 'Stop timer' : 'Start timer'}
                </button>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <label className="h-9 px-2 rounded-lg border border-slate-300 bg-white flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={manualHours}
                      onChange={(e) => {
                        setManualHours(e.target.value);
                        if (manualTimeError) setManualTimeError('');
                      }}
                      placeholder="0"
                      className="w-full bg-transparent text-xs outline-none"
                    />
                    <span className="text-[11px] text-slate-500">h</span>
                  </label>
                  <label className="h-9 px-2 rounded-lg border border-slate-300 bg-white flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={manualMinutes}
                      onChange={(e) => {
                        setManualMinutes(e.target.value);
                        if (manualTimeError) setManualTimeError('');
                      }}
                      placeholder="0"
                      className="w-full bg-transparent text-xs outline-none"
                    />
                    <span className="text-[11px] text-slate-500">m</span>
                  </label>
                  <Button type="button" variant="secondary" className="h-9 px-2.5 text-xs" onClick={() => addManualTime()}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => addManualTime(15)} className="h-7 px-2 rounded-md border border-slate-300 bg-white text-[11px] font-medium text-slate-600 hover:bg-slate-100">+15m</button>
                  <button type="button" onClick={() => addManualTime(30)} className="h-7 px-2 rounded-md border border-slate-300 bg-white text-[11px] font-medium text-slate-600 hover:bg-slate-100">+30m</button>
                  <button type="button" onClick={() => addManualTime(60)} className="h-7 px-2 rounded-md border border-slate-300 bg-white text-[11px] font-medium text-slate-600 hover:bg-slate-100">+1h</button>
                </div>
                {manualTimeError ? <p className="text-xs text-rose-600">{manualTimeError}</p> : null}
              </div>

              {aiEnabled ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Audit</h4>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${riskAssessment ? (riskAssessment.isAtRisk ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-500'}`}>
                      {riskAssessment ? (riskAssessment.isAtRisk ? 'At risk' : 'Healthy') : 'Not checked'}
                    </p>
                    <Button size="sm" onClick={runAIAudit} disabled={isAIThinking} className="h-8 px-2 rounded-lg text-xs">
                      {isAIThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Check
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {riskAssessment?.reason || 'Run a quick health check for risk signals.'}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 relative group">
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Documentation</h4>
                 <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all">
                   <Edit2 className="w-4 h-4" />
                 </button>
              </div>
              {isEditing ? (
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm h-40 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none font-medium"
                />
              ) : (
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">{task.description || "No documentation provided."}</p>
              )}
            </div>

          </div>
        );
      case 'dependencies':
        const selectedDeps = potentialDependencies.filter((dep) => task.blockedByIds?.includes(dep.id));
        const availableDeps = potentialDependencies.filter((dep) => {
          if (task.blockedByIds?.includes(dep.id)) return false;
          if (!dependencyQuery.trim()) return true;
          return dep.title.toLowerCase().includes(dependencyQuery.trim().toLowerCase());
        });

        const renderDependencyRow = (dep: Task, isSelected: boolean) => (
          <button
            key={dep.id}
            onClick={() => handleToggleDependency(dep.id)}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all group ${
              isSelected
                ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3 text-left min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isSelected ? <Lock className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-rose-900' : 'text-slate-900'}`}>{dep.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                    {dep.status.replace('-', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">#{dep.id.slice(-4)}</span>
                </div>
              </div>
            </div>
            {isSelected ? (
              <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
            )}
          </button>
        );

        return (
          <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-600" /> Dependencies
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Choose tasks that must be completed first.</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-slate-900">{selectedDeps.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">selected</p>
              </div>
            </div>

            <label className="h-10 border border-slate-300 rounded-lg px-3 flex items-center gap-2 bg-white">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={dependencyQuery}
                onChange={(e) => setDependencyQuery(e.target.value)}
                placeholder="Search available tasks"
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </label>

            <div className="grid md:grid-cols-2 gap-3 flex-1 min-h-0">
              <section className="border border-slate-200 rounded-xl bg-white p-3 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Selected</p>
                  <span className="text-xs text-slate-500">{selectedDeps.length}</span>
                </div>
                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {selectedDeps.length === 0 ? (
                    <div className="h-full min-h-24 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-center px-4 text-center">
                      No dependencies yet.
                    </div>
                  ) : (
                    selectedDeps.map((dep) => renderDependencyRow(dep, true))
                  )}
                </div>
              </section>

              <section className="border border-slate-200 rounded-xl bg-white p-3 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Available</p>
                  <span className="text-xs text-slate-500">{availableDeps.length}</span>
                </div>
                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {availableDeps.length === 0 ? (
                    <div className="h-full min-h-24 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-center px-4 text-center">
                      {dependencyQuery.trim() ? 'No tasks match this search.' : 'No other tasks available.'}
                    </div>
                  ) : (
                    availableDeps.map((dep) => renderDependencyRow(dep, false))
                  )}
                </div>
              </section>
            </div>
          </div>
        );
      case 'subtasks':
        const completedSubtasks = (task.subtasks || []).filter((subtask) => subtask.isCompleted).length;
        return (
          <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-indigo-600" /> Subtasks
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Break work into small, trackable steps.</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-slate-900">{completedSubtasks}/{task.subtasks.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">done</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 border border-slate-200 rounded-xl bg-white p-3">
              <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 h-full">
                {task.subtasks.length === 0 ? (
                  <div className="h-full min-h-24 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-center px-4 text-center">
                    No subtasks yet.
                  </div>
                ) : (
                  task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white">
                      <button
                        onClick={() => handleToggleSubtask(subtask.id)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                          subtask.isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {subtask.isCompleted ? <Check className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                      </button>
                      <p className={`text-sm flex-1 min-w-0 truncate ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {subtask.title}
                      </p>
                      <button
                        onClick={() => handleRemoveSubtask(subtask.id)}
                        className="w-7 h-7 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
              <Button type="submit" variant="secondary" className="px-3 h-10">
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </div>
        );
      case 'comments':
        return (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-4">
              {task.comments?.length === 0 && (
                <div className="h-full min-h-24 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-center px-4 text-center">
                  No comments yet.
                </div>
              )}
              {task.comments?.map(c => (
                <div key={c.id} className={`flex gap-3 ${c.userId === currentUser?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                    <img src={allUsers.find(u => u.id === c.userId)?.avatar} alt={c.displayName} className="w-full h-full object-cover" />
                  </div>
                  <div className={`max-w-[78%] px-3 py-2 rounded-xl text-sm ${c.userId === currentUser?.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {c.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <p className="text-xs text-slate-400 px-1">{typingUser} is typing…</p>
              )}
              <div ref={commentsEndRef} />
            </div>
            <form onSubmit={handleAddComment} className="mt-3 relative group">
              <input value={commentText} onChange={(e) => { setCommentText(e.target.value); handleTypingStart(); }} placeholder="Write a comment..." className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition-all" />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        );
      case 'activity':
        return <div className="space-y-4 animate-in fade-in duration-300">
          {task.auditLog.map(log => (
            <div key={log.id} className="p-4 bg-slate-50 border-l-4 border-indigo-600 rounded-r-xl">
              <p className="text-xs font-black text-slate-900">{log.displayName} node recorded {log.action}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>;
      default:
        return null;
    }
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
          <Button variant="danger" className="px-6" onClick={() => { if(confirm('Delete this task?')) { onDelete(task.id); onClose(); } }}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
