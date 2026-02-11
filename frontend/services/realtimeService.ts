import { createId } from '../utils/id';

export type RealtimeEventType =
  | 'TASKS_UPDATED'
  | 'PROJECTS_UPDATED'
  | 'USERS_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'COMMENT_TYPING'
  | 'PRESENCE_PING';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  orgId?: string;
  actorId?: string;
  sentAt: number;
  clientId: string;
  payload?: Record<string, unknown>;
}

const CHANNEL_NAME = 'velo_realtime_v1';
const STORAGE_FALLBACK_KEY = 'velo_realtime_event';
const CLIENT_KEY = 'velo_realtime_client_id';

type RealtimeListener = (event: RealtimeEvent) => void;

const ensureClientId = (): string => {
  const fromSession = sessionStorage.getItem(CLIENT_KEY);
  if (fromSession) return fromSession;
  const next = createId();
  sessionStorage.setItem(CLIENT_KEY, next);
  return next;
};

const clientId = ensureClientId();
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel(CHANNEL_NAME)
  : null;

const listeners = new Set<RealtimeListener>();
let hasBoundGlobalListeners = false;

const publish = (message: Omit<RealtimeEvent, 'id' | 'clientId' | 'sentAt'>) => {
  const event: RealtimeEvent = {
    id: createId(),
    clientId,
    sentAt: Date.now(),
    ...message
  };
  if (channel) {
    channel.postMessage(event);
  } else {
    localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(event));
    localStorage.removeItem(STORAGE_FALLBACK_KEY);
  }
};

const notify = (event: RealtimeEvent) => {
  listeners.forEach((listener) => listener(event));
};

const bindGlobalListeners = () => {
  if (hasBoundGlobalListeners) return;
  hasBoundGlobalListeners = true;
  channel?.addEventListener('message', (raw: MessageEvent<RealtimeEvent>) => {
    if (!raw?.data) return;
    notify(raw.data);
  });
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== STORAGE_FALLBACK_KEY || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue) as RealtimeEvent;
      notify(payload);
    } catch {
      // Ignore malformed payloads from unknown keys.
    }
  });
};

const subscribe = (listener: RealtimeListener): (() => void) => {
  bindGlobalListeners();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const realtimeService = {
  getClientId: () => clientId,
  subscribe,
  publish
};
