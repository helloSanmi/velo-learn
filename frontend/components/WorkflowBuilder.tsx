import React, { useState } from 'react';
import { WorkflowAction, WorkflowRule, WorkflowTrigger, User } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import { workflowService } from '../services/workflowService';

interface WorkflowBuilderProps {
  orgId: string;
  allUsers: User[];
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ orgId }) => {
  const [rules, setRules] = useState<WorkflowRule[]>(workflowService.getRules(orgId));
  const [isAdding, setIsAdding] = useState(false);

  const [newName, setNewName] = useState('New rule');
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
    setRules((prev) => [...prev, saved]);
    setIsAdding(false);
  };

  const toggleRule = (id: string) => {
    workflowService.toggleRule(id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  const removeRule = (id: string) => {
    workflowService.deleteRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Workflows</h3>
          <p className="text-sm text-slate-600">Automate repetitive updates with simple rules.</p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New rule
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300"
            placeholder="Rule name"
          />

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Trigger</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value as WorkflowTrigger)} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                <option value="TASK_CREATED">Task created</option>
                <option value="STATUS_CHANGED">Status changed</option>
                <option value="PRIORITY_CHANGED">Priority changed</option>
              </select>
              <input
                value={triggerVal}
                onChange={(e) => setTriggerVal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                placeholder="Trigger value"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500">Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value as WorkflowAction)} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                <option value="SET_PRIORITY">Set priority</option>
                <option value="ASSIGN_USER">Assign user</option>
                <option value="ADD_TAG">Add tag</option>
                <option value="NOTIFY_OWNER">Notify owner</option>
              </select>
              <input
                value={actionVal}
                onChange={(e) => setActionVal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                placeholder="Action value"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave}>Save rule</Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rules.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500 text-center">
            No rules created yet.
          </div>
        )}

        {rules.map((rule) => (
          <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{rule.name}</p>
              <p className="text-xs text-slate-500 truncate">
                IF {rule.trigger} ({rule.triggerValue || '-'}) THEN {rule.action} ({rule.actionValue || '-'})
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleRule(rule.id)}
                className={`px-2.5 py-1 rounded-lg text-xs ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {rule.isActive ? 'Active' : 'Paused'}
              </button>
              <button onClick={() => removeRule(rule.id)} className="p-2 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
