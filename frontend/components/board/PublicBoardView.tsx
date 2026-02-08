
import React from 'react';
import { Project, Task, TaskStatus } from '../../types';
import KanbanBoard from './KanbanBoard';
import { Cloud, Lock } from 'lucide-react';

interface PublicBoardViewProps {
  project: Project;
  tasks: Task[];
}

const PublicBoardView: React.FC<PublicBoardViewProps> = ({ project, tasks }) => {
  const categorizedTasks = {
    [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.DONE]: tasks.filter(t => t.status === TaskStatus.DONE),
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="flex-none bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2 rounded-xl text-white">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">{project.name}</h1>
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-0.5">Public Insight Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl text-slate-500 text-xs font-bold">
          <Lock className="w-3.5 h-3.5" /> Read-Only Access
        </div>
      </header>

      <div className="flex-none p-8">
        <div className="max-w-4xl">
           <p className="text-slate-500 font-medium leading-relaxed">{project.description}</p>
        </div>
      </div>

      <KanbanBoard 
        categorizedTasks={categorizedTasks}
        statusFilter="All"
        onDeleteTask={() => {}}
        onUpdateStatus={() => {}}
        onMoveTask={() => {}}
        onAIAssist={() => {}}
        onSelectTask={() => {}}
        onAddNewTask={() => {}}
        readOnly={true}
      />
    </div>
  );
};

export default PublicBoardView;
