import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { TaskPriority, TaskStatus, User } from '../../types';

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

const controlClass =
  'h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300';

const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  priorityFilter,
  tagFilter,
  assigneeFilter,
  uniqueTags,
  allUsers,
  onStatusChange,
  onPriorityChange,
  onTagChange,
  onAssigneeChange
}) => {
  return (
    <div className="flex-none px-4 md:px-8 pt-4 sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus | 'All')}
            className={controlClass}
          >
            <option value="All">All statuses</option>
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>{status.replace('-', ' ')}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as TaskPriority | 'All')}
            className={controlClass}
          >
            <option value="All">All priorities</option>
            {Object.values(TaskPriority).map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className={controlClass}
          >
            <option value="All">All assignees</option>
            <option value="Me">Assigned to me</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => onTagChange(e.target.value)}
            className={controlClass}
          >
            <option value="All">All tags</option>
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
