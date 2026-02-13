
import { OrgInvite, User, Organization } from '../types';
import { realtimeService } from './realtimeService';
import { createId } from '../utils/id';
import { TASKS_STORAGE_KEY } from './task-service/storage';

const USERS_KEY = 'velo_users';
const ORGS_KEY = 'velo_orgs';
const SESSION_KEY = 'velo_session';
const INVITES_KEY = 'velo_org_invites';
const PROJECTS_KEY = 'velo_projects';
const GROUPS_KEY = 'velo_security_groups';
const TEAMS_KEY = 'velo_teams';
const WORKFLOWS_KEY = 'velo_workflows';
const PROJECT_CHAT_KEY = 'velo_project_owner_chat';
const SAVED_VIEWS_KEY = 'velo_saved_views';
const NOTIFICATIONS_KEY = 'velo_notifications';
const ESTIMATION_PROFILES_KEY = 'velo_estimation_profiles_v1';
const PRESENCE_KEY_PREFIX = 'velo_presence_v1:';

const PLAN_DEFAULT_SEATS: Record<'free' | 'basic' | 'pro', number> = {
  free: 3,
  basic: 15,
  pro: 100
};

const PLAN_SEAT_PRICE: Record<'free' | 'basic' | 'pro', number> = {
  free: 0,
  basic: 5,
  pro: 7
};

const extractEmailDomain = (email?: string): string | null => {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1]?.trim().toLowerCase();
  return domain || null;
};

