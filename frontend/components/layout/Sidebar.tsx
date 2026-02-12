import React from 'react';
import {
  Activity,
  Camera,
  GanttChartSquare,
  Link2,
  Mic,
  Settings,
  Sparkles,
  Terminal,
  Users,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { MainViewType, Project, User } from '../../types';
import SidebarNavButton from './sidebar/SidebarNavButton';
import SidebarProjectList from './sidebar/SidebarProjectList';
import RecentActivityPanel from './sidebar/RecentActivityPanel';
import { useRecentActions } from '../../hooks/useRecentActions';

interface SidebarProps {
  isOpen: boolean;
  currentUser: User;
  allUsers: User[];
  projects: Project[];
  activeProjectId: string | null;
  currentView: MainViewType;
  onProjectSelect: (id: string | null) => void;
  onViewChange: (view: MainViewType) => void;
  onOpenCommandCenter: () => void;
  onOpenVoiceCommander: () => void;
  onOpenVisionModal: () => void;
  onAddProject: () => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onCompleteProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenSettings: () => void;
  onCloseSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  currentUser,
  allUsers,
  projects,
  activeProjectId,
  currentView,
  onProjectSelect,
  onViewChange,
  onOpenCommandCenter,
  onOpenVoiceCommander,
  onOpenVisionModal,
  onAddProject,
  onUpdateProject,
  onCompleteProject,
  onArchiveProject,
  onDeleteProject,
  onOpenSettings,
  onCloseSidebar
}) => {
  const recentActions = useRecentActions();

  const runSidebarAction = (action: () => void) => {
    action();
    if (window.innerWidth < 1024) onCloseSidebar();
  };

  return (
    <aside
      className={`h-full w-full bg-slate-50 border-r border-slate-200 flex flex-col p-4 text-slate-600 overflow-hidden ${
        isOpen ? 'fixed inset-0 z-[56] lg:relative lg:inset-auto' : 'hidden lg:flex'
      }`}
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 transition-all space-y-8">
        <SidebarProjectList
          allUsers={allUsers}
          currentUser={currentUser}
          projects={projects}
          activeProjectId={activeProjectId}
          currentView={currentView}
          onProjectSelect={onProjectSelect}
          onViewChange={onViewChange}
          onAddProject={onAddProject}
          onUpdateProject={onUpdateProject}
          onCompleteProject={onCompleteProject}
          onArchiveProject={onArchiveProject}
          onDeleteProject={onDeleteProject}
          onCloseSidebar={onCloseSidebar}
        />

        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-slate-500 mb-2 truncate">Insights</p>
          <SidebarNavButton
            active={currentView === 'roadmap'}
            onClick={() => runSidebarAction(() => onViewChange('roadmap'))}
            icon={GanttChartSquare}
            label="Roadmap"
          />
          <SidebarNavButton
            active={currentView === 'analytics'}
            onClick={() => runSidebarAction(() => onViewChange('analytics'))}
            icon={Activity}
            label="Analytics"
          />
          <SidebarNavButton
            active={currentView === 'resources'}
            onClick={() => runSidebarAction(() => onViewChange('resources'))}
            icon={Users}
            label="Resources"
            badge="AI"
          />
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-slate-500 mb-2 truncate">Workflows</p>
          <SidebarNavButton
            active={currentView === 'workflows'}
            onClick={() => runSidebarAction(() => onViewChange('workflows'))}
            icon={Zap}
            label="Workflows"
            badge="Pro"
          />
          <SidebarNavButton
            active={currentView === 'integrations'}
            onClick={() => runSidebarAction(() => onViewChange('integrations'))}
            icon={Link2}
            label="Integrations"
          />
          <SidebarNavButton
            active={currentView === 'templates'}
            onClick={() => runSidebarAction(() => onViewChange('templates'))}
            icon={LayoutGrid}
            label="Templates"
          />
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-slate-500 mb-2 truncate">Tools</p>
          <button
            onClick={() => runSidebarAction(onOpenCommandCenter)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 hover:border-slate-200 border border-transparent hover:text-slate-900 font-medium text-sm transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Terminal className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">AI Assistant</span>
            </div>
          </button>
          <button
            onClick={() => runSidebarAction(onOpenVoiceCommander)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 hover:border-slate-200 border border-transparent hover:text-slate-900 font-medium text-sm transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Mic className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">Voice Assistant</span>
            </div>
            <span className="text-[9px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full shrink-0">Live</span>
          </button>
          <button
            onClick={() => runSidebarAction(onOpenVisionModal)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 hover:border-slate-200 border border-transparent hover:text-slate-900 font-medium text-sm transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Camera className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">Image to Tasks</span>
            </div>
            <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        <RecentActivityPanel recentActions={recentActions} />
      </div>

      <div className="pt-4 border-t border-slate-200 shrink-0">
        <button
          onClick={() => runSidebarAction(onOpenSettings)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 hover:border-slate-200 border border-transparent hover:text-slate-900 font-medium transition-colors text-sm group"
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
