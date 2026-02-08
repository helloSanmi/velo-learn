import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Lock, Sparkles, Trash2 } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';
import Badge from './ui/Badge';
import { projectService } from '../services/projectService';
import { settingsService } from '../services/settingsService';
import { userService } from '../services/userService';

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
  task,
  isSelected,
  onToggleSelection,
  onDelete,
  onAIAssist,
  onSelect,
  readOnly = false
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

  const priorityVariants = {
    [TaskPriority.HIGH]: 'rose' as const,
    [TaskPriority.MEDIUM]: 'amber' as const,
    [TaskPriority.LOW]: 'indigo' as const
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('taskId', task.id);
    e.currentTarget.classList.add('opacity-60');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-60');
  };

  const totalMs = (task.timeLogged || 0) + elapsed;
  const minutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(minutes / 60);
  const formattedTime = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;

  const isBlocked = (task.blockedByIds?.length || 0) > 0;
  const isCompact = settings.compactMode;

  const project = useMemo(() => {
    const projects = projectService.getProjects();
    return projects.find((p) => p.id === task.projectId);
  }, [task.projectId]);

  const assignee = useMemo(() => {
    const users = userService.getUsers();
    return users.find((u) => u.id === task.assigneeId);
  }, [task.assigneeId]);

  return (
    <article
      draggable={!readOnly}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        if (!readOnly && e.shiftKey && onToggleSelection) {
          onToggleSelection(task.id);
          return;
        }
        onSelect(task);
      }}
      data-task-id={task.id}
      className={`group border rounded-xl bg-white p-3.5 cursor-pointer transition-all ${
        isSelected ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
      } ${isBlocked ? 'bg-slate-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
          {project && (
            <span className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 bg-slate-50 max-w-[140px] truncate">
              {project.name}
            </span>
          )}
          {isBlocked && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-rose-100 bg-rose-50 text-rose-700">
              <Lock className="w-3 h-3" /> Blocked
            </span>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {settings.aiSuggestions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAIAssist(task);
                }}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
                title="AI assist"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="w-7 h-7 rounded-md hover:bg-rose-50 flex items-center justify-center text-slate-500 hover:text-rose-700"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <h4 className={`text-sm font-medium text-slate-900 leading-snug ${isCompact ? '' : 'mb-1.5'}`}>{task.title}</h4>

      {!isCompact && task.description && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-2.5">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
              {tag}
            </span>
          ))}
          {totalMs > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <Clock className="w-3 h-3" /> {formattedTime}
            </span>
          )}
        </div>

        {assignee && (
          <img
            src={assignee.avatar}
            alt={assignee.displayName}
            className="w-6 h-6 rounded-md border border-slate-200"
          />
        )}
      </div>
    </article>
  );
};

export default TaskItem;
