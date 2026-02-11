import React from 'react';
import { X } from 'lucide-react';
import { Task } from '../../types';
import Badge from '../ui/Badge';

interface TaskDetailHeaderProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({ task, onClose }) => {
  return (
    <div className="px-4 py-4 md:px-5 flex items-start justify-between border-b border-slate-200 flex-shrink-0 bg-white">
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="indigo">{task.status.toUpperCase()}</Badge>
          {task.isAtRisk && <Badge variant="rose">AT RISK</Badge>}
          <Badge variant="amber">{task.priority.toUpperCase()}</Badge>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight truncate md:whitespace-normal">{task.title}</h2>
      </div>
      <button onClick={onClose} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition-all shrink-0 active:scale-95">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TaskDetailHeader;
