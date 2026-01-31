import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cloud, Plus, RotateCcw, Menu, User, Settings, ChevronDown, Bell, LogOut } from 'lucide-react';
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

  return (
    <header className="flex-none w-full bg-slate-100/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 sticky top-0 z-[55] shadow-sm">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-500 hover:bg-slate-200 rounded-xl lg:hidden transition-all active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => window.location.reload()}>
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-300 ring-2 ring-slate-100">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-heading font-extrabold text-slate-900 tracking-tighter">
              Velo<span className="text-indigo-600">.</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center border-r border-slate-300 pr-4 gap-2">
            <button 
              onClick={() => { if(confirm('Reset all Velo nodes?')) { taskService.clearData(); onReset(); } }}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Reset System"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <Button 
            size="sm" 
            variant="secondary"
            onClick={onNewTask} 
            className="rounded-xl font-extrabold h-10 px-6 tracking-tight"
          >
            <Plus className="w-4 h-4 mr-2" />
            Provision Node
          </Button>

          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2.5 bg-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all relative border border-slate-300/50"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-100 animate-pulse" />
              )}
            </button>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-slate-300 outline-none group"
            >
              <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md overflow-hidden bg-slate-200 ring-1 ring-slate-300 transition-transform group-hover:scale-105">
                <img src={user.avatar} className="w-full h-full object-cover" alt={user.username} />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-black text-slate-900 leading-none tracking-tight">{user.displayName}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role}</p>
              </div>
              <ChevronDown className={`hidden md:block w-4 h-4 text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 z-[100]">
                <div className="p-3">
                  <button onClick={() => { onOpenSettings('profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                    <User className="w-4 h-4" /> Identity Details
                  </button>
                  <button onClick={() => { onOpenSettings('general'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                    <Settings className="w-4 h-4" /> Preferences
                  </button>
                  <div className="h-px bg-slate-100 my-2 mx-2" />
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all">
                    <LogOut className="w-4 h-4" /> Exit Session
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