
import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
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
  // Fixed: Added readOnly and onToggleTimer props to ColumnProps
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
    <div 
      className="flex flex-col w-full h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600`}>
            {icon}
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">{title}</h2>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onAddNewTask}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Add Task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className={`flex-1 flex flex-col gap-4 transition-all duration-300 overflow-y-auto no-scrollbar pb-10 ${isOver ? 'bg-indigo-50/40 rounded-[2rem] ring-4 ring-indigo-100 ring-inset' : ''}`}>
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            isSelected={selectedTaskIds.includes(task.id)}
            onToggleSelection={onToggleTaskSelection}
            onDelete={onDeleteTask} 
            onUpdateStatus={onUpdateStatus}
            onAIAssist={onAIAssist}
            onSelect={onSelectTask}
            // Fixed: Passing readOnly and onToggleTimer to TaskItem
            readOnly={readOnly}
            onToggleTimer={onToggleTimer}
          />
        ))}

        {tasks.length === 0 && !isOver && (
          <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/40">
            <div className="p-4 bg-slate-50 rounded-full mb-4 text-slate-300 ring-8 ring-slate-100/50">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Workspace</p>
            <button 
              onClick={onAddNewTask}
              className="mt-5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Initialize Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;
