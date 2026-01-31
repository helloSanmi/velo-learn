
import { User, Organization } from '../types';

const USERS_KEY = 'velo_users';
const ORGS_KEY = 'velo_orgs';
const SESSION_KEY = 'velo_session';

export const userService = {
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  getOrganization: (orgId: string): Organization | null => {
    const orgs: Organization[] = JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
    return orgs.find(o => o.id === orgId) || null;
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
    return updatedOrg;
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
    return updatedUsers;
  },

  deleteUser: (userId: string): User[] => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const updated = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    return updated;
  },

  provisionUser: (orgId: string, username: string, role: 'admin' | 'member' = 'member'): { success: boolean; error?: string; user?: User } => {
    const org = userService.getOrganization(orgId);
    const orgUsers = userService.getUsers(orgId);
    if (!org) return { success: false, error: 'Organization identifier mismatch.' };
    if (orgUsers.length >= org.totalSeats) {
      return { success: false, error: `License threshold reached (${org.totalSeats} nodes).` };
    }
    const allUsers = userService.getUsers();
    const cleanUsername = username.toLowerCase().trim();
    if (allUsers.find(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'Identity already exists in cluster.' };
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      orgId,
      username: cleanUsername,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      email: `${cleanUsername}@velo.ai`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      role
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...allUsers, newUser]));
    return { success: true, user: newUser };
  },

  register: (identifier: string, orgName?: string): User => {
    const allUsers = userService.getUsers();
    const cleanId = identifier.toLowerCase().trim();
    const existing = allUsers.find((u: User) => u.username === cleanId || u.email === cleanId);
    if (existing) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(existing));
      return existing;
    }
    const orgs: Organization[] = JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
    const newOrgId = crypto.randomUUID();
    const newUserId = crypto.randomUUID();
    const newOrg: Organization = {
      id: newOrgId,
      name: orgName || `${cleanId}'s Cluster`,
      totalSeats: 10,
      ownerId: newUserId,
      createdAt: Date.now()
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

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
