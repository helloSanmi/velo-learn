import React, { useEffect, useMemo, useState } from 'react';
import { Project, ProjectStage, Task, TaskPriority, User } from '../../types';
import KanbanHeader from './KanbanHeader';
import KanbanBoard from './KanbanBoard';
import KanbanModals from './KanbanModals';
import ProjectOwnerChatModal from './ProjectOwnerChatModal';
import { computeKanbanTotals } from './kanbanUtils';
import { useSavedBoardViews } from './hooks/useSavedBoardViews';
import { useKanbanStageManager } from './hooks/useKanbanStageManager';
import { useKanbanTriage } from './hooks/useKanbanTriage';
import { projectChatService } from '../../services/projectChatService';
import { realtimeService } from '../../services/realtimeService';
import { estimationService } from '../../services/estimationService';

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
  canDeleteTask?: (taskId: string) => boolean;
  canUseTaskAI?: (taskId: string) => boolean;
  canToggleTaskTimer?: (taskId: string) => boolean;
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
  canDeleteTask,
  canUseTaskAI,
  canToggleTaskTimer,
  refreshTasks,
  onUpdateProjectStages
}) => {
  const [isOwnerChatOpen, setIsOwnerChatOpen] = useState(false);
  const [ownerChatUnreadCount, setOwnerChatUnreadCount] = useState(0);

  const {
    projectStages,
    canManageStages,
    showStageEditor,
    closeStageEditor,
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
    openSavedViews,
    closeSavedViews,
    isSaveViewOpen,
    openSaveView,
    closeSaveView,
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
  const forecastSummary = useMemo(() => {
    const tasks = Object.values(categorizedTasks).flat();
    const estimatedMinutes = tasks.reduce((sum, task) => sum + (task.estimateMinutes || 0), 0);
    const adjustedMinutes = tasks.reduce((sum, task) => {
      if (!task.estimateMinutes || task.estimateMinutes <= 0) return sum;
      const estimatorId = task.estimateProvidedBy || task.userId;
      const preview = estimationService.getAdjustmentPreview(currentUser.orgId, estimatorId, task.estimateMinutes, {
        projectId: task.projectId,
        status: task.status,
        tags: task.tags
      });
      return sum + preview.adjustedMinutes;
    }, 0);
    const factor = estimatedMinutes > 0 ? adjustedMinutes / estimatedMinutes : 1;
    const riskLabel = factor >= 1.3 ? 'At risk' : factor >= 1.1 ? 'Tight' : 'On-track';
    return { estimatedMinutes, adjustedMinutes, riskLabel } as const;
  }, [categorizedTasks, currentUser.orgId]);
  const { isTriaging, handleOptimizeOrder } = useKanbanTriage({
    activeProject,
    projectStages,
    categorizedTasks,
    refreshTasks
  });

  useEffect(() => {
    if (!activeProject) {
      setOwnerChatUnreadCount(0);
      return;
    }

    const refreshUnread = () => {
      setOwnerChatUnreadCount(
        projectChatService.getUnreadCountForUser(activeProject.orgId, activeProject.id, currentUser.id)
      );
    };

    refreshUnread();
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type !== 'PROJECT_CHAT_UPDATED') return;
      if (event.orgId !== activeProject.orgId) return;
      if (event.payload?.projectId !== activeProject.id) return;
      refreshUnread();
    });
    return () => unsubscribe();
  }, [activeProject, currentUser.id]);

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <KanbanHeader
        compactMode={compactMode}
        activeProject={activeProject}
        currentUserId={currentUser.id}
        totals={totals}
        forecastSummary={forecastSummary}
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
        onOpenOwnerChat={() => setIsOwnerChatOpen(true)}
        ownerChatUnreadCount={ownerChatUnreadCount}
        onSaveView={openSaveView}
        onApplyView={applySavedView}
        appliedViewId={appliedViewId}
        onDeleteAppliedView={deleteAppliedView}
        onOpenManageViews={openSavedViews}
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
        canDeleteTask={canDeleteTask}
        canUseTaskAI={canUseTaskAI}
        canToggleTaskTimer={canToggleTaskTimer}
      />
      <KanbanModals
        isSavedViewsOpen={isSavedViewsOpen}
        savedViews={savedViews}
        onCloseSavedViews={closeSavedViews}
        onSaveManagedViews={saveManagedViews}
        onApplySavedView={applySavedView}
        showStageEditor={showStageEditor}
        draftStages={draftStages}
        setDraftStages={setDraftStages}
        newStageName={newStageName}
        setNewStageName={setNewStageName}
        onCloseStageEditor={closeStageEditor}
        onAddStage={addStage}
        onRemoveStage={removeStage}
        onSaveStages={saveStages}
        isSaveViewOpen={isSaveViewOpen}
        saveViewName={saveViewName}
        setSaveViewName={setSaveViewName}
        onCloseSaveView={closeSaveView}
        onSaveView={saveCurrentView}
      />
      {activeProject ? (
        <ProjectOwnerChatModal
          isOpen={isOwnerChatOpen}
          onClose={() => setIsOwnerChatOpen(false)}
          project={activeProject}
          currentUser={currentUser}
          allUsers={allUsers}
        />
      ) : null}
    </div>
  );
};

export default KanbanView;
