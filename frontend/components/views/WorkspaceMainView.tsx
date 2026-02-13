import React, { Suspense, lazy, useMemo } from 'react';
import { MainViewType, Project, ProjectStage, ProjectTemplate, Task, TaskPriority, User } from '../../types';
import KanbanView from '../board/KanbanView';

const AnalyticsView = lazy(() => import('../analytics/AnalyticsView'));
const RoadmapView = lazy(() => import('../RoadmapView'));
const WorkloadView = lazy(() => import('../WorkloadView'));
const IntegrationHub = lazy(() => import('../IntegrationHub'));
const WorkflowBuilder = lazy(() => import('../WorkflowBuilder'));
const ProjectsLifecycleView = lazy(() => import('../ProjectsLifecycleView'));
const TemplatesView = lazy(() => import('../templates/TemplatesView'));

interface WorkspaceMainViewProps {
  currentView: MainViewType;
  user: User;
  tasks: Task[];
  projects: Project[];
  allUsers: User[];
  allProjectTasks: Task[];
  activeProject?: Project;
  visibleProjects: Project[];
  categorizedTasks: Record<string, Task[]>;
  selectedTaskIds: string[];
  settingsCompactMode: boolean;
  templateQuery: string;
  templates: ProjectTemplate[];
  searchQuery: string;
  projectFilter: string | 'All';
  dueFrom?: number;
  dueTo?: number;
  statusFilter: string | 'All';
  priorityFilter: TaskPriority | 'All';
  tagFilter: string | 'All';
  assigneeFilter: string | 'All';
  uniqueTags: string[];
  setTemplateQuery: (value: string) => void;
  setProjectModalTemplateId: (value: string | null) => void;
  setIsProjectModalOpen: (value: boolean) => void;
  setStatusFilter: (s: string | 'All') => void;
  setPriorityFilter: (p: TaskPriority | 'All') => void;
  setTagFilter: (t: string) => void;
  setAssigneeFilter: (a: string) => void;
  setSearchQuery: (value: string) => void;
  setProjectFilter: (value: string | 'All') => void;
  setDueFrom: (value?: number) => void;
  setDueTo: (value?: number) => void;
  setSelectedTaskIds: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  handleDeleteTaskWithPolicy: (id: string) => void;
  handleStatusUpdateWithPolicy: (id: string, status: string) => void;
  handleMoveTaskWithPolicy: (taskId: string, targetStatus: string, targetTaskId?: string) => void;
  assistWithAI: (task: Task) => void;
  setSelectedTask: (task: Task | null) => void;
  setIsModalOpen: (open: boolean) => void;
  refreshTasks: () => void;
  handleUpdateProject: (id: string, updates: Partial<Project>) => void;
  handleRenameProject: (id: string, name: string) => void;
  handleCompleteProject: (id: string) => void;
  handleReopenProject: (id: string) => void;
  handleArchiveProject: (id: string) => void;
  handleRestoreProject: (id: string) => void;
  handleDeleteProject: (id: string) => void;
  handlePurgeProject: (id: string) => void;
  handleBulkLifecycleAction: (action: 'complete' | 'archive' | 'delete' | 'restore' | 'reopen' | 'purge', ids: string[]) => void;
  handleUpdateTaskWithPolicy: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>) => void;
  onToggleTimer?: (id: string) => void;
  canDeleteTask: (taskId: string) => boolean;
  canManageTask: (taskId: string) => boolean;
  canToggleTaskTimer: (taskId: string) => boolean;
}

