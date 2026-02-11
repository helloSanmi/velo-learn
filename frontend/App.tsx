import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, User, Project, TaskPriority, TaskStatus, MainViewType } from './types';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
import { taskService } from './services/taskService';
import { workflowService } from './services/workflowService';
import { useTasks } from './hooks/useTasks';
import { useAccessControl } from './hooks/useAccessControl';
import { useProjectLifecycleActions } from './hooks/useProjectLifecycleActions';
import { useTaskPolicyActions } from './hooks/useTaskPolicyActions';
import { mockDataService } from './services/mockDataService';
import { settingsService, UserSettings } from './services/settingsService';

import WorkspaceLayout from './components/layout/WorkspaceLayout';
import KanbanView from './components/board/KanbanView';
import GlobalModals from './components/modals/GlobalModals';
import AnalyticsView from './components/analytics/AnalyticsView';
import RoadmapView from './components/RoadmapView';
import AuthView from './components/AuthView';
import LandingPage from './components/LandingPage';
import PricingPage from './components/PricingPage';
import SupportPage from './components/SupportPage';
import PublicBoardView from './components/board/PublicBoardView';
import SelectionActionBar from './components/board/SelectionActionBar';
import Confetti from './components/ui/Confetti';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkloadView from './components/WorkloadView';
import IntegrationHub from './components/IntegrationHub';
import ProjectsLifecycleView from './components/ProjectsLifecycleView';
import { SettingsTabType } from './components/SettingsModal';
import DialogHost from './components/ui/DialogHost';
import { dialogService } from './services/dialogService';
import ToastHost from './components/ui/ToastHost';
import { toastService } from './services/toastService';
import { migrationService } from './services/migrationService';
import { notificationService } from './services/notificationService';
import { syncGuardService } from './services/syncGuardService';
import { realtimeService } from './services/realtimeService';
import { presenceService } from './services/presenceService';

const getActiveProjectStorageKey = (user: User) => `velo_active_project:${user.orgId}:${user.id}`;

