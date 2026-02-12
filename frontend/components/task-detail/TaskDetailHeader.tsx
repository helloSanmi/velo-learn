import React from 'react';
import { Trash2, X } from 'lucide-react';
import { Task } from '../../types';
import Badge from '../ui/Badge';
import { dialogService } from '../../services/dialogService';

interface TaskDetailHeaderProps {
  task: Task;
  onClose: () => void;
  onDelete: (id: string) => void;
  canDelete?: boolean;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({ task, onClose, onDelete, canDelete = true }) => {
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
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={async () => {
            if (!canDelete) return;
            const confirmed = await dialogService.confirm('Delete this task?', { title: 'Delete task', confirmText: 'Delete', danger: true });
            if (confirmed) {
              onDelete(task.id);
              onClose();
            }
          }}
          disabled={!canDelete}
          title={canDelete ? 'Delete task' : 'Only project owner/admin can delete'}
          className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-all disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-slate-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition-all active:scale-95">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TaskDetailHeader;
