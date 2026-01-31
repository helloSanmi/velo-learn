import React, { useState } from 'react';
import { MessageSquare, Github, Layout, CheckCircle2, AlertCircle, RefreshCcw, ExternalLink, Settings2, Trash2 } from 'lucide-react';
import { Project } from '../types';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { projectService } from '../services/projectService';

interface IntegrationHubProps {
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

const IntegrationHub: React.FC<IntegrationHubProps> = ({ projects, onUpdateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const toggleSlack = () => {
    if (!activeProject) return;
    const isEnabled = !activeProject.integrations?.slack?.enabled;
    onUpdateProject(activeProject.id, {
      integrations: {
        ...activeProject.integrations,
        slack: { enabled: isEnabled, channel: activeProject.integrations?.slack?.channel || 'engineering-updates' }
      }
    });
  };

  const connectors = [
    {
      id: 'slack',
      name: 'Slack',
      icon: <MessageSquare className="w-8 h-8 text-[#4A154B]" />,
      description: 'Stream task updates and comments directly to your team channels.',
      status: activeProject?.integrations?.slack?.enabled ? 'Connected' : 'Available',
      action: toggleSlack
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-8 h-8 text-[#181717]" />,
      description: 'Link pull requests and commits to Runa operational nodes.',
      status: 'Available',
      action: () => alert('GitHub Integration setup coming soon to your cluster.')
    },
    {
      id: 'jira',
      name: 'Atlassian Jira',
      icon: <Layout className="w-8 h-8 text-[#0052CC]" />,
      description: 'Two-way synchronization between Runa and Jira Software.',
      status: 'Available',
      action: () => alert('Jira Integration setup coming soon to your cluster.')
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12 animate-in fade-in duration-500 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Connector Hub</h2>
            <p className="text-slate-500 font-medium">Synchronize your enterprise nodes with third-party clusters.</p>
          </div>
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
             <span className="text-[10px] font-black uppercase text-slate-400 pl-4">Target Node</span>
             <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
             >
               {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {connectors.map(c => (
            <div key={c.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col">
               <div className="flex items-start justify-between mb-8">
                  <div className="p-5 bg-slate-50 rounded-[2rem] shadow-inner group-hover:scale-105 transition-transform">{c.icon}</div>
                  <Badge variant={c.status === 'Connected' ? 'emerald' : 'neutral'}>{c.status.toUpperCase()}</Badge>
               </div>
               
               <div className="flex-1">
                 <h3 className="text-xl font-black text-slate-900 mb-3">{c.name}</h3>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">{c.description}</p>
               </div>

               {c.status === 'Connected' ? (
                 <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                       <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                       <span className="text-xs font-bold text-emerald-800">Operational Sync Active</span>
                    </div>
                    <Button variant="outline" className="w-full py-4 rounded-2xl border-slate-200" onClick={c.action}>
                      <Settings2 className="w-4 h-4 mr-2" /> Configure Sync
                    </Button>
                 </div>
               ) : (
                 <Button variant="secondary" className="w-full py-4 rounded-2xl shadow-indigo-100" onClick={c.action}>
                   Establish Link <ExternalLink className="ml-2 w-4 h-4" />
                 </Button>
               )}
            </div>
          ))}
        </div>

        <div className="p-10 md:p-14 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-1000" />
           <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="shrink-0 p-6 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20"><RefreshCcw className="w-12 h-12 text-white animate-spin-slow" /></div>
              <div className="text-center md:text-left space-y-4">
                 <h3 className="text-3xl font-black tracking-tighter">Unified Synchronization Engine</h3>
                 <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">
                   Runa Enterprise uses a high-performance websocket bus to ensure every comment, status change, and code commit is propagated across your infrastructure nodes in sub-100ms.
                 </p>
                 <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                    <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest">Websockets: Active</div>
                    <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest">TLS 1.3: Secure</div>
                    <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest">Cluster: Node-04-A</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationHub;