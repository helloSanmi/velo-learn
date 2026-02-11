import React, { useMemo, useState } from 'react';
import { ListOrdered, Loader2, Plus, Settings2, X } from 'lucide-react';
import { Project, ProjectStage, Task, TaskPriority, TaskStatus, User } from '../../types';
import { aiService } from '../../services/aiService';
import { taskService } from '../../services/taskService';
import { DEFAULT_PROJECT_STAGES } from '../../services/projectService';
import { dialogService } from '../../services/dialogService';
import { savedViewService, SavedBoardView } from '../../services/savedViewService';
import { toastService } from '../../services/toastService';
import FilterBar from './FilterBar';
import KanbanBoard from './KanbanBoard';

interface KanbanViewProps {
  searchQuery: string;
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
  const [isTriaging, setIsTriaging] = useState(false);
  const [showStageEditor, setShowStageEditor] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [draftStages, setDraftStages] = useState<ProjectStage[]>([]);
  const [savedViews, setSavedViews] = useState<SavedBoardView[]>(() => savedViewService.list(currentUser.id, currentUser.orgId));

  const projectStages = useMemo(() => {
    const baseStages = activeProject?.stages?.length ? activeProject.stages : DEFAULT_PROJECT_STAGES;
    const unknownStatuses = Object.keys(categorizedTasks)
      .filter((statusId) => !baseStages.some((stage) => stage.id === statusId))
      .map((statusId) => ({
        id: statusId,
        name: statusId.replace(/-/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase())
      }));
    return [...baseStages, ...unknownStatuses];
  }, [activeProject, categorizedTasks]);

  const canManageStages =
    !!activeProject &&
    (currentUser.role === 'admin' || activeProject.members?.includes(currentUser.id));

  const openStageEditor = () => {
    setDraftStages(projectStages.map((stage) => ({ ...stage })));
    setNewStageName('');
    setShowStageEditor(true);
  };

  const saveStages = () => {
    if (!activeProject) return;
    const sanitized = draftStages
      .map((stage) => ({ ...stage, name: stage.name.trim() }))
      .filter((stage) => stage.id && stage.name);
    if (sanitized.length === 0) return;
    onUpdateProjectStages(activeProject.id, sanitized);
    setShowStageEditor(false);
    if (statusFilter !== 'All' && !sanitized.some((stage) => stage.id === statusFilter)) {
      setStatusFilter('All');
    }
  };

