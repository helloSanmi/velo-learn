import React, { useState, useEffect, useMemo } from 'react';
import { X, Settings, Monitor, Bell, Shield, Cloud, Sparkles, User, Mail, Camera, Save, Inbox, ShieldCheck, Trash2, Users, TrendingUp, UserPlus, Smartphone, ArrowLeft, Zap, LayoutGrid, CheckCircle2, Loader2, Activity, Edit2, Check, Search, Archive, ArchiveRestore } from 'lucide-react';
import Button from './ui/Button';
import WorkflowBuilder from './WorkflowBuilder';
import { settingsService, UserSettings } from '../services/settingsService';
import { userService } from '../services/userService';
import { User as UserType, Organization, Project, Task, TaskStatus } from '../types';
import { dialogService } from '../services/dialogService';

export type SettingsTabType = 'profile' | 'general' | 'notifications' | 'security' | 'appearance' | 'admin' | 'automation' | 'projects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabType;
  user?: UserType;
  projects?: Project[];
  projectTasks?: Task[];
  onRenameProject?: (id: string, name: string) => void;
  onCompleteProject?: (id: string) => void;
  onReopenProject?: (id: string) => void;
  onArchiveProject?: (id: string) => void;
  onRestoreProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onPurgeProject?: (id: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'general',
  user,
  projects = [],
  projectTasks = [],
  onRenameProject,
  onCompleteProject,
  onReopenProject,
  onArchiveProject,
  onRestoreProject,
  onDeleteProject,
  onPurgeProject
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  
  const [newUserName, setNewUserName] = useState('');
  const [provisionError, setProvisionError] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [projectQuery, setProjectQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setActiveTab(initialTab);
      setSettings(settingsService.getSettings());
      setAllUsers(userService.getUsers(user.orgId));
      setOrg(userService.getOrganization(user.orgId));
      setIsManagingSubscription(false);
      setEditingUserId(null);
    }
  }, [isOpen, initialTab, user]);

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(q));
  }, [projects, projectQuery]);

  const activeProjects = filteredProjects.filter((project) => !project.isArchived && !project.isCompleted && !project.isDeleted);
  const archivedProjects = filteredProjects.filter((project) => project.isArchived && !project.isDeleted);
  const completedProjects = filteredProjects.filter((project) => project.isCompleted && !project.isDeleted);
  const deletedProjects = filteredProjects.filter((project) => project.isDeleted);
  const focusedProject = projects.find((project) => project.id === focusedProjectId) || null;
  const focusedProjectTasks = useMemo(
    () => (focusedProject ? projectTasks.filter((task) => task.projectId === focusedProject.id) : []),
    [projectTasks, focusedProject]
  );

  if (!isOpen || !user) return null;

  const handleToggle = (key: keyof UserSettings) => {
    const newVal = !settings[key as keyof UserSettings];
    const updated = settingsService.updateSettings({ [key]: newVal });
    setSettings(updated);
  };

  const handleThemeChange = (theme: UserSettings['theme']) => {
    const updated = settingsService.updateSettings({ theme });
    setSettings(updated);
  };

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError('');
    if (!newUserName.trim()) return;

    const result = userService.provisionUser(user.orgId, newUserName);
    if (result.success) {
      setAllUsers(userService.getUsers(user.orgId));
      setNewUserName('');
      setIsProvisioning(false);
    } else {
      setProvisionError(result.error || 'Could not add seat.');
    }
  };

  const handleUpdateUserRole = (userId: string, role: 'admin' | 'member') => {
    const updatedAll = userService.updateUser(userId, { role });
    setAllUsers(updatedAll.filter(u => u.orgId === user.orgId));
  };

  const handleStartEdit = (targetUser: UserType) => {
    setEditingUserId(targetUser.id);
    setEditNameValue(targetUser.displayName);
  };

  const handleCommitEdit = () => {
    if (!editingUserId) return;
    const updatedAll = userService.updateUser(editingUserId, { displayName: editNameValue });
    setAllUsers(updatedAll.filter(u => u.orgId === user.orgId));
    setEditingUserId(null);
  };

  const handlePurgeUser = async (userId: string) => {
    if (userId === user.id) return;
    const confirmed = await dialogService.confirm('Remove this user permanently? This cannot be undone.', {
      title: 'Remove user',
      confirmText: 'Remove',
      danger: true
    });
    if (confirmed) {
      const allAfterDelete = userService.deleteUser(userId);
      setAllUsers(allAfterDelete.filter(u => u.orgId === user.orgId));
    }
  };

  const handleUpgradeTier = (tier: 'starter' | 'pro' | 'enterprise') => {
    if (!org) return;
    setIsUpgrading(true);
    const seatsMap = { starter: 3, pro: 15, enterprise: 100 };
    const newSeats = seatsMap[tier];
    
    setTimeout(() => {
      const updatedOrg = userService.updateOrganization(org.id, { totalSeats: newSeats });
      if (updatedOrg) setOrg(updatedOrg);
      setIsUpgrading(false);
      setIsManagingSubscription(false);
    }, 800);
  };

  const ToggleRow: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
  }> = ({ icon, title, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${enabled ? 'bg-slate-900' : 'bg-slate-300'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  const submitProjectRename = () => {
    if (!editingProjectId || !onRenameProject) return;
    const trimmed = editingProjectName.trim();
    if (!trimmed) return;
    onRenameProject(editingProjectId, trimmed);
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-200">
                  <img src={user?.avatar} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{user?.displayName || 'User Account'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{org?.name} • {user?.role === 'admin' ? 'Admin' : 'Member'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-500">Display Name</p>
                  <input type="text" defaultValue={user?.displayName} className="w-full text-sm font-medium text-slate-900 outline-none bg-transparent mt-0.5" />
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-500">Registered Email</p>
                  <input type="email" defaultValue={user?.email || `${user?.username.toLowerCase()}@velo.app`} className="w-full text-sm font-medium text-slate-900 outline-none bg-transparent mt-0.5" readOnly />
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={() => dialogService.notice('Profile updates saved.', { title: 'Profile' })}>
              <Save className="w-4 h-4 mr-2" /> Save Profile
            </Button>
          </div>
        );
      case 'automation':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-900">Workflow Rules</h3>
              <p className="text-xs text-slate-500 mt-1">Automate repetitive actions with compact trigger/action rules.</p>
            </div>
            <WorkflowBuilder orgId={user.orgId} allUsers={allUsers} />
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full min-h-0 flex flex-col">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-900">Project Lifecycle</h3>
              <p className="text-xs text-slate-500 mt-1">Select any project to open its full details panel.</p>
            </div>

            <label className="h-10 rounded-lg border border-slate-300 px-3 bg-white flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={projectQuery}
                onChange={(event) => setProjectQuery(event.target.value)}
                placeholder="Filter projects"
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-4 flex-1 min-h-0">
              <section className="border border-slate-200 rounded-xl bg-white p-3 flex flex-col min-h-0">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { title: 'Active', count: activeProjects.length },
                    { title: 'Archived', count: archivedProjects.length },
                    { title: 'Completed', count: completedProjects.length },
                    { title: 'Deleted', count: deletedProjects.length }
                  ].map((item) => (
                    <div key={item.title} className="h-9 px-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{item.title}</p>
                      <p className="text-xs font-semibold text-slate-900">{item.count}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
                  {[
                    { title: 'Active', items: activeProjects, empty: 'No active projects.' },
                    { title: 'Archived', items: archivedProjects, empty: 'No archived projects.' },
                    { title: 'Completed', items: completedProjects, empty: 'No completed projects.' },
                    { title: 'Deleted', items: deletedProjects, empty: 'No deleted projects.' }
                  ].map((group) => (
                    <div key={group.title} className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 px-1">{group.title}</p>
                      {group.items.length === 0 ? (
                        <div className="h-14 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 flex items-center justify-center text-center px-3">
                          {group.empty}
                        </div>
                      ) : (
                        group.items.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => setFocusedProjectId(project.id)}
                            className={`w-full text-left border rounded-lg p-2.5 transition-colors ${
                              focusedProjectId === project.id ? 'border-slate-900 bg-slate-100 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${project.color} shrink-0`} />
                              <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {focusedProject ? (
                <section className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col min-h-0 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Project details</p>
                    <h4 className="text-base font-semibold text-slate-900 truncate mt-1">{focusedProject.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{focusedProject.description || 'No description.'}</p>
                  </div>
                  <button onClick={() => setFocusedProjectId(null)} className="h-7 px-2 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">Close</button>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <p className="text-[10px] text-slate-500">Total</p>
                    <p className="text-sm font-semibold text-slate-900">{focusedProjectTasks.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <p className="text-[10px] text-slate-500">To do</p>
                    <p className="text-sm font-semibold text-slate-900">{focusedProjectTasks.filter((t) => t.status === TaskStatus.TODO).length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <p className="text-[10px] text-slate-500">In progress</p>
                    <p className="text-sm font-semibold text-slate-900">{focusedProjectTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <p className="text-[10px] text-slate-500">Done</p>
                    <p className="text-sm font-semibold text-slate-900">{focusedProjectTasks.filter((t) => t.status === TaskStatus.DONE).length}</p>
                  </div>
                </div>
                <div className="mt-3 border border-slate-200 rounded-lg bg-slate-50/60 max-h-[32vh] overflow-y-auto custom-scrollbar">
                  {focusedProjectTasks.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500">No tasks found for this project.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {focusedProjectTasks.map((task) => (
                        <div key={task.id} className="p-3">
                          <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {task.status.replace('-', ' ')} • {task.priority}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {editingProjectId === focusedProject.id ? (
                    <>
                      <input
                        autoFocus
                        value={editingProjectName}
                        onChange={(event) => setEditingProjectName(event.target.value)}
                        className="h-8 flex-1 min-w-[120px] rounded-md border border-slate-300 px-2 text-xs bg-white outline-none"
                      />
                      <button onClick={submitProjectRename} className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700">Save</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingProjectId(focusedProject.id); setEditingProjectName(focusedProject.name); }} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700">Rename</button>
                  )}
                  {!focusedProject.isDeleted && !focusedProject.isArchived && !focusedProject.isCompleted && (
                    <>
                      <button onClick={() => onCompleteProject?.(focusedProject.id)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700">Complete</button>
                      <button onClick={() => onArchiveProject?.(focusedProject.id)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 inline-flex items-center gap-1"><Archive className="w-3 h-3" /> Archive</button>
                    </>
                  )}
                  {focusedProject.isArchived && <button onClick={() => onRestoreProject?.(focusedProject.id)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 inline-flex items-center gap-1"><ArchiveRestore className="w-3 h-3" /> Restore</button>}
                  {focusedProject.isCompleted && <button onClick={() => onReopenProject?.(focusedProject.id)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700">Reopen</button>}
                  {!focusedProject.isDeleted ? (
                    <button onClick={() => onDeleteProject?.(focusedProject.id)} className="h-7 px-2 rounded-md border border-rose-200 bg-rose-50 text-[10px] text-rose-700">Delete</button>
                  ) : (
                    <>
                      <button onClick={() => onRestoreProject?.(focusedProject.id)} className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700">Restore</button>
                      <button onClick={() => onPurgeProject?.(focusedProject.id)} className="h-7 px-2 rounded-md border border-rose-200 bg-rose-50 text-[10px] text-rose-700">Purge</button>
                    </>
                  )}
                </div>
              </section>
              ) : (
                <section className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 bg-white flex items-center justify-center">
                  <p className="text-sm">Select a project from the left list to open details.</p>
                </section>
              )}
            </div>
          </div>
        );
      case 'general':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ToggleRow
              icon={<Sparkles className="w-4 h-4" />}
              title="AI Suggestions"
              description="Generate subtasks and detect at-risk tasks."
              enabled={settings.aiSuggestions}
              onToggle={() => handleToggle('aiSuggestions')}
            />
            <ToggleRow
              icon={<Cloud className="w-4 h-4" />}
              title="Real-time Sync"
              description="Keep workspace updates synced automatically."
              enabled={settings.realTimeUpdates}
              onToggle={() => handleToggle('realTimeUpdates')}
            />
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs text-slate-600">
                Changes are saved immediately and applied across your current workspace.
              </p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ToggleRow
              icon={<Inbox className="w-4 h-4" />}
              title="Assignment Alerts"
              description="Notify immediately when tasks are assigned to you."
              enabled={settings.enableNotifications}
              onToggle={() => handleToggle('enableNotifications')}
            />
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <Smartphone className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Mobile Delivery</p>
                <p className="text-xs text-slate-500 mt-0.5">Push delivery is controlled by your browser or OS notification permissions.</p>
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <p className="text-xs text-slate-600">Tip: keep alerts enabled for assignment updates, and mute only low-priority browser notifications.</p>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Workspace Security</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Workspace ID: {org?.id?.slice(0, 8) || 'N/A'}...SEC</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">Your organization data is isolated per workspace and persisted with scoped access controls.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">Session</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">Authenticated</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">{user.role || 'member'}</p>
              </div>
            </div>
            <Button size="md" variant="outline" className="w-full">
              <ShieldCheck className="w-4 h-4 mr-2" /> Run Security Check
            </Button>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ToggleRow
              icon={<Monitor className="w-4 h-4" />}
              title="Compact Mode"
              description="Reduce spacing to fit more content on screen."
              enabled={settings.compactMode}
              onToggle={() => handleToggle('compactMode')}
            />
            <div className="grid grid-cols-3 gap-2">
              {(['Light', 'Dark', 'Aurora'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`p-3 rounded-xl border transition-colors text-left ${settings.theme === theme ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className={`w-full h-10 rounded-md ${theme === 'Light' ? 'bg-slate-100 border border-slate-200' : theme === 'Dark' ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-500'}`} />
                  <p className="text-xs font-medium text-slate-700 mt-2 text-center">{theme}</p>
                </button>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs text-slate-600">Theme changes apply instantly across board, modals, and dashboard pages.</p>
            </div>
          </div>
        );
      case 'admin':
        const seatUsage = (allUsers.length / (org?.totalSeats || 1)) * 100;
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Team</h3>
                <p className="text-xs text-slate-500 mt-1">{org?.name || 'Workspace'} • ID {org?.id?.slice(0, 8) || 'N/A'} • Created {new Date(org?.createdAt || 0).toLocaleDateString()}</p>
              </div>
              <span className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-[11px] text-slate-500">Members</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{allUsers.length}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-[11px] text-slate-500">Seat limit</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{org?.totalSeats || 0}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-[11px] text-slate-500">Usage</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{Math.round(seatUsage)}%</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Seat usage</p>
                <p className="text-xs text-slate-500">{allUsers.length} / {org?.totalSeats || 0}</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div style={{ width: `${Math.min(seatUsage, 100)}%` }} className="h-full bg-slate-900 transition-all duration-500" />
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'starter', name: 'Starter', seats: 3 },
                  { id: 'pro', name: 'Pro', seats: 15 },
                  { id: 'enterprise', name: 'Enterprise', seats: 100 }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => handleUpgradeTier(tier.id as any)}
                    disabled={isUpgrading}
                    className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      org?.totalSeats === tier.seats
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tier.name} ({tier.seats})
                  </button>
                ))}
              </div>
              {isUpgrading && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating plan...
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Members</p>
                <Button size="sm" variant="outline" onClick={() => setIsProvisioning(!isProvisioning)} className="h-8 rounded-lg border-slate-200">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add member
                </Button>
              </div>

              {isProvisioning && (
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <form onSubmit={handleProvision} className="flex flex-col sm:flex-row gap-2">
                    <input
                      autoFocus
                      placeholder="Username"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none"
                    />
                    <Button type="submit" size="sm" className="h-9">Add</Button>
                  </form>
                  {provisionError && <p className="text-xs text-rose-600 mt-2">{provisionError}</p>}
                </div>
              )}

              <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img src={u.avatar} className="w-full h-full object-cover" alt={u.displayName} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2 max-w-xs">
                             <input
                              autoFocus
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommitEdit()}
                              className="h-8 w-full px-3 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                             />
                             <button onClick={handleCommitEdit} className="w-8 h-8 bg-slate-900 text-white rounded-lg inline-flex items-center justify-center"><Check className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            {u.displayName} {u.id === user?.id ? '(You)' : ''}
                            <button onClick={() => handleStartEdit(u)} className="p-1 text-slate-300 hover:text-slate-700 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={u.role || 'member'} onChange={(e) => handleUpdateUserRole(u.id, e.target.value as 'admin' | 'member')} disabled={u.id === user?.id} className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none cursor-pointer disabled:opacity-40">
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handlePurgeUser(u.id)}
                        disabled={u.id === user?.id}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-20"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest opacity-20">Section coming soon</div>;
    }
  };

  const navItems: { id: SettingsTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile' as const, label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'general' as const, label: 'General', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'appearance' as const, label: 'Appearance', icon: <Monitor className="w-4 h-4" /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'automation' as const, label: 'Workflows', icon: <Zap className="w-4 h-4" /> });
    navItems.push({ id: 'admin' as const, label: 'Team', icon: <Settings className="w-4 h-4" /> });
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200 h-[90vh] md:h-[80vh] flex flex-col md:flex-row border border-slate-200">
        <div className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex-shrink-0 flex flex-col">
          <div className="p-4 pb-3">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tighter">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200"><Settings className="w-6 h-6 text-white" /></div> Settings
            </h2>
          </div>
          <nav className="flex-1 p-3.5 md:p-4 space-y-1.5 overflow-x-auto no-scrollbar md:overflow-y-auto">
            <div className="flex md:flex-col gap-2">
              {navItems.map((tab) => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id as SettingsTabType); setIsManagingSubscription(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap min-w-max md:w-full ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}>
                  <span className={`${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400'}`}>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth">
            {renderContent()}
          </div>
          <div className="px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
             <div className="flex flex-col text-center sm:text-left">
               <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide">Version</p>
               <p className="text-[11px] font-medium text-slate-900 mt-0.5">Velo 3.0.1</p>
             </div>
             <Button onClick={onClose} variant="outline" size="md" className="px-8">Close</Button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-slate-900 text-white rounded-2xl md:hidden shadow-2xl active:scale-95 transition-transform">
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
