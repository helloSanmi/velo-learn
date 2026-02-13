import React, { Suspense, lazy } from 'react';
import TaskModal from '../TaskModal';
import ProjectModal from '../ProjectModal';
import TaskDetailModal from '../TaskDetailModal';
import { SettingsTabType } from '../SettingsModal';
import { Task, User, Project, TaskPriority } from '../../types';

const AIModal = lazy(() => import('../AIModal'));
const AICommandCenter = lazy(() => import('../AICommandCenter'));
const VoiceCommander = lazy(() => import('../VoiceCommander'));
const VisionModal = lazy(() => import('../VisionModal'));
const CommandPalette = lazy(() => import('../CommandPalette'));
const SettingsModal = lazy(() => import('../SettingsModal'));

interface GlobalModalsProps {
  user: User;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;
  projectModalTemplateId?: string | null;
  setProjectModalTemplateId?: (templateId: string | null) => void;
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
  canAssignMembers: boolean;
  canManageTask: (taskId: string) => boolean;
  createTask: (
    title: string,
    description: string,
    priority: TaskPriority,
    tags: string[],
    dueDate?: number,
    projectId?: string,
    assigneeIds?: string[],
    securityGroupIds?: string[],
    estimateMinutes?: number,
    estimateProvidedBy?: string
  ) => void;
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
  canDeleteTask: (taskId: string) => boolean;
  canToggleTaskTimer: (taskId: string) => boolean;
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
  onChangeProjectOwner: (id: string, ownerId: string) => void;
  onDeleteOrganization: () => void;
  onUserUpdated: (user: User) => void;
}

const GlobalModals: React.FC<GlobalModalsProps> = ({
  user, isModalOpen, setIsModalOpen, isProjectModalOpen, setIsProjectModalOpen,
  projectModalTemplateId, setProjectModalTemplateId,
  isCommandCenterOpen, setIsCommandCenterOpen, isVoiceCommanderOpen, setIsVoiceCommanderOpen,
  isVisionModalOpen, setIsVisionModalOpen, isCommandPaletteOpen, setIsCommandPaletteOpen,
  isSettingsOpen, setIsSettingsOpen, settingsTab, selectedTask, setSelectedTask,
  aiSuggestions, setAiSuggestions, aiLoading, activeTaskTitle, tasks, projects,
  projectTasks,
  activeProjectId, aiEnabled, canAssignMembers, canManageTask, createTask, handleAddProject, handleUpdateTask,
  handleCommentOnTask, deleteTask, canDeleteTask, canToggleTaskTimer, onToggleTimer, applyAISuggestions, handleGeneratedTasks,
  setActiveProjectId, refreshTasks, onRenameProject, onCompleteProject, onReopenProject, onArchiveProject, onRestoreProject, onDeleteProject, onPurgeProject, onChangeProjectOwner, onDeleteOrganization, onUserUpdated
}) => {
  const withLazy = (node: React.ReactNode) => (
    <Suspense fallback={null}>{node}</Suspense>
  );

  return (
    <>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canAssignMembers={canAssignMembers}
        projectId={activeProjectId}
        onSubmit={(title, description, priority, tags, dueDate, assigneeIds, securityGroupIds, estimateMinutes) =>
          createTask(title, description, priority, tags, dueDate, activeProjectId || 'p1', assigneeIds, securityGroupIds, estimateMinutes, user.id)
        }
      />
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectModalTemplateId?.(null);
        }}
        onSubmit={handleAddProject}
        currentUserId={user.id}
        initialTemplateId={projectModalTemplateId}
      />
      <TaskDetailModal 
        task={selectedTask ? (tasks.find((t) => t.id === selectedTask.id) || selectedTask) : null}
        tasks={tasks} // Fixed: Passing the tasks array to the detail modal to prevent 'filter' errors
        currentUser={user} 
        onClose={() => { setSelectedTask(null); refreshTasks(); }} 
        onUpdate={handleUpdateTask} 
        onAddComment={handleCommentOnTask} 
        onDelete={deleteTask} 
        canDelete={Boolean(selectedTask && canDeleteTask(selectedTask.id))}
        canManageTask={Boolean(selectedTask && canManageTask(selectedTask.id))}
        canTrackTime={Boolean(selectedTask && canToggleTaskTimer(selectedTask.id))}
        aiEnabled={aiEnabled}
        onToggleTimer={onToggleTimer}
      />
      {withLazy(<AIModal suggestions={aiSuggestions} onClose={() => setAiSuggestions(null)} onApply={applyAISuggestions} isLoading={aiLoading} taskTitle={activeTaskTitle} />)}
      {withLazy(<AICommandCenter isOpen={isCommandCenterOpen} onClose={() => setIsCommandCenterOpen(false)} tasks={tasks} />)}
      {withLazy(<VoiceCommander isOpen={isVoiceCommanderOpen} onClose={() => setIsVoiceCommanderOpen(false)} tasks={tasks} />)}
      {withLazy(<VisionModal isOpen={isVisionModalOpen} onClose={() => setIsVisionModalOpen(false)} onTasksGenerated={handleGeneratedTasks} />)}
      {withLazy(<CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} tasks={tasks} projects={projects} onSelectTask={setSelectedTask} onSelectProject={setActiveProjectId} />)}
      {withLazy(
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
          onChangeProjectOwner={onChangeProjectOwner}
          onDeleteOrganization={onDeleteOrganization}
          onUserUpdated={onUserUpdated}
        />
      )}
    </>
  );
};

export default GlobalModals;
