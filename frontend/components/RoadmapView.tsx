import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Search, Target } from 'lucide-react';
import { Project, Task, TaskStatus } from '../types';
import Badge from './ui/Badge';

interface RoadmapViewProps {
  tasks: Task[];
  projects: Project[];
}

type MilestoneFilter = 'All' | 'On Track' | 'At Risk' | 'Completed';
type HorizonFilter = 'All' | '90' | '180';
type LaneKey = 'now' | 'next' | 'later' | 'completed';

interface LaneConfig {
  key: LaneKey;
  title: string;
  subtitle: string;
}

const LANE_CONFIG: LaneConfig[] = [
  { key: 'now', title: 'Now', subtitle: '0-30 days' },
  { key: 'next', title: 'Next', subtitle: '31-90 days' },
  { key: 'later', title: 'Later', subtitle: 'Beyond 90 days' },
  { key: 'completed', title: 'Completed', subtitle: 'Delivered milestones' }
];

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

const daysUntil = (targetTs: number) => Math.ceil((targetTs - startOfToday()) / 86400000);

const RoadmapView: React.FC<RoadmapViewProps> = ({ tasks, projects }) => {
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<MilestoneFilter>('All');
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('All');

  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  const getDoneStageId = (projectId: string) => {
    const project = projectMap.get(projectId);
    return project?.stages?.[project.stages.length - 1]?.id || TaskStatus.DONE;
  };

  const isCompleted = (task: Task) => task.status === getDoneStageId(task.projectId) || task.status === TaskStatus.DONE;

  const allMilestones = useMemo(() => {
    const nowTs = Date.now();
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const dueDate = task.dueDate as number;
        const completed = isCompleted(task);
        const dueInDays = daysUntil(dueDate);
        const isLate = !completed && dueDate < startOfToday();
        const isDueSoon = !completed && dueInDays >= 0 && dueInDays <= 7;
        const isAtRisk = isLate || isDueSoon;

        return {
          ...task,
          dueDate,
          dueInDays,
          completed,
          isLate,
          isDueSoon,
          isAtRisk,
          isPastHorizon: dueDate > nowTs + 180 * 86400000
        };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [tasks, projectMap]);

  const filteredMilestones = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allMilestones
      .filter((task) => (projectFilter === 'All' ? true : task.projectId === projectFilter))
      .filter((task) => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Completed') return task.completed;
        if (statusFilter === 'At Risk') return task.isAtRisk;
        return !task.completed && !task.isAtRisk;
      })
      .filter((task) => {
        if (horizonFilter === 'All') return true;
        const maxDays = Number(horizonFilter);
        return task.completed || task.dueInDays <= maxDays;
      })
      .filter((task) => {
        if (!normalizedQuery) return true;
        const projectName = projectMap.get(task.projectId)?.name || '';
        return `${task.title} ${projectName}`.toLowerCase().includes(normalizedQuery);
      });
  }, [allMilestones, projectFilter, statusFilter, horizonFilter, query, projectMap]);

  const laneTasks = useMemo(() => {
    const lanes: Record<LaneKey, Task[]> = { now: [], next: [], later: [], completed: [] };

    filteredMilestones.forEach((task: any) => {
      if (task.completed) {
        lanes.completed.push(task);
        return;
      }

      if (task.dueInDays <= 30) {
        lanes.now.push(task);
        return;
      }

      if (task.dueInDays <= 90) {
        lanes.next.push(task);
        return;
      }

      lanes.later.push(task);
    });

    lanes.completed.sort((a, b) => b.dueDate - a.dueDate);
    return lanes;
  }, [filteredMilestones]);

  const insights = useMemo(() => {
    const total = filteredMilestones.length;
    const completed = filteredMilestones.filter((task: any) => task.completed).length;
    const atRisk = filteredMilestones.filter((task: any) => task.isAtRisk).length;
    const dueSoon = filteredMilestones.filter((task: any) => !task.completed && task.dueInDays >= 0 && task.dueInDays <= 14).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, atRisk, dueSoon, completionRate };
  }, [filteredMilestones]);

  const timelineStrip = useMemo(() => {
    const grouped = filteredMilestones.reduce((acc, task: any) => {
      const date = new Date(task.dueDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          ts: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total: 0,
          completed: 0,
          atRisk: 0
        };
      }
      acc[key].total += 1;
      if (task.completed) acc[key].completed += 1;
      if (task.isAtRisk && !task.completed) acc[key].atRisk += 1;
      return acc;
    }, {} as Record<string, { key: string; ts: number; label: string; total: number; completed: number; atRisk: number }>);

    return Object.values(grouped)
      .sort((a, b) => a.ts - b.ts)
      .map((month) => ({
        ...month,
        completionRate: month.total ? Math.round((month.completed / month.total) * 100) : 0
      }));
  }, [filteredMilestones]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">Roadmap</h2>
              <p className="text-xs md:text-sm text-slate-600 mt-0.5">Strategic milestone planning across near-term and long-term delivery windows.</p>
            </div>
            <Badge variant="indigo">{insights.completionRate}% complete</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <label className="md:col-span-2 h-9 bg-white border border-slate-300 rounded-lg px-2.5 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roadmap milestones"
                className="w-full bg-transparent text-xs md:text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </label>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs md:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="All">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as MilestoneFilter)}
                className="h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs md:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="All">All status</option>
                <option value="On Track">On track</option>
                <option value="At Risk">At risk</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={horizonFilter}
                onChange={(event) => setHorizonFilter(event.target.value as HorizonFilter)}
                className="h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs md:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="All">All horizon</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50">
              <p className="text-[10px] text-slate-500">Milestones</p>
              <p className="text-base font-semibold text-slate-900">{insights.total}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50">
              <p className="text-[10px] text-slate-500">Completed</p>
              <p className="text-base font-semibold text-slate-900">{insights.completed}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50">
              <p className="text-[10px] text-slate-500">At risk</p>
              <p className="text-base font-semibold text-rose-700">{insights.atRisk}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50">
              <p className="text-[10px] text-slate-500">Due in 14 days</p>
              <p className="text-base font-semibold text-amber-700">{insights.dueSoon}</p>
            </div>
          </div>
        </header>

        {filteredMilestones.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No roadmap milestones found</h3>
            <p className="text-sm text-slate-600 mt-2">Try adjusting filters or assign due dates to tasks so they appear in the roadmap.</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              {LANE_CONFIG.map((lane) => {
                const laneItems = laneTasks[lane.key] as any[];
                return (
                  <article key={lane.key} className="bg-white border border-slate-200 rounded-xl p-3.5 h-[360px] md:h-[420px] xl:h-[520px] flex flex-col">
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                        <span className="text-[11px] text-slate-500">{laneItems.length}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lane.subtitle}</p>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {laneItems.length === 0 ? (
                        <div className="h-24 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-center text-center px-3">
                          No milestones in this lane.
                        </div>
                      ) : (
                        laneItems.map((task) => {
                          const project = projectMap.get(task.projectId);
                          const due = new Date(task.dueDate);
                          return (
                            <div key={task.id} className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-sm font-medium text-slate-900 line-clamp-2">{task.title}</p>

                              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className={`w-2 h-2 rounded-full ${project?.color || 'bg-slate-400'}`} />
                                <span className="truncate">{project?.name || 'General'}</span>
                              </div>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-600 inline-flex items-center gap-1">
                                  <CalendarDays className="w-3.5 h-3.5" /> {due.toLocaleDateString()}
                                </span>

                                {task.completed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <CheckCircle2 className="w-3 h-3" /> Done
                                  </span>
                                ) : task.isAtRisk ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-rose-50 text-rose-700 border border-rose-100">
                                    <AlertTriangle className="w-3 h-3" /> Risk
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                                    <Target className="w-3 h-3" /> On track
                                  </span>
                                )}
                              </div>

                              {!task.completed && task.dueInDays <= 7 ? (
                                <p className="mt-1.5 text-[11px] text-amber-700 inline-flex items-center gap-1">
                                  <Clock3 className="w-3 h-3" /> Due in {Math.max(task.dueInDays, 0)} day{Math.abs(task.dueInDays) === 1 ? '' : 's'}
                                </p>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Executive Timeline</h3>
                <p className="text-[11px] text-slate-500">Monthly delivery and risk trend</p>
              </div>
              <div className="overflow-x-auto custom-scrollbar max-h-[220px]">
                <div className="min-w-[760px] grid grid-cols-1 md:grid-cols-6 gap-2">
                  {timelineStrip.map((month) => (
                    <div key={month.key} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                      <p className="text-[11px] font-semibold text-slate-700">{month.label}</p>
                      <p className="text-xl font-semibold text-slate-900 mt-1">{month.total}</p>
                      <p className="text-[11px] text-slate-500">milestones</p>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-slate-900" style={{ width: `${month.completionRate}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700">{month.completed} done</span>
                        <span className="text-rose-700">{month.atRisk} risk</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default RoadmapView;
