import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SecurityGroup, Task, Team, User, Project, TaskPriority, MainViewType } from './types';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
import { taskService } from './services/taskService';
import { workflowService } from './services/workflowService';
import { useTasks } from './hooks/useTasks';
import { useAccessControl } from './hooks/useAccessControl';
import { useProjectLifecycleActions } from './hooks/useProjectLifecycleActions';
import { useTaskPolicyActions } from './hooks/useTaskPolicyActions';
import { useWorkspaceBootstrap } from './hooks/useWorkspaceBootstrap';
import { useWorkspaceConnection } from './hooks/useWorkspaceConnection';
import { useActiveProjectPersistence } from './hooks/useActiveProjectPersistence';
import { useProjectManagement } from './hooks/useProjectManagement';
import { usePostSignupAdminSetup } from './hooks/usePostSignupAdminSetup';
import { settingsService, UserSettings } from './services/settingsService';
import { groupService } from './services/groupService';
import { teamService } from './services/teamService';

import WorkspaceLayout from './components/layout/WorkspaceLayout';
import GlobalModals from './components/modals/GlobalModals';
import PublicBoardView from './components/board/PublicBoardView';
import SelectionActionBar from './components/board/SelectionActionBar';
import Confetti from './components/ui/Confetti';
import { SettingsTabType } from './components/SettingsModal';
import DialogHost from './components/ui/DialogHost';
import { dialogService } from './services/dialogService';
import ToastHost from './components/ui/ToastHost';
import { toastService } from './services/toastService';
import { syncGuardService } from './services/syncGuardService';
import AuthRouter from './components/views/AuthRouter';
import WorkspaceMainView from './components/views/WorkspaceMainView';
import MoveBackReasonModal from './components/modals/MoveBackReasonModal';
import AdminSetupModal from './components/modals/AdminSetupModal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => userService.getCurrentUser());
  const [authView, setAuthView] = useState<'landing' | 'pricing' | 'support' | 'login' | 'register' | 'join'>('landing');
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const current = userService.getCurrentUser();
    return current ? userService.getUsers(current.orgId) : [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const current = userService.getCurrentUser();
    return current ? projectService.getProjects(current.orgId) : [];
  });
  const [groups, setGroups] = useState<SecurityGroup[]>(() => {
    const current = userService.getCurrentUser();
    return current ? groupService.getGroups(current.orgId) : [];
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    const current = userService.getCurrentUser();
    return current ? teamService.getTeams(current.orgId) : [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<MainViewType>('board');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [publicProject, setPublicProject] = useState<Project | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalTemplateId, setProjectModalTemplateId] = useState<string | null>(null);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isVoiceCommanderOpen, setIsVoiceCommanderOpen] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabType>('general');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [templateQuery, setTemplateQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(syncGuardService.hasPending());
  const [onlineCount, setOnlineCount] = useState(1);
  
  const toggleTaskSelection = useCallback((id: string) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]);
  }, []);

  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());

  const {
    tasks, categorizedTasks, aiLoading, aiSuggestions, activeTaskTitle,
    priorityFilter, statusFilter, tagFilter, assigneeFilter, projectFilter, searchQuery, dueFrom, dueTo, uniqueTags,
    confettiActive, setConfettiActive, setPriorityFilter, setStatusFilter,
    setTagFilter, setAssigneeFilter, setProjectFilter, setSearchQuery, setDueFrom, setDueTo, setAiSuggestions, refreshTasks,
    createTask, updateStatus, updateTask, addComment, moveTask, deleteTask,
    assistWithAI, applyAISuggestions, bulkUpdateTasks, bulkDeleteTasks, toggleTimer
  } = useTasks(user, activeProjectId || undefined);

  const refreshWorkspaceData = useCallback(() => {
    if (!user) return;
    setAllUsers(userService.getUsers(user.orgId));
    setProjects(projectService.getProjects(user.orgId));
    setGroups(groupService.getGroups(user.orgId));
    setTeams(teamService.getTeams(user.orgId));
    refreshTasks();
    setSelectedTask((prev) => {
      if (!prev) return null;
      const latest = taskService.getTaskById(prev.id);
      return latest || null;
    });
  }, [user, refreshTasks]);

  useWorkspaceBootstrap({
    setUser,
    setAllUsers,
    setProjects,
    refreshTasks,
    setPublicProject,
    setIsCommandPaletteOpen
  });

  useWorkspaceConnection({
    user,
    allUsers,
    tasks,
    projects,
    settings,
    setSettings,
    setAllUsers,
    setProjects,
    setSelectedTask,
    refreshTasks,
    setIsOffline,
    setHasPendingSync,
    setOnlineCount
  });

  useActiveProjectPersistence({
    user,
    projects,
    activeProjectId,
    currentView,
    setActiveProjectId
  });

  useEffect(() => {
    if (user) {
      refreshWorkspaceData();
    }
  }, [user, refreshWorkspaceData]);

  const { isAdminSetupOpen, setIsAdminSetupOpen, completeSetup } = usePostSignupAdminSetup(
    user,
    teams,
    groups,
    isSettingsOpen
  );

  const { canManageProject, canManageTask, hasTaskPermission, ensureTaskPermission } = useAccessControl({ user, projects, tasks });

  const {
    handleLogout,
    handleReset,
    handleOpenTaskFromNotification,
    handleUpdateProject,
    handleChangeProjectOwner
  } = useProjectManagement({
    user,
    allUsers,
    projects,
    refreshTasks,
    canManageProject,
    setProjects,
    setActiveProjectId,
    setSelectedTask,
    setCurrentView,
    setUser,
    setAuthView
  });

  const {
    handleRenameProject,
    handleArchiveProject,
    handleCompleteProject,
    handleReopenProject,
    handleRestoreProject,
    handleDeleteProject,
    handlePurgeProject,
    handleBulkLifecycleAction
  } = useProjectLifecycleActions({
    user,
    projects,
    activeProjectId,
    setActiveProjectId,
    setProjects,
    setSelectedTask,
    refreshTasks,
    canManageProject
  });

  const {
    moveBackRequest,
    moveBackReason,
    moveBackReasonError,
    setMoveBackReason,
    closeMoveBackPrompt,
    submitMoveBackReason,
    handleMoveTaskWithPolicy,
    handleStatusUpdateWithPolicy,
    handleUpdateTaskWithPolicy,
    handleDeleteTaskWithPolicy,
    handleToggleTimerWithPolicy,
    handleCommentOnTaskWithPolicy,
    handleCreateTaskWithPolicy
  } = useTaskPolicyActions({
    user,
    tasks,
    projects,
    ensureTaskPermission,
    canManageProject,
    moveTask,
    updateStatus,
    updateTask,
    addComment,
    deleteTask,
    toggleTimer,
    createTask
  });

  const handleAssistWithAIPolicy = useCallback(
    (task: Task) => {
      if (!canManageTask(task)) {
        toastService.warning('Permission denied', 'Only project owners or admins can run AI suggestions.');
        return;
      }
      assistWithAI(task);
    },
    [assistWithAI, canManageTask]
  );

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [activeProjectId, projects]);
  const allProjectTasks = useMemo(() => (user ? taskService.getAllTasksForOrg(user.orgId) : []), [user, tasks, projects]);
  const templates = useMemo(
    () =>
      workflowService
        .getTemplates()
        .filter((template) =>
          `${template.name} ${template.description}`.toLowerCase().includes(templateQuery.trim().toLowerCase())
        ),
    [templateQuery]
  );

  const themeClass = settings.theme === 'Dark' ? 'dark-theme' : settings.theme === 'Aurora' ? 'aurora-theme' : '';
  const visibleProjects = user
    ? (user.role === 'admin' ? projects : projects.filter((project) => project.members.includes(user.id)))
    : [];

  const handleOpenSettings = useCallback((tab: SettingsTabType) => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }, []);

  const canDeleteTaskById = useCallback((taskId: string) => hasTaskPermission(taskId, 'delete'), [hasTaskPermission]);
  const canToggleTaskTimerById = useCallback((taskId: string) => hasTaskPermission(taskId, 'complete'), [hasTaskPermission]);
  const canManageTaskById = useCallback((taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    return task ? canManageTask(task) : false;
  }, [tasks, canManageTask]);

  const handleDeleteOrganization = useCallback(() => {
    if (!user) return;
    const result = userService.deleteOrganization(user.id, user.orgId);
    if (!result.success) {
      toastService.error('Delete failed', result.error || 'Could not delete workspace.');
      return;
    }
    setIsSettingsOpen(false);
    setSelectedTask(null);
    setSelectedTaskIds([]);
    setProjects([]);
    setAllUsers([]);
    setGroups([]);
    setTeams([]);
    setActiveProjectId(null);
    setCurrentView('board');
    setUser(null);
    setAuthView('landing');
  }, [user]);

  const handleBulkPriority = useCallback((priority: TaskPriority) => {
    const allowed = selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'rename'));
    bulkUpdateTasks(allowed, { priority });
    toastService.success('Priorities updated', `${allowed.length} task${allowed.length > 1 ? 's updated' : ' updated'}.`);
    setSelectedTaskIds([]);
  }, [bulkUpdateTasks, ensureTaskPermission, selectedTaskIds]);

  const handleBulkStatus = useCallback((status: string) => {
    bulkUpdateTasks(
      selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'complete')),
      { status }
    );
    setSelectedTaskIds([]);
  }, [bulkUpdateTasks, ensureTaskPermission, selectedTaskIds]);

  const handleBulkAssignee = useCallback((assigneeId: string) => {
    bulkUpdateTasks(
      selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'assign')),
      { assigneeId, assigneeIds: [assigneeId] }
    );
    setSelectedTaskIds([]);
  }, [bulkUpdateTasks, ensureTaskPermission, selectedTaskIds]);

  const handleBulkDelete = useCallback(async () => {
    const confirmed = await dialogService.confirm('Delete selected tasks?', { title: 'Bulk delete', confirmText: 'Delete', danger: true });
    if (!confirmed) return;
    bulkDeleteTasks(selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'delete')));
    setSelectedTaskIds([]);
  }, [bulkDeleteTasks, ensureTaskPermission, selectedTaskIds]);

  const handleAddProjectFromModal = useCallback((
    name: string,
    description: string,
    color: string,
    members: string[],
    templateId?: string,
    aiGeneratedTasks?: any[],
    meta?: { startDate?: number; endDate?: number; budgetCost?: number; scopeSummary?: string; scopeSize?: number }
  ) => {
    if (!user) return;
    const proj = projectService.createProject(user.orgId, name, description, color, members, meta, user.id);
    setProjects([...projects, proj]);
    setActiveProjectId(proj.id);
    setIsProjectModalOpen(false);
    setProjectModalTemplateId(null);
    if (templateId) {
      const template = workflowService.getTemplates().find((item) => item.id === templateId);
      template?.tasks.forEach((templateTask) =>
        handleCreateTaskWithPolicy(templateTask.title, templateTask.description, templateTask.priority, templateTask.tags, undefined, proj.id)
      );
    }
    if (aiGeneratedTasks && aiGeneratedTasks.length > 0) {
      aiGeneratedTasks.forEach((generatedTask) =>
        handleCreateTaskWithPolicy(generatedTask.title, generatedTask.description, generatedTask.priority, generatedTask.tags || ['AI-Ingested'], undefined, proj.id)
      );
    }
  }, [handleCreateTaskWithPolicy, projects, setProjects, user]);

  const handleUpdateTaskFromModal = useCallback((taskId: string, updates: any) => {
    handleUpdateTaskWithPolicy(taskId, updates);
    if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, ...updates });
  }, [handleUpdateTaskWithPolicy, selectedTask]);

  const handleCommentOnTaskFromModal = useCallback((taskId: string, text: string) => {
    handleCommentOnTaskWithPolicy(taskId, text);
    const updatedTask = taskService.getTaskById(taskId);
    if (updatedTask) setSelectedTask(updatedTask);
  }, [handleCommentOnTaskWithPolicy]);

  const handleGeneratedTasksFromVision = useCallback((generated: any[]) => {
    generated.forEach((item) =>
      handleCreateTaskWithPolicy(item.title, item.description, TaskPriority.MEDIUM, ['Vision Scan'], undefined, activeProjectId || 'p1')
    );
  }, [activeProjectId, handleCreateTaskWithPolicy]);

  if (publicProject) {
    const projectTasks = tasks.filter((task) => task.projectId === publicProject.id);
    return <PublicBoardView project={publicProject} tasks={projectTasks} />;
  }

  if (!user) {
    return <AuthRouter authView={authView} setAuthView={setAuthView} onAuthSuccess={setUser} />;
  }

  return (
    <WorkspaceLayout user={user} allUsers={allUsers} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} projects={visibleProjects} activeProjectId={activeProjectId} currentView={currentView} themeClass={themeClass} compactMode={settings.compactMode} onLogout={handleLogout} onNewTask={() => setIsModalOpen(true)} onReset={handleReset} onRefreshData={refreshWorkspaceData} onOpenSettings={handleOpenSettings} onOpenTaskFromNotification={handleOpenTaskFromNotification} onCloseSidebar={() => setIsSidebarOpen(false)} onProjectSelect={setActiveProjectId} onViewChange={setCurrentView} onOpenCommandCenter={() => setIsCommandCenterOpen(true)} onOpenVoiceCommander={() => setIsVoiceCommanderOpen(true)} onOpenVisionModal={() => setIsVisionModalOpen(true)} onAddProject={() => { setProjectModalTemplateId(null); setIsProjectModalOpen(true); }} onUpdateProject={handleUpdateProject} onCompleteProject={handleCompleteProject} onArchiveProject={handleArchiveProject} onDeleteProject={handleDeleteProject} onlineCount={onlineCount} isOnline={!isOffline}>
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />
      <WorkspaceMainView
        currentView={currentView}
        user={user}
        tasks={tasks}
        projects={projects}
        allUsers={allUsers}
        allProjectTasks={allProjectTasks}
        activeProject={activeProject}
        visibleProjects={visibleProjects}
        categorizedTasks={categorizedTasks}
        selectedTaskIds={selectedTaskIds}
        settingsCompactMode={settings.compactMode}
        templateQuery={templateQuery}
        templates={templates}
        searchQuery={searchQuery}
        projectFilter={projectFilter}
        dueFrom={dueFrom}
        dueTo={dueTo}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        tagFilter={tagFilter}
        assigneeFilter={assigneeFilter}
        uniqueTags={uniqueTags}
        setTemplateQuery={setTemplateQuery}
        setProjectModalTemplateId={setProjectModalTemplateId}
        setIsProjectModalOpen={setIsProjectModalOpen}
        setStatusFilter={setStatusFilter}
        setPriorityFilter={setPriorityFilter}
        setTagFilter={setTagFilter}
        setAssigneeFilter={setAssigneeFilter}
        setSearchQuery={setSearchQuery}
        setProjectFilter={setProjectFilter}
        setDueFrom={setDueFrom}
        setDueTo={setDueTo}
        setSelectedTaskIds={setSelectedTaskIds}
        toggleTaskSelection={toggleTaskSelection}
        handleDeleteTaskWithPolicy={handleDeleteTaskWithPolicy}
        handleStatusUpdateWithPolicy={handleStatusUpdateWithPolicy}
        handleMoveTaskWithPolicy={handleMoveTaskWithPolicy}
        assistWithAI={handleAssistWithAIPolicy}
        setSelectedTask={setSelectedTask}
        setIsModalOpen={setIsModalOpen}
        refreshTasks={refreshTasks}
        handleUpdateProject={handleUpdateProject}
        handleRenameProject={handleRenameProject}
        handleCompleteProject={handleCompleteProject}
        handleReopenProject={handleReopenProject}
        handleArchiveProject={handleArchiveProject}
        handleRestoreProject={handleRestoreProject}
        handleDeleteProject={handleDeleteProject}
        handlePurgeProject={handlePurgeProject}
        handleBulkLifecycleAction={handleBulkLifecycleAction}
        handleUpdateTaskWithPolicy={handleUpdateTaskWithPolicy}
        onToggleTimer={handleToggleTimerWithPolicy}
        canDeleteTask={canDeleteTaskById}
        canManageTask={canManageTaskById}
        canToggleTaskTimer={canToggleTaskTimerById}
      />
      {(isOffline || hasPendingSync) && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[200] rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm">
          {isOffline ? 'Offline: local changes queued' : 'Local changes pending sync'}
        </div>
      )}
      <SelectionActionBar
        selectedCount={selectedTaskIds.length}
        allUsers={allUsers}
        onClear={() => setSelectedTaskIds([])}
        onBulkPriority={handleBulkPriority}
        onBulkStatus={handleBulkStatus}
        onBulkAssignee={handleBulkAssignee}
        onBulkDelete={handleBulkDelete}
      />
      <GlobalModals user={user} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} isProjectModalOpen={isProjectModalOpen} setIsProjectModalOpen={setIsProjectModalOpen} projectModalTemplateId={projectModalTemplateId} setProjectModalTemplateId={setProjectModalTemplateId} isCommandCenterOpen={isCommandCenterOpen} setIsCommandCenterOpen={setIsCommandCenterOpen} isVoiceCommanderOpen={isVoiceCommanderOpen} setIsVoiceCommanderOpen={setIsVoiceCommanderOpen} isVisionModalOpen={isVisionModalOpen} setIsVisionModalOpen={setIsVisionModalOpen} isCommandPaletteOpen={isCommandPaletteOpen} setIsCommandPaletteOpen={setIsCommandPaletteOpen} isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} settingsTab={settingsTab} selectedTask={selectedTask} setSelectedTask={setSelectedTask} aiSuggestions={aiSuggestions} setAiSuggestions={setAiSuggestions} aiLoading={aiLoading} activeTaskTitle={activeTaskTitle} tasks={tasks} projectTasks={allProjectTasks} projects={projects} activeProjectId={activeProjectId} aiEnabled={settings.aiSuggestions} canAssignMembers={Boolean(activeProject && canManageProject(activeProject))} canManageTask={canManageTaskById} createTask={handleCreateTaskWithPolicy}
        handleAddProject={handleAddProjectFromModal}
        handleUpdateTask={handleUpdateTaskFromModal}
        handleCommentOnTask={handleCommentOnTaskFromModal}
        deleteTask={handleDeleteTaskWithPolicy}
        canDeleteTask={canDeleteTaskById}
        canToggleTaskTimer={canToggleTaskTimerById}
        onToggleTimer={handleToggleTimerWithPolicy}
        applyAISuggestions={applyAISuggestions}
        handleGeneratedTasks={handleGeneratedTasksFromVision}
        setActiveProjectId={setActiveProjectId}
        refreshTasks={refreshTasks}
        onRenameProject={handleRenameProject}
        onCompleteProject={handleCompleteProject}
        onReopenProject={handleReopenProject}
        onArchiveProject={handleArchiveProject}
        onRestoreProject={handleRestoreProject}
        onDeleteProject={handleDeleteProject}
        onPurgeProject={handlePurgeProject}
        onChangeProjectOwner={handleChangeProjectOwner}
        onDeleteOrganization={handleDeleteOrganization}
        onUserUpdated={setUser}
      />
      <MoveBackReasonModal
        isOpen={Boolean(moveBackRequest)}
        reason={moveBackReason}
        reasonError={moveBackReasonError}
        onReasonChange={setMoveBackReason}
        onCancel={closeMoveBackPrompt}
        onSubmit={submitMoveBackReason}
      />
      <AdminSetupModal
        isOpen={isAdminSetupOpen}
        user={user}
        allUsers={allUsers}
        teams={teams}
        groups={groups}
        onTeamsChanged={setTeams}
        onGroupsChanged={setGroups}
        onOpenSettingsTab={(tab) => {
          setIsAdminSetupOpen(false);
          handleOpenSettings(tab);
        }}
        onComplete={() => {
          completeSetup();
          refreshWorkspaceData();
        }}
      />
      <DialogHost />
      <ToastHost />
    </WorkspaceLayout>
  );
};

export default App;
