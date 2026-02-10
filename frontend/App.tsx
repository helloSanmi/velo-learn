import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, User, Project, TaskPriority, TaskStatus, MainViewType } from './types';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
import { taskService } from './services/taskService';
import { workflowService } from './services/workflowService';
import { useTasks } from './hooks/useTasks';
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

const getActiveProjectStorageKey = (user: User) => `velo_active_project:${user.orgId}:${user.id}`;

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
  
  const toggleTaskSelection = useCallback((id: string) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]);
  }, []);

  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => e.detail && setSettings(e.detail);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const {
    tasks, categorizedTasks, aiLoading, aiSuggestions, activeTaskTitle,
    priorityFilter, statusFilter, tagFilter, assigneeFilter, uniqueTags,
    confettiActive, setConfettiActive, setPriorityFilter, setStatusFilter,
    setTagFilter, setAssigneeFilter, setAiSuggestions, refreshTasks,
    createTask, updateStatus, updateTask, addComment, moveTask, deleteTask,
    assistWithAI, applyAISuggestions, bulkUpdateTasks, bulkDeleteTasks, toggleTimer
  } = useTasks(user, activeProjectId || undefined);

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
      refreshTasks();
      setAllUsers(userService.getUsers(user.orgId));
      setProjects(projectService.getProjects(user.orgId));
    }
  }, [user, refreshTasks]);

  useEffect(() => {
    if (!user) return;
    const activeProjects = projects.filter((project) => !project.isArchived && !project.isCompleted && !project.isDeleted);
    const storageKey = getActiveProjectStorageKey(user);

    if (activeProjectId && activeProjects.some((project) => project.id === activeProjectId)) return;

    const storedProjectId = localStorage.getItem(storageKey);
    if (storedProjectId && activeProjects.some((project) => project.id === storedProjectId)) {
      setActiveProjectId(storedProjectId);
      return;
    }

    if (activeProjectId && !activeProjects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(null);
    }
  }, [user, projects, activeProjectId]);

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
  
  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    projectService.updateProject(id, updates);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleRenameProject = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    projectService.renameProject(id, trimmed);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)));
    toastService.success('Project renamed', `"${trimmed}" is now the project name.`);
  };

  const handleArchiveProject = (id: string) => {
    projectService.archiveProject(id);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isArchived: true, archivedAt: Date.now(), isCompleted: false, completedAt: undefined, isDeleted: false, deletedAt: undefined }
          : p
      )
    );
    if (activeProjectId === id) setActiveProjectId(null);
    refreshTasks();
    const project = projects.find((item) => item.id === id);
    toastService.info('Project archived', project ? `"${project.name}" moved to archived.` : 'Project moved to archived.');
  };

  const handleCompleteProject = (id: string) => {
    projectService.completeProject(id);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isCompleted: true, completedAt: Date.now(), isArchived: false, archivedAt: undefined, isDeleted: false, deletedAt: undefined }
          : p
      )
    );
    if (activeProjectId === id) setActiveProjectId(null);
    refreshTasks();
    const project = projects.find((item) => item.id === id);
    toastService.success('Project completed', project ? `"${project.name}" marked complete.` : 'Project marked complete.');
  };

  const handleReopenProject = (id: string) => {
    projectService.reopenProject(id);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, isCompleted: false, completedAt: undefined } : p)));
    refreshTasks();
    const project = projects.find((item) => item.id === id);
    toastService.info('Project reopened', project ? `"${project.name}" is active again.` : 'Project is active again.');
  };

  const handleRestoreProject = (id: string) => {
    projectService.restoreProject(id);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isArchived: false,
              archivedAt: undefined,
              isCompleted: false,
              completedAt: undefined,
              isDeleted: false,
              deletedAt: undefined
            }
          : p
      )
    );
    refreshTasks();
    const project = projects.find((item) => item.id === id);
    toastService.success('Project restored', project ? `"${project.name}" restored to active.` : 'Project restored to active.');
  };

  const handleDeleteProject = (id: string) => {
    projectService.deleteProject(id);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isDeleted: true, deletedAt: Date.now(), isArchived: false, archivedAt: undefined, isCompleted: false, completedAt: undefined }
          : p
      )
    );
    if (activeProjectId === id) setActiveProjectId(null);
    setSelectedTask((prev) => (prev?.projectId === id ? null : prev));
    refreshTasks();
    const project = projects.find((item) => item.id === id);
    toastService.warning('Project deleted', project ? `"${project.name}" moved to deleted.` : 'Project moved to deleted.');
  };

  const handlePurgeProject = (id: string) => {
    projectService.purgeProject(id);
    taskService.deleteTasksByProject(user.id, user.orgId, id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    setSelectedTask((prev) => (prev?.projectId === id ? null : prev));
    refreshTasks();
    toastService.warning('Project permanently deleted', 'Project and related tasks were removed.');
  };

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

  const renderMainView = () => {
    switch (currentView) {
      case 'projects':
        return (
          <ProjectsLifecycleView
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
          />
        );
      case 'analytics': return <AnalyticsView tasks={tasks} projects={projects} allUsers={allUsers} />;
      case 'roadmap': return <RoadmapView tasks={tasks} projects={projects} />;
      case 'resources': return <WorkloadView users={allUsers} tasks={tasks} onReassign={(tid, uid) => updateTask(tid, { assigneeId: uid, assigneeIds: [uid] }, user.displayName)} />;
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
        <KanbanView statusFilter={statusFilter} priorityFilter={priorityFilter} tagFilter={tagFilter} assigneeFilter={assigneeFilter} uniqueTags={uniqueTags} allUsers={allUsers} currentUser={user} activeProject={activeProject} categorizedTasks={categorizedTasks} selectedTaskIds={selectedTaskIds} compactMode={settings.compactMode} setStatusFilter={setStatusFilter} setPriorityFilter={setPriorityFilter} setTagFilter={setTagFilter} setAssigneeFilter={setAssigneeFilter} setSelectedTaskIds={setSelectedTaskIds} toggleTaskSelection={toggleTaskSelection} deleteTask={deleteTask} onToggleTimer={toggleTimer} handleStatusUpdate={(id, s) => updateStatus(id, s, user.displayName)} moveTask={moveTask} assistWithAI={assistWithAI} setSelectedTask={setSelectedTask} setIsModalOpen={setIsModalOpen} refreshTasks={refreshTasks} onUpdateProjectStages={(projectId, stages) => handleUpdateProject(projectId, { stages })} />
      );
    }
  };

  return (
    <WorkspaceLayout user={user} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} projects={projects.filter(p => p.members.includes(user.id))} activeProjectId={activeProjectId} currentView={currentView} themeClass={themeClass} compactMode={settings.compactMode} onLogout={handleLogout} onNewTask={() => setIsModalOpen(true)} onReset={handleReset} onOpenSettings={(tab) => { setSettingsTab(tab); setIsSettingsOpen(true); }} onOpenTaskFromNotification={handleOpenTaskFromNotification} onProjectSelect={setActiveProjectId} onViewChange={setCurrentView} onOpenCommandCenter={() => setIsCommandCenterOpen(true)} onOpenVoiceCommander={() => setIsVoiceCommanderOpen(true)} onOpenVisionModal={() => setIsVisionModalOpen(true)} onAddProject={() => { setProjectModalTemplateId(null); setIsProjectModalOpen(true); }} onRenameProject={handleRenameProject} onCompleteProject={handleCompleteProject} onArchiveProject={handleArchiveProject} onDeleteProject={handleDeleteProject}>
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />
      {renderMainView()}
      <SelectionActionBar selectedCount={selectedTaskIds.length} allUsers={allUsers} onClear={() => setSelectedTaskIds([])} onBulkPriority={(p) => { bulkUpdateTasks(selectedTaskIds, { priority: p }); toastService.success('Priorities updated', `${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's updated' : ' updated'}.`); setSelectedTaskIds([]); }} onBulkStatus={(s) => { bulkUpdateTasks(selectedTaskIds, { status: s }); setSelectedTaskIds([]); }} onBulkAssignee={(u) => { bulkUpdateTasks(selectedTaskIds, { assigneeId: u, assigneeIds: [u] }); setSelectedTaskIds([]); }} onBulkDelete={async () => { const confirmed = await dialogService.confirm('Delete selected tasks?', { title: 'Bulk delete', confirmText: 'Delete', danger: true }); if (confirmed) { bulkDeleteTasks(selectedTaskIds); setSelectedTaskIds([]); } }} />
      <GlobalModals user={user} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} isProjectModalOpen={isProjectModalOpen} setIsProjectModalOpen={setIsProjectModalOpen} projectModalTemplateId={projectModalTemplateId} setProjectModalTemplateId={setProjectModalTemplateId} isCommandCenterOpen={isCommandCenterOpen} setIsCommandCenterOpen={setIsCommandCenterOpen} isVoiceCommanderOpen={isVoiceCommanderOpen} setIsVoiceCommanderOpen={setIsVoiceCommanderOpen} isVisionModalOpen={isVisionModalOpen} setIsVisionModalOpen={setIsVisionModalOpen} isCommandPaletteOpen={isCommandPaletteOpen} setIsCommandPaletteOpen={setIsCommandPaletteOpen} isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} settingsTab={settingsTab} selectedTask={selectedTask} setSelectedTask={setSelectedTask} aiSuggestions={aiSuggestions} setAiSuggestions={setAiSuggestions} aiLoading={aiLoading} activeTaskTitle={activeTaskTitle} tasks={tasks} projectTasks={allProjectTasks} projects={projects} activeProjectId={activeProjectId} aiEnabled={settings.aiSuggestions} createTask={createTask} 
        handleAddProject={(n, d, c, m, tid, aiGeneratedTasks, meta) => {
            const proj = projectService.createProject(user.orgId, n, d, c, m, meta);
            setProjects([...projects, proj]);
            setActiveProjectId(proj.id);
            setIsProjectModalOpen(false);
            setProjectModalTemplateId(null);
            if (tid) {
              const tmpl = workflowService.getTemplates().find(t => t.id === tid);
              tmpl?.tasks.forEach(t => createTask(t.title, t.description, t.priority, t.tags, undefined, proj.id));
            }
            if (aiGeneratedTasks && aiGeneratedTasks.length > 0) {
              aiGeneratedTasks.forEach(t => createTask(t.title, t.description, t.priority, t.tags || ['AI-Ingested'], undefined, proj.id));
            }
        }}
        handleUpdateTask={(id, u) => { updateTask(id, u, user.displayName); if(selectedTask?.id === id) setSelectedTask({...selectedTask, ...u}); }}
        handleCommentOnTask={(id, t) => { const updated = addComment(id, t); if(updated) setSelectedTask(updated); }}
        deleteTask={deleteTask}
        onToggleTimer={toggleTimer}
        applyAISuggestions={applyAISuggestions}
        handleGeneratedTasks={(g) => g.forEach(x => createTask(x.title, x.description, TaskPriority.MEDIUM, ['Vision Scan'], undefined, activeProjectId || 'p1'))}
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
      <DialogHost />
      <ToastHost />
    </WorkspaceLayout>
  );
};

export default App;
