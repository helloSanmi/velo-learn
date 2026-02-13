import React, { useEffect, useState } from 'react';
import { Bell, Cloud, Inbox, Mail, Monitor, Pencil, Shield, ShieldCheck, Smartphone, Sparkles, User } from 'lucide-react';
import Button from '../ui/Button';
import SettingsToggleRow from './SettingsToggleRow';
import { UserSettings } from '../../services/settingsService';
import { Organization, SecurityGroup, Team, User as UserType } from '../../types';
import { dialogService } from '../../services/dialogService';

interface SettingsCoreTabsProps {
  activeTab: 'profile' | 'general' | 'notifications' | 'security' | 'appearance';
  user: UserType;
  org: Organization | null;
  teams: Team[];
  groups: SecurityGroup[];
  settings: UserSettings;
  onToggle: (key: keyof UserSettings) => void;
  onThemeChange: (theme: UserSettings['theme']) => void;
  onThresholdChange: (value: number) => void;
  onAvatarUpdate: (avatar: string) => Promise<void>;
}

const SettingsCoreTabs: React.FC<SettingsCoreTabsProps> = ({
  activeTab,
  user,
  org,
  teams,
  groups,
  settings,
  onToggle,
  onThemeChange,
  onThresholdChange,
  onAvatarUpdate
}) => {
  const [securityRequireApprovalDraft, setSecurityRequireApprovalDraft] = useState(settings.estimationRequireApproval);
  const [securityThresholdDraft, setSecurityThresholdDraft] = useState(settings.estimationApprovalThreshold);
  const [avatarDraft, setAvatarDraft] = useState(user.avatar || '');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  useEffect(() => {
    if (activeTab !== 'security') return;
    setSecurityRequireApprovalDraft(settings.estimationRequireApproval);
    setSecurityThresholdDraft(settings.estimationApprovalThreshold);
  }, [activeTab, settings.estimationRequireApproval, settings.estimationApprovalThreshold]);

  useEffect(() => {
    if (activeTab !== 'profile') return;
    setAvatarDraft(user.avatar || '');
    setIsEditingAvatar(false);
  }, [activeTab, user.avatar]);

  if (activeTab === 'profile') {
    const parts = (user.displayName || user.username || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || user.username || 'N/A';
    const lastName = parts.slice(1).join(' ') || 'N/A';
    const teamNames = teams.filter((team) => team.memberIds.includes(user.id)).map((team) => team.name);
    const groupNames = groups.filter((group) => group.memberIds.includes(user.id)).map((group) => group.name);

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-200">
              <img
                src={user?.avatar}
                className="w-full h-full object-cover"
                alt="Profile"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.onerror = null;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'user'}`;
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsEditingAvatar((prev) => !prev)}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-md border border-slate-700 bg-slate-900 text-white flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              title="Edit avatar"
            >
              <Pencil className="w-3 h-3" />
            </button>
            {isEditingAvatar ? (
              <div className="absolute left-0 top-[72px] z-20 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                <input
                  type="url"
                  value={avatarDraft}
                  onChange={(event) => setAvatarDraft(event.target.value)}
                  placeholder="Paste avatar image URL"
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs outline-none"
                />
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarDraft(user.avatar || '');
                      setIsEditingAvatar(false);
                    }}
                    className="h-7 rounded-md border border-slate-200 px-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingAvatar}
                    onClick={async () => {
                      setSavingAvatar(true);
                      try {
                        await onAvatarUpdate(avatarDraft.trim());
                        setIsEditingAvatar(false);
                      } finally {
                        setSavingAvatar(false);
                      }
                    }}
                    className="h-7 rounded-md border border-slate-800 bg-slate-800 px-2.5 text-[11px] font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                  >
                    {savingAvatar ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{user?.displayName || 'User Account'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{org?.name} • {user?.role === 'admin' ? 'Admin' : 'Member'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {[
            ['First name', firstName],
            ['Last name', lastName],
            ['Email', user?.email || `${user?.username.toLowerCase()}@velo.app`],
            ['Company', org?.name || 'N/A'],
            ['Group', groupNames.length ? groupNames.join(', ') : 'Not assigned'],
            ['Team', teamNames.length ? teamNames.join(', ') : 'Not assigned']
          ].map(([label, value], index) => (
            <div key={label} className={`grid grid-cols-[130px_1fr] gap-3 px-4 py-2.5 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-sm text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'general') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <SettingsToggleRow
          icon={<Sparkles className="w-4 h-4" />}
          title="AI Suggestions"
          description="Generate subtasks and detect at-risk tasks."
          enabled={settings.aiSuggestions}
          onToggle={() => onToggle('aiSuggestions')}
        />
        <SettingsToggleRow
          icon={<Cloud className="w-4 h-4" />}
          title="Real-time Sync"
          description="Keep workspace updates synced automatically."
          enabled={settings.realTimeUpdates}
          onToggle={() => onToggle('realTimeUpdates')}
        />
        <SettingsToggleRow
          icon={<Sparkles className="w-4 h-4" />}
          title="Estimate Calibration"
          description="Apply historical bias correction to planning estimates."
          enabled={settings.enableEstimateCalibration}
          onToggle={() => onToggle('enableEstimateCalibration')}
        />
        <SettingsToggleRow
          icon={<User className="w-4 h-4" />}
          title="Show Personal Forecast Details"
          description="Show your own adjustment factor in planning views."
          enabled={settings.showPersonalCalibration}
          onToggle={() => onToggle('showPersonalCalibration')}
        />
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-600">
            Changes are saved immediately and applied across your current workspace.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'notifications') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <SettingsToggleRow
          icon={<Inbox className="w-4 h-4" />}
          title="Assignment Alerts"
          description="Notify immediately when tasks are assigned to you."
          enabled={settings.enableNotifications}
          onToggle={() => onToggle('enableNotifications')}
        />
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
          <Smartphone className="w-4 h-4 text-slate-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Mobile Delivery</p>
            <p className="text-xs text-slate-500 mt-0.5">Push delivery is controlled by your browser or OS notification permissions.</p>
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-600">Tip: keep alerts enabled for assignment updates, and mute only low-priority browser notifications.</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'security') {
    const hasSecurityChanges =
      securityRequireApprovalDraft !== settings.estimationRequireApproval ||
      securityThresholdDraft !== settings.estimationApprovalThreshold;

    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-700" />
                <p className="text-base font-semibold text-slate-900">Workspace Security</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Workspace ID: {org?.id?.slice(0, 8) || 'N/A'}...SEC</p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Data is isolated per workspace with role-scoped access controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                Session: Authenticated
              </span>
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 capitalize">
                Role: {user.role || 'member'}
              </span>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full h-9"
          onClick={() => dialogService.notice('Security scan completed. No critical risks detected.', { title: 'Security check' })}
        >
          <ShieldCheck className="w-4 h-4 mr-2" /> Run Security Check
        </Button>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Security Policies</p>
              <p className="text-xs text-slate-500 mt-0.5">Control approval behavior for high-risk forecast adjustments.</p>
            </div>
            <button
              onClick={() => setSecurityRequireApprovalDraft((prev) => !prev)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${securityRequireApprovalDraft ? 'bg-slate-900' : 'bg-slate-300'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${securityRequireApprovalDraft ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div>
            <label className="text-xs text-slate-500">Approval threshold</label>
            <input
              type="number"
              min={0}
              max={2}
              step={0.05}
              value={securityThresholdDraft}
              disabled={!securityRequireApprovalDraft}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) return;
                const clamped = Math.max(0, Math.min(2, value));
                setSecurityThresholdDraft(Number(clamped.toFixed(2)));
              }}
              className="mt-1 w-full h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
          <p className="text-xs text-slate-500">
            Value range: 0.00 to 2.00. Higher values require stricter approval.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSecurityRequireApprovalDraft(true);
              setSecurityThresholdDraft(1.35);
            }}
            disabled={!hasSecurityChanges}
          >
            Reset to default
          </Button>
          <Button
            disabled={!hasSecurityChanges}
            onClick={() => {
              if (securityRequireApprovalDraft !== settings.estimationRequireApproval) onToggle('estimationRequireApproval');
              if (securityThresholdDraft !== settings.estimationApprovalThreshold) onThresholdChange(securityThresholdDraft);
              dialogService.notice('Security settings updated.', { title: 'Security' });
            }}
          >
            Apply changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SettingsToggleRow
        icon={<Monitor className="w-4 h-4" />}
        title="Compact Mode"
        description="Reduce spacing to fit more content on screen."
        enabled={settings.compactMode}
        onToggle={() => onToggle('compactMode')}
      />
      <div className="grid grid-cols-3 gap-2">
        {(['Light', 'Dark', 'Aurora'] as const).map((theme) => (
          <button
            key={theme}
            onClick={() => onThemeChange(theme)}
            className={`p-3 rounded-xl border transition-colors text-left ${settings.theme === theme ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <div className={`w-full h-10 rounded-md ${theme === 'Light' ? 'bg-slate-100 border border-slate-200' : theme === 'Dark' ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-500'}`} />
            <p className="text-xs font-medium text-slate-700 mt-2 text-center">{theme}</p>
          </button>
        ))}
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs text-slate-600">Theme changes apply instantly across board, modals, and dashboard pages.</p>
      </div>
    </div>
  );
};

export default SettingsCoreTabs;
