
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cloud, Plus, LogOut, RotateCcw, Menu, User, Settings, Shield, ChevronDown, Bell, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../../types';
import Button from '../ui/Button';
import { taskService } from '../../services/taskService';
import { SettingsTabType } from '../SettingsModal';
import { notificationService, Notification } from '../../services/notificationService';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  onNewTask: () => void;
  onReset: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: (tab: SettingsTabType) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNewTask, onReset, onToggleSidebar, onOpenSettings }) => {
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
      if (e.detail.userId === user.id) {
        fetchNotifications();
      }
    };
    
    window.addEventListener('notificationsUpdated', handleAlertUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleAlertUpdate);
  }, [user.id, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleReset = () => {
    if (window.confirm('Reset workspace data to demo defaults?')) {
      taskService.clearData();
      onReset();
    }
  };

  const handleMenuAction = (tab: SettingsTabType) => {
    onOpenSettings(tab);
    setIsProfileOpen(false);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(user.id);
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <header className="flex-none w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 lg:px-8 py-3.5 sticky top-0 z-[55]">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left Section: Branding & Menu Toggle */}
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl lg:hidden transition-all active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 shrink-0 group cursor-default">
            <div className="bg-slate-900 p-2 rounded-xl shadow-indigo-200/50 shadow-lg group-hover:bg-indigo-600 group-hover:rotate-3 transition-all duration-500">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter select-none">CloudTasks</h1>
          </div>
        </div>
        
        {/* Right Section: Global Actions & Profile Control */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center border-r border-slate-200 pr-5 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset} 
              className="text-slate-500 border-none shadow-none hover:bg-slate-100 h-9 font-bold px-3"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Reset
            </Button>
          </div>

          <Button 
            size="sm" 
            onClick={onNewTask} 
            className="px-4 md:px-5 rounded-xl h-10 font-bold shadow-indigo-100 shadow-xl"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">New Task</span>
          </Button>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative group"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse group-hover:scale-125 transition-transform" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-[100] ring-1 ring-black/5">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                   <div>
                     <h3 className="text-sm font-black text-slate-900">Alert Center</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{unreadCount} unread items</p>
                   </div>
                   {unreadCount > 0 && (
                     <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                     >
                       Clear All
                     </button>
                   )}
                </div>
                
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => { notificationService.markAsRead(n.id); setIsNotificationsOpen(false); }}
                      className={`p-5 border-b border-slate-50 transition-colors cursor-pointer group hover:bg-slate-50/80 relative ${!n.read ? 'bg-indigo-50/20' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-slate-200' : 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]'}`} />
                        <div className="flex-1">
                          <p className={`text-sm tracking-tight ${!n.read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-2.5 uppercase tracking-tighter">{timeAgo(n.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-16 px-10 text-center">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
                          <CheckCircle2 className="w-6 h-6" />
                       </div>
                       <p className="text-sm font-black text-slate-900">Workspace is quiet</p>
                       <p className="text-xs text-slate-400 mt-1 font-medium">Notifications for assignments and updates will appear here.</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                   <button onClick={() => setIsNotificationsOpen(false)} className="text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Close Panel</button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 md:gap-4 pl-3 md:pl-5 border-l border-slate-200 group outline-none"
            >
              <div className="hidden lg:flex flex-col items-end mr-1 transition-opacity group-hover:opacity-70">
                <span className="text-[12px] font-black text-slate-900 leading-none mb-1 tracking-tight">{user.username}</span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">Admin</span>
              </div>
              <div className="w-10 h-10 rounded-xl border-2 border-white shadow-xl ring-1 ring-slate-100 overflow-hidden bg-slate-100 shrink-0 transform group-hover:scale-105 transition-transform">
                <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
              </div>
              <ChevronDown className={`hidden md:block w-4 h-4 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2.5rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-[100] ring-1 ring-black/5">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Authenticated Identity</p>
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user.email || user.username}</p>
                </div>
                <div className="p-3 grid gap-1">
                  <button 
                    onClick={() => handleMenuAction('general')}
                    className="w-full flex items-center gap-3.5 px-5 py-4 rounded-3xl text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-indigo-600 transition-all group"
                  >
                    <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <Settings className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    System Settings
                  </button>
                  <button 
                    onClick={() => handleMenuAction('profile')}
                    className="w-full flex items-center gap-3.5 px-5 py-4 rounded-3xl text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-indigo-600 transition-all group"
                  >
                    <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    Manage Profile
                  </button>
                  <button 
                    onClick={() => handleMenuAction('security')}
                    className="w-full flex items-center gap-3.5 px-5 py-4 rounded-3xl text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-indigo-600 transition-all group"
                  >
                    <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <Shield className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    Security Audit
                  </button>
                  
                  <div className="h-[1px] bg-slate-100 my-2 mx-5" />
                  
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3.5 px-5 py-4 rounded-3xl text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all group"
                  >
                    <div className="p-2 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    Sign Out Session
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Build v2.5.0 • Stable</p>
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
