import { Dispatch, SetStateAction, useEffect } from 'react';
import { Project, Task, User } from '../types';
import { notificationService } from '../services/notificationService';
import { projectService } from '../services/projectService';
import { realtimeService } from '../services/realtimeService';
import { settingsService, UserSettings } from '../services/settingsService';
import { syncGuardService } from '../services/syncGuardService';
import { taskService } from '../services/taskService';
import { toastService } from '../services/toastService';
import { userService } from '../services/userService';
import { presenceService } from '../services/presenceService';

interface UseWorkspaceConnectionOptions {
  user: User | null;
  allUsers: User[];
  tasks: Task[];
  projects: Project[];
  settings: UserSettings;
  setSettings: Dispatch<SetStateAction<UserSettings>>;
  setAllUsers: (users: User[]) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  refreshTasks: () => void;
  setIsOffline: (value: boolean) => void;
  setHasPendingSync: (value: boolean) => void;
  setOnlineCount: (value: number) => void;
}

export const useWorkspaceConnection = ({
  user,
  allUsers,
  tasks,
  projects,
  settings,
  setSettings,
  setAllUsers,
  setProjects,
  setSelectedTask,
  refreshTasks,
  setIsOffline,
  setHasPendingSync,
  setOnlineCount
}: UseWorkspaceConnectionOptions) => {
  useEffect(() => {
    const onOffline = () => {
      setIsOffline(true);
      toastService.warning('Offline mode', 'Changes are saved locally and marked pending sync.');
    };

    const onOnline = () => {
      setIsOffline(false);
      if (syncGuardService.hasPending()) {
        syncGuardService.clearPending();
        setHasPendingSync(false);
        toastService.info('Connection restored', 'Pending local changes were retained.');
      }
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [setHasPendingSync, setIsOffline]);

  useEffect(() => {
    setHasPendingSync(syncGuardService.hasPending());
  }, [tasks, projects, setHasPendingSync]);

  useEffect(() => {
    if (!user) return;

    const key = `velo_sla_alerts:${user.orgId}`;
    const alerted: Record<string, string> = JSON.parse(localStorage.getItem(key) || '{}');
    const now = Date.now();
    const admins = allUsers.filter((member) => member.role === 'admin').map((member) => member.id);

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      if (task.status === 'done') return;

      const hoursToDue = (task.dueDate - now) / (1000 * 60 * 60);
      const dueKey = `${task.id}:due`;
      const overdueKey = `${task.id}:overdue`;
      const escalateKey = `${task.id}:escalate`;

      if (hoursToDue <= 24 && hoursToDue > 0 && !alerted[dueKey]) {
        alerted[dueKey] = '1';
        notificationService.addNotification({
          userId: task.assigneeId || task.userId,
          title: 'Due soon',
          message: `"${task.title}" is due within 24 hours.`,
          type: 'DUE_DATE',
          linkId: task.id
        });
      }

      if (hoursToDue <= 0 && !alerted[overdueKey]) {
        alerted[overdueKey] = '1';
        notificationService.addNotification({
          userId: task.assigneeId || task.userId,
          title: 'Task overdue',
          message: `"${task.title}" is overdue.`,
          type: 'DUE_DATE',
          linkId: task.id
        });
      }

      if (hoursToDue <= -24 && task.priority === 'High' && !alerted[escalateKey]) {
        alerted[escalateKey] = '1';
        admins.forEach((adminId) => {
          notificationService.addNotification({
            userId: adminId,
            title: 'SLA escalation',
            message: `High-priority task "${task.title}" is overdue by more than 24 hours.`,
            type: 'SYSTEM',
            linkId: task.id
          });
        });
      }
    });

    localStorage.setItem(key, JSON.stringify(alerted));
  }, [allUsers, tasks, user]);

  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent<UserSettings>) => {
      if (event.detail) setSettings(event.detail);
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
  }, [setSettings]);

  useEffect(() => {
    if (!user) {
      setOnlineCount(0);
      return;
    }

    const unsubscribeRealtime = realtimeService.subscribe((event) => {
      if (event.clientId === realtimeService.getClientId()) return;
      if (event.orgId && event.orgId !== user.orgId) return;

      if (event.type === 'TASKS_UPDATED') {
        refreshTasks();
        setSelectedTask((prev) => {
          if (!prev) return null;
          const latest = taskService.getTaskById(prev.id);
          return latest || null;
        });
        return;
      }

      if (event.type === 'PROJECTS_UPDATED') {
        setProjects(projectService.getProjects(user.orgId));
        refreshTasks();
        return;
      }

      if (event.type === 'USERS_UPDATED') {
        setAllUsers(userService.getUsers(user.orgId));
        return;
      }

      if (event.type === 'SETTINGS_UPDATED') {
        setSettings(settingsService.getSettings());
      }
    });

    let stopPresence: (() => void) | undefined;
    if (settings.realTimeUpdates) {
      stopPresence = presenceService.start(user, (entries) => {
        const ids = new Set(entries.map((entry) => entry.userId));
        ids.add(user.id);
        setOnlineCount(ids.size);
      });
    } else {
      setOnlineCount(1);
    }

    return () => {
      unsubscribeRealtime();
      stopPresence?.();
    };
  }, [refreshTasks, setAllUsers, setOnlineCount, setProjects, setSelectedTask, setSettings, settings.realTimeUpdates, user]);
};
