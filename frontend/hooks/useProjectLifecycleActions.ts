import { Dispatch, SetStateAction, useCallback } from 'react';
import { Project, Task, User } from '../types';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { dialogService } from '../services/dialogService';
import { toastService } from '../services/toastService';

interface UseProjectLifecycleActionsParams {
  user: User | null;
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: Dispatch<SetStateAction<string | null>>;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  refreshTasks: () => void;
  canManageProject: (project?: Project) => boolean;
}

export const useProjectLifecycleActions = ({
  user,
  projects,
  activeProjectId,
  setActiveProjectId,
  setProjects,
  setSelectedTask,
  refreshTasks,
  canManageProject
}: UseProjectLifecycleActionsParams) => {
  const handleRenameProject = useCallback((id: string, name: string) => {
    if (!user) return;
    const target = projects.find((project) => project.id === id);
    if (!target) return;
    if (target.isCompleted || target.isArchived || target.isDeleted) {
      toastService.warning('Rename blocked', 'Only active projects can be renamed.');
      return;
    }
    if (!canManageProject(target)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can rename projects.');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) return;
    projectService.renameProject(id, trimmed);
    setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, name: trimmed } : project)));
    toastService.success('Project renamed', `"${trimmed}" is now the project name.`);
  }, [user, projects, canManageProject, setProjects]);

  const handleArchiveProject = useCallback((id: string) => {
    if (!user) return;
    const project = projects.find((item) => item.id === id);
    if (!canManageProject(project)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can archive projects.');
      return;
    }
    dialogService
      .confirm(`Archive "${project?.name || 'this project'}"?`, {
        title: 'Archive project',
        description: 'Archived projects are removed from the active board until restored.',
        confirmText: 'Archive',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        projectService.archiveProject(id);
        setProjects((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, isArchived: true, archivedAt: Date.now(), isCompleted: false, completedAt: undefined, isDeleted: false, deletedAt: undefined }
              : item
          )
        );
        if (activeProjectId === id) setActiveProjectId(null);
        refreshTasks();
        toastService.info('Project archived', project ? `"${project.name}" moved to archived.` : 'Project moved to archived.');
      });
  }, [user, projects, canManageProject, setProjects, activeProjectId, setActiveProjectId, refreshTasks]);

  const handleCompleteProject = useCallback((id: string) => {
    if (!user) return;
    const target = projects.find((project) => project.id === id);
    if (!target) return;
    if (!canManageProject(target)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can complete projects.');
      return;
    }
    const project = projects.find((item) => item.id === id);
    dialogService
      .confirm(`Mark "${project?.name || 'this project'}" as completed?`, {
        title: 'Complete project',
        description: 'Completed projects move out of the active board and into completed state.',
        confirmText: 'Complete',
        danger: false
      })
      .then((confirmed) => {
        if (!confirmed) return;
        projectService.completeProject(id);
        setProjects((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, isCompleted: true, completedAt: Date.now(), isArchived: false, archivedAt: undefined, isDeleted: false, deletedAt: undefined }
              : item
          )
        );
        if (activeProjectId === id) setActiveProjectId(null);
        refreshTasks();
        toastService.success('Project completed', project ? `"${project.name}" marked complete.` : 'Project marked complete.');
      });
  }, [user, projects, canManageProject, setProjects, activeProjectId, setActiveProjectId, refreshTasks]);

  const handleReopenProject = useCallback((id: string) => {
    if (!user) return;
    const target = projects.find((project) => project.id === id);
    if (!target) return;
    if (!canManageProject(target)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can reopen projects.');
      return;
    }
    projectService.reopenProject(id);
    setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, isCompleted: false, completedAt: undefined } : project)));
    refreshTasks();
    const project = projects.find((item) => item.id === id);
    toastService.info('Project reopened', project ? `"${project.name}" is active again.` : 'Project is active again.');
  }, [user, projects, canManageProject, setProjects, refreshTasks]);

  const handleRestoreProject = useCallback((id: string) => {
    if (!user) return;
    const target = projects.find((project) => project.id === id);
    if (!canManageProject(target)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can restore projects.');
      return;
    }
    projectService.restoreProject(id);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              isArchived: false,
              archivedAt: undefined,
              isCompleted: false,
              completedAt: undefined,
              isDeleted: false,
              deletedAt: undefined
            }
          : project
      )
    );
    refreshTasks();
    const project = projects.find((item) => item.id === id);
    toastService.success('Project restored', project ? `"${project.name}" restored to active.` : 'Project restored to active.');
  }, [user, projects, canManageProject, setProjects, refreshTasks]);

  const handleDeleteProject = useCallback((id: string) => {
    if (!user) return;
    const project = projects.find((item) => item.id === id);
    if (!canManageProject(project)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can delete projects.');
      return;
    }
    dialogService
      .confirm(`Move "${project?.name || 'this project'}" to deleted?`, {
        title: 'Delete project',
        description: 'This keeps project data in Deleted until permanently purged.',
        confirmText: 'Delete',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        projectService.deleteProject(id);
        setProjects((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, isDeleted: true, deletedAt: Date.now(), isArchived: false, archivedAt: undefined, isCompleted: false, completedAt: undefined }
              : item
          )
        );
        if (activeProjectId === id) setActiveProjectId(null);
        setSelectedTask((prev) => (prev?.projectId === id ? null : prev));
        refreshTasks();
        toastService.warning('Project deleted', project ? `"${project.name}" moved to deleted.` : 'Project moved to deleted.');
      });
  }, [user, projects, canManageProject, setProjects, activeProjectId, setActiveProjectId, setSelectedTask, refreshTasks]);

  const handlePurgeProject = useCallback((id: string) => {
    if (!user) return;
    const target = projects.find((project) => project.id === id);
    if (!canManageProject(target)) {
      toastService.warning('Permission denied', 'Only admins or the project creator can purge projects.');
      return;
    }
    projectService.purgeProject(id);
    taskService.deleteTasksByProject(user.id, user.orgId, id);
    setProjects((prev) => prev.filter((project) => project.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    setSelectedTask((prev) => (prev?.projectId === id ? null : prev));
    refreshTasks();
    toastService.warning('Project permanently deleted', 'Project and related tasks were removed.');
  }, [user, projects, canManageProject, setProjects, activeProjectId, setActiveProjectId, setSelectedTask, refreshTasks]);

  const handleBulkLifecycleAction = useCallback((action: 'archive' | 'complete' | 'delete' | 'restore', ids: string[]) => {
    ids.forEach((id) => {
      if (action === 'archive') handleArchiveProject(id);
      if (action === 'complete') handleCompleteProject(id);
      if (action === 'delete') handleDeleteProject(id);
      if (action === 'restore') handleRestoreProject(id);
    });
  }, [handleArchiveProject, handleCompleteProject, handleDeleteProject, handleRestoreProject]);

  return {
    handleRenameProject,
    handleArchiveProject,
    handleCompleteProject,
    handleReopenProject,
    handleRestoreProject,
    handleDeleteProject,
    handlePurgeProject,
    handleBulkLifecycleAction
  };
};
