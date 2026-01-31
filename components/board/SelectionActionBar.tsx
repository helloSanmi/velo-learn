
import React from 'react';
import { Trash2, UserPlus, AlertCircle, X, CheckSquare, MoveRight } from 'lucide-react';
import { TaskPriority, TaskStatus, User } from '../../types';
import Button from '../ui/Button';

interface SelectionActionBarProps {
  selectedCount: number;
  allUsers: User[];
  onClear: () => void;
  onBulkPriority: (priority: TaskPriority) => void;
  onBulkStatus: (status: TaskStatus) => void;
  onBulkAssignee: (userId: string) => void;
  onBulkDelete: () => void;
}

const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  selectedCount,
  allUsers,
  onClear,
  onBulkPriority,
  onBulkStatus,
  onBulkAssignee,
  onBulkDelete
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-slate-900 text-white rounded-[2.5rem] px-8 py-5 shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center gap-4 pr-10 border-r border-white/10">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
             <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">{selectedCount} Items</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulk Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Priority Action */}
           <div className="group relative">
             <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Priority
             </button>
             <div className="absolute bottom-full left-0 mb-4 bg-white rounded-2xl p-2 shadow-2xl hidden group-hover:block animate-in fade-in slide-in-from-bottom-2">
                {Object.values(TaskPriority).map(p => (
                  <button 
                    key={p} 
                    onClick={() => onBulkPriority(p)}
                    className="w-full text-left px-4 py-2 rounded-xl text-slate-800 text-xs font-bold hover:bg-slate-100 whitespace-nowrap"
                  >
                    Set to {p}
                  </button>
                ))}
             </div>
           </div>

           {/* Status Action */}
           <div className="group relative">
             <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-bold text-xs">
                <MoveRight className="w-4 h-4 text-indigo-400" /> Move
             </button>
             <div className="absolute bottom-full left-0 mb-4 bg-white rounded-2xl p-2 shadow-2xl hidden group-hover:block animate-in fade-in slide-in-from-bottom-2">
                {Object.values(TaskStatus).map(s => (
                  <button 
                    key={s} 
                    onClick={() => onBulkStatus(s)}
                    className="w-full text-left px-4 py-2 rounded-xl text-slate-800 text-xs font-bold hover:bg-slate-100 whitespace-nowrap"
                  >
                    Move to {s.replace('-', ' ')}
                  </button>
                ))}
             </div>
           </div>

           {/* Assignee Action */}
           <div className="group relative">
             <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all font-bold text-xs">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Assign
             </button>
             <div className="absolute bottom-full left-0 mb-4 bg-white rounded-2xl p-2 shadow-2xl hidden group-hover:block animate-in fade-in slide-in-from-bottom-2 max-h-48 overflow-y-auto custom-scrollbar">
                {allUsers.map(u => (
                  <button 
                    key={u.id} 
                    onClick={() => onBulkAssignee(u.id)}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 rounded-xl text-slate-800 text-xs font-bold hover:bg-slate-100 whitespace-nowrap"
                  >
                    <img src={u.avatar} className="w-4 h-4 rounded-full" /> {u.username}
                  </button>
                ))}
             </div>
           </div>

           <div className="w-[1px] h-8 bg-white/10" />

           <button 
            onClick={onBulkDelete}
            className="p-3 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>

        <button 
          onClick={onClear}
          className="ml-4 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SelectionActionBar;
