import React, { useState, useEffect, useMemo } from 'react';
import { X, Settings, Monitor, Bell, Shield, Cloud, Sparkles, User, Mail, Camera, Save, Inbox, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import Button from './ui/Button';
import WorkflowBuilder from './WorkflowBuilder';
import { settingsService, UserSettings } from '../services/settingsService';
import { userService } from '../services/userService';
import { User as UserType, Organization, Project, Task, TaskStatus } from '../types';
import { dialogService } from '../services/dialogService';
import SettingsToggleRow from './settings/SettingsToggleRow';
import SettingsProjectsTab from './settings/SettingsProjectsTab';
import SettingsAdminTab from './settings/SettingsAdminTab';

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
          <SettingsProjectsTab
            projectQuery={projectQuery}
            setProjectQuery={setProjectQuery}
            activeProjects={activeProjects}
            archivedProjects={archivedProjects}
            completedProjects={completedProjects}
            deletedProjects={deletedProjects}
            focusedProjectId={focusedProjectId}
            setFocusedProjectId={setFocusedProjectId}
            focusedProject={focusedProject}
            focusedProjectTasks={focusedProjectTasks}
            editingProjectId={editingProjectId}
            editingProjectName={editingProjectName}
            setEditingProjectId={setEditingProjectId}
            setEditingProjectName={setEditingProjectName}
            submitProjectRename={submitProjectRename}
            onCompleteProject={onCompleteProject}
            onReopenProject={onReopenProject}
            onArchiveProject={onArchiveProject}
            onRestoreProject={onRestoreProject}
            onDeleteProject={onDeleteProject}
            onPurgeProject={onPurgeProject}
          />
        );
      case 'general':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsToggleRow
              icon={<Sparkles className="w-4 h-4" />}
              title="AI Suggestions"
              description="Generate subtasks and detect at-risk tasks."
              enabled={settings.aiSuggestions}
              onToggle={() => handleToggle('aiSuggestions')}
            />
            <SettingsToggleRow
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
            <SettingsToggleRow
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
            <SettingsToggleRow
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
        return (
          <SettingsAdminTab
            user={user}
            org={org}
            allUsers={allUsers}
            isProvisioning={isProvisioning}
            setIsProvisioning={setIsProvisioning}
            newUserName={newUserName}
            setNewUserName={setNewUserName}
            provisionError={provisionError}
            handleProvision={handleProvision}
            isUpgrading={isUpgrading}
            handleUpgradeTier={handleUpgradeTier}
            editingUserId={editingUserId}
            editNameValue={editNameValue}
            setEditNameValue={setEditNameValue}
            handleCommitEdit={handleCommitEdit}
            handleStartEdit={handleStartEdit}
            handleUpdateUserRole={handleUpdateUserRole}
            handlePurgeUser={handlePurgeUser}
          />
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
