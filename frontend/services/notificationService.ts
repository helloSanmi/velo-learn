
import { createId } from '../utils/id';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'DUE_DATE' | 'SYSTEM';
  timestamp: number;
  read: boolean;
  linkId?: string; 
}

const NOTIFICATIONS_KEY = 'velo_notifications';

export const notificationService = {
  getNotifications: (userId: string): Notification[] => {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      const all: Notification[] = data ? JSON.parse(data) : [];
      return all
        .filter(n => n.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      return [];
    }
  },

  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>): void => {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      const all: Notification[] = data ? JSON.parse(data) : [];
      
      const newNotification: Notification = {
        ...notification,
        id: createId(),
        read: false,
        timestamp: Date.now()
      };
      
      const updated = [newNotification, ...all];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
        detail: { userId: notification.userId } 
      }));
    } catch (e) {
      console.error("Failed to add notification", e);
    }
  },

  markAsRead: (id: string): void => {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      const all: Notification[] = data ? JSON.parse(data) : [];
      const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      
      const notification = all.find(n => n.id === id);
      if (notification) {
        window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
          detail: { userId: notification.userId } 
        }));
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  },

  markAllAsRead: (userId: string): void => {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      const all: Notification[] = data ? JSON.parse(data) : [];
      const updated = all.map(n => n.userId === userId ? { ...n, read: true } : n);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
        detail: { userId } 
      }));
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  }
};
