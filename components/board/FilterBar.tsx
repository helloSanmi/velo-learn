
import React from 'react';
import { Filter } from 'lucide-react';
import { TaskStatus, TaskPriority, User } from '../../types';

interface FilterBarProps {
  statusFilter: TaskStatus | 'All';
  priorityFilter: TaskPriority | 'All';
  tagFilter: string | 'All';
  assigneeFilter: string | 'All';
  uniqueTags: string[];
  allUsers: User[];
  onStatusChange: (status: TaskStatus | 'All') => void;
  onPriorityChange: (priority: TaskPriority | 'All') => void;
  onTagChange: (tag: string) => void;
  onAssigneeChange: (assigneeId: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  priorityFilter,
  assigneeFilter,
  allUsers,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange
}) => {
  return (
    <div className="flex-none bg-white border-b border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
      <div className="w-full px-4 md:px-6 lg:px-8 py-3 flex items-center gap-6 md:gap-10 whitespace-nowrap min-w-max">
        <div className="flex items-center gap-2.5 text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
        </div>

        <div className="flex items-center gap-8">
          {/* Assignee Filter */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[9px] font-black uppercase text-slate-400 tracking-tighter">Assignee</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-xl">
               <select 
                value={assigneeFilter}
                onChange={(e) => onAssigneeChange(e.target.value)}
                className="bg-transparent text-[11px] font-bold uppercase tracking-wide rounded-lg px-2 py-0.5 outline-none border-none cursor-pointer"
               >
                 <option value="All">All Staff</option>
                 <option value="Me">My Tasks</option>
                 {allUsers.map(u => (
                   <option key={u.id} value={u.id}>{u.username}</option>
                 ))}
               </select>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[9px] font-black uppercase text-slate-400 tracking-tighter">Status</span>
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl">
              {['All', ...Object.values(TaskStatus)].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status as any)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all ${
                    statusFilter === status 
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {status === 'All' ? 'All' : status.split('-')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[9px] font-black uppercase text-slate-400 tracking-tighter">Priority</span>
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl">
              {['All', ...Object.values(TaskPriority)].map((priority) => (
                <button
                  key={priority}
                  onClick={() => onPriorityChange(priority as any)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all ${
                    priorityFilter === priority 
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {priority === 'All' ? 'All' : priority.charAt(0)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
