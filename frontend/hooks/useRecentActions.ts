import { useEffect, useState } from 'react';

export interface RecentActionItem {
  displayName: string;
  action: string;
  taskTitle: string;
  timestamp: number;
}

const sortRecentActions = (actions: RecentActionItem[]): RecentActionItem[] => {
  return [...actions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
};

export const useRecentActions = (storageKey = 'velo_data', refreshMs = 5000) => {
  const [recentActions, setRecentActions] = useState<RecentActionItem[]>([]);

  useEffect(() => {
    const fetchRecentActions = () => {
      try {
        const allTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const actions = allTasks.flatMap((task: any) =>
          (task.auditLog || []).map((audit: any) => ({ ...audit, taskTitle: task.title }))
        );
        setRecentActions(sortRecentActions(actions));
      } catch {
        setRecentActions([]);
      }
    };

    fetchRecentActions();
    const interval = window.setInterval(fetchRecentActions, refreshMs);
    return () => window.clearInterval(interval);
  }, [refreshMs, storageKey]);

  return recentActions;
};
