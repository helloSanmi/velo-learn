import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
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

  // Soft limit for "Focus Density"
  const CAPACITY_LIMIT = 5;
  const loadPercentage = Math.min((tasks.length / CAPACITY_LIMIT) * 100, 100);
  const isOverCapacity = tasks.length > CAPACITY_LIMIT;

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
      className="flex flex-col w-full h-full min-h-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col mb-6 px-1 gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600`}>
              {icon}
            </div>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-900">{title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold ${isOverCapacity ? 'text-rose-500' : 'text-slate-400'}`}>
                  {tasks.length} {tasks.length === 1 ? 'Node' : 'Nodes'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onAddNewTask} 
            className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Capacity Gauge */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex items-center shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${isOverCapacity ? 'bg-rose-500' : loadPercentage > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Scrollable Task Area */}
      <div className={`flex-1 flex flex-col gap-4 transition-all pb-12 overflow-y-auto min-h-0 custom-scrollbar pr-2 -mr-2 ${isOver ? 'bg-indigo-50/40 rounded-[2.5rem] ring-4 ring-indigo-100 ring-inset scale-[0.98]' : ''}`}>
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
            readOnly={readOnly}
            onToggleTimer={onToggleTimer}
          />
        ))}
        {tasks.length === 0 && !isOver && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
             <div className="p-6 bg-white rounded-full shadow-sm mb-4">
                <Zap className="w-8 h-8 text-slate-200" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cluster Idle</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;