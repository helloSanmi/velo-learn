import React from 'react';
import { Clock, Loader2, Pause, Play, RotateCcw, ShieldCheck } from 'lucide-react';
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
  description: string;
  setDescription: (value: string) => void;
  canManageTask: boolean;
  canTrackTime: boolean;
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
  description,
  setDescription,
  canManageTask,
  canTrackTime
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
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[220px] overflow-visible">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assignees</h4>
            <span className="text-[10px] font-semibold text-slate-500">{assigneeIds.length} selected</span>
          </div>
          <div className="flex-1 min-h-0 overflow-visible">
            <AssigneePicker
              users={allUsers}
              selectedIds={assigneeIds}
              onChange={(nextIds) => {
                setAssigneeIds(nextIds);
                onUpdate(task.id, { assigneeIds: nextIds, assigneeId: nextIds[0] || undefined });
              }}
              disabled={!canManageTask}
              compact
              dropdownUnassignedOnly
              showInitialsChips
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[220px]">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time Tracked</h4>
          <div className="flex-1 min-h-0 flex flex-col gap-2.5">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-lg font-bold text-slate-900 leading-none">{formatTrackedTime(totalTrackedMs)}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                  task.isTimerRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Clock className="w-3 h-3" />
                  {task.isTimerRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className={`h-8 px-3 text-xs justify-center ${
                task.isTimerRunning ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''
              }`}
              onClick={() => onToggleTimer?.(task.id)}
              disabled={!canTrackTime}
              title={task.isTimerRunning ? 'Stop timer' : 'Start timer'}
            >
              {task.isTimerRunning ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
              {task.isTimerRunning ? 'Stop' : 'Start'}
            </Button>

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
                disabled={!canTrackTime}
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
                disabled={!canTrackTime}
                placeholder="Minutes"
                className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-slate-300"
              />
              <Button type="button" variant="secondary" className="col-span-2 h-8 px-3 text-xs" onClick={() => addManualTime()} disabled={!canTrackTime}>
                Add manual time
              </Button>
            </div>
            {!canTrackTime ? <p className="text-[11px] text-slate-500">Only assigned members can track time.</p> : null}
            {manualTimeError ? <p className="text-[11px] text-rose-600">{manualTimeError}</p> : null}
          </div>
        </div>

        {aiEnabled ? (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[220px]">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Audit</h4>
            <div className="flex-1 min-h-0 flex flex-col gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <p className={`mt-1 text-sm font-semibold ${riskAssessment ? (riskAssessment.isAtRisk ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-700'}`}>
                  {riskAssessment ? (riskAssessment.isAtRisk ? 'At risk' : 'Healthy') : 'Not checked yet'}
                </p>
              </div>
              <Button size="sm" onClick={runAIAudit} disabled={isAIThinking || !canManageTask} className="h-8 px-2 rounded-lg text-xs self-start">
                {isAIThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                {riskAssessment ? 'Run again' : 'Run check'}
              </Button>
              {!canManageTask ? <p className="text-[11px] text-slate-500">Only project owner/admin can run AI audit.</p> : null}
              <div className="min-h-0 overflow-y-auto custom-scrollbar pr-1">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {riskAssessment?.reason || 'Run a health check to detect possible delivery risks.'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative group">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Documentation</h4>
        {canManageTask ? (
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
