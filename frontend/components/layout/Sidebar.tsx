
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Activity, Terminal, Plus, X, Camera, Mic, Sparkles, Zap, LayoutGrid, Users, Link2, Globe, GanttChartSquare, Radio } from 'lucide-react';
import { Project, MainViewType, AuditEntry } from '../../types';
import { taskService } from '../../services/taskService';

interface SidebarProps {
  isOpen: boolean;
  projects: Project[];
  activeProjectId: string | null;
  currentView: MainViewType;
  onProjectSelect: (id: string | null) => void;
  onViewChange: (view: MainViewType) => void;
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
  const [recentActions, setRecentActions] = useState<any[]>([]);

  useEffect(() => {
    const fetchPulse = () => {
      const allTasks = JSON.parse(localStorage.getItem('velo_data') || '[]');
      const actions = allTasks
        .flatMap((t: any) => (t.auditLog || []).map((a: any) => ({ ...a, taskTitle: t.title })))
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 3);
      setRecentActions(actions);
    };
    fetchPulse();
    const interval = setInterval(fetchPulse, 5000);
    return () => clearInterval(interval);
  }, []);

  const NavButton = ({ active, onClick, icon: Icon, label, badge, colorClass = 'bg-indigo-600' }: { active: boolean; onClick: () => void; icon: any; label: string; badge?: string; colorClass?: string }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all duration-200 ${
        active ? `${colorClass} text-white shadow-lg scale-[1.02]` : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className="truncate">{label}</span>
      </div>
      {badge && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{badge}</span>}
    </button>
  );

  return (
    <aside className={`h-full w-full bg-slate-100/90 backdrop-blur-xl border-r border-slate-200 flex flex-col p-5 text-slate-600 overflow-hidden ${isOpen ? 'fixed inset-0 z-[56] lg:relative lg:inset-auto' : 'hidden lg:flex'}`}>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-2 no-scrollbar hover:no-scrollbar-show transition-all space-y-8">
        
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 truncate">Core Hub</p>
          <NavButton active={currentView === 'board' && activeProjectId === null} onClick={() => { onProjectSelect(null); onViewChange('board'); }} icon={LayoutDashboard} label="Global Board" />
          <NavButton active={currentView === 'roadmap'} onClick={() => onViewChange('roadmap')} icon={GanttChartSquare} label="Strategic Roadmap" />
          <NavButton active={currentView === 'analytics'} onClick={() => onViewChange('analytics')} icon={Activity} label="Velocity Center" />
          <NavButton active={currentView === 'resources'} onClick={() => onViewChange('resources')} icon={Users} label="Resource Hub" badge="AI" colorClass="bg-emerald-600" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 truncate">Shared Projects</p>
            <button onClick={onAddProject} className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-200/50 rounded-lg transition-colors shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-1">
            {projects.length > 0 ? projects.map((project) => (
              <button key={project.id} onClick={() => { onProjectSelect(project.id); onViewChange('board'); }} className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all font-bold group ${currentView === 'board' && activeProjectId === project.id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/40 hover:text-slate-900'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${project.color} shrink-0`} />
                <span className="truncate tracking-tight text-sm">{project.name}</span>
                {project.isPublic && <Globe className="w-3 h-3 text-indigo-500 ml-auto opacity-60 shrink-0" />}
              </button>
            )) : (
              <div className="px-4 py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl opacity-40">
                <p className="text-[8px] font-black uppercase">No active nodes</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 truncate">Enterprise Logic</p>
          <NavButton active={currentView === 'workflows'} onClick={() => onViewChange('workflows')} icon={Zap} label="Workflow Engine" badge="PRO" />
          <NavButton active={currentView === 'integrations'} onClick={() => onViewChange('integrations')} icon={Link2} label="Connector Hub" colorClass="bg-amber-600" />
          <NavButton active={currentView === 'templates'} onClick={() => onViewChange('templates')} icon={LayoutGrid} label="Strategy Gallery" />
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 truncate">AI Modalities</p>
          <button onClick={onOpenCommandCenter} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-200/80 hover:text-slate-900 font-bold transition-all group text-left">
            <div className="flex items-center gap-3.5 min-w-0"><Terminal className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" /><span className="truncate">AI Commander</span></div>
          </button>
          <button onClick={onOpenVoiceCommander} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-200/80 hover:text-slate-900 font-bold transition-all group text-left">
            <div className="flex items-center gap-3.5 min-w-0"><Mic className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" /><span className="truncate">Voice Commander</span></div>
            <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full shrink-0">LIVE</span>
          </button>
          <button onClick={onOpenVisionModal} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-200/80 hover:text-slate-900 font-bold transition-all group text-left">
            <div className="flex items-center gap-3.5 min-w-0"><Camera className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" /><span className="truncate">Snap-to-Task</span></div>
            <Sparkles className="w-3 h-3 text-amber-500/60 shrink-0" />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2 px-3 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 truncate">Workspace Pulse</p>
          </div>
          <div className="space-y-3 px-3">
            {recentActions.map((action, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-[10px] font-bold text-slate-600 leading-tight">
                  <span className="text-indigo-600">{action.displayName}</span> {action.action.toLowerCase()}
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{action.taskTitle}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="pt-6 border-t border-slate-200 shrink-0">
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-200 hover:text-slate-900 font-bold transition-all text-sm group">
          <Settings className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:rotate-45 transition-all shrink-0" />
          <span className="truncate">User Preferences</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
