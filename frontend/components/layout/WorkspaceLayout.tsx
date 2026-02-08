
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { User, Project, MainViewType } from '../../types';
import { SettingsTabType } from '../SettingsModal';
import { Globe, Cpu, Zap } from 'lucide-react';

interface WorkspaceLayoutProps {
  user: User;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  projects: Project[];
  activeProjectId: string | null;
  currentView: MainViewType;
  themeClass: string;
  compactMode: boolean;
  onLogout: () => void;
  onNewTask: () => void;
  onReset: () => void;
  onOpenSettings: (tab: SettingsTabType) => void;
  onProjectSelect: (id: string | null) => void;
  onViewChange: (view: MainViewType) => void;
  onOpenCommandCenter: () => void;
  onOpenVoiceCommander: () => void;
  onOpenVisionModal: () => void;
  onAddProject: () => void;
  children: React.ReactNode;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  user, isSidebarOpen, setIsSidebarOpen, projects, activeProjectId, currentView,
  themeClass, compactMode, onLogout, onNewTask, onReset, onOpenSettings,
  onProjectSelect, onViewChange, onOpenCommandCenter, onOpenVoiceCommander,
  onOpenVisionModal, onAddProject, children
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('velo_sidebar_width');
    return saved ? parseInt(saved, 10) : 288; 
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem('velo_sidebar_width', sidebarWidth.toString());
  }, [sidebarWidth]);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.min(Math.max(200, e.clientX), 500);
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div className={`h-screen w-screen flex flex-col bg-slate-50 overflow-hidden ${themeClass} ${compactMode ? 'compact-layout' : ''} ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      <Header 
        user={user} 
        onLogout={onLogout} 
        onNewTask={onNewTask} 
        onReset={onReset} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenSettings={onOpenSettings} 
      />
      
      <div className="flex-1 flex relative overflow-hidden">
        {isSidebarOpen && <div className="fixed inset-0 z-[55] bg-slate-900/30 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
        
        <div 
          className="relative hidden lg:flex h-full shrink-0 group/sidebar"
          style={{ width: `${sidebarWidth}px` }}
        >
          <Sidebar 
            isOpen={isSidebarOpen} 
            projects={projects} 
            activeProjectId={activeProjectId} 
            currentView={currentView} 
            onProjectSelect={onProjectSelect} 
            onViewChange={onViewChange} 
            onOpenCommandCenter={onOpenCommandCenter} 
            onOpenVoiceCommander={onOpenVoiceCommander} 
            onOpenVisionModal={onOpenVisionModal} 
            onAddProject={onAddProject} 
            onOpenSettings={() => onOpenSettings('general')} 
          />
          <div 
            onMouseDown={startResizing}
            className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[60] transition-colors ${isResizing ? 'bg-slate-300' : 'hover:bg-slate-200'}`}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-slate-400/30 rounded-full opacity-0 group-hover/sidebar:opacity-100" />
          </div>
        </div>

        <div className="lg:hidden">
          <Sidebar 
            isOpen={isSidebarOpen} 
            projects={projects} 
            activeProjectId={activeProjectId} 
            currentView={currentView} 
            onProjectSelect={onProjectSelect} 
            onViewChange={onViewChange} 
            onOpenCommandCenter={onOpenCommandCenter} 
            onOpenVoiceCommander={onOpenVoiceCommander} 
            onOpenVisionModal={onOpenVisionModal} 
            onAddProject={onAddProject} 
            onOpenSettings={() => onOpenSettings('general')} 
          />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
          <div className={`flex-1 flex flex-col overflow-hidden relative ${isResizing ? 'pointer-events-none' : ''}`}>
             {children}
          </div>
          
          <footer className="flex-none bg-white border-t border-slate-200 px-6 py-2.5">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-8">
              <div className="hidden md:flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[10px] font-medium text-slate-500 uppercase tracking-wide">System healthy</span>
                </div>
                <div className="h-3 w-px bg-slate-200" />
                <div className="flex items-center gap-2 text-slate-400">
                  <Globe className="w-3 h-3" />
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wide">US-East</span>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-3 px-4 py-1 bg-slate-50 rounded-full border border-slate-200">
                   <p className="font-mono text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                     Velo <span className="text-slate-700">v3.0.1</span>
                   </p>
                   <div className="w-1 h-1 rounded-full bg-slate-300" />
                   <p className="font-mono text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                     Workspace
                   </p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400">
                   <Cpu className="w-3 h-3" />
                   <span className="font-mono text-[10px] font-medium uppercase tracking-wide">Latency: 38ms</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                   <Zap className="w-3 h-3" />
                   <span className="font-mono text-[10px] font-medium uppercase tracking-wide">Sync: Active</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
