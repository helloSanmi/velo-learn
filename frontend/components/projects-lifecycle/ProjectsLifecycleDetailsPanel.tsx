import React from 'react';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { Project, Task } from '../../types';

interface ProjectsLifecycleDetailsPanelProps {
  currentUserRole?: 'admin' | 'member' | 'guest';
  focusedProject: Project;
  focusedProjectTasks: Task[];
  focusedProjectStats: {
    total: number;
    done: number;
    backlog: number;
    inProgress: number;
    completionRate: number;
    estimatedSpent?: number;
    scopeGap?: number;
  } | null;
  projectStatus: string;
  editingProjectId: string | null;
  editingProjectName: string;
  setEditingProjectId: (id: string | null) => void;
  setEditingProjectName: (name: string) => void;
  submitProjectRename: () => void;
  onCompleteProject: (id: string) => void;
  onReopenProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onRestoreProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onPurgeProject: (id: string) => void;
}

const ProjectsLifecycleDetailsPanel: React.FC<ProjectsLifecycleDetailsPanelProps> = ({
  currentUserRole,
  focusedProject,
  focusedProjectTasks,
  focusedProjectStats,
  projectStatus,
  editingProjectId,
  editingProjectName,
  setEditingProjectId,
  setEditingProjectName,
  submitProjectRename,
  onCompleteProject,
  onReopenProject,
  onArchiveProject,
  onRestoreProject,
  onDeleteProject,
  onPurgeProject
}) => {
  return (
    <section className="border border-slate-200 rounded-xl bg-white p-4 md:p-5 flex flex-col min-h-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{projectStatus}</p>
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
            {focusedProject.startDate ? new Date(focusedProject.startDate).toLocaleDateString() : 'No start'} -{' '}
            {focusedProject.endDate ? new Date(focusedProject.endDate).toLocaleDateString() : 'No end'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2 bg-white">
          <p className="text-[11px] text-slate-500">Planned / Est. spent</p>
          <p className="text-sm font-semibold text-slate-900">
            {focusedProject.budgetCost ? `$${focusedProject.budgetCost.toLocaleString()}` : 'No budget'} /{' '}
            {focusedProjectStats?.estimatedSpent ? `$${Math.round(focusedProjectStats.estimatedSpent).toLocaleString()}` : '-'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2 bg-white">
          <p className="text-[11px] text-slate-500">Scope target</p>
          <p className="text-sm font-semibold text-slate-900">
            {typeof focusedProject.scopeSize === 'number' ? `${focusedProject.scopeSize} tasks` : 'Not set'}
            {typeof focusedProjectStats?.scopeGap === 'number'
              ? ` (${focusedProjectStats.scopeGap >= 0 ? '+' : ''}${focusedProjectStats.scopeGap} gap)`
              : ''}
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
        {!focusedProject.isDeleted && !focusedProject.isArchived && !focusedProject.isCompleted && editingProjectId === focusedProject.id ? (
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
            <button onClick={submitProjectRename} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
              Save
            </button>
          </>
        ) : !focusedProject.isDeleted && !focusedProject.isArchived && !focusedProject.isCompleted ? (
          <button
            onClick={() => {
              setEditingProjectId(focusedProject.id);
              setEditingProjectName(focusedProject.name);
            }}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700"
          >
            Rename
          </button>
        ) : null}

        {!focusedProject.isDeleted && !focusedProject.isArchived && !focusedProject.isCompleted && (
          <>
            <button onClick={() => onCompleteProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
              Complete
            </button>
            <button
              disabled={currentUserRole !== 'admin'}
              onClick={() => onArchiveProject(focusedProject.id)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </>
        )}
        {focusedProject.isArchived && (
          <button
            disabled={currentUserRole !== 'admin'}
            onClick={() => onRestoreProject(focusedProject.id)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <ArchiveRestore className="w-3.5 h-3.5" /> Restore
          </button>
        )}
        {focusedProject.isCompleted && (
          <button onClick={() => onReopenProject(focusedProject.id)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
            Reopen
          </button>
        )}
        {!focusedProject.isDeleted ? (
          <button
            disabled={currentUserRole !== 'admin'}
            onClick={() => onDeleteProject(focusedProject.id)}
            className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700 inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        ) : (
          <>
            <button
              disabled={currentUserRole !== 'admin'}
              onClick={() => onRestoreProject(focusedProject.id)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-40"
            >
              Restore
            </button>
            <button
              disabled={currentUserRole !== 'admin'}
              onClick={() => onPurgeProject(focusedProject.id)}
              className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700 disabled:opacity-40"
            >
              Purge
            </button>
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
                  <p className="text-xs text-slate-500 mt-0.5">
                    {task.status.replace('-', ' ')} • {task.priority}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectsLifecycleDetailsPanel;
