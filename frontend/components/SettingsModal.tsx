import React, { useState, useEffect, useMemo } from 'react';
import { X, Settings, Monitor, Bell, Shield, Sparkles, User, Users, Zap } from 'lucide-react';
import Button from './ui/Button';
import WorkflowBuilder from './WorkflowBuilder';
import { settingsService, UserSettings } from '../services/settingsService';
import { userService } from '../services/userService';
import { OrgInvite, Team, User as UserType, Organization, Project, SecurityGroup, Task } from '../types';
import SettingsProjectsTab from './settings/SettingsProjectsTab';
import SettingsAdminTab from './settings/SettingsAdminTab';
import { groupService } from '../services/groupService';
import { realtimeService } from '../services/realtimeService';
import SettingsTeamsTab from './settings/SettingsTeamsTab';
import { teamService } from '../services/teamService';
import SettingsCoreTabs from './settings/SettingsCoreTabs';
import { dialogService } from '../services/dialogService';
import SettingsDangerTab from './settings/SettingsDangerTab';

export type SettingsTabType = 'profile' | 'general' | 'notifications' | 'security' | 'appearance' | 'groups' | 'teams' | 'licenses' | 'automation' | 'projects' | 'danger';

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
  onChangeProjectOwner?: (id: string, ownerId: string) => void;
  onDeleteOrganization?: () => void;
  onUserUpdated?: (user: UserType) => void;
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
  onPurgeProject,
  onChangeProjectOwner,
  onDeleteOrganization,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());
  const [profileUser, setProfileUser] = useState<UserType | null>(user || null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [groups, setGroups] = useState<SecurityGroup[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'member' | 'admin'>('member');
  const [newInviteIdentifier, setNewInviteIdentifier] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'member' | 'admin'>('member');
  const [seatPurchaseCount, setSeatPurchaseCount] = useState(5);
  const [provisionError, setProvisionError] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFirstNameValue, setEditFirstNameValue] = useState('');
  const [editLastNameValue, setEditLastNameValue] = useState('');
  const [editEmailValue, setEditEmailValue] = useState('');
  const [projectQuery, setProjectQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen && user) {
      setActiveTab(initialTab);
      setSettings(settingsService.getSettings());
      setProfileUser(user);
      setAllUsers(userService.getUsers(user.orgId));
      setGroups(groupService.getGroups(user.orgId));
      setTeams(teamService.getTeams(user.orgId));
      setInvites(userService.getInvites(user.orgId));
      setOrg(userService.getOrganization(user.orgId));
      setEditingUserId(null);
    }
  }, [isOpen, initialTab, user]);

  useEffect(() => {
    if (!isOpen || !user) return undefined;
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type !== 'GROUPS_UPDATED') return;
      if (event.orgId && event.orgId !== user.orgId) return;
      setGroups(groupService.getGroups(user.orgId));
    });
    return () => unsubscribe();
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || !user) return undefined;
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type !== 'TEAMS_UPDATED') return;
      if (event.orgId && event.orgId !== user.orgId) return;
      setTeams(teamService.getTeams(user.orgId));
    });
    return () => unsubscribe();
  }, [isOpen, user]);

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
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setProvisionError('Username and email are required.');
      return;
    }

    const result = userService.provisionUser(user.orgId, newUserName, newUserRole, {
      firstName: newUserFirstName,
      lastName: newUserLastName,
      email: newUserEmail
    });
    if (result.success) {
      setAllUsers(userService.getUsers(user.orgId));
      setNewUserName('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserEmail('');
      setNewUserRole('member');
      setIsProvisioning(false);
    } else {
      setProvisionError(result.error || 'Could not add seat.');
    }
  };

  const handleUpdateUserRole = (userId: string, role: 'admin' | 'member') => {
    const updatedAll = userService.updateUser(userId, { role });
    setAllUsers(updatedAll.filter(u => u.orgId === user.orgId));
    setInvites(userService.getInvites(user.orgId));
  };

  const handleStartEdit = (targetUser: UserType) => {
    const parts = (targetUser.displayName || '').trim().split(/\s+/).filter(Boolean);
    setEditingUserId(targetUser.id);
    setEditFirstNameValue(targetUser.firstName || parts[0] || '');
    setEditLastNameValue(targetUser.lastName || parts.slice(1).join(' '));
    setEditEmailValue(targetUser.email || '');
  };

  const handleCommitEdit = () => {
    if (!editingUserId) return;
    const firstName = editFirstNameValue.trim();
    const lastName = editLastNameValue.trim();
    const email = editEmailValue.trim().toLowerCase();
    if (!firstName || !lastName || !email) return;
    const displayName = `${firstName} ${lastName}`.trim();
    const updatedAll = userService.updateUser(editingUserId, {
      firstName,
      lastName,
      email,
      displayName
    });
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
      setInvites(userService.getInvites(user.orgId));
    }
  };

  const handleBuyMoreSeats = () => {
    if (!org) return;
    const updatedOrg = userService.addSeats(org.id, seatPurchaseCount);
    if (updatedOrg) setOrg(updatedOrg);
  };

  const handleCreateInvite = async () => {
    const result = userService.createInvite(user.orgId, user.id, {
      role: newInviteRole,
      invitedIdentifier: newInviteIdentifier.trim() || undefined,
      ttlDays: 14,
      maxUses: 1
    });
    if (!result.success || !result.invite) {
      await dialogService.notice(result.error || 'Could not create invite.', { title: 'Invite error' });
      return;
    }
    setInvites(userService.getInvites(user.orgId));
    setNewInviteIdentifier('');
    await dialogService.notice(`Invite token: ${result.invite.token}`, { title: 'Invite created' });
  };

  const handleAvatarUpdate = async (avatar: string) => {
    if (!user) return;
    const fallbackAvatar = (profileUser?.avatar || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`).trim();
    const nextAvatar = avatar.trim() || fallbackAvatar;
    const updatedAll = userService.updateUser(user.id, { avatar: nextAvatar });
    const updatedCurrent = updatedAll.find((candidate) => candidate.id === user.id) || null;
    setAllUsers(updatedAll.filter((candidate) => candidate.orgId === user.orgId));
    if (updatedCurrent) {
      setProfileUser(updatedCurrent);
      onUserUpdated?.(updatedCurrent);
    }
    await dialogService.notice('Avatar updated.', { title: 'Profile' });
  };

  const handleRevokeInvite = (inviteId: string) => {
    const result = userService.revokeInvite(inviteId, user.id);
    if (!result.success) return;
    setInvites(userService.getInvites(user.orgId));
  };

  const submitProjectRename = () => {
    if (!editingProjectId || !onRenameProject) return;
    const trimmed = editingProjectName.trim();
    if (!trimmed) return;
    onRenameProject(editingProjectId, trimmed);
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleDeleteOrganization = async () => {
    if (!user || !onDeleteOrganization || user.role !== 'admin') return;
    const confirmed = await dialogService.confirm(
      'Delete this entire workspace and all related data? This action cannot be undone.',
      { title: 'Delete workspace', confirmText: 'Delete workspace', danger: true }
    );
    if (!confirmed) return;
    onDeleteOrganization();
    onClose();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'automation':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-base font-semibold text-slate-900">Workflow Rules</h3>
              <p className="text-xs text-slate-500 mt-1">Automate repetitive actions with compact trigger/action rules.</p>
            </div>
            <WorkflowBuilder orgId={user.orgId} allUsers={allUsers} />
          </div>
        );
      case 'projects':
        return (
          <SettingsProjectsTab
            currentUserRole={user.role}
            currentUserId={user.id}
            allUsers={allUsers}
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
            onChangeProjectOwner={onChangeProjectOwner}
          />
        );
      case 'teams':
        return (
          <SettingsTeamsTab
            currentUser={user}
            allUsers={allUsers}
            teams={teams}
            groups={groups}
            projects={projects}
            onTeamsChanged={setTeams}
            onGroupsChanged={setGroups}
          />
        );
      case 'groups':
        return (
          <SettingsTeamsTab
            currentUser={user}
            allUsers={allUsers}
            teams={teams}
            groups={groups}
            projects={projects}
            onTeamsChanged={setTeams}
            onGroupsChanged={setGroups}
          />
        );
      case 'profile':
      case 'general':
      case 'notifications':
      case 'security':
      case 'appearance':
        return (
          <SettingsCoreTabs
            activeTab={activeTab}
            user={profileUser || user}
            org={org}
            teams={teams}
            groups={groups}
            settings={settings}
            onToggle={handleToggle}
            onThemeChange={handleThemeChange}
            onThresholdChange={(value) => {
              const updated = settingsService.updateSettings({ estimationApprovalThreshold: value });
              setSettings(updated);
            }}
            onAvatarUpdate={handleAvatarUpdate}
          />
        );
      case 'licenses':
        return (
          <SettingsAdminTab
            user={user}
            org={org}
            allUsers={allUsers}
            isProvisioning={isProvisioning}
            setIsProvisioning={setIsProvisioning}
            newUserName={newUserName}
            setNewUserName={setNewUserName}
            newUserFirstName={newUserFirstName}
            setNewUserFirstName={setNewUserFirstName}
            newUserLastName={newUserLastName}
            setNewUserLastName={setNewUserLastName}
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
            newUserRole={newUserRole}
            setNewUserRole={setNewUserRole}
            provisionError={provisionError}
            handleProvision={handleProvision}
            seatPurchaseCount={seatPurchaseCount}
            setSeatPurchaseCount={setSeatPurchaseCount}
            handleBuyMoreSeats={handleBuyMoreSeats}
            editingUserId={editingUserId}
            editFirstNameValue={editFirstNameValue}
            setEditFirstNameValue={setEditFirstNameValue}
            editLastNameValue={editLastNameValue}
            setEditLastNameValue={setEditLastNameValue}
            editEmailValue={editEmailValue}
            setEditEmailValue={setEditEmailValue}
            handleCommitEdit={handleCommitEdit}
            handleStartEdit={handleStartEdit}
            handleUpdateUserRole={handleUpdateUserRole}
            handlePurgeUser={handlePurgeUser}
            invites={invites}
            newInviteIdentifier={newInviteIdentifier}
            setNewInviteIdentifier={setNewInviteIdentifier}
            newInviteRole={newInviteRole}
            setNewInviteRole={setNewInviteRole}
            handleCreateInvite={handleCreateInvite}
            handleRevokeInvite={handleRevokeInvite}
          />
        );
      case 'danger':
        return (
          <SettingsDangerTab
            user={user}
            org={org}
            onDeleteOrganization={handleDeleteOrganization}
          />
        );
      default:
        return (
          <SettingsCoreTabs
            activeTab="general"
            user={profileUser || user}
            org={org}
            teams={teams}
            groups={groups}
            settings={settings}
            onToggle={handleToggle}
            onThemeChange={handleThemeChange}
            onThresholdChange={(value) => {
              const updated = settingsService.updateSettings({ estimationApprovalThreshold: value });
              setSettings(updated);
            }}
            onAvatarUpdate={handleAvatarUpdate}
          />
        );
    }
  };

  const navItems: { id: SettingsTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile' as const, label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'general' as const, label: 'General', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'appearance' as const, label: 'Appearance', icon: <Monitor className="w-4 h-4" /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'teams' as const, label: 'Teams & Access', icon: <Users className="w-4 h-4" /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'automation' as const, label: 'Workflows', icon: <Zap className="w-4 h-4" /> });
    navItems.push({ id: 'licenses' as const, label: 'Licenses', icon: <Settings className="w-4 h-4" /> });
    navItems.push({ id: 'danger' as const, label: 'Danger Zone', icon: <Shield className="w-4 h-4" /> });
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200 h-[90vh] md:h-[80vh] flex flex-col md:flex-row border border-slate-200">
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex-shrink-0 flex flex-col">
          <div className="p-4 pb-3">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tighter">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200"><Settings className="w-6 h-6 text-white" /></div> Settings
            </h2>
          </div>
          <nav className="flex-1 p-3.5 md:p-4 space-y-1.5 overflow-x-auto no-scrollbar md:overflow-y-auto">
            <div className="flex md:flex-col gap-2">
              {navItems.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as SettingsTabType)} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors whitespace-nowrap min-w-max md:w-full ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
