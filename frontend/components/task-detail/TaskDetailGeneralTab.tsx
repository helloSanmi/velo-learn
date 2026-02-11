import React from 'react';
import { Clock, Edit2, Loader2, Pause, Play, Plus, RotateCcw, ShieldCheck } from 'lucide-react';
import { Task, TaskPriority, User } from '../../types';
import Button from '../ui/Button';
import AssigneePicker from '../ui/AssigneePicker';

interface TaskDetailGeneralTabProps {
  task: Task;
  aiEnabled: boolean;
  allUsers: User[];
  assigneeIds: string[];
  setAssigneeIds: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>) => void;
  onAddComment: (id: string, text: string) => void;
  currentUser?: User;
  canApprove: boolean;
  totalTrackedMs: number;
  formatTrackedTime: (ms: number) => string;
  manualHours: string;
  setManualHours: (value: string) => void;
  manualMinutes: string;
  setManualMinutes: (value: string) => void;
  manualTimeError: string;
  setManualTimeError: (value: string) => void;
  addManualTime: (minutesToAdd?: number) => void;
  onToggleTimer?: (id: string) => void;
  riskAssessment: { isAtRisk: boolean; reason: string } | null;
  isAIThinking: boolean;
  runAIAudit: () => Promise<void>;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  description: string;
  setDescription: (value: string) => void;
}

const TaskDetailGeneralTab: React.FC<TaskDetailGeneralTabProps> = ({
  task,
  aiEnabled,
  allUsers,
  assigneeIds,
  setAssigneeIds,
  onUpdate,
  onAddComment,
  currentUser,
  canApprove,
  totalTrackedMs,
  formatTrackedTime,
  manualHours,
  setManualHours,
  manualMinutes,
  setManualMinutes,
  manualTimeError,
  setManualTimeError,
  addManualTime,
  onToggleTimer,
  riskAssessment,
  isAIThinking,
  runAIAudit,
  isEditing,
  setIsEditing,
  description,
  setDescription
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {task.movedBackAt && task.movedBackReason ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Moved Backward</p>
              <p className="text-sm text-amber-900 mt-0.5">{task.movedBackReason}</p>
              <p className="text-[11px] text-amber-700 mt-1">
                {task.movedBackBy || 'Unknown'} • {new Date(task.movedBackAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {task.priority === TaskPriority.HIGH ? (
        <div className={`rounded-2xl border px-4 py-3 ${task.approvedAt ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${task.approvedAt ? 'text-emerald-700' : 'text-slate-600'}`}>Approval</p>
              <p className={`text-sm mt-0.5 ${task.approvedAt ? 'text-emerald-900' : 'text-slate-700'}`}>
                {task.approvedAt ? `Approved by ${task.approvedBy || 'Admin'} on ${new Date(task.approvedAt).toLocaleString()}` : 'Approval required before moving this high-priority task to done.'}
              </p>
            </div>
            {canApprove && !task.approvedAt ? (
              <Button
                size="sm"
                onClick={() => {
                  onUpdate(task.id, { approvedAt: Date.now(), approvedBy: currentUser?.displayName || 'Admin' });
                  onAddComment(task.id, `Approved for completion by ${currentUser?.displayName || 'Admin'}.`);
                }}
                className="h-8 px-3 text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={`grid grid-cols-1 ${aiEnabled ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col h-[228px] min-h-[228px]">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assignees</h4>
          <div className="flex-1 min-h-0 overflow-hidden">
            <AssigneePicker
              users={allUsers}
              selectedIds={assigneeIds}
              onChange={(nextIds) => {
                setAssigneeIds(nextIds);
                onUpdate(task.id, { assigneeIds: nextIds, assigneeId: nextIds[0] || undefined });
              }}
              compact
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col h-[228px] min-h-[228px]">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time Tracked</h4>
          <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Total</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xl font-bold text-emerald-800 leading-none">{formatTrackedTime(totalTrackedMs)}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold shrink-0 ${
                  task.isTimerRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Clock className="w-3 h-3" />
                  {task.isTimerRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={manualHours}
                onChange={(e) => {
                  setManualHours(e.target.value);
                  if (manualTimeError) setManualTimeError('');
                }}
                placeholder="Hours"
                className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-slate-300"
              />
              <input
                type="number"
                min={0}
                step={1}
                value={manualMinutes}
                onChange={(e) => {
                  setManualMinutes(e.target.value);
                  if (manualTimeError) setManualTimeError('');
                }}
                placeholder="Minutes"
                className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-slate-300"
              />
              <Button type="button" variant="secondary" className="col-span-2 h-9 px-3 text-xs" onClick={() => addManualTime()}>
                Add manual time
              </Button>
            </div>
            {manualTimeError ? <p className="text-[11px] text-rose-600">{manualTimeError}</p> : <div className="h-[16px]" />}
            <Button
              type="button"
              variant="secondary"
              className={`h-9 px-3 text-xs ${
                task.isTimerRunning
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : ''
              }`}
              onClick={() => onToggleTimer?.(task.id)}
            >
              {task.isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {task.isTimerRunning ? 'Stop timer' : 'Start timer'}
            </Button>
          </div>
        </div>

        {aiEnabled ? (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col h-[228px] min-h-[228px]">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Audit</h4>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-semibold ${riskAssessment ? (riskAssessment.isAtRisk ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-500'}`}>
                  {riskAssessment ? (riskAssessment.isAtRisk ? 'At risk' : 'Healthy') : 'Not checked'}
                </p>
                <Button size="sm" onClick={runAIAudit} disabled={isAIThinking} className="h-8 px-2 rounded-lg text-xs">
                  {isAIThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Check
                </Button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {riskAssessment?.reason || 'Run a quick health check for risk signals.'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative group">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Documentation</h4>
          <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm h-28 outline-none focus:ring-2 focus:ring-slate-300 transition-all resize-none font-medium"
          />
        ) : (
          <div className="max-h-28 overflow-y-auto custom-scrollbar pr-1">
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">{task.description || 'No documentation provided.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailGeneralTab;
