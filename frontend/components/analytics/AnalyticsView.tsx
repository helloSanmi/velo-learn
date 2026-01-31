import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, TaskPriority, Project, User } from '../../types';
import { 
  TrendingUp, 
  Clock, 
  Activity, 
  Gauge, 
  Users, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  Layers,
  Terminal,
  FileDown,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { aiService } from '../../services/aiService';

interface AnalyticsViewProps {
  tasks: Task[];
  projects: Project[];
  allUsers: User[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, projects, allUsers }) => {
  const [healthInsights, setHealthInsights] = useState<{ bottlenecks: string[]; suggestions: string[] } | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // Collapsible States
  const [isWorkforceExpanded, setIsWorkforceExpanded] = useState(false);
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(false);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const totalTimeMs = tasks.reduce((acc, t) => acc + (t.timeLogged || 0), 0);
    const totalHours = (totalTimeMs / 3600000).toFixed(1);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const statusDist = {
      todo: total > 0 ? (tasks.filter(t => t.status === TaskStatus.TODO).length / total) * 100 : 0,
      inProgress: total > 0 ? (inProgress / total) * 100 : 0,
      done: total > 0 ? (completed / total) * 100 : 0,
    };
    const highPriorityCount = tasks.filter(t => t.priority === TaskPriority.HIGH).length;
    const priorityRisk = total > 0 ? (highPriorityCount / total) * 100 : 0;
    return { total, completed, inProgress, totalHours, completionRate, statusDist, priorityRisk };
  }, [tasks]);

  const workforceData = useMemo(() => {
    return allUsers.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const activeCount = userTasks.filter(t => t.status !== TaskStatus.DONE).length;
      const doneCount = userTasks.filter(t => t.status === TaskStatus.DONE).length;
      const highPriCount = userTasks.filter(t => t.priority === TaskPriority.HIGH).length;
      const timeMs = userTasks.reduce((acc, t) => acc + (t.timeLogged || 0), 0);
      const hours = timeMs / 3600000;
      
      // Precision Velocity: Factoring in task complexity (Priority weights)
      const complexityPoints = userTasks.reduce((acc, t) => {
          if (t.priority === TaskPriority.HIGH) return acc + 3;
          if (t.priority === TaskPriority.MEDIUM) return acc + 2;
          return acc + 1;
      }, 0);
      
      const velocity = hours > 0 ? (complexityPoints / hours).toFixed(2) : (doneCount > 0 ? doneCount : 0);
      const focus = userTasks.length > 0 ? Math.round((highPriCount / userTasks.length) * 100) : 0;

      return {
        ...user,
        activeCount,
        doneCount,
        hours: hours.toFixed(1),
        velocity,
        focus,
        totalAssigned: userTasks.length
      };
    }).sort((a, b) => Number(b.velocity) - Number(a.velocity)); // Sort by actual velocity
  }, [tasks, allUsers]);

  const telemetry = useMemo(() => {
    return tasks
      .flatMap(t => (t.auditLog || []).map(a => ({ ...a, taskTitle: t.title })))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks]);

  const runAIHealthAudit = async () => {
    setIsLoadingInsights(true);
    try {
      const insights = await aiService.getHealthInsights(tasks, allUsers);
      setHealthInsights(insights);
    } catch (error) {
      console.error("Audit failed", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const displayedWorkforce = isWorkforceExpanded ? workforceData : workforceData.slice(0, 4);
  const displayedTelemetry = isTelemetryExpanded ? telemetry : telemetry.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 animate-in fade-in duration-500 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="indigo">TELEMETRY: ACTIVE</Badge>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Velocity Center</h2>
                <p className="text-slate-500 font-medium text-sm md:text-base mt-1">Analyzing {stats.total} operational nodes for your organization.</p>
            </div>
            <div className="flex items-center gap-3 no-print">
                <Button 
                    onClick={handleExportPDF} 
                    variant="outline" 
                    className="rounded-2xl py-3 px-6 bg-white border-slate-200"
                >
                    <FileDown className="w-4 h-4 mr-2" />
                    Strategic Report
                </Button>
                <Button 
                    onClick={runAIHealthAudit} 
                    disabled={isLoadingInsights}
                    variant="secondary" 
                    className="rounded-2xl py-3 px-6 shadow-indigo-200 w-full md:w-auto"
                >
                    {isLoadingInsights ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                    Strategy Audit
                </Button>
            </div>
        </div>

        {/* Top Level Vital Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl flex flex-col justify-between h-40 md:h-auto">
                <Activity className="w-6 h-6 text-indigo-400 mb-2 md:mb-6" />
                <div>
                  <p className="text-3xl md:text-4xl font-black tracking-tighter">{stats.total}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cluster Nodes</p>
                </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-40 md:h-auto">
                <TrendingUp className="w-6 h-6 text-emerald-500 mb-2 md:mb-6" />
                <div>
                  <p className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">{stats.completionRate}%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Resolution Rate</p>
                </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-40 md:h-auto">
                <Clock className="w-6 h-6 text-indigo-600 mb-2 md:mb-6" />
                <div>
                  <p className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">{stats.totalHours}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Hours</p>
                </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-40 md:h-auto">
                <Gauge className={`w-6 h-6 mb-2 md:mb-6 ${stats.priorityRisk > 30 ? 'text-rose-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">{Math.round(stats.priorityRisk)}%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategic Risk Factor</p>
                </div>
            </div>
        </div>

        {/* Main Analytics Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
                {/* Infrastructure Section */}
                <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 p-6 md:p-10 shadow-sm">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 md:mb-8 flex items-center gap-3">
                        <Layers className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /> Organizational Saturation
                    </h3>
                    <div className="relative h-12 md:h-16 w-full bg-slate-100 rounded-xl md:rounded-2xl overflow-hidden flex shadow-inner">
                        <div style={{ width: `${stats.statusDist.todo}%` }} className="h-full bg-slate-200 transition-all duration-1000" />
                        <div style={{ width: `${stats.statusDist.inProgress}%` }} className="h-full bg-indigo-600 transition-all duration-1000" />
                        <div style={{ width: `${stats.statusDist.done}%` }} className="h-full bg-emerald-500 transition-all duration-1000" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6">
                        <div className="text-center">
                            <p className="text-lg md:text-xl font-black text-slate-900">{stats.statusDist.todo.toFixed(0)}%</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Backlog</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg md:text-xl font-black text-indigo-600">{stats.statusDist.inProgress.toFixed(0)}%</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Active</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg md:text-xl font-black text-emerald-600">{stats.statusDist.done.toFixed(0)}%</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Resolved</p>
                        </div>
                    </div>
                </div>

                {/* Workforce Strategic Performance - COLLAPSIBLE */}
                <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 p-6 md:p-10 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
                        <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /> Workforce Strategic Performance
                        </h3>
                        <div className="flex items-center gap-2 no-print">
                            <button 
                                onClick={() => setIsWorkforceExpanded(!isWorkforceExpanded)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                            >
                                {isWorkforceExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Collapse Personnel</> : <><ChevronDown className="w-3.5 h-3.5" /> View {workforceData.length} Personnel</>}
                            </button>
                        </div>
                    </div>
                    
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${isWorkforceExpanded ? 'max-h-[2000px]' : 'max-h-[600px] overflow-hidden relative'}`}>
                        {!isWorkforceExpanded && workforceData.length > 4 && (
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
                        )}
                        {displayedWorkforce.map(u => (
                            <div key={u.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={u.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm" alt="" />
                                        <div className="min-w-0">
                                            <p className="text-base font-black text-slate-900 truncate">{u.displayName}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-indigo-600 tracking-tighter">{u.velocity}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Velocity Score</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-sm font-black text-slate-900">{u.activeCount}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Pending</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-sm font-black text-emerald-600">{u.doneCount}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Closed</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-sm font-black text-indigo-600">{u.focus}%</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Focus</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {!isWorkforceExpanded && workforceData.length > 4 && (
                        <button 
                            onClick={() => setIsWorkforceExpanded(true)}
                            className="w-full py-4 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl transition-all mt-4 no-print"
                        >
                            Surfacing High-Velocity Nodes Only • View Full Organization
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-6 md:space-y-8">
                {/* Strategy Feed */}
                <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-xl"><Sparkles className="w-5 h-5 text-indigo-600" /></div>
                        <h3 className="text-lg font-black text-slate-900">Strategy Feed</h3>
                    </div>
                    {healthInsights ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            {healthInsights.bottlenecks.map((b, i) => (
                                <div key={i} className="flex gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-900">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" /> {b}
                                </div>
                            ))}
                            <button onClick={() => setHealthInsights(null)} className="w-full py-2 text-[10px] font-black uppercase text-slate-400 no-print">Clear Audit Results</button>
                        </div>
                    ) : (
                        <div className="py-10 text-center space-y-4">
                            <Zap className="w-8 h-8 text-slate-200 mx-auto" />
                            <p className="text-xs text-slate-400 font-medium px-4">Audit cluster for personnel imbalances.</p>
                            <button onClick={runAIHealthAudit} className="px-5 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all no-print">Establish Scan</button>
                        </div>
                    )}
                </div>

                {/* Live Telemetry - COLLAPSIBLE */}
                <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-xl"><Terminal className="w-5 h-5 text-white" /></div>
                            <h3 className="text-lg font-black text-slate-900">Live Telemetry</h3>
                        </div>
                        <button 
                            onClick={() => setIsTelemetryExpanded(!isTelemetryExpanded)}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all no-print"
                            title="Expand History"
                        >
                            {isTelemetryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="space-y-4">
                        {displayedTelemetry.length > 0 ? displayedTelemetry.map((entry, i) => (
                            <div key={i} className="relative pl-6 border-l-2 border-slate-100 pb-2 animate-in slide-in-from-left-2 duration-300">
                                <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                                <p className="text-[11px] font-black text-slate-900 leading-none">{entry.displayName}</p>
                                <p className="text-[10px] text-slate-500 mt-1 truncate">{entry.action} node "{entry.taskTitle}"</p>
                                <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        )) : (
                            <div className="py-8 text-center">
                                <History className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                <p className="text-[10px] font-black text-slate-300 uppercase">No Event History</p>
                            </div>
                        )}
                        
                        {!isTelemetryExpanded && telemetry.length > 5 && (
                            <button 
                                onClick={() => setIsTelemetryExpanded(true)}
                                className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors w-full text-center py-2 no-print"
                            >
                                + {telemetry.length - 5} More Events • View History
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;