import React, { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Search, Trash2 } from 'lucide-react';
import { Project, Task, TaskStatus } from '../types';

interface ProjectsLifecycleViewProps {
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
}

type StatusFilter = 'All' | 'Active' | 'Archived' | 'Completed' | 'Deleted';

const ProjectsLifecycleView: React.FC<ProjectsLifecycleViewProps> = ({
  projects,
  projectTasks,
  activeProjectId,
  onRenameProject,
  onCompleteProject,
  onReopenProject,
  onArchiveProject,
  onRestoreProject,
  onDeleteProject,
  onPurgeProject
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const getProjectStatus = (project: Project): Exclude<StatusFilter, 'All'> => {
    if (project.isDeleted) return 'Deleted';
    if (project.isArchived) return 'Archived';
    if (project.isCompleted) return 'Completed';
    return 'Active';
  };

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((project) => (statusFilter === 'All' ? true : getProjectStatus(project) === statusFilter))
      .filter((project) => (q ? `${project.name} ${project.description}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [projects, query, statusFilter]);

  const focusedProject = projects.find((project) => project.id === focusedProjectId) || null;
  const focusedProjectTasks = useMemo(
    () => (focusedProject ? projectTasks.filter((task) => task.projectId === focusedProject.id) : []),
    [projectTasks, focusedProject]
  );

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
                          <div className={`w-3 h-3 rounded-full ${project.color} shrink-0 ${activeProjectId === project.id ? 'active-node ring-2 ring-[#76003f]/25 ring-offset-1 ring-offset-white' : ''}`} />
                          <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                        </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-600">{status}</span>
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
                  <p className="text-base font-semibold text-slate-900">{focusedProjectTasks.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">To do</p>
                  <p className="text-base font-semibold text-slate-900">{focusedProjectTasks.filter((t) => t.status === TaskStatus.TODO).length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">In progress</p>
                  <p className="text-base font-semibold text-slate-900">{focusedProjectTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-[11px] text-slate-500">Done</p>
                  <p className="text-base font-semibold text-slate-900">{focusedProjectTasks.filter((t) => t.status === TaskStatus.DONE).length}</p>
                </div>
              </div>

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
                    <button onClick={() => onArchiveProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 inline-flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" /> Archive</button>
                  </>
                )}
                {focusedProject.isArchived && <button onClick={() => onRestoreProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 inline-flex items-center gap-1.5"><ArchiveRestore className="w-3.5 h-3.5" /> Restore</button>}
                {focusedProject.isCompleted && <button onClick={() => onReopenProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">Reopen</button>}
                {!focusedProject.isDeleted ? (
                  <button onClick={() => onDeleteProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700 inline-flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                ) : (
                  <>
                    <button onClick={() => onRestoreProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">Restore</button>
                    <button onClick={() => onPurgeProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700">Purge</button>
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