const inferOrgEmailDomain = (orgId: string): string => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const domains = users
    .filter((user) => user.orgId === orgId)
    .map((user) => extractEmailDomain(user.email))
    .filter((domain): domain is string => Boolean(domain));
  if (domains.length === 0) return 'velo.ai';
  const counts = new Map<string, number>();
  domains.forEach((domain) => counts.set(domain, (counts.get(domain) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
};

const emitUsersUpdated = (orgId?: string, actorId?: string, userId?: string) => {
  realtimeService.publish({
    type: 'USERS_UPDATED',
    orgId,
    actorId,
    payload: userId ? { userId } : undefined
  });
};

export const userService = {
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  getOrganization: (orgId: string): Organization | null => {
    const orgs: Organization[] = JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
    return orgs.find(o => o.id === orgId) || null;
  },

  getOrganizations: (): Organization[] => {
    return JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
  },

  updateOrganization: (orgId: string, updates: Partial<Organization>): Organization | null => {
    const orgs: Organization[] = JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
    let updatedOrg: Organization | null = null;
    const newOrgs = orgs.map(o => {
      if (o.id === orgId) {
        updatedOrg = { ...o, ...updates };
        return updatedOrg;
      }
      return o;
    });
    localStorage.setItem(ORGS_KEY, JSON.stringify(newOrgs));
    emitUsersUpdated(orgId);
    return updatedOrg;
  },

  addSeats: (orgId: string, seatsToAdd: number): Organization | null => {
    if (!Number.isFinite(seatsToAdd) || seatsToAdd <= 0) return userService.getOrganization(orgId);
    const org = userService.getOrganization(orgId);
    if (!org) return null;
    return userService.updateOrganization(orgId, { totalSeats: Math.max(org.totalSeats, org.totalSeats + Math.round(seatsToAdd)) });
  },

  getInvites: (orgId?: string): OrgInvite[] => {
    const invites: OrgInvite[] = JSON.parse(localStorage.getItem(INVITES_KEY) || '[]');
    if (orgId) return invites.filter((invite) => invite.orgId === orgId);
    return invites;
  },

  createInvite: (
    orgId: string,
    createdBy: string,
    options?: { role?: 'member' | 'admin'; invitedIdentifier?: string; ttlDays?: number; maxUses?: number }
  ): { success: boolean; invite?: OrgInvite; error?: string } => {
    const org = userService.getOrganization(orgId);
    if (!org) return { success: false, error: 'Organization not found.' };
    const token = `velo_${createId().slice(0, 10)}`;
    const invite: OrgInvite = {
      id: createId(),
      orgId,
      token,
      role: options?.role || 'member',
      createdBy,
      createdAt: Date.now(),
      expiresAt: Date.now() + Math.max(1, options?.ttlDays || 14) * 24 * 60 * 60 * 1000,
      maxUses: options?.maxUses || 1,
      usedCount: 0,
      invitedIdentifier: options?.invitedIdentifier?.trim() || undefined
    };
    const invites = userService.getInvites();
    localStorage.setItem(INVITES_KEY, JSON.stringify([invite, ...invites]));
    emitUsersUpdated(orgId, createdBy);
    return { success: true, invite };
  },

  revokeInvite: (inviteId: string, actorId: string): { success: boolean; error?: string } => {
    const invites = userService.getInvites();
    const target = invites.find((invite) => invite.id === inviteId);
    if (!target) return { success: false, error: 'Invite not found.' };
    const updated = invites.map((invite) => invite.id === inviteId ? { ...invite, revoked: true } : invite);
    localStorage.setItem(INVITES_KEY, JSON.stringify(updated));
    emitUsersUpdated(target.orgId, actorId);
    return { success: true };
  },

  getUsers: (orgId?: string): User[] => {
    const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (orgId) return allUsers.filter(u => u.orgId === orgId);
    return allUsers;
  },

  updateUser: (userId: string, updates: Partial<User>): User[] => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const updatedUsers = users.map((u: User) => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    const current = userService.getCurrentUser();
    if (current && current.id === userId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...updates }));
    }
    emitUsersUpdated(updatedUsers.find((u) => u.id === userId)?.orgId, userId, userId);
    return updatedUsers;
  },

  deleteUser: (userId: string): User[] => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const updated = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    emitUsersUpdated(users.find((u) => u.id === userId)?.orgId, userId, userId);
    return updated;
  },

  provisionUser: (
    orgId: string,
    username: string,
    role: 'admin' | 'member' = 'member',
    profile?: { firstName?: string; lastName?: string; email?: string }
  ): { success: boolean; error?: string; user?: User } => {
    const org = userService.getOrganization(orgId);
    const orgUsers = userService.getUsers(orgId);
    if (!org) return { success: false, error: 'Organization identifier mismatch.' };
    if (orgUsers.length >= org.totalSeats) {
      return { success: false, error: `License threshold reached (${org.totalSeats} nodes).` };
    }
    const allUsers = userService.getUsers();
    const normalizedInput = username.toLowerCase().trim();
    const hasEmailInput = normalizedInput.includes('@');
    const cleanUsername = hasEmailInput ? normalizedInput.split('@')[0] : normalizedInput;
    const orgDomain = inferOrgEmailDomain(orgId);
    const explicitEmail = profile?.email?.trim().toLowerCase();
    const resolvedEmail = explicitEmail || (hasEmailInput ? normalizedInput : `${cleanUsername}@${orgDomain}`);
    const firstName = profile?.firstName?.trim() || '';
    const lastName = profile?.lastName?.trim() || '';
    const displayName = `${firstName} ${lastName}`.trim() || username.charAt(0).toUpperCase() + username.slice(1);
    if (!cleanUsername) {
      return { success: false, error: 'Username is required.' };
    }
    if (!resolvedEmail) {
      return { success: false, error: 'Email is required.' };
    }
    if (allUsers.find(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'Identity already exists in cluster.' };
    }
    if (allUsers.find(u => (u.email || '').toLowerCase() === resolvedEmail)) {
      return { success: false, error: 'Email already exists in cluster.' };
    }
    const newUser: User = {
      id: createId(),
      orgId,
      username: cleanUsername,
      displayName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: resolvedEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      role
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...allUsers, newUser]));
    emitUsersUpdated(orgId, newUser.id, newUser.id);
    return { success: true, user: newUser };
  },

  register: (
    identifier: string,
    orgName?: string,
    options?: { plan?: 'free' | 'basic' | 'pro'; totalSeats?: number }
  ): User => {
    const allUsers = userService.getUsers();
    const cleanId = identifier.toLowerCase().trim();
    const existing = allUsers.find((u: User) => u.username === cleanId || u.email === cleanId);
    if (existing) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(existing));
      return existing;
    }
    const orgs: Organization[] = JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
    const newOrgId = createId();
    const newUserId = createId();
    const plan = options?.plan || 'basic';
    const selectedSeats = Number.isFinite(options?.totalSeats as number) ? Number(options?.totalSeats) : PLAN_DEFAULT_SEATS[plan];
    const totalSeats = Math.max(1, Math.round(selectedSeats));
    const newOrg: Organization = {
      id: newOrgId,
      name: orgName || `${cleanId}'s Cluster`,
      totalSeats,
      ownerId: newUserId,
      createdAt: Date.now(),
      plan,
      seatPrice: PLAN_SEAT_PRICE[plan],
      billingCurrency: 'USD'
    };
    orgs.push(newOrg);
    localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
    const newUser: User = { 
      id: newUserId, 
      orgId: newOrgId, 
      username: cleanId,
      displayName: cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
      email: cleanId.includes('@') ? cleanId : `${cleanId}@velo.ai`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanId}`,
      role: 'admin'
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...allUsers, newUser]));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    emitUsersUpdated(newOrgId, newUser.id, newUser.id);
    return newUser;
  },

  login: (identifier: string): User | null => {
    const users = userService.getUsers();
    const user = users.find((u: User) => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase());
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  acceptInvite: (token: string, identifier: string): { success: boolean; error?: string; user?: User } => {
    const cleanToken = token.trim();
    const cleanId = identifier.toLowerCase().trim();
    if (!cleanToken) return { success: false, error: 'Invite token is required.' };
    if (!cleanId) return { success: false, error: 'Username or email is required.' };

    const invites = userService.getInvites();
    const inviteIndex = invites.findIndex((item) => item.token === cleanToken);
    if (inviteIndex < 0) return { success: false, error: 'Invite token not found.' };
    const invite = invites[inviteIndex];
    if (invite.revoked) return { success: false, error: 'This invite has been revoked.' };
    if (invite.expiresAt < Date.now()) return { success: false, error: 'This invite has expired.' };
    if ((invite.maxUses || 1) <= invite.usedCount) return { success: false, error: 'This invite has reached its usage limit.' };
    if (invite.invitedIdentifier && invite.invitedIdentifier.toLowerCase() !== cleanId) {
      return { success: false, error: 'This invite is restricted to a different identifier.' };
    }

    const org = userService.getOrganization(invite.orgId);
    if (!org) return { success: false, error: 'Organization no longer exists.' };
    const orgUsers = userService.getUsers(org.id);
    if (orgUsers.length >= org.totalSeats) {
      return { success: false, error: `No available licenses in ${org.name}. Ask admin to buy more seats.` };
    }

    const allUsers = userService.getUsers();
    const exists = allUsers.find((user) => user.username.toLowerCase() === cleanId || user.email?.toLowerCase() === cleanId);
    if (exists) {
      return { success: false, error: 'This identifier is already in use.' };
    }

    const newUser: User = {
      id: createId(),
      orgId: org.id,
      username: cleanId.includes('@') ? cleanId.split('@')[0] : cleanId,
      displayName: cleanId.includes('@') ? cleanId.split('@')[0].replace(/\b\w/g, (c) => c.toUpperCase()) : cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
      email: cleanId.includes('@') ? cleanId : `${cleanId}@${inferOrgEmailDomain(org.id)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanId}`,
      role: invite.role
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...allUsers, newUser]));
    const updatedInvites = [...invites];
    updatedInvites[inviteIndex] = { ...invite, usedCount: invite.usedCount + 1 };
    localStorage.setItem(INVITES_KEY, JSON.stringify(updatedInvites));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    emitUsersUpdated(org.id, newUser.id, newUser.id);
    return { success: true, user: newUser };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  deleteOrganization: (
    actorId: string,
    orgId: string
  ): { success: boolean; error?: string } => {
    const actor = userService.getUsers(orgId).find((candidate) => candidate.id === actorId);
    if (!actor) return { success: false, error: 'Actor not found in organization.' };
    if (actor.role !== 'admin') return { success: false, error: 'Only admins can delete organization.' };

    const allUsers = userService.getUsers();
    const orgUserIds = new Set(allUsers.filter((item) => item.orgId === orgId).map((item) => item.id));

    const safeRead = <T>(key: string): T[] => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    };

    const writeArray = <T>(key: string, items: T[]) => {
      localStorage.setItem(key, JSON.stringify(items));
    };

    writeArray(
      ORGS_KEY,
      safeRead<Organization>(ORGS_KEY).filter((org) => org.id !== orgId)
    );
    writeArray(
      USERS_KEY,
      allUsers.filter((member) => member.orgId !== orgId)
    );
    writeArray(
      INVITES_KEY,
      safeRead<OrgInvite>(INVITES_KEY).filter((invite) => invite.orgId !== orgId)
    );
    writeArray(
      PROJECTS_KEY,
      safeRead<{ orgId?: string }>(PROJECTS_KEY).filter((project) => project.orgId !== orgId)
    );
    writeArray(
      TASKS_STORAGE_KEY,
      safeRead<{ orgId?: string }>(TASKS_STORAGE_KEY).filter((task) => task.orgId !== orgId)
    );
    writeArray(
      GROUPS_KEY,
      safeRead<{ orgId?: string }>(GROUPS_KEY).filter((group) => group.orgId !== orgId)
    );
    writeArray(
      TEAMS_KEY,
      safeRead<{ orgId?: string }>(TEAMS_KEY).filter((team) => team.orgId !== orgId)
    );
    writeArray(
      WORKFLOWS_KEY,
      safeRead<{ orgId?: string }>(WORKFLOWS_KEY).filter((workflow) => workflow.orgId !== orgId)
    );
    writeArray(
      PROJECT_CHAT_KEY,
      safeRead<{ orgId?: string }>(PROJECT_CHAT_KEY).filter((message) => message.orgId !== orgId)
    );
    writeArray(
      SAVED_VIEWS_KEY,
      safeRead<{ orgId?: string }>(SAVED_VIEWS_KEY).filter((view) => view.orgId !== orgId)
    );
    writeArray(
      ESTIMATION_PROFILES_KEY,
      safeRead<{ orgId?: string }>(ESTIMATION_PROFILES_KEY).filter((profile) => profile.orgId !== orgId)
    );
    writeArray(
      NOTIFICATIONS_KEY,
      safeRead<{ userId?: string }>(NOTIFICATIONS_KEY).filter((notification) => !orgUserIds.has(notification.userId || ''))
    );

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(PRESENCE_KEY_PREFIX)) {
        const maybeOrgId = key.slice(PRESENCE_KEY_PREFIX.length);
        if (maybeOrgId === orgId) localStorage.removeItem(key);
      }
    });

    const current = userService.getCurrentUser();
    if (current?.orgId === orgId) {
      localStorage.removeItem(SESSION_KEY);
    }

    emitUsersUpdated(orgId, actorId);
    realtimeService.publish({ type: 'PROJECTS_UPDATED', orgId, actorId });
    realtimeService.publish({ type: 'TASKS_UPDATED', orgId, actorId });
    realtimeService.publish({ type: 'GROUPS_UPDATED', orgId, actorId });
    realtimeService.publish({ type: 'TEAMS_UPDATED', orgId, actorId });

    return { success: true };
  },

  getPlanDefaults: () => ({
    seatDefaults: PLAN_DEFAULT_SEATS,
    seatPrices: PLAN_SEAT_PRICE
  })
};
