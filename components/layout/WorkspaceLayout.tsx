
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { User, Project } from '../../types';
import { SettingsTabType } from '../SettingsModal';

interface WorkspaceLayoutProps {
  user: User;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  projects: Project[];
  activeProjectId: string | null;
  currentView: 'board' | 'analytics';
  themeClass: string;
  compactMode: boolean;
  onLogout: () => void;
  onNewTask: () => void;
  onReset: () => void;
  onOpenSettings: (tab: SettingsTabType) => void;
  onProjectSelect: (id: string | null) => void;
  onViewChange: (view: 'board' | 'analytics') => void;
  onOpenCommandCenter: () => void;
  onOpenVoiceCommander: () => void;
  onOpenVisionModal: () => void;
  onAddProject: () => void;
  children: React.ReactNode;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  user,
  isSidebarOpen,
  setIsSidebarOpen,
  projects,
  activeProjectId,
  currentView,
  themeClass,
  compactMode,
  onLogout,
  onNewTask,
  onReset,
  onOpenSettings,
  onProjectSelect,
  onViewChange,
  onOpenCommandCenter,
  onOpenVoiceCommander,
  onOpenVisionModal,
  onAddProject,
  children
}) => {
  return (
    <div className={`h-screen w-screen flex flex-col bg-slate-50 overflow-hidden ${themeClass} ${compactMode ? 'compact-layout' : ''}`}>
      <Header 
        user={user} 
        onLogout={onLogout} 
        onNewTask={onNewTask} 
        onReset={onReset}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={onOpenSettings}
      />

      <div className="flex-1 flex relative overflow-hidden">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

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
        
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
          {children}
          
          <footer className="flex-none py-4 border-t border-slate-200 bg-white text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 opacity-60">
              CloudTasks Enterprise v2.5 • Press Ctrl+K for command bar
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
