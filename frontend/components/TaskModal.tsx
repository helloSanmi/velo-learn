import React, { useState } from 'react';
import { X, Tag, Calendar, UserPlus, Sparkles, Loader2, Target, Layers, Hash, Plus, ArrowRight } from 'lucide-react';
import { TaskPriority } from '../types';
import { userService } from '../services/userService';
import { aiService } from '../services/aiService';
import Button from './ui/Button';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, priority: TaskPriority, tags: string[], dueDate?: number, assigneeId?: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const allUsers = userService.getUsers();

  if (!isOpen) return null;

  const handleSmartSchedule = async () => {
    if (!title.trim()) {
      alert("Please enter a task title first so Runa AI can analyze the scope.");
      return;
    }
    setIsScheduling(true);
    const suggested = await aiService.suggestDueDate(title, tags);
    setDueDate(suggested);
    setIsScheduling(false);
  };

  const handleSuggestTags = async () => {
    if (!title.trim()) return;
    setIsSuggestingTags(true);
    const suggested = await aiService.suggestTags(title, description);
    const unique = Array.from(new Set([...tags, ...suggested]));
    setTags(unique);
    setIsSuggestingTags(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit(
      title, 
      description, 
      priority, 
      tags, 
      dueDate ? new Date(dueDate).getTime() : undefined,
      assigneeId || undefined
    );

    setTitle('');
    setDescription('');
    setPriority(TaskPriority.MEDIUM);
    setTags([]);
    setTagInput('');
    setDueDate('');
    setAssigneeId('');
    onClose();
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_40px_120px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                <Target className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-heading font-black text-slate-900 tracking-tight">Initialize Node</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-8 md:p-10 space-y-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.25em] px-1">Objective</label>
              <input
                autoFocus
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl md:text-3xl font-black text-slate-900 placeholder:text-slate-200 bg-transparent outline-none tracking-tight leading-tight"
                placeholder="What are we building?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    <UserPlus className="w-3 h-3" /> Assignee
                  </label>
                  <select 
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="">Global Backlog (Unassigned)</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.displayName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    <Layers className="w-3 h-3" /> Priority Tier
                  </label>
                  <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                    {Object.values(TaskPriority).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                          priority === p 
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <Calendar className="w-3 h-3" /> Target Date
                    </label>
                    <button 
                      type="button" 
                      onClick={handleSmartSchedule}
                      disabled={isScheduling}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {isScheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Runa AI Suggest
                    </button>
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all font-bold text-sm text-slate-700 ${dueDate ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <Hash className="w-3 h-3" /> Workspace Tags
                    </label>
                    <button 
                      type="button" 
                      onClick={handleSuggestTags}
                      disabled={isSuggestingTags || !title.trim()}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {isSuggestingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Runa AI Labels
                    </button>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-full pl-5 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm"
                      placeholder="Press Enter to append..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       <Plus className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-tight rounded-lg border border-indigo-100">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.25em] px-1">Detailed Context</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-6 py-5 rounded-[2rem] bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all h-32 resize-none leading-relaxed font-medium text-sm text-slate-700 custom-scrollbar shadow-inner"
                placeholder="Append strategic details, constraints, or notes..."
              />
            </div>
          </div>

          <div className="p-8 md:px-10 md:py-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Abort Entry
            </button>
            <Button
              type="submit"
              variant="secondary"
              className="flex-[2] py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98]"
            >
              Deploy Node to Board
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;