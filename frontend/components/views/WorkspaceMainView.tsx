import React from 'react';
import { MainViewType, Project, ProjectStage, ProjectTemplate, Task, TaskPriority, User } from '../../types';
import KanbanView from '../board/KanbanView';
import AnalyticsView from '../analytics/AnalyticsView';
import RoadmapView from '../RoadmapView';
import WorkloadView from '../WorkloadView';
import IntegrationHub from '../IntegrationHub';
import WorkflowBuilder from '../WorkflowBuilder';
import ProjectsLifecycleView from '../ProjectsLifecycleView';
import TemplatesView from '../templates/TemplatesView';

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
  onToggleTimer
}) => {
  switch (currentView) {
    case 'projects':
      return (
        <ProjectsLifecycleView
          currentUserRole={user.role}
          projects={projects}
          projectTasks={allProjectTasks}
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
      return <AnalyticsView tasks={tasks} projects={projects} allUsers={allUsers} />;
    case 'roadmap':
      return <RoadmapView tasks={tasks} projects={projects} />;
    case 'resources':
      return (
        <WorkloadView
          users={allUsers}
          tasks={tasks}
          onReassign={(taskId, userId) => handleUpdateTaskWithPolicy(taskId, { assigneeId: userId, assigneeIds: [userId] })}
        />
      );
    case 'integrations':
      return <IntegrationHub projects={projects} onUpdateProject={handleUpdateProject} />;
    case 'workflows':
      return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
            <WorkflowBuilder orgId={user.orgId} allUsers={allUsers} />
          </div>
        </div>
      );
    case 'templates':
      return (
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
