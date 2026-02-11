import React, { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Search, Trash2 } from 'lucide-react';
import { Project, Task } from '../types';
import { DEFAULT_PROJECT_STAGES } from '../services/projectService';

interface ProjectsLifecycleViewProps {
  currentUserRole?: 'admin' | 'member' | 'guest';
  projects: Project[];
  projectTasks: Task[];
  activeProjectId: string | null;
  onRenameProject: (id: string, name: string) => void;
  onCompleteProject: (id: string) => void;
  onReopenProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onRestoreProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onPurgeProject: (id: string) => void;
  onBulkLifecycleAction: (action: 'archive' | 'complete' | 'delete' | 'restore', ids: string[]) => void;
}

type StatusFilter = 'All' | 'Active' | 'Archived' | 'Completed' | 'Deleted';
const statusOrder: Record<Exclude<StatusFilter, 'All'>, number> = {
  Active: 0,
  Completed: 1,
  Archived: 2,
  Deleted: 3
};

const ProjectsLifecycleView: React.FC<ProjectsLifecycleViewProps> = ({
  currentUserRole,
  projects,
  projectTasks,
  activeProjectId,
  onRenameProject,
  onCompleteProject,
  onReopenProject,
  onArchiveProject,
  onRestoreProject,
  onDeleteProject,
  onPurgeProject,
  onBulkLifecycleAction
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const getProjectStatus = (project: Project): Exclude<StatusFilter, 'All'> => {
    if (project.isDeleted) return 'Deleted';
    if (project.isArchived) return 'Archived';
    if (project.isCompleted) return 'Completed';
    return 'Active';
  };

  const getStatusStyles = (status: Exclude<StatusFilter, 'All'>) => {
    if (status === 'Active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (status === 'Completed') return 'border-sky-200 bg-sky-50 text-sky-700';
    if (status === 'Archived') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-rose-200 bg-rose-50 text-rose-700';
  };

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((project) => (statusFilter === 'All' ? true : getProjectStatus(project) === statusFilter))
      .filter((project) => (q ? `${project.name} ${project.description}`.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const aStatus = getProjectStatus(a);
        const bStatus = getProjectStatus(b);
        const byStatus = statusOrder[aStatus] - statusOrder[bStatus];
        if (byStatus !== 0) return byStatus;
        return a.name.localeCompare(b.name);
      });
  }, [projects, query, statusFilter]);

  const focusedProject = projects.find((project) => project.id === focusedProjectId) || null;
  const focusedProjectTasks = useMemo(
    () => (focusedProject ? projectTasks.filter((task) => task.projectId === focusedProject.id) : []),
    [projectTasks, focusedProject]
  );
  const focusedProjectStats = useMemo(() => {
    if (!focusedProject) return null;
    const stages = focusedProject.stages?.length ? focusedProject.stages : DEFAULT_PROJECT_STAGES;
    const firstStageId = stages[0]?.id;
    const lastStageId = stages[stages.length - 1]?.id;
    const total = focusedProjectTasks.length;
    const done = lastStageId ? focusedProjectTasks.filter((task) => task.status === lastStageId).length : 0;
    const backlog = firstStageId ? focusedProjectTasks.filter((task) => task.status === firstStageId).length : 0;
    const inProgress = Math.max(0, total - done - backlog);
    const completionRate = total > 0 ? done / total : 0;
    const estimatedSpent = focusedProject.budgetCost ? focusedProject.budgetCost * completionRate : undefined;
    const scopeGap = typeof focusedProject.scopeSize === 'number' ? focusedProject.scopeSize - total : undefined;

    return { total, done, backlog, inProgress, completionRate, estimatedSpent, scopeGap };
  }, [focusedProject, focusedProjectTasks]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => !p.isArchived && !p.isCompleted && !p.isDeleted).length,
      archived: projects.filter((p) => p.isArchived && !p.isDeleted).length,
      completed: projects.filter((p) => p.isCompleted && !p.isDeleted).length,
      deleted: projects.filter((p) => p.isDeleted).length
    }),
    [projects]
  );

  const submitProjectRename = () => {
    if (!editingProjectId) return;
    const trimmed = editingProjectName.trim();
    if (!trimmed) return;
    onRenameProject(editingProjectId, trimmed);
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedProjectIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Projects</h2>
          <p className="text-sm text-slate-600 mt-1">Simple lifecycle management with clear project details and task history.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: 'All', label: `All (${counts.all})` },
              { key: 'Active', label: `Active (${counts.active})` },
              { key: 'Archived', label: `Archived (${counts.archived})` },
              { key: 'Completed', label: `Completed (${counts.completed})` },
              { key: 'Deleted', label: `Deleted (${counts.deleted})` }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key as StatusFilter)}
                className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  statusFilter === item.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : item.key === 'Active'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : item.key === 'Completed'
                        ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                        : item.key === 'Archived'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : item.key === 'Deleted'
                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4 min-h-[68vh]">
          <section className="border border-slate-200 rounded-xl bg-white p-3 flex flex-col min-h-0">
            {selectedProjectIds.length > 0 && (
              <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-2">
                <span className="text-xs text-slate-600 px-1">{selectedProjectIds.length} selected</span>
                <button onClick={() => onBulkLifecycleAction('archive', selectedProjectIds)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700">Archive</button>
                <button onClick={() => onBulkLifecycleAction('complete', selectedProjectIds)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700">Complete</button>
                <button onClick={() => onBulkLifecycleAction('delete', selectedProjectIds)} className="h-7 px-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-700">Delete</button>
                <button onClick={() => onBulkLifecycleAction('restore', selectedProjectIds)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700">Restore</button>
                <button onClick={() => setSelectedProjectIds([])} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700">Clear</button>
              </div>
            )}
            <label className="h-10 rounded-lg border border-slate-300 px-3 bg-white flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>

            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
              {filteredProjects.length === 0 ? (
                <div className="h-20 border border-dashed border-slate-200 rounded-lg text-sm text-slate-500 flex items-center justify-center text-center px-3">
                  No projects found.
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const status = getProjectStatus(project);
                  return (
                      <button
                        key={project.id}
                        onClick={() => setFocusedProjectId(project.id)}
                      className={`w-full text-left border rounded-lg p-3 transition-colors ${
                        focusedProjectId === project.id ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedProjectIds.includes(project.id)}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleProjectSelection(project.id);
                            }}
                            onClick={(event) => event.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-slate-300"
                          />
                          <div className={`w-3 h-3 rounded-full ${project.color} shrink-0 ${activeProjectId === project.id ? 'active-node ring-1 ring-[#76003f]/15 ring-offset-0' : ''}`} />
                          <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                        </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md border ${getStatusStyles(status)}`}>{status}</span>
                        <span className="text-[11px] text-slate-500">
                          {projectTasks.filter((t) => t.projectId === project.id).length} tasks
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {focusedProject ? (
            <section className="border border-slate-200 rounded-xl bg-white p-4 md:p-5 flex flex-col min-h-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{getProjectStatus(focusedProject)}</p>
                  <h3 className="text-xl font-semibold text-slate-900 truncate mt-1">{focusedProject.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{focusedProject.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">Total</p>
                  <p className="text-base font-semibold text-slate-900">{focusedProjectStats?.total || 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">Backlog</p>
                  <p className="text-base font-semibold text-slate-900">{focusedProjectStats?.backlog || 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">In progress</p>
                  <p className="text-base font-semibold text-slate-900">{focusedProjectStats?.inProgress || 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">Done</p>
                  <p className="text-base font-semibold text-slate-900">{focusedProjectStats?.done || 0}</p>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-white">
                  <p className="text-[11px] text-slate-500">Timeline</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {focusedProject.startDate ? new Date(focusedProject.startDate).toLocaleDateString() : 'No start'} - {focusedProject.endDate ? new Date(focusedProject.endDate).toLocaleDateString() : 'No end'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-white">
                  <p className="text-[11px] text-slate-500">Planned / Est. spent</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {focusedProject.budgetCost ? `$${focusedProject.budgetCost.toLocaleString()}` : 'No budget'} / {focusedProjectStats?.estimatedSpent ? `$${Math.round(focusedProjectStats.estimatedSpent).toLocaleString()}` : '-'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-white">
                  <p className="text-[11px] text-slate-500">Scope target</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {typeof focusedProject.scopeSize === 'number' ? `${focusedProject.scopeSize} tasks` : 'Not set'}
                    {typeof focusedProjectStats?.scopeGap === 'number' ? ` (${focusedProjectStats.scopeGap >= 0 ? '+' : ''}${focusedProjectStats.scopeGap} gap)` : ''}
                  </p>
                </div>
              </div>
              {focusedProject.scopeSummary ? (
                <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">Scope summary</p>
                  <p className="text-sm text-slate-700 mt-1">{focusedProject.scopeSummary}</p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {editingProjectId === focusedProject.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingProjectName}
                      onChange={(event) => setEditingProjectName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') submitProjectRename();
                        if (event.key === 'Escape') {
                          setEditingProjectId(null);
                          setEditingProjectName('');
                        }
                      }}
                      className="h-9 flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 text-sm bg-white outline-none"
                    />
                    <button onClick={submitProjectRename} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">Save</button>
                  </>
                ) : (
                  <button onClick={() => { setEditingProjectId(focusedProject.id); setEditingProjectName(focusedProject.name); }} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
                    Rename
                  </button>
                )}

                {!focusedProject.isDeleted && !focusedProject.isArchived && !focusedProject.isCompleted && (
                  <>
                    <button onClick={() => onCompleteProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">Complete</button>
                    <button disabled={currentUserRole !== 'admin'} onClick={() => onArchiveProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-40"><Archive className="w-3.5 h-3.5" /> Archive</button>
                  </>
                )}
                {focusedProject.isArchived && <button disabled={currentUserRole !== 'admin'} onClick={() => onRestoreProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-40"><ArchiveRestore className="w-3.5 h-3.5" /> Restore</button>}
                {focusedProject.isCompleted && <button onClick={() => onReopenProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">Reopen</button>}
                {!focusedProject.isDeleted ? (
                  <button disabled={currentUserRole !== 'admin'} onClick={() => onDeleteProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700 inline-flex items-center gap-1.5 disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                ) : (
                  <>
                    <button disabled={currentUserRole !== 'admin'} onClick={() => onRestoreProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-40">Restore</button>
                    <button disabled={currentUserRole !== 'admin'} onClick={() => onPurgeProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700 disabled:opacity-40">Purge</button>
                  </>
                )}
              </div>

              <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden flex-1 min-h-0">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tasks</div>
                <div className="max-h-[38vh] overflow-y-auto custom-scrollbar">
                  {focusedProjectTasks.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">No tasks found for this project.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {focusedProjectTasks.map((task) => (
                        <div key={task.id} className="p-3">
                          <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{task.status.replace('-', ' ')} • {task.priority}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="border border-dashed border-slate-200 rounded-xl p-6 text-slate-500 bg-white flex items-center justify-center">
              <p className="text-sm">Select a project from the left panel.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsLifecycleView;
