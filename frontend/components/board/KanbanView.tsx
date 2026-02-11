import React, { useMemo } from 'react';
import { Project, ProjectStage, Task, TaskPriority, User } from '../../types';
import KanbanHeader from './KanbanHeader';
import ProjectStageEditorModal from './ProjectStageEditorModal';
import KanbanBoard from './KanbanBoard';
import SavedViewsManagerModal from './SavedViewsManagerModal';
import SaveViewModal from './SaveViewModal';
import { computeKanbanTotals } from './kanbanUtils';
import { useSavedBoardViews } from './hooks/useSavedBoardViews';
import { useKanbanStageManager } from './hooks/useKanbanStageManager';
import { useKanbanTriage } from './hooks/useKanbanTriage';

interface KanbanViewProps {
  searchQuery: string;
  projectFilter: string | 'All';
  projects: Project[];
  dueFrom?: number;
  dueTo?: number;
  statusFilter: string | 'All';
  priorityFilter: TaskPriority | 'All';
  tagFilter: string | 'All';
  assigneeFilter: string | 'All';
  uniqueTags: string[];
  allUsers: User[];
  currentUser: User;
  activeProject: Project | undefined;
  categorizedTasks: Record<string, Task[]>;
  selectedTaskIds: string[];
  compactMode: boolean;
  setStatusFilter: (s: string | 'All') => void;
  setPriorityFilter: (p: TaskPriority | 'All') => void;
  setTagFilter: (t: string) => void;
  setAssigneeFilter: (a: string) => void;
  setSearchQuery: (value: string) => void;
  setProjectFilter: (value: string | 'All') => void;
  setDueFrom: (value?: number) => void;
  setDueTo: (value?: number) => void;
  setSelectedTaskIds: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  deleteTask: (id: string) => void;
  handleStatusUpdate: (id: string, status: string) => void;
  moveTask: (taskId: string, targetStatus: string, targetTaskId?: string) => void;
  assistWithAI: (task: Task) => void;
  setSelectedTask: (task: Task) => void;
  setIsModalOpen: (open: boolean) => void;
  onToggleTimer?: (id: string) => void;
  refreshTasks?: () => void;
  onUpdateProjectStages: (projectId: string, stages: ProjectStage[]) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({
  searchQuery,
  projectFilter,
  projects,
  dueFrom,
  dueTo,
  statusFilter,
  priorityFilter,
  tagFilter,
  assigneeFilter,
  uniqueTags,
  allUsers,
  currentUser,
  activeProject,
  categorizedTasks,
  selectedTaskIds,
  compactMode,
  setStatusFilter,
  setPriorityFilter,
  setTagFilter,
  setAssigneeFilter,
  setSearchQuery,
  setProjectFilter,
  setDueFrom,
  setDueTo,
  setSelectedTaskIds,
  toggleTaskSelection,
  deleteTask,
  handleStatusUpdate,
  moveTask,
  assistWithAI,
  setSelectedTask,
  setIsModalOpen,
  onToggleTimer,
  refreshTasks,
  onUpdateProjectStages
}) => {
  const {
    projectStages,
    canManageStages,
    showStageEditor,
    setShowStageEditor,
    newStageName,
    setNewStageName,
    draftStages,
    setDraftStages,
    openStageEditor,
    saveStages,
    addStage,
    removeStage
  } = useKanbanStageManager({
    activeProject,
    categorizedTasks,
    currentUserId: currentUser.id,
    currentUserRole: currentUser.role,
    statusFilter,
    setStatusFilter,
    handleStatusUpdate,
    onUpdateProjectStages
  });

  const {
    savedViews,
    appliedViewId,
    isSavedViewsOpen,
    setIsSavedViewsOpen,
    isSaveViewOpen,
    setIsSaveViewOpen,
    saveViewName,
    setSaveViewName,
    saveCurrentView,
    applySavedView,
    deleteAppliedView,
    saveManagedViews
  } = useSavedBoardViews({
    currentUser,
    searchQuery,
    projectFilter,
    statusFilter,
    priorityFilter,
    tagFilter,
    assigneeFilter,
    dueFrom,
    dueTo,
    setSearchQuery,
    setProjectFilter,
    setStatusFilter,
    setPriorityFilter,
    setTagFilter,
    setAssigneeFilter,
    setDueFrom,
    setDueTo
  });

  const totals = useMemo(() => computeKanbanTotals(categorizedTasks, projectStages), [categorizedTasks, projectStages]);
  const { isTriaging, handleOptimizeOrder } = useKanbanTriage({
    activeProject,
    projectStages,
    categorizedTasks,
    refreshTasks
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <KanbanHeader
        compactMode={compactMode}
        activeProject={activeProject}
        currentUserId={currentUser.id}
        totals={totals}
        savedViews={savedViews}
        projectStages={projectStages}
        isTriaging={isTriaging}
        canManageStages={canManageStages}
        selectedTaskIds={selectedTaskIds}
        searchQuery={searchQuery}
        projectFilter={projectFilter}
        dueFrom={dueFrom}
        dueTo={dueTo}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        tagFilter={tagFilter}
        assigneeFilter={assigneeFilter}
        uniqueTags={uniqueTags}
        allUsers={allUsers}
        projects={projects}
        onSaveView={() => setIsSaveViewOpen(true)}
        onApplyView={applySavedView}
        appliedViewId={appliedViewId}
        onDeleteAppliedView={deleteAppliedView}
        onOpenManageViews={() => setIsSavedViewsOpen(true)}
        onOptimizeOrder={handleOptimizeOrder}
        onOpenStages={openStageEditor}
        onClearSelected={() => setSelectedTaskIds([])}
        setStatusFilter={setStatusFilter}
        setPriorityFilter={setPriorityFilter}
        setTagFilter={setTagFilter}
        setAssigneeFilter={setAssigneeFilter}
        setSearchQuery={setSearchQuery}
        setProjectFilter={setProjectFilter}
        setDueFrom={setDueFrom}
        setDueTo={setDueTo}
      />

      <KanbanBoard
        categorizedTasks={categorizedTasks}
        statusFilter={statusFilter}
        statusOptions={projectStages}
        selectedTaskIds={selectedTaskIds}
        onToggleTaskSelection={toggleTaskSelection}
        onDeleteTask={deleteTask}
        onUpdateStatus={handleStatusUpdate}
        onMoveTask={moveTask}
        onAIAssist={assistWithAI}
        onSelectTask={setSelectedTask}
        onAddNewTask={() => setIsModalOpen(true)}
        onToggleTimer={onToggleTimer}
      />
      <SavedViewsManagerModal
        isOpen={isSavedViewsOpen}
        views={savedViews}
        onClose={() => setIsSavedViewsOpen(false)}
        onSave={saveManagedViews}
        onApply={applySavedView}
      />
      <ProjectStageEditorModal
        isOpen={showStageEditor}
        draftStages={draftStages}
        setDraftStages={setDraftStages}
        newStageName={newStageName}
        setNewStageName={setNewStageName}
        onClose={() => setShowStageEditor(false)}
        onAddStage={addStage}
        onRemoveStage={removeStage}
        onSave={saveStages}
      />
      <SaveViewModal
        isOpen={isSaveViewOpen}
        name={saveViewName}
        setName={setSaveViewName}
        onClose={() => {
          setIsSaveViewOpen(false);
          setSaveViewName('');
        }}
        onSave={saveCurrentView}
      />
    </div>
  );
};

export default KanbanView;
