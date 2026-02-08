import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, Clock3, Search } from 'lucide-react';
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

type MilestoneStatusFilter = 'All' | 'Done' | 'Late' | 'Planned';

const monthKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const RoadmapView: React.FC<RoadmapViewProps> = ({ tasks, projects }) => {
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<MilestoneStatusFilter>('All');

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const filteredDatedTasks = useMemo(() => {
    const now = Date.now();
    const normalizedQuery = query.trim().toLowerCase();

    return tasks
      .filter((task) => task.dueDate)
      .filter((task) => (projectFilter === 'All' ? true : task.projectId === projectFilter))
      .filter((task) => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Done') return task.status === TaskStatus.DONE;
        if (statusFilter === 'Late') return task.status !== TaskStatus.DONE && (task.dueDate || 0) < now;
        return task.status !== TaskStatus.DONE && (task.dueDate || 0) >= now;
      })
      .filter((task) => {
        if (!normalizedQuery) return true;
        const projectName = projectMap.get(task.projectId)?.name || '';
        return `${task.title} ${projectName}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  }, [tasks, query, projectFilter, statusFilter, projectMap]);

  const timeline = useMemo<MonthGroup[]>(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of filteredDatedTasks) {
      const key = monthKey(task.dueDate!);
      grouped.set(key, [...(grouped.get(key) || []), task]);
    }

    const result: MonthGroup[] = [];
    for (const [key, monthTasks] of grouped.entries()) {
      const firstTs = monthTasks[0].dueDate!;
      const completed = monthTasks.filter((task) => task.status === TaskStatus.DONE).length;
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
  }, [filteredDatedTasks]);

  const totalDatedTasks = useMemo(() => tasks.filter((task) => task.dueDate).length, [tasks]);
  const totalWithDates = timeline.reduce((acc, month) => acc + month.tasks.length, 0);
  const totalDone = timeline.reduce((acc, month) => acc + month.completed, 0);
  const overallProgress = totalWithDates ? Math.round((totalDone / totalWithDates) * 100) : 0;

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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="md:col-span-1 h-10 bg-white border border-slate-300 rounded-lg px-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search milestones"
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </label>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="All">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MilestoneStatusFilter)}
              className="h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="All">All milestone states</option>
              <option value="Done">Done</option>
              <option value="Late">Late</option>
              <option value="Planned">Planned</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
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

        {timeline.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              {totalDatedTasks === 0 ? 'No roadmap items yet' : 'No roadmap items match these filters'}
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              {totalDatedTasks === 0
                ? 'Add due dates to tasks from the board to generate a timeline.'
                : 'Try widening your filters or clearing the search query.'}
            </p>
          </div>
        ) : (
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

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                      {month.tasks.map((task) => {
                        const project = projectMap.get(task.projectId);
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
        )}
      </div>
    </div>
  );
};

export default RoadmapView;
