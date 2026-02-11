const PENDING_KEY = 'velo_sync_pending';

export const syncGuardService = {
  markLocalMutation: () => {
    if (!navigator.onLine) {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ pending: true, since: Date.now() }));
      return;
    }
    localStorage.removeItem(PENDING_KEY);
  },
  hasPending: () => {
    try {
      const payload = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      return Boolean(payload?.pending);
    } catch {
      return false;
    }
  },
  clearPending: () => localStorage.removeItem(PENDING_KEY)
};