  const addStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed) return;
    const stageId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `stage-${Date.now()}`;
    const uniqueStageId = draftStages.some((stage) => stage.id === stageId) ? `${stageId}-${Date.now()}` : stageId;
    setDraftStages((prev) => [...prev, { id: uniqueStageId, name: trimmed }]);
    setNewStageName('');
  };

  const totals = useMemo(() => {
    const total = Object.values(categorizedTasks).reduce((sum, tasks) => sum + tasks.length, 0);
    const firstStageId = projectStages[0]?.id;
    const lastStageId = projectStages[projectStages.length - 1]?.id;
    const todo = firstStageId ? (categorizedTasks[firstStageId]?.length || 0) : 0;
    const done = lastStageId ? (categorizedTasks[lastStageId]?.length || 0) : 0;
    const inProgress = total - todo - done;
    return { todo, inProgress, done, total };
  }, [categorizedTasks, projectStages]);

  const handleOptimizeOrder = async () => {
    if (!activeProject || isTriaging) return;

    const firstStageId = projectStages[0]?.id || TaskStatus.TODO;
    const todoTasks = categorizedTasks[firstStageId] || [];
    if (todoTasks.length < 2) {
      await dialogService.notice(`At least 2 tasks are required in ${projectStages[0]?.name || 'the first stage'}.`, {
        title: 'Not enough tasks'
      });
      return;
    }

    setIsTriaging(true);
    const orderedIds = await aiService.suggestTriage(todoTasks);
    const newOrder = [...todoTasks].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
    taskService.reorderTasks(activeProject.orgId, newOrder);
    refreshTasks?.();
    setIsTriaging(false);
  };

  const saveCurrentView = () => {
    const name = window.prompt('Name this view');
    if (!name?.trim()) return;
    const view = savedViewService.create({
      userId: currentUser.id,
      orgId: currentUser.orgId,
      name: name.trim(),
      searchQuery,
      statusFilter,
      priorityFilter,
      tagFilter,
      assigneeFilter,
      dueFrom,
      dueTo
    });
    setSavedViews((prev) => [view, ...prev]);
    toastService.success('View saved', `"${view.name}" created.`);
  };

  const applySavedView = (id: string) => {
    const view = savedViews.find((item) => item.id === id);
    if (!view) return;
    setSearchQuery(view.searchQuery);
    setStatusFilter(view.statusFilter);
    setPriorityFilter(view.priorityFilter);
    setTagFilter(view.tagFilter);
    setAssigneeFilter(view.assigneeFilter);
    setDueFrom(view.dueFrom);
    setDueTo(view.dueTo);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <div className={`flex-none px-4 md:px-8 ${compactMode ? 'pt-2 pb-2' : 'pt-2 pb-2.5'}`}>
        <div className="max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl p-2.5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2.5">
            <div>
              <h2 className="text-base md:text-lg font-semibold tracking-tight text-slate-900">
                {activeProject ? activeProject.name : 'All Projects'}
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {totals.total} tasks • {totals.todo} to do • {totals.inProgress} in progress • {totals.done} done
              </p>
            </div>

            <div className="flex flex-col gap-1.5 w-full lg:w-auto lg:items-end">
              <FilterBar
                embedded
                compact
                searchQuery={searchQuery}
                dueFrom={dueFrom}
                dueTo={dueTo}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                tagFilter={tagFilter}
                assigneeFilter={assigneeFilter}
                statusOptions={projectStages}
                uniqueTags={uniqueTags}
                allUsers={allUsers}
                onStatusChange={setStatusFilter}
                onPriorityChange={setPriorityFilter}
                onTagChange={setTagFilter}
                onAssigneeChange={setAssigneeFilter}
                onSearchChange={setSearchQuery}
                onDueFromChange={setDueFrom}
                onDueToChange={setDueTo}
              />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={saveCurrentView}
                  className="h-6 px-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition-colors"
                >
                  Save view
                </button>
                {savedViews.length > 0 && (
                  <select
                    className="h-6 px-1.5 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 outline-none"
                    onChange={(event) => applySavedView(event.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Apply view
                    </option>
                    {savedViews.map((view) => (
                      <option key={view.id} value={view.id}>
                        {view.name}
                      </option>
                    ))}
                  </select>
                )}
                {activeProject && (
                  <button
                    onClick={handleOptimizeOrder}
                    disabled={isTriaging}
                    className="h-6 px-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {isTriaging ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListOrdered className="w-3 h-3" />}
                    Optimize {projectStages[0]?.name || 'Backlog'}
                  </button>
                )}
                {activeProject && canManageStages && (
                  <button
                    onClick={openStageEditor}
                    className="h-6 px-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition-colors inline-flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" />
                    Stages
                  </button>
                )}

                {selectedTaskIds.length > 0 && (
                  <div className="h-6 px-1.5 rounded-md border border-slate-200 bg-slate-50 inline-flex items-center gap-1">
                    <span className="text-[11px] text-slate-700">{selectedTaskIds.length} selected</span>
                    <button onClick={() => setSelectedTaskIds([])} className="p-0.5 rounded hover:bg-slate-200">
                      <X className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
      {showStageEditor && (
        <div className="fixed inset-0 z-[180] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={(event) => event.target === event.currentTarget && setShowStageEditor(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="h-11 px-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Project stages</h3>
              <button onClick={() => setShowStageEditor(false)} className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {draftStages.map((stage) => (
                <label key={stage.id} className="block">
                  <p className="text-[11px] text-slate-500 mb-1">Stage name</p>
                  <input
                    value={stage.name}
                    onChange={(event) =>
                      setDraftStages((prev) =>
                        prev.map((item) => (item.id === stage.id ? { ...item, name: event.target.value } : item))
                      )
                    }
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </label>
              ))}
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[11px] text-slate-500 mb-1.5">Add stage</p>
                <div className="flex gap-2">
                  <input
                    value={newStageName}
                    onChange={(event) => setNewStageName(event.target.value)}
                    placeholder="Example: Review"
                    className="flex-1 h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <button onClick={addStage} className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <button onClick={() => setShowStageEditor(false)} className="flex-1 h-9 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={saveStages} className="flex-1 h-9 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800">Save stages</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanView;
