import React, { useMemo, useState } from 'react';
import { ListOrdered, Loader2, X } from 'lucide-react';
import { Project, Task, TaskPriority, TaskStatus, User } from '../../types';
import { aiService } from '../../services/aiService';
import { taskService } from '../../services/taskService';
import FilterBar from './FilterBar';
import KanbanBoard from './KanbanBoard';

interface KanbanViewProps {
  statusFilter: TaskStatus | 'All';
  priorityFilter: TaskPriority | 'All';
  tagFilter: string | 'All';
  assigneeFilter: string | 'All';
  uniqueTags: string[];
  allUsers: User[];
  activeProject: Project | undefined;
  categorizedTasks: Record<TaskStatus, Task[]>;
  selectedTaskIds: string[];
  compactMode: boolean;
  setStatusFilter: (s: TaskStatus | 'All') => void;
  setPriorityFilter: (p: TaskPriority | 'All') => void;
  setTagFilter: (t: string) => void;
  setAssigneeFilter: (a: string) => void;
  setSelectedTaskIds: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  deleteTask: (id: string) => void;
  handleStatusUpdate: (id: string, status: TaskStatus) => void;
  moveTask: (taskId: string, targetStatus: TaskStatus, targetTaskId?: string) => void;
  assistWithAI: (task: Task) => void;
  setSelectedTask: (task: Task) => void;
  setIsModalOpen: (open: boolean) => void;
  onToggleTimer?: (id: string) => void;
  refreshTasks?: () => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({
  statusFilter,
  priorityFilter,
  tagFilter,
  assigneeFilter,
  uniqueTags,
  allUsers,
  activeProject,
  categorizedTasks,
  selectedTaskIds,
  compactMode,
  setStatusFilter,
  setPriorityFilter,
  setTagFilter,
  setAssigneeFilter,
  setSelectedTaskIds,
  toggleTaskSelection,
  deleteTask,
  handleStatusUpdate,
  moveTask,
  assistWithAI,
  setSelectedTask,
  setIsModalOpen,
  onToggleTimer,
  refreshTasks
}) => {
  const [isTriaging, setIsTriaging] = useState(false);

  const totals = useMemo(() => {
    const todo = categorizedTasks[TaskStatus.TODO].length;
    const inProgress = categorizedTasks[TaskStatus.IN_PROGRESS].length;
    const done = categorizedTasks[TaskStatus.DONE].length;
    return { todo, inProgress, done, total: todo + inProgress + done };
  }, [categorizedTasks]);

  const handleOptimizeOrder = async () => {
    if (!activeProject || isTriaging) return;

    const todoTasks = categorizedTasks[TaskStatus.TODO];
    if (todoTasks.length < 2) {
      window.alert('At least 2 tasks are required in To Do.');
      return;
    }

    setIsTriaging(true);
    const orderedIds = await aiService.suggestTriage(todoTasks);
    const newOrder = [...todoTasks].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
    taskService.reorderTasks(activeProject.orgId, newOrder);
    refreshTasks?.();
    setIsTriaging(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <FilterBar
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        tagFilter={tagFilter}
        assigneeFilter={assigneeFilter}
        uniqueTags={uniqueTags}
        allUsers={allUsers}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onTagChange={setTagFilter}
        onAssigneeChange={setAssigneeFilter}
      />

      <div className={`flex-none px-4 md:px-8 ${compactMode ? 'pt-3 pb-2' : 'pt-4 pb-3'}`}>
        <div className="max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
                {activeProject ? activeProject.name : 'All Projects'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {totals.total} tasks • {totals.todo} to do • {totals.inProgress} in progress • {totals.done} done
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeProject && (
                <button
                  onClick={handleOptimizeOrder}
                  disabled={isTriaging}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isTriaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListOrdered className="w-4 h-4" />}
                  Optimize To Do
                </button>
              )}

              {selectedTaskIds.length > 0 && (
                <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 inline-flex items-center gap-2">
                  <span className="text-sm text-slate-700">{selectedTaskIds.length} selected</span>
                  <button onClick={() => setSelectedTaskIds([])} className="p-0.5 rounded hover:bg-slate-200">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <KanbanBoard
        categorizedTasks={categorizedTasks}
        statusFilter={statusFilter}
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
    </div>
  );
};

export default KanbanView;
