import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import TaskItem from '../TaskItem';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  icon: React.ReactNode;
  colorClass: string;
  tasks: Task[];
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

const Column: React.FC<ColumnProps> = ({
  title,
  status,
  icon,
  tasks,
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
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const taskElement = element?.closest('[data-task-id]');
    const targetTaskId = taskElement?.getAttribute('data-task-id') || undefined;
    onMoveTask(taskId, status, targetTaskId);
  };

  return (
    <section
      className={`h-full min-h-0 bg-white border rounded-xl flex flex-col transition-colors ${
        isOver ? 'border-slate-400 bg-slate-50' : 'border-slate-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="px-3.5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
            <p className="text-xs text-slate-500">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
          </div>
        </div>

        <button
          onClick={onAddNewTask}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {tasks.length === 0 && (
          <div className="h-full min-h-[180px] border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-sm text-slate-500 bg-slate-50">
            Drop tasks here
          </div>
        )}

        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isSelected={selectedTaskIds.includes(task.id)}
            onToggleSelection={onToggleTaskSelection}
            onDelete={onDeleteTask}
            onUpdateStatus={onUpdateStatus}
            onAIAssist={onAIAssist}
            onSelect={onSelectTask}
            readOnly={readOnly}
            onToggleTimer={onToggleTimer}
          />
        ))}
      </div>
    </section>
  );
};

export default Column;
