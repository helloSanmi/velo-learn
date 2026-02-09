import React from 'react';
import { TaskPriority, TaskStatus, User } from '../../types';

interface FilterBarProps {
  statusFilter: TaskStatus | 'All';
  priorityFilter: TaskPriority | 'All';
  tagFilter: string | 'All';
  assigneeFilter: string | 'All';
  uniqueTags: string[];
  allUsers: User[];
  embedded?: boolean;
  compact?: boolean;
  onStatusChange: (status: TaskStatus | 'All') => void;
  onPriorityChange: (priority: TaskPriority | 'All') => void;
  onTagChange: (tag: string) => void;
  onAssigneeChange: (assigneeId: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  priorityFilter,
  tagFilter,
  assigneeFilter,
  uniqueTags,
  allUsers,
  embedded = false,
  compact = false,
  onStatusChange,
  onPriorityChange,
  onTagChange,
  onAssigneeChange
}) => {
  const controlClass = compact
    ? 'h-6 min-w-[112px] px-1.5 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-slate-300'
    : 'h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-slate-300';
  const containerClass = embedded
    ? 'w-full'
    : 'flex-none px-4 md:px-8 pt-1.5 sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm';
  const frameClass = embedded
    ? 'w-full'
    : 'max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl p-2';
  const listClass = compact
    ? 'flex flex-wrap items-center justify-start md:justify-end gap-1'
    : 'grid grid-cols-2 lg:grid-cols-4 gap-1.5';

  return (
    <div className={containerClass}>
      <div className={frameClass}>
        <div className={listClass}>
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
