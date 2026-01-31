import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, User, Project, TaskPriority, TaskStatus, MainViewType } from './types';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
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
import PublicBoardView from './components/board/PublicBoardView';
import SelectionActionBar from './components/board/SelectionActionBar';
import Confetti from './components/ui/Confetti';
import PresenceOverlay from './components/PresenceOverlay';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkloadView from './components/WorkloadView';
import IntegrationHub from './components/IntegrationHub';
import { SettingsTabType } from './components/SettingsModal';
import { LayoutGrid, Terminal, Zap, ArrowRight } from 'lucide-react';
import Button from './components/ui/Button';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<MainViewType>('board');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [publicProject, setPublicProject] = useState<Project | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isVoiceCommanderOpen, setIsVoiceCommanderOpen] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabType>('general');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
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
    if (currentUser && (!hash || !hash.startsWith('#public/'))) {
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

  const handleLogout = () => { userService.logout(); setUser(null); setAuthView('landing'); };
  const handleReset = () => mockDataService.init().then(() => refreshTasks());
  
  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    projectService.updateProject(id, updates);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [activeProjectId, projects]);

  if (publicProject) {
      const projectTasks = tasks.filter(t => t.projectId === publicProject.id);
      return <PublicBoardView project={publicProject} tasks={projectTasks} />;
  }

  if (!user) {
    if (authView === 'landing') return <LandingPage onGetStarted={() => setAuthView('register')} onLogin={() => setAuthView('login')} />;
    return <AuthView onAuthSuccess={setUser} initialMode={authView as any} />;
  }

  const themeClass = settings.theme === 'Dark' ? 'dark-theme' : settings.theme === 'Aurora' ? 'aurora-theme' : '';

  const renderMainView = () => {
    switch (currentView) {
      case 'analytics': return <AnalyticsView tasks={tasks} projects={projects} allUsers={allUsers} />;
      case 'roadmap': return <RoadmapView tasks={tasks} projects={projects} />;
      case 'resources': return <WorkloadView users={allUsers} tasks={tasks} onReassign={(tid, uid) => updateTask(tid, { assigneeId: uid }, user.displayName)} />;
      case 'integrations': return <IntegrationHub projects={projects} onUpdateProject={handleUpdateProject} />;
      case 'workflows': return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12 custom-scrollbar">
          <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-10 md:p-16 border border-slate-200 shadow-sm"><WorkflowBuilder orgId={user.orgId} allUsers={allUsers} /></div>
        </div>
      );
      case 'templates':
        const templates = workflowService.getTemplates();
        return (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-12">
               <div><h2 className="text-4xl font-black text-slate-900 tracking-tighter">Strategy Gallery</h2><p className="text-slate-500 font-medium mt-2">Initialize specialized workspaces.</p></div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {templates.map(t => (
                   <div key={t.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                      <div className="p-5 bg-slate-50 rounded-[2rem] w-fit mb-8 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><LayoutGrid className="w-8 h-8" /></div>
                      <h3 className="text-xl font-black text-slate-900 mb-3">{t.name}</h3><p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 flex-1">{t.description}</p>
                      <Button onClick={() => setIsProjectModalOpen(true)} className="w-full py-4 rounded-2xl" variant="secondary">Deploy Node <ArrowRight className="ml-2 w-5 h-5" /></Button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        );
      default: return (
        <KanbanView statusFilter={statusFilter} priorityFilter={priorityFilter} tagFilter={tagFilter} assigneeFilter={assigneeFilter} uniqueTags={uniqueTags} allUsers={allUsers} activeProject={activeProject} categorizedTasks={categorizedTasks} selectedTaskIds={selectedTaskIds} compactMode={settings.compactMode} setStatusFilter={setStatusFilter} setPriorityFilter={setPriorityFilter} setTagFilter={setTagFilter} setAssigneeFilter={setAssigneeFilter} setSelectedTaskIds={setSelectedTaskIds} toggleTaskSelection={toggleTaskSelection} deleteTask={deleteTask} onToggleTimer={toggleTimer} handleStatusUpdate={(id, s) => updateStatus(id, s, user.displayName)} moveTask={moveTask} assistWithAI={assistWithAI} setSelectedTask={setSelectedTask} setIsModalOpen={setIsModalOpen} refreshTasks={refreshTasks} />
      );
    }
  };

  return (
    <WorkspaceLayout user={user} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} projects={projects.filter(p => p.members.includes(user.id))} activeProjectId={activeProjectId} currentView={currentView} themeClass={themeClass} compactMode={settings.compactMode} onLogout={handleLogout} onNewTask={() => setIsModalOpen(true)} onReset={handleReset} onOpenSettings={(tab) => { setSettingsTab(tab); setIsSettingsOpen(true); }} onProjectSelect={setActiveProjectId} onViewChange={setCurrentView} onOpenCommandCenter={() => setIsCommandCenterOpen(true)} onOpenVoiceCommander={() => setIsVoiceCommanderOpen(true)} onOpenVisionModal={() => setIsVisionModalOpen(true)} onAddProject={() => setIsProjectModalOpen(true)}>
      <PresenceOverlay users={allUsers} /><Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />
      {renderMainView()}
      <SelectionActionBar selectedCount={selectedTaskIds.length} allUsers={allUsers} onClear={() => setSelectedTaskIds([])} onBulkPriority={(p) => { bulkUpdateTasks(selectedTaskIds, { priority: p }); setSelectedTaskIds([]); }} onBulkStatus={(s) => { bulkUpdateTasks(selectedTaskIds, { status: s }); setSelectedTaskIds([]); }} onBulkAssignee={(u) => { bulkUpdateTasks(selectedTaskIds, { assigneeId: u }); setSelectedTaskIds([]); }} onBulkDelete={() => { if(confirm('Bulk delete?')) { bulkDeleteTasks(selectedTaskIds); setSelectedTaskIds([]); } }} />
      <GlobalModals user={user} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} isProjectModalOpen={isProjectModalOpen} setIsProjectModalOpen={setIsProjectModalOpen} isCommandCenterOpen={isCommandCenterOpen} setIsCommandCenterOpen={setIsCommandCenterOpen} isVoiceCommanderOpen={isVoiceCommanderOpen} setIsVoiceCommanderOpen={setIsVoiceCommanderOpen} isVisionModalOpen={isVisionModalOpen} setIsVisionModalOpen={setIsVisionModalOpen} isCommandPaletteOpen={isCommandPaletteOpen} setIsCommandPaletteOpen={setIsCommandPaletteOpen} isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} settingsTab={settingsTab} selectedTask={selectedTask} setSelectedTask={setSelectedTask} aiSuggestions={aiSuggestions} setAiSuggestions={setAiSuggestions} aiLoading={aiLoading} activeTaskTitle={activeTaskTitle} tasks={tasks} projects={projects} activeProjectId={activeProjectId} aiEnabled={settings.aiSuggestions} createTask={createTask} 
        handleAddProject={(n, d, c, m, tid, aiGeneratedTasks) => {
            const proj = projectService.createProject(user.orgId, n, d, c, m);
            setProjects([...projects, proj]);
            setActiveProjectId(proj.id);
            setIsProjectModalOpen(false);
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
        deleteTask={deleteTask} applyAISuggestions={applyAISuggestions} handleGeneratedTasks={(g) => g.forEach(x => createTask(x.title, x.description, TaskPriority.MEDIUM, ['Vision Scan'], undefined, activeProjectId || 'p1'))} setActiveProjectId={setActiveProjectId} refreshTasks={refreshTasks}
      />
    </WorkspaceLayout>
  );
};

export default App;