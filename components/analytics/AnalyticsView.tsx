
import React, { useMemo, useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, Project, User } from '../../types';
import { TrendingUp, CheckCircle2, AlertCircle, Clock, Activity, BarChart3, AlertTriangle, Sparkles, Loader2, ArrowRight, Gauge } from 'lucide-react';
import Badge from '../ui/Badge';
import { aiService } from '../../services/aiService';
import { userService } from '../../services/userService';

interface AnalyticsViewProps {
  tasks: Task[];
  projects: Project[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, projects }) => {
  const [healthInsights, setHealthInsights] = useState<{ bottlenecks: string[]; suggestions: string[] } | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [allUsers] = useState<User[]>(userService.getUsers());

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const totalTimeMs = tasks.reduce((acc, t) => acc + (t.timeLogged || 0), 0);
    const totalHours = (totalTimeMs / 3600000).toFixed(1);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, totalHours, completionRate };
  }, [tasks]);

  const projectVitals = useMemo(() => {
    return projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const timeMs = pTasks.reduce((acc, t) => acc + (t.timeLogged || 0), 0);
      const done = pTasks.filter(t => t.status === TaskStatus.DONE).length;
      return {
        ...p,
        hours: (timeMs / 3600000).toFixed(1),
        velocity: pTasks.length > 0 ? (done / pTasks.length * 10).toFixed(1) : '0'
      };
    });
  }, [tasks, projects]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Velocity</h2>
                <p className="text-slate-500 font-medium">Monitoring {stats.totalHours} total logged hours across clusters</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <Gauge className="w-5 h-5 text-indigo-600" />
                <div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Global Velocity</p>
                    <p className="text-sm font-black text-slate-900">High Efficiency</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between h-48">
                <Clock className="w-8 h-8 opacity-50" />
                <div>
                    <p className="text-4xl font-black tracking-tight">{stats.totalHours}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Hours Invested</p>
                </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-48">
                <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                <div>
                    <p className="text-4xl font-black tracking-tight text-slate-900">{stats.completionRate}%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Closure Performance</p>
                </div>
            </div>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between h-48">
                <Activity className="w-8 h-8 text-indigo-400 opacity-50" />
                <div>
                    <p className="text-4xl font-black tracking-tight">{stats.total}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Nodes</p>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-indigo-600" /> Resource Allocation By Project
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {projectVitals.map(p => (
                    <div key={p.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-3 h-3 rounded-full ${p.color}`} />
                            <p className="text-sm font-black text-slate-800 truncate">{p.name}</p>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{p.hours}h</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time spent</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-indigo-600">{p.velocity}/10</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Velocity</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
