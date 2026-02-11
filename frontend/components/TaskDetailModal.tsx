import React from 'react';
import { Task, User } from '../types';
import TaskDetailGeneralTab from './task-detail/TaskDetailGeneralTab';
import TaskDetailDependenciesTab from './task-detail/TaskDetailDependenciesTab';
import TaskDetailSubtasksTab from './task-detail/TaskDetailSubtasksTab';
import TaskDetailCommentsTab from './task-detail/TaskDetailCommentsTab';
import TaskDetailActivityTab from './task-detail/TaskDetailActivityTab';
import TaskDetailHeader from './task-detail/TaskDetailHeader';
import TaskDetailTabs from './task-detail/TaskDetailTabs';
import TaskDetailFooter from './task-detail/TaskDetailFooter';
import { useTaskDetailState } from '../hooks/useTaskDetailState';

interface TaskDetailModalProps {
  task: Task | null;
  tasks: Task[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'order'>>) => void;
  onAddComment: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  currentUser?: User;
  aiEnabled?: boolean;
  onToggleTimer?: (id: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  tasks,
  onClose,
  onUpdate,
  onAddComment,
  onDelete,
  currentUser,
  aiEnabled = true,
  onToggleTimer
}) => {
  if (!task) return null;

  const state = useTaskDetailState({
    task,
    tasks,
    currentUser,
    aiEnabled,
    onUpdate,
    onAddComment
  });

  const renderTabContent = () => {
    if (state.activeTab === 'general') {
      return (
        <TaskDetailGeneralTab
          task={task}
          aiEnabled={aiEnabled}
          allUsers={state.allUsers}
          assigneeIds={state.assigneeIds}
          setAssigneeIds={state.setAssigneeIds}
          onUpdate={onUpdate}
          onAddComment={onAddComment}
          currentUser={currentUser}
          canApprove={state.canApprove}
          totalTrackedMs={state.totalTrackedMs}
          formatTrackedTime={state.formatTrackedTime}
          manualHours={state.manualHours}
          setManualHours={state.setManualHours}
          manualMinutes={state.manualMinutes}
          setManualMinutes={state.setManualMinutes}
          manualTimeError={state.manualTimeError}
          setManualTimeError={state.setManualTimeError}
          addManualTime={state.addManualTime}
          onToggleTimer={onToggleTimer}
          riskAssessment={state.riskAssessment}
          isAIThinking={state.isAIThinking}
          runAIAudit={state.runAIAudit}
          isEditing={state.isEditing}
          setIsEditing={state.setIsEditing}
          description={state.description}
          setDescription={state.setDescription}
        />
      );
    }

    if (state.activeTab === 'dependencies') {
      return (
        <TaskDetailDependenciesTab
          task={task}
          potentialDependencies={state.potentialDependencies}
          dependencyQuery={state.dependencyQuery}
          setDependencyQuery={state.setDependencyQuery}
          onToggleDependency={state.handleToggleDependency}
        />
      );
    }

    if (state.activeTab === 'subtasks') {
      return (
        <TaskDetailSubtasksTab
          task={task}
          newSubtaskTitle={state.newSubtaskTitle}
          setNewSubtaskTitle={state.setNewSubtaskTitle}
          onAddSubtask={state.handleAddSubtask}
          onToggleSubtask={state.handleToggleSubtask}
          onRemoveSubtask={state.handleRemoveSubtask}
        />
      );
    }

    if (state.activeTab === 'comments') {
      return (
        <TaskDetailCommentsTab
          task={task}
          currentUser={currentUser}
          allUsers={state.allUsers}
          typingUsers={state.typingUsers}
          commentText={state.commentText}
          setCommentText={state.setCommentText}
          onTypingStart={state.handleTypingStart}
          onAddComment={state.handleAddComment}
          commentsEndRef={state.commentsEndRef}
        />
      );
    }

    if (state.activeTab === 'activity') {
      return <TaskDetailActivityTab task={task} />;
    }

    return null;
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200 h-[88vh] md:h-[84vh] flex flex-col border border-slate-200">
        <TaskDetailHeader task={task} onClose={onClose} />
        <TaskDetailTabs task={task} activeTab={state.activeTab} setActiveTab={state.setActiveTab} />

        <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar scroll-smooth">{renderTabContent()}</div>

        <TaskDetailFooter
          task={task}
          onClose={onClose}
          onDelete={onDelete}
          onEdit={() => state.setIsEditing(true)}
        />
      </div>
    </div>
  );
};

export default TaskDetailModal;