const App: React.FC = () => {
  const hasHydratedActiveProjectRef = useRef(false);
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

  useEffect(() => {
    migrationService.run();
    const current = userService.getCurrentUser();
    if (current) {
      setUser(current);
      setAllUsers(userService.getUsers(current.orgId));
      setProjects(projectService.getProjects(current.orgId));
      refreshTasks();
    }
  }, []);

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

  useEffect(() => {
    const onOffline = () => {
      setIsOffline(true);
      toastService.warning('Offline mode', 'Changes are saved locally and marked pending sync.');
    };
    const onOnline = () => {
      setIsOffline(false);
      if (syncGuardService.hasPending()) {
        syncGuardService.clearPending();
        setHasPendingSync(false);
        toastService.info('Connection restored', 'Pending local changes were retained.');
      }
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    setHasPendingSync(syncGuardService.hasPending());
  }, [tasks, projects]);

  useEffect(() => {
    if (!user) return;
    const key = `velo_sla_alerts:${user.orgId}`;
    const alerted: Record<string, string> = JSON.parse(localStorage.getItem(key) || '{}');
    const now = Date.now();
    const admins = allUsers.filter((member) => member.role === 'admin').map((member) => member.id);

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      if (task.status === TaskStatus.DONE) return;
      const hoursToDue = (task.dueDate - now) / (1000 * 60 * 60);
      const dueKey = `${task.id}:due`;
      const overdueKey = `${task.id}:overdue`;
      const escalateKey = `${task.id}:escalate`;

      if (hoursToDue <= 24 && hoursToDue > 0 && !alerted[dueKey]) {
        alerted[dueKey] = '1';
        notificationService.addNotification({
          userId: task.assigneeId || task.userId,
          title: 'Due soon',
          message: `"${task.title}" is due within 24 hours.`,
          type: 'DUE_DATE',
          linkId: task.id
        });
      }
      if (hoursToDue <= 0 && !alerted[overdueKey]) {
        alerted[overdueKey] = '1';
        notificationService.addNotification({
          userId: task.assigneeId || task.userId,
          title: 'Task overdue',
          message: `"${task.title}" is overdue.`,
          type: 'DUE_DATE',
          linkId: task.id
        });
      }
      if (hoursToDue <= -24 && task.priority === TaskPriority.HIGH && !alerted[escalateKey]) {
        alerted[escalateKey] = '1';
        admins.forEach((adminId) => {
          notificationService.addNotification({
            userId: adminId,
            title: 'SLA escalation',
            message: `High-priority task "${task.title}" is overdue by more than 24 hours.`,
            type: 'SYSTEM',
            linkId: task.id
          });
        });
      }
    });

    localStorage.setItem(key, JSON.stringify(alerted));
  }, [tasks, user, allUsers]);

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => e.detail && setSettings(e.detail);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#public/')) {
        const token = hash.split('/')[1];
        const proj = projectService.getProjectByToken(token);
        if (proj) setPublicProject(proj);
    }
    const currentUser = userService.getCurrentUser();
    if (currentUser && !hash.startsWith('#public/')) {
      setUser(currentUser);
      setAllUsers(userService.getUsers(currentUser.orgId));
      setProjects(projectService.getProjects(currentUser.orgId));
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsCommandPaletteOpen(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user) {
      refreshWorkspaceData();
    }
  }, [user, refreshWorkspaceData]);

  useEffect(() => {
    if (!user || !settings.realTimeUpdates) {
      setOnlineCount(user ? 1 : 0);
      return;
    }

    const unsubscribeRealtime = realtimeService.subscribe((event) => {
      if (event.clientId === realtimeService.getClientId()) return;
      if (event.orgId && event.orgId !== user.orgId) return;
      if (event.type === 'TASKS_UPDATED') {
        refreshTasks();
        setSelectedTask((prev) => {
          if (!prev) return null;
          const latest = taskService.getTaskById(prev.id);
          return latest || null;
        });
        return;
      }
      if (event.type === 'PROJECTS_UPDATED') {
        setProjects(projectService.getProjects(user.orgId));
        refreshTasks();
        return;
      }
      if (event.type === 'USERS_UPDATED') {
        setAllUsers(userService.getUsers(user.orgId));
        return;
      }
      if (event.type === 'SETTINGS_UPDATED') {
        setSettings(settingsService.getSettings());
      }
    });

    const stopPresence = presenceService.start(user, (entries) => {
      const ids = new Set(entries.map((entry) => entry.userId));
      ids.add(user.id);
      setOnlineCount(ids.size);
    });

    return () => {
      unsubscribeRealtime();
      stopPresence();
    };
  }, [user, settings.realTimeUpdates, refreshTasks]);

  useEffect(() => {
    hasHydratedActiveProjectRef.current = false;
  }, [user?.id, user?.orgId]);

  useEffect(() => {
    if (!user) return;
    const activeProjects = projects.filter((project) => !project.isArchived && !project.isCompleted && !project.isDeleted);
    const storageKey = getActiveProjectStorageKey(user);

    if (!hasHydratedActiveProjectRef.current) {
      hasHydratedActiveProjectRef.current = true;
      const storedProjectId = localStorage.getItem(storageKey);
      if (storedProjectId && activeProjects.some((project) => project.id === storedProjectId)) {
        setActiveProjectId(storedProjectId);
      }
      return;
    }

    if (currentView === 'board' && activeProjectId === null) return;
    if (activeProjectId && activeProjects.some((project) => project.id === activeProjectId)) return;

    const storedProjectId = localStorage.getItem(storageKey);
    if (storedProjectId && activeProjects.some((project) => project.id === storedProjectId)) {
      setActiveProjectId(storedProjectId);
      return;
    }

    if (activeProjectId && !activeProjects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(null);
    }
  }, [user, projects, activeProjectId, currentView]);

  useEffect(() => {
    if (!user) return;
    const storageKey = getActiveProjectStorageKey(user);
    if (activeProjectId) {
      localStorage.setItem(storageKey, activeProjectId);
      return;
    }
    localStorage.removeItem(storageKey);
  }, [user, activeProjectId]);

  const handleLogout = () => {
    userService.logout();
    setActiveProjectId(null);
    setUser(null);
    setAuthView('landing');
  };
  const handleReset = () => mockDataService.init().then(() => refreshTasks());

  const handleOpenTaskFromNotification = (taskId: string) => {
    if (!user) return;
    const allOrgTasks = taskService.getAllTasksForOrg(user.orgId);
    const task = allOrgTasks.find((item) => item.id === taskId);
    if (!task) {
      toastService.warning('Notification unavailable', 'The related task no longer exists.');
      return;
    }
    const project = projects.find((item) => item.id === task.projectId);
    if (!project || project.isArchived || project.isCompleted || project.isDeleted) {
      setCurrentView('projects');
      toastService.info('Project not active', 'Open Projects to view this task in its lifecycle state.');
      return;
    }
    setCurrentView('board');
    setActiveProjectId(task.projectId);
    setSelectedTask(task);
  };

  const { canManageProject, ensureTaskPermission } = useAccessControl({ user, projects, tasks });
  
  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    const target = projects.find((project) => project.id === id);
    if (!target) return;
    if (!canManageProject(target)) {
      toastService.warning('Permission denied', 'Only admins or project creators can edit project settings.');
      return;
    }
    projectService.updateProject(id, updates);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

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
    createTask
  });

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
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setAuthView('register')}
          onLogin={() => setAuthView('login')}
          onOpenPricing={() => setAuthView('pricing')}
          onOpenSupport={() => setAuthView('support')}
        />
      );
    }
    if (authView === 'pricing') {
      return (
        <PricingPage
          onBackToHome={() => setAuthView('landing')}
          onOpenSupport={() => setAuthView('support')}
          onSignIn={() => setAuthView('login')}
          onGetStarted={() => setAuthView('register')}
        />
      );
    }
    if (authView === 'support') {
      return (
        <SupportPage
          onBackToHome={() => setAuthView('landing')}
          onOpenPricing={() => setAuthView('pricing')}
          onSignIn={() => setAuthView('login')}
          onGetStarted={() => setAuthView('register')}
        />
      );
    }
    return (
      <AuthView
        onAuthSuccess={setUser}
        initialMode={authView as any}
        onBackToHome={() => setAuthView('landing')}
        onOpenPricing={() => setAuthView('pricing')}
        onOpenSupport={() => setAuthView('support')}
      />
    );
  }

  const themeClass = settings.theme === 'Dark' ? 'dark-theme' : settings.theme === 'Aurora' ? 'aurora-theme' : '';
  const visibleProjects = user.role === 'admin'
    ? projects
    : projects.filter((project) => project.members.includes(user.id));

  const renderMainView = () => {
    switch (currentView) {
      case 'projects':
        return (
          <ProjectsLifecycleView
            currentUserRole={user.role}
            projects={projects}
            projectTasks={allProjectTasks}
            activeProjectId={activeProjectId}
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
      case 'analytics': return <AnalyticsView tasks={tasks} projects={projects} allUsers={allUsers} />;
      case 'roadmap': return <RoadmapView tasks={tasks} projects={projects} />;
      case 'resources': return <WorkloadView users={allUsers} tasks={tasks} onReassign={(tid, uid) => handleUpdateTaskWithPolicy(tid, { assigneeId: uid, assigneeIds: [uid] })} />;
      case 'integrations': return <IntegrationHub projects={projects} onUpdateProject={handleUpdateProject} />;
      case 'workflows': return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
            <WorkflowBuilder orgId={user.orgId} allUsers={allUsers} />
          </div>
        </div>
      );
      case 'templates':
        return (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-5">
               <div>
                 <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Templates</h2>
                 <p className="text-sm text-slate-600 mt-1">Start faster with predefined project structures.</p>
               </div>
               <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                 <input
                   value={templateQuery}
                   onChange={(event) => setTemplateQuery(event.target.value)}
                   placeholder="Filter templates"
                   className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
                 />
                 {templates.length === 0 ? (
                   <div className="border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
                     No templates match your filter.
                   </div>
                 ) : (
                   <div className="max-h-[62vh] overflow-y-auto custom-scrollbar pr-1">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {templates.map(t => (
                         <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col">
                            <h3 className="text-base font-semibold text-slate-900">{t.name}</h3>
                            <p className="text-sm text-slate-600 mt-1 flex-1">{t.description}</p>
                            <button
                              onClick={() => {
                                setProjectModalTemplateId(t.id);
                                setIsProjectModalOpen(true);
                              }}
                              className="mt-4 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                            >
                              Use template
                            </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        );
      default: return (
        <KanbanView searchQuery={searchQuery} projectFilter={projectFilter} projects={visibleProjects} dueFrom={dueFrom} dueTo={dueTo} statusFilter={statusFilter} priorityFilter={priorityFilter} tagFilter={tagFilter} assigneeFilter={assigneeFilter} uniqueTags={uniqueTags} allUsers={allUsers} currentUser={user} activeProject={activeProject} categorizedTasks={categorizedTasks} selectedTaskIds={selectedTaskIds} compactMode={settings.compactMode} setStatusFilter={setStatusFilter} setPriorityFilter={setPriorityFilter} setTagFilter={setTagFilter} setAssigneeFilter={setAssigneeFilter} setProjectFilter={setProjectFilter} setSearchQuery={setSearchQuery} setDueFrom={setDueFrom} setDueTo={setDueTo} setSelectedTaskIds={setSelectedTaskIds} toggleTaskSelection={toggleTaskSelection} deleteTask={handleDeleteTaskWithPolicy} onToggleTimer={toggleTimer} handleStatusUpdate={handleStatusUpdateWithPolicy} moveTask={handleMoveTaskWithPolicy} assistWithAI={assistWithAI} setSelectedTask={setSelectedTask} setIsModalOpen={setIsModalOpen} refreshTasks={refreshTasks} onUpdateProjectStages={(projectId, stages) => handleUpdateProject(projectId, { stages })} />
      );
    }
  };

  return (
    <WorkspaceLayout user={user} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} projects={visibleProjects} activeProjectId={activeProjectId} currentView={currentView} themeClass={themeClass} compactMode={settings.compactMode} onLogout={handleLogout} onNewTask={() => setIsModalOpen(true)} onReset={handleReset} onRefreshData={refreshWorkspaceData} onOpenSettings={(tab) => { setSettingsTab(tab); setIsSettingsOpen(true); }} onOpenTaskFromNotification={handleOpenTaskFromNotification} onCloseSidebar={() => setIsSidebarOpen(false)} onProjectSelect={setActiveProjectId} onViewChange={setCurrentView} onOpenCommandCenter={() => setIsCommandCenterOpen(true)} onOpenVoiceCommander={() => setIsVoiceCommanderOpen(true)} onOpenVisionModal={() => setIsVisionModalOpen(true)} onAddProject={() => { setProjectModalTemplateId(null); setIsProjectModalOpen(true); }} onRenameProject={handleRenameProject} onCompleteProject={handleCompleteProject} onArchiveProject={handleArchiveProject} onDeleteProject={handleDeleteProject} onlineCount={onlineCount} isOnline={!isOffline}>
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />
      {renderMainView()}
      {(isOffline || hasPendingSync) && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[200] rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm">
          {isOffline ? 'Offline: local changes queued' : 'Local changes pending sync'}
        </div>
      )}
      <SelectionActionBar selectedCount={selectedTaskIds.length} allUsers={allUsers} onClear={() => setSelectedTaskIds([])} onBulkPriority={(p) => { bulkUpdateTasks(selectedTaskIds, { priority: p }); toastService.success('Priorities updated', `${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's updated' : ' updated'}.`); setSelectedTaskIds([]); }} onBulkStatus={(s) => { bulkUpdateTasks(selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'complete')), { status: s }); setSelectedTaskIds([]); }} onBulkAssignee={(u) => { bulkUpdateTasks(selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'assign')), { assigneeId: u, assigneeIds: [u] }); setSelectedTaskIds([]); }} onBulkDelete={async () => { const confirmed = await dialogService.confirm('Delete selected tasks?', { title: 'Bulk delete', confirmText: 'Delete', danger: true }); if (confirmed) { bulkDeleteTasks(selectedTaskIds.filter((taskId) => ensureTaskPermission(taskId, 'delete'))); setSelectedTaskIds([]); } }} />
      <GlobalModals user={user} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} isProjectModalOpen={isProjectModalOpen} setIsProjectModalOpen={setIsProjectModalOpen} projectModalTemplateId={projectModalTemplateId} setProjectModalTemplateId={setProjectModalTemplateId} isCommandCenterOpen={isCommandCenterOpen} setIsCommandCenterOpen={setIsCommandCenterOpen} isVoiceCommanderOpen={isVoiceCommanderOpen} setIsVoiceCommanderOpen={setIsVoiceCommanderOpen} isVisionModalOpen={isVisionModalOpen} setIsVisionModalOpen={setIsVisionModalOpen} isCommandPaletteOpen={isCommandPaletteOpen} setIsCommandPaletteOpen={setIsCommandPaletteOpen} isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} settingsTab={settingsTab} selectedTask={selectedTask} setSelectedTask={setSelectedTask} aiSuggestions={aiSuggestions} setAiSuggestions={setAiSuggestions} aiLoading={aiLoading} activeTaskTitle={activeTaskTitle} tasks={tasks} projectTasks={allProjectTasks} projects={projects} activeProjectId={activeProjectId} aiEnabled={settings.aiSuggestions} createTask={handleCreateTaskWithPolicy} 
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
        handleCommentOnTask={(id, t) => { const updated = addComment(id, t); if(updated) setSelectedTask(updated); }}
        deleteTask={handleDeleteTaskWithPolicy}
        onToggleTimer={toggleTimer}
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
      />
      {moveBackRequest && (
        <div className="fixed inset-0 z-[280] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white shadow-2xl p-5">
            <h3 className="text-lg font-semibold text-slate-900">Reason Required</h3>
            <p className="text-sm text-slate-600 mt-1">
              Completed tasks need a comment before moving backward.
            </p>
            <textarea
              autoFocus
              value={moveBackReason}
              onChange={(event) => {
                setMoveBackReason(event.target.value);
              }}
              placeholder="Explain why this task is moving back..."
              className="mt-3 w-full min-h-[120px] rounded-xl border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
            {moveBackReasonError ? <p className="text-xs text-rose-600 mt-1.5">{moveBackReasonError}</p> : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={closeMoveBackPrompt}
                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitMoveBackReason}
                className="h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                Save reason and move
              </button>
            </div>
          </div>
        </div>
      )}
      <DialogHost />
      <ToastHost />
    </WorkspaceLayout>
  );
};

export default App;
