
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Activity, Terminal, Plus, Camera, Mic, Sparkles, Zap, LayoutGrid, Users, Link2, Globe, GanttChartSquare, MoreHorizontal, Pencil, Archive, Trash2, Check, X } from 'lucide-react';
import { Project, MainViewType } from '../../types';

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
  onRenameProject: (id: string, name: string) => void;
  onCompleteProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
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
  onRenameProject,
  onCompleteProject,
  onArchiveProject,
  onDeleteProject,
  onOpenSettings
}) => {
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

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

  useEffect(() => {
    const handleOutside = () => setMenuProjectId(null);
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const activeProjects = projects.filter((project) => !project.isArchived && !project.isCompleted && !project.isDeleted);

  const startEditingProject = (project: Project) => {
    setMenuProjectId(null);
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const submitProjectRename = () => {
    if (!editingProjectId) return;
    const trimmed = editingProjectName.trim();
    if (!trimmed) return;
    onRenameProject(editingProjectId, trimmed);
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const NavButton = ({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: any; label: string; badge?: string }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-colors border ${
        active ? 'bg-white text-[#76003f] border-[#e6d2dc] shadow-sm' : 'text-slate-600 border-transparent hover:bg-white hover:border-[#ead4df] hover:text-[#76003f]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#76003f]' : 'text-slate-400'}`} />
        <span className="truncate">{label}</span>
      </div>
      {badge && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${active ? 'bg-[#f5eaf0] text-[#76003f]' : 'bg-slate-200 text-slate-700'}`}>{badge}</span>}
    </button>
  );

  return (
    <aside className={`h-full w-full bg-[#fbf7f9] border-r border-[#ead4df] flex flex-col p-4 text-slate-600 overflow-hidden ${isOpen ? 'fixed inset-0 z-[56] lg:relative lg:inset-auto' : 'hidden lg:flex'}`}>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 transition-all space-y-8">
        
        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-[#8a506f] mb-2 truncate">Workspace</p>
          <NavButton active={currentView === 'board' && activeProjectId === null} onClick={() => { onProjectSelect(null); onViewChange('board'); }} icon={LayoutDashboard} label="Board" />

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <NavButton active={currentView === 'projects'} onClick={() => { onProjectSelect(null); onViewChange('projects'); }} icon={LayoutGrid} label={`Projects (${activeProjects.length})`} />
            </div>
            <button onClick={onAddProject} className="w-8 h-8 rounded-lg text-[#8a506f] hover:text-[#76003f] bg-white border border-[#ead4df] transition-colors shrink-0 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 max-h-[26vh] lg:max-h-[calc(100dvh-460px)] 2xl:max-h-[calc(100dvh-420px)] overflow-y-auto custom-scrollbar pr-1 pl-3 border-l border-[#ead4df] ml-3">
            {activeProjects.length > 0 ? activeProjects.map((project) => {
              const isActive = currentView === 'board' && activeProjectId === project.id;
              const isLiveProject = activeProjectId === project.id;
              const isEditing = editingProjectId === project.id;
              return (
                <div key={project.id} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors font-medium border group ${isActive ? 'bg-white border-[#e6d2dc] text-[#76003f] shadow-sm' : 'text-slate-600 border-transparent hover:bg-white hover:border-[#ead4df] hover:text-[#76003f]'}`}>
                  <button onClick={() => { onProjectSelect(project.id); onViewChange('board'); }} className="flex-1 min-w-0 flex items-center gap-2.5 text-left">
                    <div className={`w-3 h-3 rounded-full ${project.color} shrink-0 ${isLiveProject ? 'active-node ring-2 ring-[#76003f]/25 ring-offset-1 ring-offset-white' : ''}`} />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingProjectName}
                        onChange={(event) => setEditingProjectName(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            submitProjectRename();
                          }
                          if (event.key === 'Escape') {
                            setEditingProjectId(null);
                            setEditingProjectName('');
                          }
                        }}
                        className="h-7 w-full rounded-md border border-slate-300 px-2 text-xs bg-white outline-none"
                      />
                    ) : (
                      <span className="truncate tracking-tight text-sm">{project.name}</span>
                    )}
                  </button>
                  {project.isPublic && !isEditing && <Globe className={`w-3 h-3 shrink-0 ${isActive ? 'text-slate-500' : 'text-slate-400'}`} />}
                  {isEditing ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          submitProjectRename();
                        }}
                        className="w-6 h-6 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                        title="Save"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingProjectId(null);
                          setEditingProjectName('');
                        }}
                        className="w-6 h-6 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuProjectId((prev) => (prev === project.id ? null : project.id));
                        }}
                        className="w-6 h-6 rounded-md border border-transparent hover:border-[#ead4df] hover:bg-white text-slate-500 flex items-center justify-center"
                        title="Project actions"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      {menuProjectId === project.id && (
                        <div className="absolute right-0 top-7 z-20 w-40 rounded-lg border border-slate-200 bg-white shadow-lg p-1.5 space-y-1">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditingProject(project);
                            }}
                            className="w-full h-8 px-2 rounded-md hover:bg-slate-50 text-xs text-slate-700 inline-flex items-center gap-2"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit name
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuProjectId(null);
                              onCompleteProject(project.id);
                            }}
                            className="w-full h-8 px-2 rounded-md hover:bg-slate-50 text-xs text-slate-700 inline-flex items-center gap-2"
                          >
                            <Check className="w-3.5 h-3.5" /> Complete
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuProjectId(null);
                              onArchiveProject(project.id);
                            }}
                            className="w-full h-8 px-2 rounded-md hover:bg-slate-50 text-xs text-slate-700 inline-flex items-center gap-2"
                          >
                            <Archive className="w-3.5 h-3.5" /> Archive
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              const shouldDelete = window.confirm('Move this project to deleted?');
                              setMenuProjectId(null);
                              if (shouldDelete) onDeleteProject(project.id);
                            }}
                            className="w-full h-8 px-2 rounded-md hover:bg-rose-50 text-xs text-rose-700 inline-flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="px-4 py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl opacity-40">
                <p className="text-[10px] font-semibold uppercase tracking-wide">No projects yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-[#8a506f] mb-2 truncate">Insights</p>
          <NavButton active={currentView === 'roadmap'} onClick={() => onViewChange('roadmap')} icon={GanttChartSquare} label="Roadmap" />
          <NavButton active={currentView === 'analytics'} onClick={() => onViewChange('analytics')} icon={Activity} label="Analytics" />
          <NavButton active={currentView === 'resources'} onClick={() => onViewChange('resources')} icon={Users} label="Resources" badge="AI" />
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-[#8a506f] mb-2 truncate">Workflows</p>
          <NavButton active={currentView === 'workflows'} onClick={() => onViewChange('workflows')} icon={Zap} label="Workflows" badge="Pro" />
          <NavButton active={currentView === 'integrations'} onClick={() => onViewChange('integrations')} icon={Link2} label="Integrations" />
          <NavButton active={currentView === 'templates'} onClick={() => onViewChange('templates')} icon={LayoutGrid} label="Templates" />
        </div>

        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-[#8a506f] mb-2 truncate">Tools</p>
          <button onClick={onOpenCommandCenter} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:border-[#ead4df] border border-transparent hover:text-[#76003f] font-medium text-sm transition-colors text-left">
            <div className="flex items-center gap-3 min-w-0"><Terminal className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">AI Assistant</span></div>
          </button>
          <button onClick={onOpenVoiceCommander} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:border-[#ead4df] border border-transparent hover:text-[#76003f] font-medium text-sm transition-colors text-left">
            <div className="flex items-center gap-3 min-w-0"><Mic className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">Voice Assistant</span></div>
            <span className="text-[9px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full shrink-0">Live</span>
          </button>
          <button onClick={onOpenVisionModal} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:border-[#ead4df] border border-transparent hover:text-[#76003f] font-medium text-sm transition-colors text-left">
            <div className="flex items-center gap-3 min-w-0"><Camera className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">Image to Tasks</span></div>
            <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        <div className="pt-4 border-t border-[#ead4df] space-y-3">
          <div className="flex items-center gap-2 px-3 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a506f] truncate">Recent Activity</p>
          </div>
          <div className="space-y-3 px-3">
            {recentActions.map((action, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-[12px] font-medium text-slate-700 leading-tight">
                  <span className="text-slate-900">{action.displayName}</span> {action.action.toLowerCase()}
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{action.taskTitle}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="pt-4 border-t border-[#ead4df] shrink-0">
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white hover:border-[#ead4df] border border-transparent hover:text-[#76003f] font-medium transition-colors text-sm group">
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
