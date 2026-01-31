import React, { useMemo } from 'react';
import { Task, Project, TaskStatus } from '../types';
import { Calendar, ChevronRight, AlertTriangle, CheckCircle2, Clock, GanttChartSquare, Lock } from 'lucide-react';
import Badge from './ui/Badge';

interface RoadmapViewProps {
  tasks: Task[];
  projects: Project[];
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ tasks, projects }) => {
  const roadmapData = useMemo(() => {
    const datedTasks = tasks
      .filter(t => t.dueDate)
      .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

    const groups: Record<string, Task[]> = {};
    datedTasks.forEach(task => {
      const month = new Date(task.dueDate!).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[month]) groups[month] = [];
      groups[month].push(task);
    });

    return Object.entries(groups);
  }, [tasks]);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (tasks.filter(t => t.dueDate).length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-12 text-center">
        <div className="p-8 md:p-12 bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 space-y-8 max-w-md animate-in zoom-in-95 duration-700">
          <div className="p-6 bg-indigo-50 rounded-3xl w-fit mx-auto text-indigo-600 shadow-inner">
            <GanttChartSquare className="w-16 h-16" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Timeline Data Void</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mt-3">No tasks have target dates assigned. Initialize deadlines in the global board to activate the Strategic Roadmap.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12 custom-scrollbar">
      <div className="max-w-[1400px] mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <Badge variant="indigo">STRATEGIC LAYER ACTIVE</Badge>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Strategic Roadmap</h2>
            <p className="text-slate-500 font-medium text-lg">Chronological visualization of organization milestones and cluster velocity.</p>
          </div>
          <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
             <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-800">Operational</span>
             </div>
             <div className="px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-800">Inhibited</span>
             </div>
          </div>
        </div>

        <div className="space-y-24 relative">
          <div className="absolute left-[3px] top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500 via-slate-200 to-indigo-500 rounded-full opacity-20 hidden lg:block" />
          
          {roadmapData.map(([month, monthTasks]) => (
            <div key={month} className="relative lg:pl-16">
              <div className="lg:absolute left-[-6px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 z-10 shadow-sm hidden lg:block" />
              
              <div className="sticky top-0 z-20 py-4 mb-10 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 backdrop-blur-md">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900 flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-indigo-600" /> {month}
                  {month === today && <span className="text-[9px] bg-indigo-600 text-white px-2.5 py-1 rounded-lg tracking-widest">CURRENT CYCLE</span>}
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{monthTasks.length} NODES</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {monthTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const isOverdue = (task.dueDate || 0) < Date.now() && task.status !== TaskStatus.DONE;
                  const isBlocked = (task.blockedByIds?.length || 0) > 0;

                  return (
                    <div 
                      key={task.id} 
                      className={`group bg-white p-8 rounded-[2.5rem] border-2 transition-all hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between min-h-[260px] relative ${
                        task.isAtRisk || isOverdue || isBlocked ? 'border-rose-200 ring-8 ring-rose-50/30' : 'border-slate-100 hover:border-indigo-500'
                      }`}
                    >
                      {isBlocked && (
                        <div className="absolute top-6 right-8 p-2 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 animate-in fade-in zoom-in-50 duration-500">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                           <div className={`p-2 rounded-xl ${task.status === TaskStatus.DONE ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                             {task.status === TaskStatus.DONE ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                           </div>
                           <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                             {new Date(task.dueDate!).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                           </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${project?.color || 'bg-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{project?.name || 'Global Cluster'}</span>
                        </div>
                        
                        <h4 className="text-xl font-black text-slate-900 tracking-tighter leading-[1.2] group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </h4>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                         <Badge variant={task.priority === 'High' ? 'rose' : 'indigo'}>{task.priority} INTENSITY</Badge>
                         {task.isAtRisk && (
                           <div className="flex items-center gap-2 text-rose-500">
                             <AlertTriangle className="w-4 h-4 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Compromised</span>
                           </div>
                         )}
                         {isBlocked && (
                           <div className="flex items-center gap-2 text-amber-600">
                             <Lock className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Blocked</span>
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapView;