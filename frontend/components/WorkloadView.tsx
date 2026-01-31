import React, { useState, useMemo } from 'react';
import { User, Task, TaskStatus, TaskPriority } from '../types';
import { Users, Zap, TrendingUp, AlertCircle, ArrowRight, Sparkles, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { aiService } from '../services/aiService';

interface WorkloadViewProps {
  users: User[];
  tasks: Task[];
  onReassign: (taskId: string, toUserId: string) => void;
}

const WorkloadView: React.FC<WorkloadViewProps> = ({ users, tasks, onReassign }) => {
  const [isBalancing, setIsBalancing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);

  const userStats = useMemo(() => {
    return users.map(u => {
      const userTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== TaskStatus.DONE);
      const completedCount = tasks.filter(t => t.assigneeId === u.id && t.status === TaskStatus.DONE).length;
      const highPriority = userTasks.filter(t => t.priority === TaskPriority.HIGH).length;
      
      const load = userTasks.length;
      const status = load > 5 ? 'critical' : load > 3 ? 'warning' : 'optimal';
      
      return { ...u, activeCount: load, completedCount, highPriority, status };
    });
  }, [users, tasks]);

  const handleBalance = async () => {
    setIsBalancing(true);
    setSuggestions(null);
    const result = await aiService.suggestWorkloadBalance(tasks, users);
    setSuggestions(result);
    setIsBalancing(false);
  };

  const applyReassignment = (s: any) => {
    onReassign(s.taskId, s.toUserId);
    setSuggestions(prev => prev?.filter(item => item.taskId !== s.taskId) || null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12 animate-in fade-in duration-500 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Workforce Intelligence</h2>
            <p className="text-slate-500 font-medium mt-2">Real-time resource allocation and capacity monitoring.</p>
          </div>
          <Button 
            onClick={handleBalance} 
            disabled={isBalancing}
            variant="secondary" 
            className="rounded-2xl py-4 px-8 shadow-indigo-100"
          >
            {isBalancing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            Runa AI Balance Workload
          </Button>
        </div>

        {suggestions && suggestions.length > 0 && (
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-6 h-6 text-amber-300" />
              <h3 className="text-xl font-black uppercase tracking-widest">Runa AI Rebalancing Engine</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((s, i) => {
                const task = tasks.find(t => t.id === s.taskId);
                const from = users.find(u => u.id === s.fromUserId);
                const to = users.find(u => u.id === s.toUserId);
                return (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-between group hover:bg-white/20 transition-all">
                    <div>
                      <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">Optimization Suggestion</p>
                      <h4 className="text-lg font-bold leading-tight mb-4">Reassign "{task?.title}"</h4>
                      <div className="flex items-center gap-3 text-sm mb-6">
                        <span className="font-bold opacity-60">{from?.displayName.split(' ')[0]}</span>
                        <ArrowRight className="w-4 h-4 opacity-40" />
                        <span className="font-black text-emerald-300">{to?.displayName.split(' ')[0]}</span>
                      </div>
                      <p className="text-xs text-indigo-100/70 italic mb-6 leading-relaxed">"{s.reason}"</p>
                    </div>
                    <button 
                      onClick={() => applyReassignment(s)}
                      className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all"
                    >
                      Authorize Transfer
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSuggestions(null)} className="mt-8 text-[10px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity">Dismiss Recommendations</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStats.map(u => (
            <div key={u.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
               <div className="flex items-start justify-between mb-8">
                 <div className="relative">
                    <img src={u.avatar} className="w-16 h-16 rounded-[1.5rem] border-4 border-slate-50 shadow-sm group-hover:scale-105 transition-transform" alt="" />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${u.status === 'critical' ? 'bg-rose-500 animate-pulse' : u.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                 </div>
                 <Badge variant={u.status === 'critical' ? 'rose' : u.status === 'warning' ? 'amber' : 'emerald'}>
                   {u.status.toUpperCase()}
                 </Badge>
               </div>
               
               <div className="mb-8">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">{u.displayName}</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase text-slate-400">Current Load</p>
                    <p className="text-sm font-black text-slate-900">{u.activeCount} Active Tasks</p>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${Math.min(u.activeCount * 20, 100)}%` }} 
                      className={`h-full transition-all duration-1000 ${u.status === 'critical' ? 'bg-rose-500' : u.status === 'warning' ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mt-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-lg font-black text-slate-900 leading-none">{u.completedCount}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Closed</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-lg font-black text-rose-600 leading-none">{u.highPriority}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">High Risk</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkloadView;