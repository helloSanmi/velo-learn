import React from 'react';
import { Send } from 'lucide-react';
import { Task, User } from '../../types';

interface TaskDetailCommentsTabProps {
  task: Task;
  currentUser?: User;
  allUsers: User[];
  typingUsers: Record<string, { name: string; lastSeen: number }>;
  commentText: string;
  setCommentText: (value: string) => void;
  onTypingStart: () => void;
  onAddComment: (e: React.FormEvent) => void;
  commentsEndRef: React.RefObject<HTMLDivElement | null>;
}

const TaskDetailCommentsTab: React.FC<TaskDetailCommentsTabProps> = ({
  task,
  currentUser,
  allUsers,
  typingUsers,
  commentText,
  setCommentText,
  onTypingStart,
  onAddComment,
  commentsEndRef
}) => {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-4">
        {task.comments?.length === 0 && (
          <div className="h-full min-h-24 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-center px-4 text-center">
            No comments yet.
          </div>
        )}
        {task.comments?.map((comment) => (
          <div key={comment.id} className={`flex gap-3 ${comment.userId === currentUser?.id ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0">
              <img src={allUsers.find((user) => user.id === comment.userId)?.avatar} alt={comment.displayName} className="w-full h-full object-cover" />
            </div>
            <div className={`max-w-[78%] px-3 py-2 rounded-xl text-sm ${comment.userId === currentUser?.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {comment.text}
            </div>
          </div>
        ))}
        {Object.values(typingUsers).length > 0 ? (
          <p className="text-xs text-slate-400 px-1">
            {Object.values(typingUsers).map((entry) => entry.name).join(', ')} {Object.values(typingUsers).length > 1 ? 'are' : 'is'} typing...
          </p>
        ) : null}
        <div ref={commentsEndRef} />
      </div>
      <form onSubmit={onAddComment} className="mt-3 relative group">
        <input
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            onTypingStart();
          }}
          placeholder="Write a comment..."
          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition-all"
        />
        <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default TaskDetailCommentsTab;
