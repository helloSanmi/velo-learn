import React, { useMemo } from 'react';
import { CalendarDays, CheckCircle2, Circle, Clock3 } from 'lucide-react';
import { Project, Task, TaskStatus } from '../types';
import Badge from './ui/Badge';

interface RoadmapViewProps {
  tasks: Task[];
  projects: Project[];
}

interface MonthGroup {
  key: string;
  label: string;
  startTs: number;
  tasks: Task[];
  completed: number;
  progress: number;
}

const monthKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const RoadmapView: React.FC<RoadmapViewProps> = ({ tasks, projects }) => {
  const timeline = useMemo<MonthGroup[]>(() => {
    const dated = tasks
      .filter((t) => t.dueDate)
      .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

    const grouped = new Map<string, Task[]>();
    for (const task of dated) {
      const key = monthKey(task.dueDate!);
      grouped.set(key, [...(grouped.get(key) || []), task]);
    }

    const result: MonthGroup[] = [];
    for (const [key, monthTasks] of grouped.entries()) {
      const firstTs = monthTasks[0].dueDate!;
      const completed = monthTasks.filter((t) => t.status === TaskStatus.DONE).length;
      const progress = monthTasks.length ? Math.round((completed / monthTasks.length) * 100) : 0;
      result.push({
        key,
        label: monthLabel(firstTs),
        startTs: firstTs,
        tasks: monthTasks,
        completed,
        progress
      });
    }

    return result.sort((a, b) => a.startTs - b.startTs);
  }, [tasks]);

  const totalWithDates = timeline.reduce((acc, month) => acc + month.tasks.length, 0);
  const totalDone = timeline.reduce((acc, month) => acc + month.completed, 0);
  const overallProgress = totalWithDates ? Math.round((totalDone / totalWithDates) * 100) : 0;

  if (totalWithDates === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold tracking-tight">No roadmap items yet</h2>
          <p className="text-sm text-slate-600 mt-2">
            Add due dates to tasks from the board to generate a timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Roadmap</h2>
              <p className="text-sm text-slate-600 mt-1">Timeline view of upcoming and completed milestones.</p>
            </div>
            <Badge variant="indigo">{overallProgress}% complete</Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="text-xs text-slate-500">Total milestones</p>
              <p className="text-lg font-semibold text-slate-900">{totalWithDates}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="text-xs text-slate-500">Completed</p>
              <p className="text-lg font-semibold text-slate-900">{totalDone}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="text-xs text-slate-500">Months</p>
              <p className="text-lg font-semibold text-slate-900">{timeline.length}</p>
            </div>
          </div>
        </header>

        <section className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />

            <div className="space-y-6">
              {timeline.map((month) => (
                <div key={month.key} className="relative">
                  <div className="absolute -left-[1.05rem] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-400" />

                  <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-slate-900">
                      <CalendarDays className="w-4 h-4" />
                      <h3 className="font-semibold">{month.label}</h3>
                    </div>
                    <div className="text-xs text-slate-500">{month.completed}/{month.tasks.length} done</div>
                  </div>

                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-slate-800" style={{ width: `${month.progress}%` }} />
                  </div>

                  <div className="space-y-2">
                    {month.tasks.map((task) => {
                      const project = projects.find((p) => p.id === task.projectId);
                      const isDone = task.status === TaskStatus.DONE;
                      const isLate = (task.dueDate || 0) < Date.now() && !isDone;

                      return (
                        <div key={task.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <span className={`w-2 h-2 rounded-full ${project?.color || 'bg-slate-400'}`} />
                                <span className="truncate">{project?.name || 'General'}</span>
                                <span>•</span>
                                <span>{new Date(task.dueDate!).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <CheckCircle2 className="w-3 h-3" /> Done
                                </span>
                              ) : isLate ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-rose-50 text-rose-700 border border-rose-100">
                                  <Clock3 className="w-3 h-3" /> Late
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-700 border border-slate-200">
                                  <Circle className="w-3 h-3" /> Planned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RoadmapView;
