import React from 'react';
import TaskModal from '../TaskModal';
import ProjectModal from '../ProjectModal';
import TaskDetailModal from '../TaskDetailModal';
import AIModal from '../AIModal';
import AICommandCenter from '../AICommandCenter';
import VoiceCommander from '../VoiceCommander';
import VisionModal from '../VisionModal';
import CommandPalette from '../CommandPalette';
import SettingsModal, { SettingsTabType } from '../SettingsModal';
import { Task, User, Project, TaskPriority } from '../../types';

interface GlobalModalsProps {
  user: User;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;
  isCommandCenterOpen: boolean;
  setIsCommandCenterOpen: (open: boolean) => void;
  isVoiceCommanderOpen: boolean;
  setIsVoiceCommanderOpen: (open: boolean) => void;
  isVisionModalOpen: boolean;
  setIsVisionModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  settingsTab: SettingsTabType;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  aiSuggestions: string[] | null;
  setAiSuggestions: (s: string[] | null) => void;
  aiLoading: boolean;
  activeTaskTitle: string;
  tasks: Task[];
  projectTasks: Task[];
  projects: Project[];
  activeProjectId: string | null;
  aiEnabled: boolean;
  createTask: (title: string, description: string, priority: TaskPriority, tags: string[], dueDate?: number, projectId?: string, assigneeIds?: string[]) => void;
  handleAddProject: (
    name: string,
    description: string,
    color: string,
    members: string[],
    templateId?: string,
    aiGeneratedTasks?: any[],
    meta?: { startDate?: number; endDate?: number; budgetCost?: number; scopeSummary?: string; scopeSize?: number }
  ) => void;
  handleUpdateTask: (id: string, updates: any) => void;
  handleCommentOnTask: (id: string, text: string) => void;
  deleteTask: (id: string) => void;
  onToggleTimer: (id: string) => void;
  applyAISuggestions: (finalSteps: string[]) => void;
  handleGeneratedTasks: (generated: any[]) => void;
  setActiveProjectId: (id: string) => void;
  refreshTasks: () => void;
  onRenameProject: (id: string, name: string) => void;
  onCompleteProject: (id: string) => void;
  onReopenProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onRestoreProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onPurgeProject: (id: string) => void;
}

const GlobalModals: React.FC<GlobalModalsProps> = ({
  user, isModalOpen, setIsModalOpen, isProjectModalOpen, setIsProjectModalOpen,
  isCommandCenterOpen, setIsCommandCenterOpen, isVoiceCommanderOpen, setIsVoiceCommanderOpen,
  isVisionModalOpen, setIsVisionModalOpen, isCommandPaletteOpen, setIsCommandPaletteOpen,
  isSettingsOpen, setIsSettingsOpen, settingsTab, selectedTask, setSelectedTask,
  aiSuggestions, setAiSuggestions, aiLoading, activeTaskTitle, tasks, projects,
  projectTasks,
  activeProjectId, aiEnabled, createTask, handleAddProject, handleUpdateTask,
  handleCommentOnTask, deleteTask, onToggleTimer, applyAISuggestions, handleGeneratedTasks,
  setActiveProjectId, refreshTasks, onRenameProject, onCompleteProject, onReopenProject, onArchiveProject, onRestoreProject, onDeleteProject, onPurgeProject
}) => {
  return (
    <>
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={(title, description, priority, tags, dueDate, assigneeIds) => createTask(title, description, priority, tags, dueDate, activeProjectId || 'p1', assigneeIds)} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSubmit={handleAddProject} currentUserId={user.id} />
      <TaskDetailModal 
        task={selectedTask ? (tasks.find((t) => t.id === selectedTask.id) || selectedTask) : null}
        tasks={tasks} // Fixed: Passing the tasks array to the detail modal to prevent 'filter' errors
        currentUser={user} 
        onClose={() => { setSelectedTask(null); refreshTasks(); }} 
        onUpdate={handleUpdateTask} 
        onAddComment={handleCommentOnTask} 
        onDelete={deleteTask} 
        aiEnabled={aiEnabled}
        onToggleTimer={onToggleTimer}
      />
      <AIModal suggestions={aiSuggestions} onClose={() => setAiSuggestions(null)} onApply={applyAISuggestions} isLoading={aiLoading} taskTitle={activeTaskTitle} />
      <AICommandCenter isOpen={isCommandCenterOpen} onClose={() => setIsCommandCenterOpen(false)} tasks={tasks} />
      <VoiceCommander isOpen={isVoiceCommanderOpen} onClose={() => setIsVoiceCommanderOpen(false)} tasks={tasks} />
      <VisionModal isOpen={isVisionModalOpen} onClose={() => setIsVisionModalOpen(false)} onTasksGenerated={handleGeneratedTasks} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} tasks={tasks} projects={projects} onSelectTask={setSelectedTask} onSelectProject={setActiveProjectId} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        user={user}
        projects={projects}
        projectTasks={projectTasks}
        onRenameProject={onRenameProject}
        onCompleteProject={onCompleteProject}
        onReopenProject={onReopenProject}
        onArchiveProject={onArchiveProject}
        onRestoreProject={onRestoreProject}
        onDeleteProject={onDeleteProject}
        onPurgeProject={onPurgeProject}
      />
    </>
  );
};

export default GlobalModals;
