import React, { useState } from 'react';
import { WorkflowRule, WorkflowTrigger, WorkflowAction, TaskPriority, User } from '../types';
import { Zap, Play, Plus, Trash2, ArrowRight, Settings, Activity, CheckCircle2 } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { workflowService } from '../services/workflowService';

interface WorkflowBuilderProps {
  orgId: string;
  allUsers: User[];
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ orgId, allUsers }) => {
  const [rules, setRules] = useState<WorkflowRule[]>(workflowService.getRules(orgId));
  const [isAdding, setIsAdding] = useState(false);
  
  const [newName, setNewName] = useState('New Automation Rule');
  const [trigger, setTrigger] = useState<WorkflowTrigger>('STATUS_CHANGED');
  const [triggerVal, setTriggerVal] = useState('done');
  const [action, setAction] = useState<WorkflowAction>('SET_PRIORITY');
  const [actionVal, setActionVal] = useState('High');

  const handleSave = () => {
    const saved = workflowService.saveRule({
      orgId,
      name: newName,
      trigger,
      triggerValue: triggerVal,
      action,
      actionValue: actionVal,
      isActive: true
    });
    setRules([...rules, saved]);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    workflowService.deleteRule(id);
    setRules(rules.filter(r => r.id !== id));
  };

  const handleToggle = (id: string) => {
    workflowService.toggleRule(id);
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Automation Engine</h3>
          <p className="text-xs text-slate-500 font-medium">Create visual rules to eliminate manual busywork.</p>
        </div>
        <Button size="sm" variant="secondary" className="rounded-xl px-6" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Rule
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100 animate-in zoom-in-95">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Zap className="w-5 h-5" />
            </div>
            <input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-lg font-black text-slate-900 outline-none bg-transparent border-b border-dashed border-indigo-200 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="indigo">TRIGGER</Badge>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">When event occurs</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <select 
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="TASK_CREATED">Task is created</option>
                  <option value="STATUS_CHANGED">Task status changes</option>
                  <option value="PRIORITY_CHANGED">Task priority changes</option>
                </select>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Target value:</p>
                  <input 
                    value={triggerVal}
                    onChange={(e) => setTriggerVal(e.target.value)}
                    placeholder="e.g. done"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-2 border-indigo-100 items-center justify-center text-indigo-400 shadow-sm z-10">
              <ArrowRight className="w-5 h-5" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="rose">ACTION</Badge>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Execute logic</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <select 
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="SET_PRIORITY">Set task priority</option>
                  <option value="ASSIGN_USER">Assign specific user</option>
                  <option value="ADD_TAG">Add workspace tag</option>
                  <option value="NOTIFY_OWNER">Notify board owner</option>
                </select>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Parameter:</p>
                  <input 
                    value={actionVal}
                    onChange={(e) => setActionVal(e.target.value)}
                    placeholder="e.g. High"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <Button className="flex-1 py-4 rounded-2xl" onClick={handleSave}>Initialize Rule</Button>
            <Button variant="outline" className="px-10 py-4 rounded-2xl" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {rules.length > 0 ? rules.map((rule) => (
          <div key={rule.id} className={`flex items-center justify-between p-6 bg-white border rounded-[2rem] transition-all hover:shadow-xl hover:shadow-slate-200/50 ${rule.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className="flex items-center gap-5">
              <div className={`p-3 rounded-2xl ${rule.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">{rule.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rule.trigger.replace('_', ' ')}: {rule.triggerValue}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{rule.action.replace('_', ' ')}: {rule.actionValue}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleToggle(rule.id)}
                className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${rule.isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${rule.isActive ? 'translate-x-5' : ''}`} />
              </button>
              <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Settings className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-black uppercase text-slate-400 tracking-widest">No active automations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;