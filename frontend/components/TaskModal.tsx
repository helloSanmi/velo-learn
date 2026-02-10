import React, { useState } from 'react';
import { Hash, Loader2, Sparkles, X } from 'lucide-react';
import { TaskPriority } from '../types';
import { userService } from '../services/userService';
import { aiService } from '../services/aiService';
import { dialogService } from '../services/dialogService';
import Button from './ui/Button';
import AssigneePicker from './ui/AssigneePicker';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, priority: TaskPriority, tags: string[], dueDate?: number, assigneeIds?: string[]) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const allUsers = userService.getUsers();

  if (!isOpen) return null;

  const handleSuggestDate = async () => {
    if (!title.trim()) {
      await dialogService.notice('Please enter a task title first.', { title: 'Task title required' });
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
    setTags((prev) => Array.from(new Set([...prev, ...suggested])));
    setIsSuggestingTags(false);
  };

  const addTagFromInput = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !tagInput.trim()) return;
    e.preventDefault();
    const nextTag = tagInput.trim();
    if (!tags.includes(nextTag)) setTags([...tags, nextTag]);
    setTagInput('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit(
      title,
      description,
      priority,
      tags,
      dueDate ? new Date(dueDate).getTime() : undefined,
      assigneeIds
    );

    setTitle('');
    setDescription('');
    setPriority(TaskPriority.MEDIUM);
    setTags([]);
    setTagInput('');
    setDueDate('');
    setAssigneeIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">New Task</h2>
            <p className="text-[11px] text-slate-500 -mt-0.5">Compact task setup</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 min-h-0 flex flex-col">
          <div className="p-3.5 md:p-4 space-y-3 overflow-y-auto custom-scrollbar">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Title</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Task title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Assignees</label>
                <AssigneePicker users={allUsers} selectedIds={assigneeIds} onChange={setAssigneeIds} compact />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-slate-300">
                  {Object.values(TaskPriority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-slate-500">Due date</label>
                <button type="button" onClick={handleSuggestDate} className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                  {isScheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Suggest
                </button>
              </div>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-slate-500">Tags</label>
                <button type="button" onClick={handleSuggestTags} className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                  {isSuggestingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Suggest
                </button>
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTagFromInput}
                  placeholder="Press Enter to add"
                  className="w-full h-10 rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              {tags.length > 0 && (
                <div className="mt-2 max-h-20 overflow-y-auto custom-scrollbar pr-1 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button key={tag} type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="px-2 py-1 rounded-md text-xs border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">
                      {tag} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-28 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                placeholder="Add notes or details..."
              />
            </div>
          </div>

          <div className="border-t border-slate-200 p-3.5 md:p-4 bg-white">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1">Create Task</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
