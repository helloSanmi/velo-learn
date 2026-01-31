import React, { useState, useEffect } from 'react';
import { X, Settings, Monitor, Bell, Shield, Cloud, Sparkles, User, Mail, Camera, Save, Inbox, ShieldCheck, Trash2, Users, TrendingUp, UserPlus, Smartphone, ArrowLeft, Zap, LayoutGrid, CheckCircle2, Loader2, Activity, Edit2, Check } from 'lucide-react';
import Button from './ui/Button';
import WorkflowBuilder from './WorkflowBuilder';
import { settingsService, UserSettings } from '../services/settingsService';
import { userService } from '../services/userService';
import { User as UserType, Organization } from '../types';

export type SettingsTabType = 'profile' | 'general' | 'notifications' | 'security' | 'appearance' | 'admin' | 'automation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabType;
  user?: UserType;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab = 'general', user }) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  
  const [newUserName, setNewUserName] = useState('');
  const [provisionError, setProvisionError] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setActiveTab(initialTab);
      setSettings(settingsService.getSettings());
      setAllUsers(userService.getUsers(user.orgId));
      setOrg(userService.getOrganization(user.orgId));
      setIsManagingSubscription(false);
      setEditingUserId(null);
    }
  }, [isOpen, initialTab, user]);

  if (!isOpen || !user) return null;

  const handleToggle = (key: keyof UserSettings) => {
    const newVal = !settings[key as keyof UserSettings];
    const updated = settingsService.updateSettings({ [key]: newVal });
    setSettings(updated);
  };

  const handleThemeChange = (theme: UserSettings['theme']) => {
    const updated = settingsService.updateSettings({ theme });
    setSettings(updated);
  };

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError('');
    if (!newUserName.trim()) return;

    const result = userService.provisionUser(user.orgId, newUserName);
    if (result.success) {
      setAllUsers(userService.getUsers(user.orgId));
      setNewUserName('');
      setIsProvisioning(false);
    } else {
      setProvisionError(result.error || 'Provisioning failed.');
    }
  };

  const handleUpdateUserRole = (userId: string, role: 'admin' | 'member') => {
    const updatedAll = userService.updateUser(userId, { role });
    setAllUsers(updatedAll.filter(u => u.orgId === user.orgId));
  };

  const handleStartEdit = (targetUser: UserType) => {
    setEditingUserId(targetUser.id);
    setEditNameValue(targetUser.displayName);
  };

  const handleCommitEdit = () => {
    if (!editingUserId) return;
    const updatedAll = userService.updateUser(editingUserId, { displayName: editNameValue });
    setAllUsers(updatedAll.filter(u => u.orgId === user.orgId));
    setEditingUserId(null);
  };

  const handlePurgeUser = (userId: string) => {
    if (userId === user.id) return;
    if (confirm('Permanently decommission this identity node from the Runa cluster? This action cannot be reversed.')) {
      const allAfterDelete = userService.deleteUser(userId);
      setAllUsers(allAfterDelete.filter(u => u.orgId === user.orgId));
    }
  };

  const handleUpgradeTier = (tier: 'starter' | 'pro' | 'enterprise') => {
    if (!org) return;
    setIsUpgrading(true);
    const seatsMap = { starter: 3, pro: 15, enterprise: 100 };
    const newSeats = seatsMap[tier];
    
    setTimeout(() => {
      const updatedOrg = userService.updateOrganization(org.id, { totalSeats: newSeats });
      if (updatedOrg) setOrg(updatedOrg);
      setIsUpgrading(false);
      setIsManagingSubscription(false);
    }, 800);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="relative group">
                 <div className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-2xl ring-1 ring-slate-100 overflow-hidden bg-slate-200">
                    <img src={user?.avatar} className="w-full h-full object-cover" alt="Profile" />
                 </div>
                 <button className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-110 active:scale-95">
                    <Camera className="w-4 h-4" />
                 </button>
               </div>
               <div className="text-center">
                 <h3 className="text-xl font-black text-slate-900">{user?.displayName || 'User Account'}</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{org?.name} • {user?.role === 'admin' ? 'System Admin' : 'Member'}</p>
               </div>
            </div>
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Account Identity</h3>
               <div className="grid gap-4">
                 <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 group focus-within:border-indigo-500 transition-all">
                    <User className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Display Name</p>
                      <input type="text" defaultValue={user?.displayName} className="w-full text-sm font-bold text-slate-900 outline-none bg-transparent" />
                    </div>
                 </div>
                 <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 group focus-within:border-indigo-500 transition-all">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Registered Email</p>
                      <input type="email" defaultValue={user?.email || `${user?.username.toLowerCase()}@runa.ai`} className="w-full text-sm font-bold text-slate-900 outline-none bg-transparent" readOnly />
                    </div>
                 </div>
               </div>
            </div>
            <Button className="w-full py-4 rounded-2xl shadow-indigo-100" onClick={() => alert('Profile Sync Complete')}>
              <Save className="w-4 h-4 mr-2" /> Update Account Info
            </Button>
          </div>
        );
      case 'automation':
        return <WorkflowBuilder orgId={user.orgId} allUsers={allUsers} />;
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Intelligence Layer</h3>
               <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">AI Predictive Modeling</p>
                      <p className="text-xs text-slate-500 font-medium">Auto-suggest subtasks and analyze risk levels.</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle('aiSuggestions')} className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.aiSuggestions ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.aiSuggestions ? 'translate-x-5' : ''}`} />
                  </button>
               </div>
            </div>
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Connectivity</h3>
               <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Hyper-Sync Core</p>
                      <p className="text-xs text-slate-500 font-medium">Instant workspace state propagation across clusters.</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle('realTimeUpdates')} className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.realTimeUpdates ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.realTimeUpdates ? 'translate-x-5' : ''}`} />
                  </button>
               </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Alerting Channels</h3>
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
              <div className="flex gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Assignment Alerts</p>
                  <p className="text-xs text-slate-500 font-medium">Notify me instantly when tasks are assigned to me.</p>
                </div>
              </div>
              <button onClick={() => handleToggle('enableNotifications')} className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.enableNotifications ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.enableNotifications ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex flex-col items-center text-center gap-3">
              <Smartphone className="w-8 h-8 text-indigo-600" />
              <p className="text-sm font-black text-slate-900">Mobile Push Nodes</p>
              <p className="text-xs text-slate-500 font-medium">Native push notifications are managed via your device system settings.</p>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Integrity & Compliance</h3>
            <div className="p-8 border-2 border-indigo-100 bg-indigo-50 rounded-[2.5rem] flex flex-col items-center text-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="p-4 bg-white rounded-2xl shadow-xl shadow-indigo-200/50">
                <Shield className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">Encrypted Workspace Node</p>
                <p className="text-sm text-indigo-700/80 font-bold mt-1">Tenant ID: {org?.id.slice(0, 8)}...-SEC</p>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs">Your organization data is isolated at the database level and protected by Runa Enterprise encryption standards.</p>
              <Button size="md" variant="secondary" className="mt-2 rounded-xl px-8 shadow-indigo-200">Activate Enterprise Shield</Button>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Interface Canvas</h3>
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <div className="flex gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-slate-600">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">High-Density Mode</p>
                    <p className="text-xs text-slate-500 font-medium">Minimize whitespace for professional monitoring.</p>
                  </div>
                </div>
                <button onClick={() => handleToggle('compactMode')} className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.compactMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.compactMode ? 'translate-x-5' : ''}`} />
                </button>
             </div>
             <div className="grid grid-cols-3 gap-4 mt-6">
                {(['Light', 'Dark', 'Aurora'] as const).map((theme) => (
                  <button key={theme} onClick={() => handleThemeChange(theme)} className={`p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 group ${settings.theme === theme ? 'border-indigo-600 bg-white shadow-indigo-50 shadow-xl' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                    <div className={`w-full h-16 rounded-xl group-hover:scale-95 transition-transform ${theme === 'Light' ? 'bg-slate-100' : theme === 'Dark' ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{theme}</span>
                  </button>
                ))}
             </div>
          </div>
        );
      case 'admin':
        if (isManagingSubscription) {
          return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-4">
                 <button onClick={() => setIsManagingSubscription(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                 <div>
                   <h3 className="text-xl font-black text-slate-900 leading-tight">License Tier Calibration</h3>
                   <p className="text-xs text-slate-500 font-medium">Upgrade or adjust your organization cluster</p>
                 </div>
               </div>

               <div className="grid gap-3">
                  {[
                    { id: 'starter', name: 'Starter', price: '$0', seats: 3, icon: <LayoutGrid className="w-5 h-5" /> },
                    { id: 'pro', name: 'Professional', price: '$29', seats: 15, icon: <Zap className="w-5 h-5" />, popular: true },
                    { id: 'enterprise', name: 'Enterprise', price: '$99', seats: 100, icon: <ShieldCheck className="w-5 h-5" /> }
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => handleUpgradeTier(tier.id as any)}
                      disabled={isUpgrading}
                      className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all group relative ${
                        org?.totalSeats === tier.seats 
                        ? 'border-indigo-600 bg-indigo-50/20' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      {org?.totalSeats === tier.seats && (
                        <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Active Node</span>
                      )}
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-colors ${org?.totalSeats === tier.seats ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 group-hover:text-indigo-600 shadow-sm'}`}>
                          {tier.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900">{tier.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tier.seats} Seat Licenses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">{tier.price}</p>
                        {org?.totalSeats === tier.seats && <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-1 inline" />}
                      </div>
                    </button>
                  ))}
               </div>
               
               {isUpgrading && (
                 <div className="p-8 flex flex-col items-center justify-center gap-4 animate-pulse">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reconfiguring Cluster Nodes...</p>
                 </div>
               )}
            </div>
          );
        }

        const seatUsage = (allUsers.length / (org?.totalSeats || 1)) * 100;
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{org?.name} Console</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Tenant ID: {org?.id.slice(0,8)}... • Created {new Date(org?.createdAt || 0).toLocaleDateString()}</p>
              </div>
              <div className="hidden sm:flex px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Root Admin Access
              </div>
            </div>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full -mr-12 -mt-12" />
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 rounded-2xl"><Users className="w-6 h-6" /></div>
                <div>
                   <h4 className="text-lg font-black tracking-tight">License Governance</h4>
                   <p className="text-xs text-slate-400 font-medium tracking-tight">Managing workload seats & identity nodes</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <p className="text-4xl font-black tracking-tighter">{allUsers.length}<span className="text-slate-500 text-2xl font-bold ml-2">/ {org?.totalSeats} seats used</span></p>
                   <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">{Math.round(seatUsage)}% Capacity</p>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner">
                   <div style={{ width: `${Math.min(seatUsage, 100)}%` }} className="h-full bg-indigo-500 transition-all duration-1000" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.25em]">Identity Directory</h4>
                <Button size="sm" variant="outline" onClick={() => setIsProvisioning(!isProvisioning)} className="rounded-xl border-slate-200">
                  <UserPlus className="w-3.5 h-3.5 mr-2" /> Provision Seat
                </Button>
              </div>
              {isProvisioning && (
                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <form onSubmit={handleProvision} className="flex flex-col sm:flex-row gap-3">
                    <input autoFocus placeholder="Username for new user" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-sm bg-white" />
                    <Button type="submit" size="md" variant="secondary" className="rounded-xl">Confirm Allocation</Button>
                  </form>
                  {provisionError && <p className="text-rose-600 text-[10px] font-black uppercase mt-2 px-2">{provisionError}</p>}
                </div>
              )}
              <div className="grid gap-3">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all group">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2 max-w-xs">
                             <input 
                              autoFocus
                              value={editNameValue} 
                              onChange={(e) => setEditNameValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommitEdit()}
                              className="w-full px-3 py-1 bg-white border border-indigo-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                             />
                             <button onClick={handleCommitEdit} className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all"><Check className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <p className="text-base font-black text-slate-900 truncate tracking-tight flex items-center gap-2">
                            {u.displayName} {u.id === user?.id ? '(You)' : ''}
                            <button onClick={() => handleStartEdit(u)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-indigo-600 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                          </p>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <select value={u.role || 'member'} onChange={(e) => handleUpdateUserRole(u.id, e.target.value as 'admin' | 'member')} disabled={u.id === user?.id} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer disabled:opacity-40">
                          <option value="member">Member</option>
                          <option value="admin">System Admin</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => handlePurgeUser(u.id)} 
                        disabled={u.id === user?.id} 
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-10"
                        title="Purge Node"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-2 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 bg-indigo-50/20">
              <div className="p-4 bg-white rounded-[2rem] shadow-xl shadow-indigo-100/50 text-indigo-600 border border-indigo-100">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-slate-900 tracking-tight">Expand Workspace Capabilities</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">Adjust your seat allocation or upgrade to Professional/Enterprise clusters to unlock more nodes.</p>
              </div>
              <Button size="md" variant="secondary" className="rounded-xl px-10 shadow-indigo-200 mt-2" onClick={() => setIsManagingSubscription(true)}>Manage Subscription</Button>
            </div>
          </div>
        );
      default:
        return <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest opacity-20">Interface Section Under Maintenance</div>;
    }
  };

  const navItems: { id: SettingsTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile' as const, label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'general' as const, label: 'Workflows', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'appearance' as const, label: 'UI Interface', icon: <Monitor className="w-4 h-4" /> },
    { id: 'notifications' as const, label: 'Messaging', icon: <Bell className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Compliance', icon: <Shield className="w-4 h-4" /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'automation' as const, label: 'Automation', icon: <Zap className="w-4 h-4" /> });
    navItems.push({ id: 'admin' as const, label: 'Governance', icon: <Settings className="w-4 h-4" /> });
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-t-[3rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 md:zoom-in-95 duration-500 max-h-[95vh] md:max-h-[85vh] flex flex-col md:flex-row border border-white/20">
        <div className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex-shrink-0 flex flex-col">
          <div className="p-8 md:p-12 pb-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tighter">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200"><Settings className="w-6 h-6 text-white" /></div> Center
            </h2>
          </div>
          <nav className="flex-1 p-6 md:p-8 space-y-1.5 overflow-x-auto no-scrollbar md:overflow-y-auto">
            <div className="flex md:flex-col gap-2">
              {navItems.map((tab) => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id as SettingsTabType); setIsManagingSubscription(false); }} className={`flex items-center gap-3.5 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap min-w-max md:w-full ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'}`}>
                  <span className={`${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400'}`}>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar scroll-smooth">
            {renderContent()}
          </div>
          <div className="px-8 py-8 md:px-16 md:py-12 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
             <div className="flex flex-col text-center sm:text-left">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Deployment Package</p>
               <p className="text-[10px] font-bold text-slate-900 mt-0.5">Runa Enterprise 2.5.4</p>
             </div>
             <Button onClick={onClose} variant="outline" size="md" className="rounded-2xl px-10 border-slate-200 bg-white shadow-none font-black text-[10px] uppercase tracking-widest">Terminate Session</Button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-slate-900 text-white rounded-2xl md:hidden shadow-2xl active:scale-95 transition-transform">
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;