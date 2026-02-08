import React, { useState, useEffect } from 'react';
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
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('runa_column_widths');
    return saved ? JSON.parse(saved) : {
      [TaskStatus.TODO]: 380,
      [TaskStatus.IN_PROGRESS]: 380,
      [TaskStatus.DONE]: 380
    };
  });

  const [activeResizer, setActiveResizer] = useState<string | null>(null);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeResizer) {
        const resizerElement = document.getElementById(`resizer-${activeResizer}`);
        if (resizerElement) {
          const parentRect = resizerElement.parentElement?.getBoundingClientRect();
          if (parentRect) {
            const newWidth = Math.min(Math.max(280, e.clientX - parentRect.left), 800);
            setColWidths(prev => ({ ...prev, [activeResizer]: newWidth }));
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (activeResizer) {
        localStorage.setItem('runa_column_widths', JSON.stringify(colWidths));
        setActiveResizer(null);
      }
    };

    if (activeResizer) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeResizer, colWidths]);

  return (
    <main className={`flex-1 overflow-x-auto min-h-0 w-full px-4 md:px-8 pb-8 scroll-smooth custom-scrollbar ${activeResizer ? 'cursor-col-resize select-none' : ''}`}>
      <div className="flex gap-5 md:gap-7 h-full min-w-max pb-4">
        {visibleColumns.map(col => (
          <div 
            key={col.id} 
            className="relative flex shrink-0 flex-col h-full min-h-0 group/col"
            style={{ width: `${colWidths[col.id] || 380}px` }}
          >
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
              readOnly={readOnly}
              onToggleTimer={onToggleTimer}
            />
            {/* Column Resizer */}
            {!readOnly && (
              <div 
                id={`resizer-${col.id}`}
                onMouseDown={() => setActiveResizer(col.id)}
                className={`absolute right-[-12px] top-0 bottom-12 w-[12px] cursor-col-resize z-10 transition-all ${activeResizer === col.id ? 'bg-slate-300/50' : 'hover:bg-slate-300/30 hover:opacity-100'}`}
              >
                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-slate-400/30 rounded-full transition-opacity ${activeResizer === col.id ? 'opacity-100' : 'opacity-0 group-hover/col:opacity-100'}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
};

export default KanbanBoard;
