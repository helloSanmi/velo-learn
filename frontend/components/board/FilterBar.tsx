import React from 'react';
import { TaskPriority } from '../../types';
import DueDateRangeControl from './filter-bar/DueDateRangeControl';
import SearchFilterControl from './filter-bar/SearchFilterControl';
import SelectFilterControl from './filter-bar/SelectFilterControl';
import { FilterBarProps } from './filter-bar/types';

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
  const frameClass = embedded ? 'w-full' : 'max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl p-2';
  const listClass = compact
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_repeat(5,minmax(120px,1fr))_minmax(240px,1.2fr)] gap-1.5 items-center'
    : 'grid grid-cols-2 lg:grid-cols-4 gap-1.5';

  return (
    <div className={containerClass}>
      <div className={frameClass}>
        <div className={listClass}>
          <SearchFilterControl value={searchQuery} onChange={onSearchChange} className={controlClass} />

          <SelectFilterControl
            value={projectFilter}
            onChange={onProjectChange}
            className={controlClass}
            options={[
              { value: 'All', label: 'All projects' },
              ...projectOptions.map((project) => ({ value: project.id, label: project.name }))
            ]}
          />

          <SelectFilterControl
            value={statusFilter}
            onChange={(value) => onStatusChange(value as string | 'All')}
            className={controlClass}
            options={[
              { value: 'All', label: 'All statuses' },
              ...statusOptions.map((status) => ({ value: status.id, label: status.name }))
            ]}
          />

          <SelectFilterControl
            value={priorityFilter}
            onChange={(value) => onPriorityChange(value as TaskPriority | 'All')}
            className={controlClass}
            options={[
              { value: 'All', label: 'All priorities' },
              ...Object.values(TaskPriority).map((priority) => ({ value: priority, label: priority }))
            ]}
          />

          <SelectFilterControl
            value={assigneeFilter}
            onChange={onAssigneeChange}
            className={controlClass}
            options={[
              { value: 'All', label: 'All assignees' },
              { value: 'Me', label: 'Assigned to me' },
              ...allUsers.map((user) => ({ value: user.id, label: user.displayName }))
            ]}
          />

          <SelectFilterControl
            value={tagFilter}
            onChange={onTagChange}
            className={controlClass}
            options={[
              { value: 'All', label: 'All tags' },
              ...uniqueTags.map((tag) => ({ value: tag, label: tag }))
            ]}
          />

          <DueDateRangeControl
            dueFrom={dueFrom}
            dueTo={dueTo}
            onDueFromChange={onDueFromChange}
            onDueToChange={onDueToChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
