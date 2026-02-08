import React, { useState } from 'react';
import FilterBar from './FilterBar';
import KanbanBoard from './KanbanBoard';
import { Task, TaskStatus, TaskPriority, User, Project } from '../../types';
import { X, Loader2, ListOrdered } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { taskService } from '../../services/taskService';

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

  const handleStrategicTriage = async () => {
    if (!activeProject || isTriaging) return;
    setIsTriaging(true);
    
    const todoTasks = categorizedTasks[TaskStatus.TODO];
    if (todoTasks.length < 2) {
      alert("At least 2 tasks are needed in the backlog for logical re-ordering.");
      setIsTriaging(false);
      return;
    }

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

      <div className={`flex-none px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 ${compactMode ? 'pt-4 pb-2' : 'pt-6 pb-4'}`}>
        <div className="flex items-center gap-5">
          <h2 className={`font-bold text-slate-900 tracking-tight truncate max-w-[240px] md:max-w-none ${compactMode ? 'text-lg' : 'text-2xl'}`}>
            {activeProject ? activeProject.name : "Global Workspace"}
          </h2>
          {activeProject && (
            <button 
              onClick={handleStrategicTriage}
              disabled={isTriaging}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {isTriaging ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListOrdered className="w-3 h-3 text-slate-500" />}
              Optimize Order
            </button>
          )}
        </div>
        {selectedTaskIds.length > 0 && (
           <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-right-4">
             <span className="text-xs font-medium text-slate-700">{selectedTaskIds.length} selected</span>
             <button onClick={() => setSelectedTaskIds([])} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500" />
             </button>
           </div>
        )}
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
