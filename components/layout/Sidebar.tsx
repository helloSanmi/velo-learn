
import React from 'react';
import { LayoutDashboard, Settings, Activity, Terminal, Plus, X, Camera, Mic, Sparkles } from 'lucide-react';
import { Project } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  projects: Project[];
  activeProjectId: string | null;
  currentView: 'board' | 'analytics';
  onProjectSelect: (id: string | null) => void;
  onViewChange: (view: 'board' | 'analytics') => void;
  onOpenCommandCenter: () => void;
  onOpenVoiceCommander: () => void;
  onOpenVisionModal: () => void;
  onAddProject: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen,
  projects, 
  activeProjectId, 
  currentView,
  onProjectSelect, 
  onViewChange,
  onOpenCommandCenter,
  onOpenVoiceCommander,
  onOpenVisionModal,
  onAddProject,
  onOpenSettings
}) => {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-[56] w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-5 text-slate-400 
      transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:h-full
      ${isOpen ? 'translate-x-0 shadow-[40px_0_60px_-15px_rgba(0,0,0,0.3)]' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex items-center justify-between mb-8 lg:hidden">
        <span className="text-white font-black text-lg tracking-tighter">Navigation</span>
      </div>

      <div className="space-y-1.5 mb-10">
        <p className="px-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">Core Engine</p>
        <button 
          onClick={() => { onProjectSelect(null); onViewChange('board'); }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold transition-all duration-200 ${
            currentView === 'board' && activeProjectId === null 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-[1.02]' 
              : 'hover:bg-slate-800/50 hover:text-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          General Board
        </button>
        <button 
          onClick={() => onViewChange('analytics')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold transition-all duration-200 ${
            currentView === 'analytics' 
              ? 'bg-slate-700 text-white shadow-lg scale-[1.02]' 
              : 'hover:bg-slate-800/50 hover:text-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Analytics Hub
        </button>
      </div>

      <div className="space-y-1.5 mb-10">
        <p className="px-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">AI Modalities</p>
        <button 
          onClick={onOpenCommandCenter}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 hover:text-white font-bold transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <Terminal className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            AI Commander
          </div>
        </button>
        <button 
          onClick={onOpenVoiceCommander}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 hover:text-white font-bold transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <Mic className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
            Voice Commander
          </div>
          <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full">LIVE</span>
        </button>
        <button 
          onClick={onOpenVisionModal}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-800/80 hover:text-white font-bold transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <Camera className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
            Snap-to-Task
          </div>
          <Sparkles className="w-3 h-3 text-amber-500/40" />
        </button>
      </div>

      <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar-dark pr-1 no-scrollbar">
        <div className="flex items-center justify-between px-3 mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Shared Projects</p>
          <button 
            onClick={onAddProject} 
            className="p-1 text-slate-500 hover:text-indigo-400 transition-colors bg-slate-800/50 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {projects.length > 0 ? projects.map((project) => (
          <button
            key={project.id}
            onClick={() => { onProjectSelect(project.id); onViewChange('board'); }}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all font-bold group ${
              currentView === 'board' && activeProjectId === project.id 
                ? 'bg-slate-800 text-white ring-1 ring-slate-700' 
                : 'hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${project.color} group-hover:scale-125 transition-transform`} />
            <span className="truncate tracking-tight">{project.name}</span>
          </button>
        )) : (
          <div className="px-4 py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl opacity-40">
            <p className="text-[10px] font-black uppercase">No active projects</p>
          </div>
        )}
      </div>

      <div className="pt-6 mt-8 border-t border-slate-800 space-y-1.5">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-800 hover:text-white font-bold transition-all text-sm group"
        >
          <Settings className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:rotate-45 transition-all" />
          User Preferences
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
