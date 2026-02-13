import React, { useMemo, useState } from 'react';
import { Building2, FolderLock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { Project, SecurityGroup, Team, User } from '../../types';
import { teamService } from '../../services/teamService';
import { groupService } from '../../services/groupService';
import { dialogService } from '../../services/dialogService';

interface SettingsTeamsTabProps {
  currentUser: User;
  allUsers: User[];
  teams: Team[];
  groups: SecurityGroup[];
  projects: Project[];
  onTeamsChanged: (teams: Team[]) => void;
  onGroupsChanged: (groups: SecurityGroup[]) => void;
}

const getProjectOwnerId = (project?: Project) => project?.createdBy || project?.members?.[0];

type AccessTab = 'teams' | 'groups';
type GroupDraftScope = 'global' | 'project';

const SettingsTeamsTab: React.FC<SettingsTeamsTabProps> = ({
  currentUser,
  allUsers,
  teams,
  groups,
  projects,
  onTeamsChanged,
  onGroupsChanged
}) => {
  const [activeTab, setActiveTab] = useState<AccessTab>('teams');
  const [query, setQuery] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingLeadId, setEditingLeadId] = useState('');
  const [editingMembers, setEditingMembers] = useState<string[]>([]);

  const [groupName, setGroupName] = useState('');
  const [groupScope, setGroupScope] = useState<GroupDraftScope>('global');
  const [groupProjectId, setGroupProjectId] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupMembers, setEditingGroupMembers] = useState<string[]>([]);

  const [error, setError] = useState('');

  const orgUsers = useMemo(() => allUsers.filter((user) => user.orgId === currentUser.orgId), [allUsers, currentUser.orgId]);
  const orgProjects = useMemo(() => projects.filter((project) => project.orgId === currentUser.orgId), [projects, currentUser.orgId]);
  const canManageTeams = currentUser.role === 'admin';

  const ownedProjects = useMemo(() => {
    if (currentUser.role === 'admin') return orgProjects;
    return orgProjects.filter((project) => getProjectOwnerId(project) === currentUser.id);
  }, [orgProjects, currentUser.id, currentUser.role]);

  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name)), [teams]);
  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.name.localeCompare(b.name)), [groups]);

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedTeams;
    return sortedTeams.filter((team) => `${team.name} ${team.description || ''}`.toLowerCase().includes(q));
  }, [sortedTeams, query]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedGroups;
    return sortedGroups.filter((group) => `${group.name} ${group.scope}`.toLowerCase().includes(q));
  }, [sortedGroups, query]);

  const refreshTeams = () => onTeamsChanged(teamService.getTeams(currentUser.orgId));
  const refreshGroups = () => onGroupsChanged(groupService.getGroups(currentUser.orgId));

  const toggleMember = (ids: string[], setIds: (next: string[]) => void, userId: string) => {
    setIds(ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]);
  };

  const createTeam = () => {
    if (!canManageTeams) return;
    setError('');
    const result = teamService.createTeam(currentUser, currentUser.orgId, {
      name,
      description,
      leadId: leadId || undefined,
      memberIds
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setName('');
    setDescription('');
    setLeadId('');
    setMemberIds([]);
    setShowCreateTeam(false);
    refreshTeams();
  };

  const startEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingName(team.name);
    setEditingDescription(team.description || '');
    setEditingLeadId(team.leadId || '');
    setEditingMembers(team.memberIds || []);
    setError('');
  };

  const saveEditTeam = () => {
    if (!editingTeamId || !canManageTeams) return;
    const result = teamService.updateTeam(currentUser, editingTeamId, {
      name: editingName,
      description: editingDescription,
      leadId: editingLeadId || undefined,
      memberIds: editingMembers
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingTeamId(null);
    setEditingName('');
    setEditingDescription('');
    setEditingLeadId('');
    setEditingMembers([]);
    refreshTeams();
  };

  const removeTeam = async (team: Team) => {
    if (!canManageTeams) return;
    const confirmed = await dialogService.confirm(`Delete team "${team.name}"?`, {
      title: 'Delete team',
      confirmText: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    const result = teamService.deleteTeam(currentUser, team.id);
    if (!result.success) {
      setError(result.error || 'Unable to delete team.');
      return;
    }
    refreshTeams();
  };

  const canEditGroup = (group: SecurityGroup) => {
    if (group.scope === 'global') return currentUser.role === 'admin';
    if (currentUser.role === 'admin') return true;
    const project = orgProjects.find((candidate) => candidate.id === group.projectId);
    return getProjectOwnerId(project) === currentUser.id;
  };

  const createGroup = () => {
    setError('');
    const result = groupService.createGroup(
      currentUser,
      currentUser.orgId,
      {
        name: groupName,
        scope: groupScope,
        projectId: groupScope === 'project' ? groupProjectId : undefined,
        memberIds: groupMemberIds
      },
      orgProjects
    );
    if (result.error) {
      setError(result.error);
      return;
    }
    setGroupName('');
    setGroupScope('global');
    setGroupProjectId('');
    setGroupMemberIds([]);
    setShowCreateGroup(false);
    refreshGroups();
  };

  const startEditGroup = (group: SecurityGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
    setEditingGroupMembers(group.memberIds || []);
    setError('');
  };

  const saveEditGroup = () => {
    if (!editingGroupId) return;
    const result = groupService.updateGroup(currentUser, editingGroupId, {
      name: editingGroupName,
      memberIds: editingGroupMembers
    }, orgProjects);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingGroupId(null);
    setEditingGroupName('');
    setEditingGroupMembers([]);
    refreshGroups();
  };

  const removeGroup = async (group: SecurityGroup) => {
    const confirmed = await dialogService.confirm(`Delete group "${group.name}"?`, {
      title: 'Delete group',
      confirmText: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    const result = groupService.deleteGroup(currentUser, group.id, orgProjects);
    if (!result.success) {
      setError(result.error || 'Unable to delete group.');
      return;
    }
    refreshGroups();
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
        <h3 className="text-base font-semibold text-slate-900">Teams & Access</h3>
        <p className="mt-1 text-xs text-slate-500">Manage organization teams and security groups.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-2 border-b border-slate-200/80 bg-slate-50/80">
          <button
            onClick={() => setActiveTab('teams')}
            className={`h-10 text-sm font-medium ${activeTab === 'teams' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" /> Teams</span>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`h-10 text-sm font-medium border-l border-slate-200 ${activeTab === 'groups' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="inline-flex items-center gap-2"><FolderLock className="h-4 w-4" /> Security Groups</span>
          </button>
        </div>

        <div className="p-3.5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="relative w-full sm:w-[280px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={activeTab === 'teams' ? 'Search team name or lead' : 'Search group name or scope'}
                className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>
            {activeTab === 'teams' ? (
              <Button size="sm" onClick={() => setShowCreateTeam((prev) => !prev)} disabled={!canManageTeams}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Team
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowCreateGroup((prev) => !prev)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Group
              </Button>
            )}
          </div>

          {activeTab === 'teams' && showCreateTeam ? (
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 grid gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" className="h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none" />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none" />
              <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none">
                <option value="">Select lead</option>
                {orgUsers.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </select>
              <div className="grid max-h-24 grid-cols-2 gap-2 overflow-y-auto custom-scrollbar">
                {orgUsers.map((member) => (
                  <label key={member.id} className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
                    <input type="checkbox" checked={memberIds.includes(member.id)} onChange={() => toggleMember(memberIds, setMemberIds, member.id)} />
                    <span className="truncate">{member.displayName}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={createTeam} disabled={!name.trim()}>Save team</Button>
              </div>
            </div>
          ) : null}

          {activeTab === 'groups' && showCreateGroup ? (
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 grid gap-2">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" className="h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none" />
              <select value={groupScope} onChange={(e) => setGroupScope(e.target.value as GroupDraftScope)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none">
                <option value="global">Global</option>
                <option value="project">Project</option>
              </select>
              {groupScope === 'project' ? (
                <select value={groupProjectId} onChange={(e) => setGroupProjectId(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none">
                  <option value="">Select project</option>
                  {ownedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              ) : null}
              <div className="grid max-h-24 grid-cols-2 gap-2 overflow-y-auto custom-scrollbar">
                {orgUsers.map((member) => (
                  <label key={member.id} className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
                    <input type="checkbox" checked={groupMemberIds.includes(member.id)} onChange={() => toggleMember(groupMemberIds, setGroupMemberIds, member.id)} />
                    <span className="truncate">{member.displayName}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={createGroup} disabled={!groupName.trim() || (groupScope === 'project' && !groupProjectId)}>Save group</Button>
              </div>
            </div>
          ) : null}

          <div className="max-h-[44vh] overflow-auto rounded-lg border border-slate-200/90">
            {activeTab === 'teams' ? (
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5">Team Name</th>
                    <th className="px-3 py-1.5">Description</th>
                    <th className="px-3 py-1.5">Team Lead</th>
                    <th className="px-3 py-1.5">Members</th>
                    <th className="px-3 py-1.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team) => {
                    const isEditing = editingTeamId === team.id;
                    const teamLead = orgUsers.find((member) => member.id === team.leadId);
                    return (
                      <tr key={team.id} className="border-t border-slate-200/80 align-top">
                        <td className="px-3 py-1.5">
                          {isEditing ? <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="h-8 w-full rounded-md border border-slate-300 px-2 text-sm outline-none" /> : <span className="font-medium text-slate-900">{team.name}</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          {isEditing ? <input value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} className="h-8 w-full rounded-md border border-slate-300 px-2 text-sm outline-none" /> : <span className="text-slate-700">{team.description || '-'}</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          {isEditing ? (
                            <select value={editingLeadId} onChange={(e) => setEditingLeadId(e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none">
                              <option value="">Select lead</option>
                              {orgUsers.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
                            </select>
                          ) : (
                            <span>{teamLead?.displayName || 'Unassigned'}</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {isEditing ? (
                            <div className="grid max-h-20 grid-cols-2 gap-1 overflow-y-auto custom-scrollbar">
                              {orgUsers.map((member) => (
                                <label key={member.id} className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 text-[11px]">
                                  <input type="checkbox" checked={editingMembers.includes(member.id)} onChange={() => toggleMember(editingMembers, setEditingMembers, member.id)} />
                                  <span className="truncate">{member.displayName}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <span>{team.memberIds.length} members</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {canManageTeams ? (
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <Button size="sm" onClick={saveEditTeam}>Save</Button>
                              ) : (
                                <button onClick={() => startEditTeam(team)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"><Pencil className="h-4 w-4" /></button>
                              )}
                              <button onClick={() => removeTeam(team)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ) : <span className="text-xs text-slate-400">Read only</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5">Group Name</th>
                    <th className="px-3 py-1.5">Scope</th>
                    <th className="px-3 py-1.5">Project</th>
                    <th className="px-3 py-1.5">Members</th>
                    <th className="px-3 py-1.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => {
                    const isEditing = editingGroupId === group.id;
                    const project = orgProjects.find((item) => item.id === group.projectId);
                    const editable = canEditGroup(group);
                    return (
                      <tr key={group.id} className="border-t border-slate-200/80 align-top">
                        <td className="px-3 py-1.5">
                          {isEditing ? <input value={editingGroupName} onChange={(e) => setEditingGroupName(e.target.value)} className="h-8 w-full rounded-md border border-slate-300 px-2 text-sm outline-none" /> : <span className="font-medium text-slate-900">{group.name}</span>}
                        </td>
                        <td className="px-3 py-1.5">{group.scope === 'global' ? 'Global' : 'Project'}</td>
                        <td className="px-3 py-1.5">{group.scope === 'project' ? (project?.name || 'Unknown') : '-'}</td>
                        <td className="px-3 py-1.5">
                          {isEditing ? (
                            <div className="grid max-h-20 grid-cols-2 gap-1 overflow-y-auto custom-scrollbar">
                              {orgUsers.map((member) => (
                                <label key={member.id} className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 text-[11px]">
                                  <input type="checkbox" checked={editingGroupMembers.includes(member.id)} onChange={() => toggleMember(editingGroupMembers, setEditingGroupMembers, member.id)} />
                                  <span className="truncate">{member.displayName}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <span>{group.memberIds.length} members</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {editable ? (
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <Button size="sm" onClick={saveEditGroup}>Save</Button>
                              ) : (
                                <button onClick={() => startEditGroup(group)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"><Pencil className="h-4 w-4" /></button>
                              )}
                              <button onClick={() => removeGroup(group)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ) : <span className="text-xs text-slate-400">Read only</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
};

export default SettingsTeamsTab;
