import React from 'react';
import KanbanHeaderActions from './header/KanbanHeaderActions';
import KanbanHeaderFilters from './header/KanbanHeaderFilters';
import KanbanHeaderTitle from './header/KanbanHeaderTitle';
import { KanbanHeaderProps } from './header/types';

const KanbanHeader: React.FC<KanbanHeaderProps> = ({
  compactMode,
  activeProject,
  currentUserId,
  totals,
  forecastSummary,
  savedViews,
  projectStages,
  isTriaging,
  canManageStages,
  selectedTaskIds,
  searchQuery,
  projectFilter,
  dueFrom,
  dueTo,
  statusFilter,
  priorityFilter,
  tagFilter,
  assigneeFilter,
  uniqueTags,
  allUsers,
  projects,
  onOpenOwnerChat,
  ownerChatUnreadCount,
  onSaveView,
  onApplyView,
  appliedViewId,
  onDeleteAppliedView,
  onOpenManageViews,
  onOptimizeOrder,
  onOpenStages,
  onClearSelected,
  setStatusFilter,
  setPriorityFilter,
  setTagFilter,
  setAssigneeFilter,
  setSearchQuery,
  setProjectFilter,
  setDueFrom,
  setDueTo
}) => {
  const ownerId = activeProject?.createdBy || activeProject?.members?.[0];

  return (
    <div className={`flex-none px-4 md:px-8 ${compactMode ? 'pt-1.5 pb-1.5' : 'pt-2 pb-2'}`}>
      <div className="max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl p-2.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5">
            <KanbanHeaderTitle
              projectName={activeProject ? activeProject.name : 'All Projects'}
              totals={totals}
              forecastSummary={forecastSummary}
              ownerId={ownerId}
              currentUserId={currentUserId}
              allUsers={allUsers}
              showOwner={Boolean(activeProject)}
              onOpenOwnerChat={onOpenOwnerChat}
              ownerChatUnreadCount={ownerChatUnreadCount}
            />

            <KanbanHeaderActions
              onSaveView={onSaveView}
              savedViews={savedViews}
              onApplyView={onApplyView}
              appliedViewId={appliedViewId}
              onDeleteAppliedView={onDeleteAppliedView}
              onOpenManageViews={onOpenManageViews}
              activeProject={activeProject}
              onOptimizeOrder={onOptimizeOrder}
              isTriaging={isTriaging}
              projectStages={projectStages}
              canManageStages={canManageStages}
              onOpenStages={onOpenStages}
              selectedTaskIds={selectedTaskIds}
              onClearSelected={onClearSelected}
            />
          </div>

          <KanbanHeaderFilters
            searchQuery={searchQuery}
            projectFilter={projectFilter}
            projects={projects}
            dueFrom={dueFrom}
            dueTo={dueTo}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            tagFilter={tagFilter}
            assigneeFilter={assigneeFilter}
            projectStages={projectStages}
            uniqueTags={uniqueTags}
            allUsers={allUsers}
            setStatusFilter={setStatusFilter}
            setPriorityFilter={setPriorityFilter}
            setTagFilter={setTagFilter}
            setAssigneeFilter={setAssigneeFilter}
            setSearchQuery={setSearchQuery}
            setProjectFilter={setProjectFilter}
            setDueFrom={setDueFrom}
            setDueTo={setDueTo}
          />
        </div>
      </div>
    </div>
  );
};

export default KanbanHeader;
