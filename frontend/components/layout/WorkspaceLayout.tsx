
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { User, Project, MainViewType } from '../../types';
import { SettingsTabType } from '../SettingsModal';

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
  onRefreshData: () => void;
  onOpenSettings: (tab: SettingsTabType) => void;
  onOpenTaskFromNotification: (taskId: string) => void;
  onCloseSidebar: () => void;
  onProjectSelect: (id: string | null) => void;
  onViewChange: (view: MainViewType) => void;
  onOpenCommandCenter: () => void;
  onOpenVoiceCommander: () => void;
  onOpenVisionModal: () => void;
  onAddProject: () => void;
  onRenameProject: (id: string, name: string) => void;
  onCompleteProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onlineCount: number;
  isOnline: boolean;
  children: React.ReactNode;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  user, isSidebarOpen, setIsSidebarOpen, projects, activeProjectId, currentView,
  themeClass, compactMode, onLogout, onNewTask, onReset, onRefreshData, onOpenSettings,
  onOpenTaskFromNotification, onCloseSidebar, onProjectSelect, onViewChange, onOpenCommandCenter, onOpenVoiceCommander,
  onOpenVisionModal, onAddProject, onRenameProject, onCompleteProject, onArchiveProject, onDeleteProject, onlineCount, isOnline, children
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
    <div className={`h-[100dvh] min-h-[100dvh] w-screen flex flex-col bg-[#f7f3f6] overflow-hidden ${themeClass} ${compactMode ? 'compact-layout' : ''} ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      <Header 
        user={user} 
        onLogout={onLogout} 
        onNewTask={onNewTask} 
        onReset={onReset} 
        onRefreshData={onRefreshData}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenSettings={onOpenSettings}
        onOpenTaskFromNotification={onOpenTaskFromNotification}
        onlineCount={onlineCount}
        isOnline={isOnline}
      />
      
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
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
            onRenameProject={onRenameProject}
            onCompleteProject={onCompleteProject}
            onArchiveProject={onArchiveProject}
            onDeleteProject={onDeleteProject}
            onOpenSettings={() => onOpenSettings('general')} 
            onCloseSidebar={onCloseSidebar}
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
            onRenameProject={onRenameProject}
            onCompleteProject={onCompleteProject}
            onArchiveProject={onArchiveProject}
            onDeleteProject={onDeleteProject}
            onOpenSettings={() => onOpenSettings('general')} 
            onCloseSidebar={onCloseSidebar}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#f7f3f6] relative">
          <div className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative ${isResizing ? 'pointer-events-none' : ''}`}>
             {children}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
