
import React from 'react';
import { ListChecks, Hourglass, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import Column from './Column';

interface KanbanBoardProps {
  categorizedTasks: Record<TaskStatus, Task[]>;
  statusFilter: TaskStatus | 'All';
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onMoveTask: (taskId: string, targetStatus: TaskStatus, targetTaskId?: string) => void;
  onAIAssist: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onAddNewTask: () => void;
  // Fixed: Added readOnly and onToggleTimer props to KanbanBoardProps
  readOnly?: boolean;
  onToggleTimer?: (id: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  categorizedTasks,
  statusFilter,
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
  const columns = [
    {
      id: TaskStatus.TODO,
      title: "To Do",
      icon: <ListChecks className="w-4 h-4" />,
      tasks: categorizedTasks[TaskStatus.TODO]
    },
    {
      id: TaskStatus.IN_PROGRESS,
      title: "In Progress",
      icon: <Hourglass className="w-4 h-4" />,
      tasks: categorizedTasks[TaskStatus.IN_PROGRESS]
    },
    {
      id: TaskStatus.DONE,
      title: "Completed",
      icon: <CheckCircle2 className="w-4 h-4" />,
      tasks: categorizedTasks[TaskStatus.DONE]
    }
  ];

  const visibleColumns = columns.filter(col => statusFilter === 'All' || col.id === statusFilter);

  return (
    <main className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-6 lg:px-8 py-6 snap-x snap-mandatory scroll-smooth">
      <div className={`flex gap-6 lg:gap-8 h-full min-w-max pb-4 w-full ${
        visibleColumns.length === 3 ? 'lg:grid lg:grid-cols-3 lg:w-full lg:max-w-none' : 
        visibleColumns.length === 2 ? 'lg:grid lg:grid-cols-2 lg:max-w-[1000px]' : 'lg:max-w-[500px]'
      }`}>
        {visibleColumns.map(col => (
          <div key={col.id} className="w-[85vw] sm:w-[350px] md:w-[380px] lg:w-full snap-center flex-shrink-0 flex flex-col h-full">
            <Column 
              title={col.title} 
              status={col.id} 
              icon={col.icon} 
              colorClass="bg-slate-400"
              tasks={col.tasks}
              selectedTaskIds={selectedTaskIds}
              onToggleTaskSelection={onToggleTaskSelection}
              onDeleteTask={onDeleteTask}
              onUpdateStatus={onUpdateStatus}
              onMoveTask={onMoveTask}
              onAIAssist={onAIAssist}
              onSelectTask={onSelectTask}
              onAddNewTask={onAddNewTask}
              // Fixed: Passing readOnly and onToggleTimer to Column
              readOnly={readOnly}
              onToggleTimer={onToggleTimer}
            />
          </div>
        ))}
      </div>
    </main>
  );
};

export default KanbanBoard;
