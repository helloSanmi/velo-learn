
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { Trash2, ListChecks, Sparkles, Play, Pause, Clock } from 'lucide-react';
import Badge from './ui/Badge';
import { userService } from '../services/userService';
import { settingsService } from '../services/settingsService';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onAIAssist: (task: Task) => void;
  onSelect: (task: Task) => void;
  onToggleTimer?: (id: string) => void;
  readOnly?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, isSelected, onToggleSelection, onDelete, onAIAssist, onSelect, onToggleTimer, readOnly = false 
}) => {
  const [settings, setSettings] = useState(settingsService.getSettings());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => setSettings(e.detail);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    let interval: any;
    if (task.isTimerRunning && task.timerStartedAt) {
      interval = setInterval(() => {
        setElapsed(Date.now() - task.timerStartedAt!);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [task.isTimerRunning, task.timerStartedAt]);

  const totalMs = (task.timeLogged || 0) + elapsed;
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  const formatTime = () => {
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const priorityVariants = {
    [TaskPriority.HIGH]: 'rose' as const,
    [TaskPriority.MEDIUM]: 'amber' as const,
    [TaskPriority.LOW]: 'indigo' as const,
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) { e.preventDefault(); return; }
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('sourceStatus', task.status);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasksCount = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const progressPercentage = subtasksCount > 0 ? Math.round((completedSubtasksCount / subtasksCount) * 100) : 0;
  
  const allUsers = userService.getUsers();
  const assignee = allUsers.find(u => u.id === task.assigneeId);
  const isCompact = settings.compactMode;

  return (
    <div 
      draggable={!readOnly} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        if (!readOnly && e.shiftKey && onToggleSelection) {
          onToggleSelection(task.id);
        } else {
          onSelect(task);
        }
      }}
      data-task-id={task.id}
      className={`group bg-white rounded-xl shadow-sm border transition-all duration-150 cursor-grab active:cursor-grabbing relative flex flex-col ${
        isCompact ? 'p-2.5 gap-2' : 'p-4 gap-3'
      } ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
      } ${task.isTimerRunning ? 'ring-2 ring-emerald-500/20' : ''}`}
    >
      {task.isTimerRunning && (
        <div className="absolute inset-0 bg-emerald-50/10 animate-pulse pointer-events-none rounded-xl" />
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
          {totalMs > 0 && (
            <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${task.isTimerRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Clock className={`w-2.5 h-2.5 ${task.isTimerRunning ? 'animate-spin-slow' : ''}`} />
              {formatTime()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {!readOnly && (
            <>
              {onToggleTimer && task.status !== TaskStatus.DONE && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
                  className={`p-1.5 rounded-lg transition-all ${task.isTimerRunning ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                  title={task.isTimerRunning ? "Stop Timer" : "Start Timer"}
                >
                  {task.isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              )}
              {settings.aiSuggestions && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAIAssist(task); }} 
                  className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="AI Breakdown"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className={isCompact ? 'space-y-0.5' : 'space-y-1.5'}>
        <h3 className={`font-bold text-slate-900 leading-snug ${isCompact ? 'text-xs' : 'text-sm'}`}>{task.title}</h3>
      </div>

      <div className={`pt-1 mt-auto ${isCompact ? 'hidden' : ''}`}>
        {subtasksCount > 0 && (
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full transition-all duration-500 ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {task.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                {tag}
              </span>
            ))}
          </div>

          {assignee && (
            <img 
              src={assignee.avatar} 
              alt={assignee.username} 
              className="w-5 h-5 rounded-full border border-white shadow-sm ring-1 ring-slate-100" 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
