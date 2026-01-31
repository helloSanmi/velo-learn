
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Zap, Target, Box, X } from 'lucide-react';
import { Task, Project } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onSelectProject: (id: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, onClose, tasks, projects, onSelectTask, onSelectProject 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Toggle logic is handled in App.tsx
      }
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-top-4 duration-300">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, or commands..."
            className="w-full pl-16 pr-6 py-6 text-lg font-medium text-slate-800 outline-none border-b border-slate-100"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md border border-slate-200 text-[10px] font-black text-slate-500">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {filteredTasks.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <Target className="w-3 h-3" /> Tasks
              </p>
              <div className="space-y-1">
                {filteredTasks.map((task, i) => (
                  <button
                    key={task.id}
                    onClick={() => { onSelectTask(task); onClose(); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                      <span className="text-sm font-bold text-slate-700">{task.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredProjects.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <Box className="w-3 h-3" /> Projects
              </p>
              <div className="space-y-1">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onSelectProject(p.id); onClose(); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-md ${p.color}`} />
                      <span className="text-sm font-bold text-slate-700">{p.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query === '' && (
            <div>
              <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all text-sm font-bold text-slate-600">
                  Create New Task
                </button>
                <button className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all text-sm font-bold text-slate-600">
                  Switch User
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Navigate</span>
            <span className="flex items-center gap-1"><Box className="w-3 h-3" /> Select</span>
          </div>
          <button onClick={onClose}>ESC to close</button>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
