
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { Trash2, Sparkles, Play, Pause, Clock, Lock, Box } from 'lucide-react';
import Badge from './ui/Badge';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
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
  
  const project = useMemo(() => {
    const allProjects = projectService.getProjects();
    return allProjects.find(p => p.id === task.projectId);
  }, [task.projectId]);

  const isCompact = settings.compactMode;
  const isBlocked = (task.blockedByIds?.length || 0) > 0;

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
      className={`bg-white rounded-[1.25rem] shadow-sm border transition-all duration-300 cursor-grab active:cursor-grabbing relative flex flex-col ${
        isCompact ? 'p-3.5 gap-2.5' : 'p-6 gap-4'
      } ${
        isSelected ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/30'
      } ${task.isTimerRunning ? 'ring-2 ring-emerald-500/20 active-node border-emerald-500/30' : ''} ${isBlocked ? 'bg-slate-50/50 grayscale-[0.4]' : ''}`}
    >
      {task.isTimerRunning && (
        <div className="absolute inset-0 bg-emerald-50/5 pointer-events-none rounded-[1.25rem]" />
      )}

      <div className="flex justify-between items-start">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
          {isBlocked && (
            <div className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-100">
               <Lock className="w-2.5 h-2.5" /> Blocked
            </div>
          )}
          {project && (
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
              <div className={`w-1.5 h-1.5 rounded-full ${project.color}`} />
              {project.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
          {!readOnly && (
            <>
              {settings.aiSuggestions && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAIAssist(task); }} 
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className={isCompact ? 'space-y-0.5' : 'space-y-1.5'}>
        <h3 className={`font-heading font-extrabold text-slate-900 leading-tight tracking-tight ${isCompact ? 'text-sm' : 'text-[15px]'} ${isBlocked ? 'text-slate-400' : ''}`}>
          {task.title}
        </h3>
      </div>

      <div className={`pt-1 mt-auto ${isCompact ? 'hidden' : ''}`}>
        {subtasksCount > 0 && (
          <div className="space-y-2 mb-3">
             <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ease-out ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                 style={{ width: `${progressPercentage}%` }}
               />
             </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {totalMs > 0 && !isBlocked && (
              <div className={`flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-widest ${task.isTimerRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Clock className={`w-2.5 h-2.5 ${task.isTimerRunning ? 'animate-spin' : ''}`} style={{animationDuration: '4s'}} />
                {formatTime()}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {task.tags?.slice(0, 1).map(tag => (
                <span key={tag} className="text-[8px] font-black text-slate-400 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {assignee && (
            <div className="relative group/avatar">
              <img 
                src={assignee.avatar} 
                alt={assignee.username} 
                className={`w-6 h-6 rounded-xl border-2 border-white shadow-md ring-1 ring-slate-100 transition-all duration-300 ${task.isTimerRunning ? 'ring-emerald-500' : 'group-hover/avatar:scale-110'}`} 
              />
              {task.isTimerRunning && (
                <div className="absolute inset-0 rounded-xl bg-emerald-500 animate-ping opacity-20" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
