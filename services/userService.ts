
import { User } from '../types';

const USERS_KEY = 'cloudtasks_users';
const SESSION_KEY = 'cloudtasks_session';

export const userService = {
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  updateUser: (userId: string, updates: Partial<User>): User[] => {
    const users = userService.getUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    // If the current user is updated, update the session
    const current = userService.getCurrentUser();
    if (current && current.id === userId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...updates }));
    }
    
    return updatedUsers;
  },

  deleteUser: (userId: string): User[] => {
    const users = userService.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users;
  },

  register: (identifier: string): User => {
    const users = userService.getUsers();
    const isEmail = identifier.includes('@');
    
    let username = identifier;
    let email = `${identifier}@cloudtasks.io`;

    if (isEmail) {
      email = identifier;
      username = identifier.split('@')[0];
    }

    const existing = users.find((u: User) => u.username === username || u.email === email);
    if (existing) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(existing));
      return existing;
    }

    // Capitalize username prefix for initial displayName
    const displayName = username.charAt(0).toUpperCase() + username.slice(1);

    const newUser: User = { 
      id: crypto.randomUUID(), 
      username,
      displayName,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      role: 'member'
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  },

  login: (identifier: string): User | null => {
    const users = userService.getUsers();
    const user = users.find((u: User) => u.username === identifier || u.email === identifier);
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
