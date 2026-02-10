import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cloud, Plus, RotateCcw, Menu, User, Settings, ChevronDown, Bell, LogOut, CheckCheck } from 'lucide-react';
import { User as UserType } from '../../types';
import Button from '../ui/Button';
import { taskService } from '../../services/taskService';
import { SettingsTabType } from '../SettingsModal';
import { notificationService, Notification } from '../../services/notificationService';
import { dialogService } from '../../services/dialogService';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  onNewTask: () => void;
  onReset: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: (tab: SettingsTabType) => void;
  onOpenTaskFromNotification: (taskId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNewTask, onReset, onToggleSidebar, onOpenSettings, onOpenTaskFromNotification }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(() => {
    const alerts = notificationService.getNotifications(user.id);
    setNotifications(alerts);
  }, [user.id]);

  useEffect(() => {
    fetchNotifications();
    const handleAlertUpdate = (e: any) => {
      if (e.detail.userId === user.id) fetchNotifications();
    };
    window.addEventListener('notificationsUpdated', handleAlertUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleAlertUpdate);
  }, [user.id, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const formatNotificationTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return 'Just now';
    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
    if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}h ago`;
    return `${Math.max(1, Math.floor(diff / day))}d ago`;
  };

  return (
    <header className="flex-none w-full bg-white/95 backdrop-blur-md border-b border-[#e6d2dc] px-4 md:px-8 py-2.5 sticky top-0 z-[55]">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-500 hover:bg-[#f5eaf0] rounded-lg lg:hidden transition-all active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => window.location.reload()}>
            <div className="bg-[#76003f] p-1.5 rounded-lg">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-heading font-bold text-slate-900 tracking-tight">
              Velo<span className="text-[#76003f]">.</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center border-r border-slate-200 pr-3 gap-1.5">
            <button 
              onClick={async () => { const confirmed = await dialogService.confirm('Reset all demo data?', { title: 'Reset workspace', confirmText: 'Reset', danger: true }); if (confirmed) { taskService.clearData(); onReset(); } }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-all"
              title="Reset System"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button 
            size="sm" 
            variant="primary"
            onClick={onNewTask} 
            className="rounded-lg h-8 px-3.5 tracking-tight text-xs bg-[#76003f] hover:bg-[#640035]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Task
          </Button>

          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1.5 bg-[#f8eef3] text-[#76003f] hover:text-[#640035] hover:bg-[#f3e3eb] rounded-lg transition-all relative border border-[#ead4df]"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-[min(92vw,360px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[120]">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">{unreadCount} unread</p>
                  </div>
                  <button
                    onClick={() => notificationService.markAllAsRead(user.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#76003f] hover:text-[#640035] disabled:opacity-40"
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          notificationService.markAsRead(item.id);
                          if (item.linkId) onOpenTaskFromNotification(item.linkId);
                          setIsNotificationsOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                          item.read ? 'bg-white' : 'bg-rose-50/35'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-sm ${item.read ? 'text-slate-700' : 'text-slate-900 font-semibold'}`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">{item.message}</p>
                          </div>
                          {!item.read ? <span className="mt-1 w-2 h-2 rounded-full bg-rose-500 shrink-0" /> : null}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{formatNotificationTime(item.timestamp)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-2.5 border-l border-slate-300 outline-none group"
            >
              <div className="w-8 h-8 rounded-lg border border-[#ead4df] overflow-hidden bg-[#f8eef3] transition-transform group-hover:scale-105">
                <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-none tracking-tight">{user.displayName}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mt-1">{user.role}</p>
              </div>
              <ChevronDown className={`hidden md:block w-4 h-4 text-[#8a506f] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 z-[100]">
                <div className="p-3">
                  <button onClick={() => { onOpenSettings('profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button onClick={() => { onOpenSettings('general'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <div className="h-px bg-slate-100 my-2 mx-2" />
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
