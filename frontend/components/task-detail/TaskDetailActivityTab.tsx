import React from 'react';
import { Task } from '../../types';

interface TaskDetailActivityTabProps {
  task: Task;
}

const TaskDetailActivityTab: React.FC<TaskDetailActivityTabProps> = ({ task }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {task.auditLog.map((log) => (
        <div key={log.id} className="p-4 bg-slate-50 border-l-4 border-indigo-600 rounded-r-xl">
          <p className="text-xs font-black text-slate-900">{log.displayName} node recorded {log.action}</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{new Date(log.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default TaskDetailActivityTab;
