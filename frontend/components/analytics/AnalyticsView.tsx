import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Project, Task, TaskPriority, TaskStatus, User } from '../../types';
import Button from '../ui/Button';
import { aiService } from '../../services/aiService';

interface AnalyticsViewProps {
  tasks: Task[];
  projects: Project[];
  allUsers: User[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, allUsers }) => {
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [healthInsights, setHealthInsights] = useState<{ bottlenecks: string[]; suggestions: string[] } | null>(null);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasks.filter((t) => t.status === TaskStatus.TODO).length;
    const high = tasks.filter((t) => t.priority === TaskPriority.HIGH).length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;

    return { total, done, inProgress, todo, high, completionRate };
  }, [tasks]);

  const people = useMemo(() => {
    return allUsers.map((user) => {
      const assigned = tasks.filter((t) => t.assigneeId === user.id);
      const active = assigned.filter((t) => t.status !== TaskStatus.DONE).length;
      const completed = assigned.filter((t) => t.status === TaskStatus.DONE).length;
      return { ...user, active, completed };
    }).sort((a, b) => b.active - a.active);
  }, [allUsers, tasks]);

  const recentActivity = useMemo(() => {
    return tasks
      .flatMap((t) => (t.auditLog || []).map((a) => ({ ...a, taskTitle: t.title })))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [tasks]);

  const runAIHealthAudit = async () => {
    setIsLoadingInsights(true);
    try {
      const insights = await aiService.getHealthInsights(tasks, allUsers);
      setHealthInsights(insights);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Analytics</h2>
            <p className="text-sm text-slate-600 mt-1">Simple view of progress, workload, and recent activity.</p>
          </div>
          <Button onClick={runAIHealthAudit} variant="secondary" disabled={isLoadingInsights}>
            {isLoadingInsights ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Run AI health check
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-semibold mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Done</p>
            <p className="text-2xl font-semibold mt-1">{stats.done}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">In progress</p>
            <p className="text-2xl font-semibold mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">High priority</p>
            <p className="text-2xl font-semibold mt-1">{stats.high}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Completion</p>
            <p className="text-2xl font-semibold mt-1">{stats.completionRate}%</p>
          </div>
        </div>

        {healthInsights && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">AI Health Check</h3>
            {healthInsights.bottlenecks.map((item, idx) => (
              <div key={idx} className="flex gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
            {healthInsights.suggestions?.map((item, idx) => (
              <div key={idx} className="flex gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Team Workload</h3>
            <div className="space-y-2">
              {people.map((person) => (
                <div key={person.id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={person.avatar} alt={person.displayName} className="w-7 h-7 rounded-lg border border-slate-200" />
                    <span className="text-sm text-slate-800 truncate">{person.displayName}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {person.active} active • {person.completed} done
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {recentActivity.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
              {recentActivity.map((entry, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{entry.displayName}</span> {entry.action.toLowerCase()}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{entry.taskTitle}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
