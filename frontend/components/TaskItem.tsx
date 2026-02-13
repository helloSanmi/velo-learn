import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Clock, Lock, Pause, Play, Sparkles, Trash2, RotateCcw } from 'lucide-react';
import { Task, TaskPriority } from '../types';
import Badge from './ui/Badge';
import { projectService } from '../services/projectService';
import { settingsService } from '../services/settingsService';
import { userService } from '../services/userService';
import { estimationService } from '../services/estimationService';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onAIAssist: (task: Task) => void;
  onSelect: (task: Task) => void;
  onToggleTimer?: (id: string) => void;
  readOnly?: boolean;
  canDelete?: boolean;
  canUseAIAssist?: boolean;
  canToggleTimer?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isSelected,
  onToggleSelection,
  onDelete,
  onAIAssist,
  onSelect,
  onToggleTimer,
  readOnly = false,
  canDelete = true,
  canUseAIAssist = true,
  canToggleTimer = true
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
  const isTimerActive = !!task.isTimerRunning;

  const isBlocked = (task.blockedByIds?.length || 0) > 0;
  const isCompact = settings.compactMode;
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = (task.subtasks || []).filter((subtask) => subtask.isCompleted).length;

  const project = useMemo(() => {
    const projects = projectService.getProjects();
    return projects.find((p) => p.id === task.projectId);
  }, [task.projectId]);

  const assigneeIds = useMemo(() => {
    if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) return task.assigneeIds;
    return task.assigneeId ? [task.assigneeId] : [];
  }, [task.assigneeIds, task.assigneeId]);

  const assignees = useMemo(() => {
    const users = userService.getUsers();
    return assigneeIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  }, [assigneeIds]);
  const assigneeNames = useMemo(
    () => assignees.map((assignee: any) => assignee.displayName || assignee.username || 'Unknown').join(', '),
    [assignees]
  );
  const adjustedEstimateLabel = useMemo(() => {
    if (!task.estimateMinutes || task.estimateMinutes <= 0) return '';
    const estimator = task.estimateProvidedBy || task.userId;
    const preview = estimationService.getAdjustmentPreview(task.orgId, estimator, task.estimateMinutes, {
      projectId: task.projectId,
      status: task.status,
      tags: task.tags
    });
    const hours = Math.max(0.25, preview.adjustedMinutes / 60);
    return `Adj ${hours.toFixed(hours >= 10 ? 1 : 2)}h`;
  }, [task]);

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
      className={`group border rounded-lg bg-white p-3 cursor-pointer transition-all ${
        isSelected ? 'border-slate-700 ring-1 ring-slate-300' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      } ${isBlocked ? 'bg-slate-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
          {project && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 bg-slate-50 max-w-[140px] truncate">
              {project.name}
            </span>
          )}
          {isBlocked && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-rose-100 bg-rose-50 text-rose-700">
              <Lock className="w-3 h-3" /> Blocked
            </span>
          )}
          {task.movedBackAt && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
              <RotateCcw className="w-3 h-3" /> Moved back
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
                disabled={!canUseAIAssist}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={canUseAIAssist ? 'AI assist' : 'Only project owner/admin can run AI suggestions'}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!canDelete) return;
                onDelete(task.id);
              }}
              disabled={!canDelete}
              className="w-7 h-7 rounded-md hover:bg-rose-50 flex items-center justify-center text-slate-500 hover:text-rose-700 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500"
              title={canDelete ? 'Delete' : 'Only project owner/admin can delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <h4 className={`text-sm font-medium text-slate-900 leading-snug ${isCompact ? '' : 'mb-1'}`}>{task.title}</h4>

      {!isCompact && task.description && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
              {tag}
            </span>
          ))}
          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">
              <CheckSquare className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks} subtasks
            </span>
          )}
          {(totalMs > 0 || isTimerActive) && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
              <Clock className="w-3 h-3" /> {formattedTime}
            </span>
          )}
          {adjustedEstimateLabel ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">
              {adjustedEstimateLabel}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {!readOnly && onToggleTimer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!canToggleTimer) return;
                onToggleTimer(task.id);
              }}
              disabled={!canToggleTimer}
              className={`h-6 px-1.5 rounded-md border text-[10px] font-medium inline-flex items-center gap-1 transition-colors ${
                isTimerActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              } disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white`}
              title={canToggleTimer ? (isTimerActive ? 'Stop timer' : 'Start timer') : 'Only assigned members can track time'}
            >
              {isTimerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isTimerActive ? 'Stop' : 'Start'}
            </button>
          )}

          {assignees.length > 0 && (
            <div className="flex items-center -space-x-1" title={assigneeNames} aria-label={assigneeNames}>
              {assignees.slice(0, 3).map((assignee: any) => (
                <div key={assignee.id} className="relative group/assignee">
                  <img
                    src={assignee.avatar}
                    alt={assignee.displayName}
                    title={assignee.displayName || assignee.username}
                    className="w-6 h-6 rounded-lg border border-white shadow-sm"
                  />
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded-md bg-slate-900 text-white text-[10px] px-1.5 py-0.5 opacity-0 group-hover/assignee:opacity-100 transition-opacity z-20">
                    {assignee.displayName || assignee.username}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default TaskItem;
