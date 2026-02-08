
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
      className={`group bg-white rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing relative flex flex-col ${
        isCompact ? 'p-3.5 gap-2.5' : 'p-6 gap-4'
      } ${
        isSelected ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
      } ${task.isTimerRunning ? 'ring-2 ring-emerald-200 border-emerald-300' : ''} ${isBlocked ? 'bg-slate-50/80 grayscale-[0.2]' : ''}`}
    >
      {task.isTimerRunning && (
        <div className="absolute inset-0 bg-emerald-50/40 pointer-events-none rounded-2xl" />
      )}

      <div className="flex justify-between items-start">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
          {isBlocked && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-rose-700 uppercase tracking-wide bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
               <Lock className="w-2.5 h-2.5" /> Blocked
            </div>
          )}
          {project && (
            <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase text-slate-500 tracking-wide bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
              <div className={`w-1.5 h-1.5 rounded-full ${project.color}`} />
              {project.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!readOnly && (
            <>
              {settings.aiSuggestions && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAIAssist(task); }} 
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className={isCompact ? 'space-y-0.5' : 'space-y-1.5'}>
        <h3 className={`font-heading font-semibold text-slate-900 leading-tight tracking-tight ${isCompact ? 'text-sm' : 'text-[15px]'} ${isBlocked ? 'text-slate-500' : ''}`}>
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
              <div className={`flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wide ${task.isTimerRunning ? 'text-emerald-700' : 'text-slate-500'}`}>
                <Clock className={`w-2.5 h-2.5 ${task.isTimerRunning ? 'animate-spin' : ''}`} style={{animationDuration: '4s'}} />
                {formatTime()}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {task.tags?.slice(0, 1).map(tag => (
                <span key={tag} className="text-[9px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg uppercase tracking-wide">
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
                className={`w-6 h-6 rounded-xl border border-slate-200 ring-1 ring-slate-100 transition-all duration-200 ${task.isTimerRunning ? 'ring-emerald-500' : 'group-hover/avatar:scale-105'}`} 
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
