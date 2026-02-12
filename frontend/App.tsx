import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, User, Project, TaskPriority, MainViewType } from './types';
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
import { settingsService, UserSettings } from './services/settingsService';

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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => userService.getCurrentUser());
  const [authView, setAuthView] = useState<'landing' | 'pricing' | 'support' | 'login' | 'register'>('landing');
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const current = userService.getCurrentUser();
    return current ? userService.getUsers(current.orgId) : [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const current = userService.getCurrentUser();
    return current ? projectService.getProjects(current.orgId) : [];
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

  if (publicProject) {
      const projectTasks = tasks.filter(t => t.projectId === publicProject.id);
      return <PublicBoardView project={publicProject} tasks={projectTasks} />;
  }

  if (!user) {
    return <AuthRouter authView={authView} setAuthView={setAuthView} onAuthSuccess={setUser} />;
  }

  const themeClass = settings.theme === 'Dark' ? 'dark-theme' : settings.theme === 'Aurora' ? 'aurora-theme' : '';
  const visibleProjects = user.role === 'admin'
    ? projects
    : projects.filter((project) => project.members.includes(user.id));

  return (
    <WorkspaceLayout user={user} allUsers={allUsers} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} projects={visibleProjects} activeProjectId={activeProjectId} currentView={currentView} themeClass={themeClass} compactMode={settings.compactMode} onLogout={handleLogout} onNewTask={() => setIsModalOpen(true)} onReset={handleReset} onRefreshData={refreshWorkspaceData} onOpenSettings={(tab) => { setSettingsTab(tab); setIsSettingsOpen(true); }} onOpenTaskFromNotification={handleOpenTaskFromNotification} onCloseSidebar={() => setIsSidebarOpen(false)} onProjectSelect={setActiveProjectId} onViewChange={setCurrentView} onOpenCommandCenter={() => setIsCommandCenterOpen(true)} onOpenVoiceCommander={() => setIsVoiceCommanderOpen(true)} onOpenVisionModal={() => setIsVisionModalOpen(true)} onAddProject={() => { setProjectModalTemplateId(null); setIsProjectModalOpen(true); }} onUpdateProject={handleUpdateProject} onCompleteProject={handleCompleteProject} onArchiveProject={handleArchiveProject} onDeleteProject={handleDeleteProject} onlineCount={onlineCount} isOnline={!isOffline}>
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
        canDeleteTask={(taskId) => hasTaskPermission(taskId, 'delete')}
        canManageTask={(taskId) => {
          const task = tasks.find((item) => item.id === taskId);
          return task ? canManageTask(task) : false;
        }}
        canToggleTaskTimer={(taskId) => hasTaskPermission(taskId, 'complete')}
      />
      {(isOffline || hasPendingSync) && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[200] rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm">
          {isOffline ? 'Offline: local changes queued' : 'Local changes pending sync'}
        </div>
      )}
      <SelectionActionBar selectedCount={selectedTaskIds.length} allUsers={allUsers} onClear={() => setSelectedTaskIds([])} onBulkPriority={(p) => { const allowed = selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'rename')); bulkUpdateTasks(allowed, { priority: p }); toastService.success('Priorities updated', `${allowed.length} task${allowed.length > 1 ? 's updated' : ' updated'}.`); setSelectedTaskIds([]); }} onBulkStatus={(s) => { bulkUpdateTasks(selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'complete')), { status: s }); setSelectedTaskIds([]); }} onBulkAssignee={(u) => { bulkUpdateTasks(selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'assign')), { assigneeId: u, assigneeIds: [u] }); setSelectedTaskIds([]); }} onBulkDelete={async () => { const confirmed = await dialogService.confirm('Delete selected tasks?', { title: 'Bulk delete', confirmText: 'Delete', danger: true }); if (confirmed) { bulkDeleteTasks(selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'delete'))); setSelectedTaskIds([]); } }} />
      <GlobalModals user={user} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} isProjectModalOpen={isProjectModalOpen} setIsProjectModalOpen={setIsProjectModalOpen} projectModalTemplateId={projectModalTemplateId} setProjectModalTemplateId={setProjectModalTemplateId} isCommandCenterOpen={isCommandCenterOpen} setIsCommandCenterOpen={setIsCommandCenterOpen} isVoiceCommanderOpen={isVoiceCommanderOpen} setIsVoiceCommanderOpen={setIsVoiceCommanderOpen} isVisionModalOpen={isVisionModalOpen} setIsVisionModalOpen={setIsVisionModalOpen} isCommandPaletteOpen={isCommandPaletteOpen} setIsCommandPaletteOpen={setIsCommandPaletteOpen} isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} settingsTab={settingsTab} selectedTask={selectedTask} setSelectedTask={setSelectedTask} aiSuggestions={aiSuggestions} setAiSuggestions={setAiSuggestions} aiLoading={aiLoading} activeTaskTitle={activeTaskTitle} tasks={tasks} projectTasks={allProjectTasks} projects={projects} activeProjectId={activeProjectId} aiEnabled={settings.aiSuggestions} canAssignMembers={Boolean(activeProject && canManageProject(activeProject))} canManageTask={(taskId) => { const task = tasks.find((item) => item.id === taskId); return task ? canManageTask(task) : false; }} createTask={handleCreateTaskWithPolicy} 
        handleAddProject={(n, d, c, m, tid, aiGeneratedTasks, meta) => {
            const proj = projectService.createProject(user.orgId, n, d, c, m, meta, user.id);
            setProjects([...projects, proj]);
            setActiveProjectId(proj.id);
            setIsProjectModalOpen(false);
            setProjectModalTemplateId(null);
            if (tid) {
              const tmpl = workflowService.getTemplates().find(t => t.id === tid);
              tmpl?.tasks.forEach(t => handleCreateTaskWithPolicy(t.title, t.description, t.priority, t.tags, undefined, proj.id));
            }
            if (aiGeneratedTasks && aiGeneratedTasks.length > 0) {
              aiGeneratedTasks.forEach(t => handleCreateTaskWithPolicy(t.title, t.description, t.priority, t.tags || ['AI-Ingested'], undefined, proj.id));
            }
        }}
        handleUpdateTask={(id, u) => { handleUpdateTaskWithPolicy(id, u); if(selectedTask?.id === id) setSelectedTask({...selectedTask, ...u}); }}
        handleCommentOnTask={(id, t) => {
          handleCommentOnTaskWithPolicy(id, t);
          const updatedTask = taskService.getTaskById(id);
          if (updatedTask) setSelectedTask(updatedTask);
        }}
        deleteTask={handleDeleteTaskWithPolicy}
        canDeleteTask={(taskId) => hasTaskPermission(taskId, 'delete')}
        canToggleTaskTimer={(taskId) => hasTaskPermission(taskId, 'complete')}
        onToggleTimer={handleToggleTimerWithPolicy}
        applyAISuggestions={applyAISuggestions}
        handleGeneratedTasks={(g) => g.forEach(x => handleCreateTaskWithPolicy(x.title, x.description, TaskPriority.MEDIUM, ['Vision Scan'], undefined, activeProjectId || 'p1'))}
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
      />
      <MoveBackReasonModal
        isOpen={Boolean(moveBackRequest)}
        reason={moveBackReason}
        reasonError={moveBackReasonError}
        onReasonChange={setMoveBackReason}
        onCancel={closeMoveBackPrompt}
        onSubmit={submitMoveBackReason}
      />
      <DialogHost />
      <ToastHost />
    </WorkspaceLayout>
  );
};

export default App;
