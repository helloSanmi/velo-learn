
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Target, Box } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

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
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {filteredTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => { onSelectTask(task); onClose(); }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <span className="text-sm font-bold text-slate-700">{task.title}</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
