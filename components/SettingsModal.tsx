
import React, { useState, useEffect } from 'react';
import { X, Settings, Monitor, Bell, Shield, Cloud, Sparkles, User, Mail, Camera, Save, Smartphone, Inbox, Users, ShieldCheck, Trash2, Key } from 'lucide-react';
import Button from './ui/Button';
import { settingsService, UserSettings } from '../services/settingsService';
import { userService } from '../services/userService';
import { User as UserType } from '../types';

export type SettingsTabType = 'profile' | 'general' | 'notifications' | 'security' | 'appearance' | 'admin';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabType;
  user?: UserType;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab = 'general', user }) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());
  const [allUsers, setAllUsers] = useState<UserType[]>(userService.getUsers());

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSettings(settingsService.getSettings());
      setAllUsers(userService.getUsers());
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof UserSettings) => {
    const newVal = !settings[key as keyof UserSettings];
    const updated = settingsService.updateSettings({ [key]: newVal });
    setSettings(updated);
  };

  const handleThemeChange = (theme: UserSettings['theme']) => {
    const updated = settingsService.updateSettings({ theme });
    setSettings(updated);
  };

  const handleUpdateUserRole = (userId: string, role: 'admin' | 'member') => {
    const updated = userService.updateUser(userId, { role });
    setAllUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user from the workspace?')) {
      const updated = userService.deleteUser(userId);
      setAllUsers(updated);
    }
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
                 <h3 className="text-xl font-black text-slate-900">{user?.username || 'User Account'}</h3>
                 <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">{user?.role === 'admin' ? 'Workspace Administrator' : 'Workspace Member'}</p>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Account Credentials</h3>
               <div className="grid gap-4">
                 <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 group focus-within:border-indigo-500 transition-all">
                    <User className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Full Name</p>
                      <input type="text" defaultValue={user?.username} className="w-full text-sm font-bold text-slate-900 outline-none bg-transparent" />
                    </div>
                 </div>
                 <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 group focus-within:border-indigo-500 transition-all">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Email Address</p>
                      <input type="email" defaultValue={user?.email || `${user?.username?.toLowerCase().replace(' ', '.')}@cloudtasks.io`} className="w-full text-sm font-bold text-slate-900 outline-none bg-transparent" />
                    </div>
                 </div>
               </div>
            </div>

            <Button className="w-full py-4 rounded-2xl shadow-indigo-100" onClick={() => alert('Profile update simulation complete.')}>
              <Save className="w-4 h-4 mr-2" />
              Update Account Info
            </Button>
          </div>
        );
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Workspace Intelligence</h3>
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
                  <button 
                    onClick={() => handleToggle('aiSuggestions')}
                    className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.aiSuggestions ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.aiSuggestions ? 'translate-x-5' : ''}`} />
                  </button>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Cloud Services</h3>
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
                  <button 
                    onClick={() => handleToggle('realTimeUpdates')}
                    className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.realTimeUpdates ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.realTimeUpdates ? 'translate-x-5' : ''}`} />
                  </button>
               </div>
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
                <button 
                  onClick={() => handleToggle('compactMode')}
                  className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.compactMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.compactMode ? 'translate-x-5' : ''}`} />
                </button>
             </div>
             
             <div className="grid grid-cols-3 gap-4 mt-6">
                {(['Light', 'Dark', 'Aurora'] as const).map((theme) => (
                  <button 
                    key={theme} 
                    onClick={() => handleThemeChange(theme)}
                    className={`p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 group ${settings.theme === theme ? 'border-indigo-600 bg-white shadow-indigo-50 shadow-xl' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <div className={`w-full h-16 rounded-xl group-hover:scale-95 transition-transform ${theme === 'Light' ? 'bg-slate-100' : theme === 'Dark' ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{theme}</span>
                  </button>
                ))}
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
              <button 
                onClick={() => handleToggle('enableNotifications')}
                className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.enableNotifications ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.enableNotifications ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Integrity & Access</h3>
            <div className="p-8 border-2 border-indigo-100 bg-indigo-50 rounded-[2.5rem] flex flex-col items-center text-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="p-4 bg-white rounded-2xl shadow-xl shadow-indigo-200/50">
                <Shield className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">Encrypted Workspace Node</p>
                <p className="text-sm text-indigo-700/80 font-bold mt-1">Build 2.5-PRO-ENT-X</p>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs">
                Your account is currently protected by standard Session Auth. Standard security measures apply.
              </p>
              <Button size="md" variant="secondary" className="mt-2 rounded-xl px-8 shadow-indigo-200" onClick={() => alert('Enterprise features are coming soon.')}>Activate Enterprise Shield</Button>
            </div>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Workspace Console</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Manage users, permissions, and workspace identity.</p>
              </div>
              <div className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Root Admin Access
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Registered Identity Profiles ({allUsers.length})</p>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">Export Directory</button>
              </div>
              
              <div className="space-y-2.5">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                        <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate tracking-tight">{u.username} {u.id === user?.id ? '(You)' : ''}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{u.email || `${u.username.toLowerCase().replace(' ', '.')}@cloudtasks.io`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1">
                        <select 
                          value={u.role || 'member'}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value as 'admin' | 'member')}
                          disabled={u.id === user?.id}
                          className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === user?.id}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 border-2 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 bg-indigo-50/20">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-indigo-100">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 tracking-tight">Access Provisioning</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] font-medium leading-relaxed">Generated invite links allow new members to join this workspace with custom domain restrictions.</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl px-6 border-indigo-200 text-indigo-600 font-black text-[10px] uppercase">Generate Join Token</Button>
            </div>
          </div>
        );
    }
  };

  const navItems = [
    { id: 'profile', label: 'My Account', icon: <User className="w-4 h-4" /> },
    { id: 'general', label: 'Intelligence', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'appearance', label: 'Interface', icon: <Monitor className="w-4 h-4" /> },
    { id: 'notifications', label: 'Channels', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Shield', icon: <Shield className="w-4 h-4" /> },
  ];

  // Add Admin tab if user is an admin
  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Console', icon: <Settings className="w-4 h-4" /> });
  }

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="bg-white w-full max-w-4xl rounded-t-[3rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 md:zoom-in-95 duration-500 max-h-[95vh] md:max-h-[85vh] flex flex-col md:flex-row border border-white/20">
        <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex-shrink-0 flex flex-col">
          <div className="p-8 md:p-10 pb-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
              <Settings className="w-7 h-7 text-indigo-600" /> Preferences
            </h2>
          </div>
          <nav className="flex-1 p-5 md:p-6 space-y-1.5 md:space-y-2 overflow-x-auto no-scrollbar md:overflow-y-auto">
            <div className="flex md:flex-col gap-2 md:gap-2">
              {navItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTabType)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap min-w-max md:w-full ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                      : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <span className={`${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar scroll-smooth">
            {renderContent()}
          </div>
          <div className="px-8 py-8 md:px-14 md:py-10 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
             <div className="flex flex-col">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Deployment Package</p>
               <p className="text-[10px] font-bold text-slate-900 mt-0.5">CloudTasks Enterprise 2.5.0</p>
             </div>
             <Button onClick={onClose} variant="outline" size="md" className="rounded-xl px-8 border-slate-200 shadow-none">Exit Interface</Button>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2.5 bg-slate-900 text-white rounded-2xl md:hidden shadow-xl active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