const WorkspaceMainView: React.FC<WorkspaceMainViewProps> = ({
  currentView,
  user,
  tasks,
  projects,
  allUsers,
  allProjectTasks,
  activeProject,
  visibleProjects,
  categorizedTasks,
  selectedTaskIds,
  settingsCompactMode,
  templateQuery,
  templates,
  searchQuery,
  projectFilter,
  dueFrom,
  dueTo,
  statusFilter,
  priorityFilter,
  tagFilter,
  assigneeFilter,
  uniqueTags,
  setTemplateQuery,
  setProjectModalTemplateId,
  setIsProjectModalOpen,
  setStatusFilter,
  setPriorityFilter,
  setTagFilter,
  setAssigneeFilter,
  setSearchQuery,
  setProjectFilter,
  setDueFrom,
  setDueTo,
  setSelectedTaskIds,
  toggleTaskSelection,
  handleDeleteTaskWithPolicy,
  handleStatusUpdateWithPolicy,
  handleMoveTaskWithPolicy,
  assistWithAI,
  setSelectedTask,
  setIsModalOpen,
  refreshTasks,
  handleUpdateProject,
  handleRenameProject,
  handleCompleteProject,
  handleReopenProject,
  handleArchiveProject,
  handleRestoreProject,
  handleDeleteProject,
  handlePurgeProject,
  handleBulkLifecycleAction,
  handleUpdateTaskWithPolicy,
  onToggleTimer,
  canDeleteTask,
  canManageTask,
  canToggleTaskTimer
}) => {
  const withLazy = (node: React.ReactNode) => (
    <Suspense fallback={<div className="flex-1 p-6 text-sm text-slate-500">Loading view...</div>}>{node}</Suspense>
  );

  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);
  const scopedTasks = useMemo(
    () => tasks.filter((task) => task.projectId === 'general' || visibleProjectIds.has(task.projectId)),
    [tasks, visibleProjectIds]
  );
  const scopedProjectTasks = useMemo(
    () => allProjectTasks.filter((task) => task.projectId === 'general' || visibleProjectIds.has(task.projectId)),
    [allProjectTasks, visibleProjectIds]
  );
  const scopedUsers = useMemo(() => {
    const memberIds = new Set<string>([user.id]);
    visibleProjects.forEach((project) => project.members.forEach((memberId) => memberIds.add(memberId)));
    scopedTasks.forEach((task) => {
      if (task.assigneeId) memberIds.add(task.assigneeId);
      (task.assigneeIds || []).forEach((assigneeId) => memberIds.add(assigneeId));
    });
    return allUsers.filter((member) => memberIds.has(member.id));
  }, [allUsers, scopedTasks, user.id, visibleProjects]);

  switch (currentView) {
    case 'projects':
      return withLazy(
        <ProjectsLifecycleView
          currentUserRole={user.role}
          currentUserId={user.id}
          projects={visibleProjects}
          projectTasks={scopedProjectTasks}
          activeProjectId={activeProject?.id || null}
          onRenameProject={handleRenameProject}
          onCompleteProject={handleCompleteProject}
          onReopenProject={handleReopenProject}
          onArchiveProject={handleArchiveProject}
          onRestoreProject={handleRestoreProject}
          onDeleteProject={handleDeleteProject}
          onPurgeProject={handlePurgeProject}
          onBulkLifecycleAction={handleBulkLifecycleAction}
        />
      );
    case 'analytics':
      return withLazy(<AnalyticsView tasks={scopedTasks} projects={visibleProjects} allUsers={scopedUsers} />);
    case 'roadmap':
      return withLazy(<RoadmapView tasks={scopedTasks} projects={visibleProjects} />);
    case 'resources':
      return withLazy(
        <WorkloadView
          users={scopedUsers}
          tasks={scopedTasks}
          onReassign={(taskId, userId) => handleUpdateTaskWithPolicy(taskId, { assigneeId: userId, assigneeIds: [userId] })}
        />
      );
    case 'integrations':
      return withLazy(<IntegrationHub projects={projects} onUpdateProject={handleUpdateProject} />);
    case 'workflows':
      return withLazy(
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
            <WorkflowBuilder orgId={user.orgId} allUsers={allUsers} />
          </div>
        </div>
      );
    case 'templates':
      return withLazy(
        <TemplatesView
          templateQuery={templateQuery}
          setTemplateQuery={setTemplateQuery}
          templates={templates}
          onUseTemplate={(templateId) => {
            setProjectModalTemplateId(templateId);
            setIsProjectModalOpen(true);
          }}
        />
      );
    default:
      return (
        <KanbanView
          searchQuery={searchQuery}
          projectFilter={projectFilter}
          projects={visibleProjects}
          dueFrom={dueFrom}
          dueTo={dueTo}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          tagFilter={tagFilter}
          assigneeFilter={assigneeFilter}
          uniqueTags={uniqueTags}
          allUsers={allUsers}
          currentUser={user}
          activeProject={activeProject}
          categorizedTasks={categorizedTasks}
          selectedTaskIds={selectedTaskIds}
          compactMode={settingsCompactMode}
          setStatusFilter={setStatusFilter}
          setPriorityFilter={setPriorityFilter}
          setTagFilter={setTagFilter}
          setAssigneeFilter={setAssigneeFilter}
          setProjectFilter={setProjectFilter}
          setSearchQuery={setSearchQuery}
          setDueFrom={setDueFrom}
          setDueTo={setDueTo}
          setSelectedTaskIds={setSelectedTaskIds}
          toggleTaskSelection={toggleTaskSelection}
          deleteTask={handleDeleteTaskWithPolicy}
          canDeleteTask={canDeleteTask}
          canUseTaskAI={canManageTask}
          canToggleTaskTimer={canToggleTaskTimer}
          onToggleTimer={onToggleTimer}
          handleStatusUpdate={handleStatusUpdateWithPolicy}
          moveTask={handleMoveTaskWithPolicy}
          assistWithAI={assistWithAI}
          setSelectedTask={setSelectedTask}
          setIsModalOpen={setIsModalOpen}
          refreshTasks={refreshTasks}
          onUpdateProjectStages={(projectId, stages: ProjectStage[]) => handleUpdateProject(projectId, { stages })}
        />
      );
  }
};

export default WorkspaceMainView;
