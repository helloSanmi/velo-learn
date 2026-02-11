import React from 'react';
import { TaskPriority, User } from '../../types';

interface FilterBarProps {
  searchQuery: string;
  projectFilter: string | 'All';
  projectOptions: Array<{ id: string; name: string }>;
  dueFrom?: number;
  dueTo?: number;
  statusFilter: string | 'All';
  priorityFilter: TaskPriority | 'All';
  tagFilter: string | 'All';
  assigneeFilter: string | 'All';
  statusOptions: Array<{ id: string; name: string }>;
  uniqueTags: string[];
  allUsers: User[];
  embedded?: boolean;
  compact?: boolean;
  onStatusChange: (status: string | 'All') => void;
  onPriorityChange: (priority: TaskPriority | 'All') => void;
  onTagChange: (tag: string) => void;
  onAssigneeChange: (assigneeId: string) => void;
  onSearchChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onDueFromChange: (value?: number) => void;
  onDueToChange: (value?: number) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  priorityFilter,
  tagFilter,
  assigneeFilter,
  searchQuery,
  projectFilter,
  projectOptions,
  dueFrom,
  dueTo,
  statusOptions,
  uniqueTags,
  allUsers,
  embedded = false,
  compact = false,
  onStatusChange,
  onPriorityChange,
  onTagChange,
  onAssigneeChange,
  onSearchChange,
  onProjectChange,
  onDueFromChange,
  onDueToChange
}) => {
  const controlClass = compact
    ? 'h-7 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-slate-300'
    : 'h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-slate-300';
  const containerClass = embedded
    ? 'w-full'
    : 'flex-none px-4 md:px-8 pt-1.5 sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm';
  const frameClass = embedded
    ? 'w-full'
    : 'max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl p-2';
  const listClass = compact
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_repeat(5,minmax(120px,1fr))_minmax(240px,1.2fr)] gap-1.5 items-center'
    : 'grid grid-cols-2 lg:grid-cols-4 gap-1.5';

  return (
    <div className={containerClass}>
      <div className={frameClass}>
        <div className={listClass}>
          <div className="w-full">
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks"
              className={controlClass}
            />
          </div>

          <div className="w-full">
            <select
              value={projectFilter}
              onChange={(e) => onProjectChange(e.target.value)}
              className={controlClass}
            >
              <option value="All">All projects</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className={controlClass}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full">
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
          </div>

          <div className="w-full">
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
          </div>

          <div className="w-full">
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

          <div className="w-full h-7 rounded-md border border-slate-200 bg-white px-2 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 shrink-0">Due</span>
            <input
              type="date"
              value={dueFrom ? new Date(dueFrom).toISOString().slice(0, 10) : ''}
              onChange={(e) => onDueFromChange(e.target.value ? new Date(`${e.target.value}T00:00:00`).getTime() : undefined)}
              className="h-6 w-full min-w-0 bg-transparent text-[11px] text-slate-700 outline-none"
              title="Due from"
              aria-label="Due from"
            />
            <span className="text-[10px] text-slate-400 shrink-0">-</span>
            <input
              type="date"
              value={dueTo ? new Date(dueTo).toISOString().slice(0, 10) : ''}
              onChange={(e) => onDueToChange(e.target.value ? new Date(`${e.target.value}T23:59:59`).getTime() : undefined)}
              className="h-6 w-full min-w-0 bg-transparent text-[11px] text-slate-700 outline-none"
              title="Due to"
              aria-label="Due to"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
