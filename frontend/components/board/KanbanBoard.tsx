import React from 'react';
import { CheckCircle2, Circle, Hourglass, ListChecks } from 'lucide-react';
import { Task } from '../../types';
import Column from './Column';

interface KanbanBoardProps {
  categorizedTasks: Record<string, Task[]>;
  statusFilter: string | 'All';
  statusOptions: Array<{ id: string; name: string }>;
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onMoveTask: (taskId: string, targetStatus: string, targetTaskId?: string) => void;
  onAIAssist: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onAddNewTask: () => void;
  readOnly?: boolean;
  onToggleTimer?: (id: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  categorizedTasks,
  statusFilter,
  statusOptions,
  selectedTaskIds = [],
  onToggleTaskSelection,
  onDeleteTask,
  onUpdateStatus,
  onMoveTask,
  onAIAssist,
  onSelectTask,
  onAddNewTask,
  readOnly = false,
  onToggleTimer
}) => {
  const columns = statusOptions.map((status, index) => {
    const Icon =
      index === 0 ? ListChecks : index === statusOptions.length - 1 ? CheckCircle2 : index === 1 ? Hourglass : Circle;
    return {
      id: status.id,
      title: status.name,
      icon: <Icon className="w-4 h-4" />,
      tasks: categorizedTasks[status.id] || []
    };
  });

  const visibleColumns = columns.filter((col) => statusFilter === 'All' || col.id === statusFilter);

  return (
    <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 md:px-8 pb-8">
      <div className="max-w-[1800px] mx-auto h-full">
        <div className={`grid gap-4 h-full ${visibleColumns.length === 1 ? 'grid-cols-1 max-w-2xl' : visibleColumns.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
          {visibleColumns.map((col) => (
            <Column
              key={col.id}
              title={col.title}
              status={col.id}
              icon={col.icon}
              colorClass=""
              tasks={col.tasks}
              selectedTaskIds={selectedTaskIds}
              onToggleTaskSelection={onToggleTaskSelection}
              onDeleteTask={onDeleteTask}
              onUpdateStatus={onUpdateStatus}
              onMoveTask={onMoveTask}
              onAIAssist={onAIAssist}
              onSelectTask={onSelectTask}
              onAddNewTask={onAddNewTask}
              readOnly={readOnly}
              onToggleTimer={onToggleTimer}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default KanbanBoard;
