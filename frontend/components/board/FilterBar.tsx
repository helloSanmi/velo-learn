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
    <div className="flex-none bg-white border-b border-slate-200 overflow-x-auto no-scrollbar">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-3 flex items-center gap-8 whitespace-nowrap">
        <div className="flex items-center gap-2.5 text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Filters</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium uppercase text-slate-400 tracking-wide">Assignee</span>
            <div className="flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
               <select 
                value={assigneeFilter}
                onChange={(e) => onAssigneeChange(e.target.value)}
                className="bg-transparent text-[12px] font-medium rounded-lg px-2 py-0.5 outline-none border-none cursor-pointer text-slate-700"
               >
                 <option value="All">Global Staff</option>
                 <option value="Me">My Identity</option>
                 {allUsers.map(u => (
                   <option key={u.id} value={u.id}>{u.displayName}</option>
                 ))}
               </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium uppercase text-slate-400 tracking-wide">Status</span>
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              {['All', ...Object.values(TaskStatus)].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status as any)}
                  className={`px-3 py-1 text-[11px] font-medium uppercase tracking-wide rounded-lg transition-colors ${
                    statusFilter === status 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {status === 'All' ? 'All' : status.split('-')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium uppercase text-slate-400 tracking-wide">Priority</span>
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              {['All', ...Object.values(TaskPriority)].map((priority) => (
                <button
                  key={priority}
                  onClick={() => onPriorityChange(priority as any)}
                  className={`px-3 py-1 text-[11px] font-medium uppercase tracking-wide rounded-lg transition-colors ${
                    priorityFilter === priority 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-800'
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
