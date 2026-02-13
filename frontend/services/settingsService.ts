
import { realtimeService } from './realtimeService';

export interface UserSettings {
  aiSuggestions: boolean;
  realTimeUpdates: boolean;
  compactMode: boolean;
  theme: 'Light' | 'Dark' | 'Aurora';
  enableNotifications: boolean;
  enableEstimateCalibration: boolean;
  showPersonalCalibration: boolean;
  estimationRequireApproval: boolean;
  estimationApprovalThreshold: number;
  requireTwoFactorAuth: boolean;
  dataRetentionPolicy: '30_days' | '90_days' | '365_days' | 'indefinite';
}

const SETTINGS_KEY = 'velo_settings';
const SESSION_KEY = 'velo_session';

const DEFAULT_SETTINGS: UserSettings = {
  aiSuggestions: true,
  realTimeUpdates: true,
  compactMode: false,
  theme: 'Light',
  enableNotifications: true,
  enableEstimateCalibration: true,
  showPersonalCalibration: true,
  estimationRequireApproval: true,
  estimationApprovalThreshold: 1.35,
  requireTwoFactorAuth: false,
  dataRetentionPolicy: '90_days'
};

export const settingsService = {
  getSettings: (): UserSettings => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  updateSettings: (updates: Partial<UserSettings>): UserSettings => {
    const current = settingsService.getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    
    // Trigger a custom event so other components can react
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: updated }));
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    realtimeService.publish({
      type: 'SETTINGS_UPDATED',
      orgId: session?.orgId,
      actorId: session?.id
    });
    
    return updated;
  }
};
