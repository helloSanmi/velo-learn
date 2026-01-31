
import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, Check, Plus, Trash2, ListChecks, MessageSquare, History, User as UserIcon, Send, Sparkles, Loader2, AlertTriangle, CheckCircle2, CalendarDays, Calendar, Clock } from 'lucide-react';
import { Task, TaskPriority, Subtask, TaskStatus, User } from '../types';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { aiService } from '../services/aiService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>) => void;
  onAddComment: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  currentUser?: User;
  aiEnabled?: boolean;
}

type TabType = 'general' | 'subtasks' | 'comments' | 'activity';

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, onClose, onUpdate, onAddComment, onDelete, currentUser, aiEnabled = true 
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
  const [isScheduling, setIsScheduling] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<{ isAtRisk: boolean; reason: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDate, setNewSubtaskDate] = useState('');

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const allUsers = userService.getUsers();

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'comments') {
      scrollToBottom();
    }
  }, [activeTab, task?.comments]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setAssigneeId(task.assigneeId || '');
      setRiskAssessment(task.isAtRisk ? { isAtRisk: true, reason: "Previously flagged." } : null);
    }
  }, [task]);

  if (!task) return null;

  const totalMinutes = Math.floor((task.timeLogged || 0) / 60000);

  const handleSmartSchedule = async () => {
    setIsScheduling(true);
    const suggested = await aiService.suggestDueDate(title, task.subtasks.map(s => s.title));
    onUpdate(task.id, { dueDate: new Date(suggested).getTime() });
    setIsScheduling(false);
  };

  const handleSave = () => {
    onUpdate(task.id, { title, description, priority, status, assigneeId: assigneeId || undefined });
    setIsEditing(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    onAddComment(task.id, commentText);
    setCommentText('');
    setIsTyping(false);
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      const others = allUsers.filter(u => u.id !== currentUser?.id);
      const randomUser = others[Math.floor(Math.random() * others.length)];
      setTypingUser(randomUser?.displayName || 'Someone');
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 5000);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
               <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assignee</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={assigneeId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setAssigneeId(newId);
                        onUpdate(task.id, { assigneeId: newId || undefined });
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">Unassigned</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.displayName}</option>
                      ))}
                    </select>
                  </div>
               </div>

               <div className="p-4 md:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time Invested</h4>
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                 </div>
                 <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-black bg-white border-slate-200 uppercase tracking-widest`}>
                    <span className="text-emerald-600">{totalMinutes} Minutes Logged</span>
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                 <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Description</h4>
                 <button onClick={() => setIsEditing(!isEditing)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                   <Edit2 className="w-4 h-4" />
                 </button>
              </div>
              {isEditing ? (
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              ) : (
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {task.description || "No documentation provided for this item."}
                </p>
              )}
            </div>

            {aiEnabled && (
              <div className="p-4 md:p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest">AI Integrity Check</h4>
                  </div>
                  <button 
                    onClick={async () => {
                        setIsAIThinking(true);
                        const assessment = await aiService.predictRisk(task);
                        setRiskAssessment(assessment);
                        onUpdate(task.id, { isAtRisk: assessment.isAtRisk });
                        setIsAIThinking(false);
                    }}
                    disabled={isAIThinking}
                    className="text-[10px] font-black uppercase text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isAIThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run Scan"}
                  </button>
                </div>
                {riskAssessment && (
                  <div className={`flex gap-3 p-3 rounded-xl border ${riskAssessment.isAtRisk ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    {riskAssessment.isAtRisk ? <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    <div>
                      <p className={`text-sm font-bold ${riskAssessment.isAtRisk ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {riskAssessment.isAtRisk ? "At Risk detected" : "Health looks good"}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium leading-tight">{riskAssessment.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'comments':
        return (
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
              {task.comments && task.comments.length > 0 ? (
                <>
                  {task.comments.map(c => {
                    const isMe = c.userId === currentUser?.id;
                    const commentUser = allUsers.find(u => u.id === c.userId);
                    return (
                      <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-9 h-9 bg-slate-200 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                          <img src={commentUser?.avatar} alt={c.displayName} />
                        </div>
                        <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-4 rounded-2xl shadow-sm border ${isMe ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`flex items-center justify-between gap-4 mb-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className={`text-xs font-black tracking-tight ${isMe ? 'text-indigo-100' : 'text-slate-900'}`}>{c.displayName}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-indigo-300' : 'text-slate-400'}`}>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                  <div className="p-5 bg-slate-50 rounded-full border border-slate-100 opacity-20">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-center">Communication line silent</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-col gap-2">
              {isTyping && (
                <p className="text-[10px] font-black text-indigo-600 animate-pulse px-4">
                  {typingUser} is typing...
                </p>
              )}
              <form onSubmit={handleAddComment} className="relative group">
                <input 
                  value={commentText}
                  onChange={(e) => {
                      setCommentText(e.target.value);
                      handleTypingStart();
                  }}
                  placeholder="Synchronize with team..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-4 pl-5 pr-14 text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none"
                />
                <button 
                  type="submit" 
                  disabled={!commentText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        );
      default:
        return <div>Subtasks and Activity content...</div>;
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in slide-in-from-bottom-12 md:zoom-in-95 duration-500 max-h-[95vh] md:max-h-[90vh] flex flex-col border border-white/20">
        <div className="px-6 py-6 md:px-10 md:py-10 flex items-start justify-between border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div className="flex-1 overflow-hidden pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="indigo">ITERATION {task.auditLog?.length || 1}</Badge>
              {task.isAtRisk && <Badge variant="rose">HIGH RISK</Badge>}
              <Badge variant="amber">{task.priority.toUpperCase()}</Badge>
            </div>
            {isEditing ? (
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl md:text-3xl font-black text-slate-900 border-b-2 border-indigo-600 outline-none w-full bg-transparent"
              />
            ) : (
              <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none truncate md:whitespace-normal">
                {task.title}
              </h2>
            )}
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-[1.25rem] hover:bg-rose-50 transition-all shrink-0">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex items-center gap-6 md:gap-10 px-6 md:px-10 border-b border-slate-100 flex-shrink-0 overflow-x-auto no-scrollbar bg-white">
          {[
            { id: 'general', label: 'Overview', icon: <UserIcon className="w-4 h-4" /> },
            { id: 'subtasks', label: 'Steps', icon: <ListChecks className="w-4 h-4" /> },
            { id: 'comments', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'activity', label: 'Audit', icon: <History className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2.5 py-5 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar scroll-smooth">
          {renderTabContent()}
        </div>

        <div className="p-6 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 flex-shrink-0">
          {isEditing ? (
            <Button variant="secondary" className="flex-1 py-4 rounded-2xl" onClick={handleSave}>Confirm Revisions</Button>
          ) : (
            <>
              <Button variant="outline" className="flex-1 py-4 rounded-2xl" onClick={() => setIsEditing(true)}>Modify Details</Button>
              <Button 
                variant="danger" 
                className="py-4 px-6 rounded-2xl" 
                onClick={() => { if(confirm('Purge this task record?')) { onDelete(task.id); onClose(); } }}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
