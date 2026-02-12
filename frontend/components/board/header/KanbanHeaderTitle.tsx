import React from 'react';
import { MessageSquare } from 'lucide-react';
import { User } from '../../../types';

interface KanbanHeaderTitleProps {
  projectName: string;
  totals: { total: number; todo: number; inProgress: number; done: number };
  ownerId?: string;
  currentUserId: string;
  allUsers: User[];
  showOwner: boolean;
  onOpenOwnerChat: () => void;
  ownerChatUnreadCount: number;
}

const KanbanHeaderTitle: React.FC<KanbanHeaderTitleProps> = ({
  projectName,
  totals,
  ownerId,
  currentUserId,
  allUsers,
  showOwner,
  onOpenOwnerChat,
  ownerChatUnreadCount
}) => {
  const owner = ownerId ? allUsers.find((user) => user.id === ownerId) : undefined;
  const ownerLabel = owner ? (owner.id === currentUserId ? `${owner.displayName} (you)` : owner.displayName) : 'Unknown owner';

  return (
    <div className="lg:min-w-[280px]">
      <h2 className="text-2xl md:text-[28px] leading-none font-semibold tracking-tight text-slate-900">{projectName}</h2>
      <p className="text-[11px] text-slate-500 mt-0.5">
        {totals.total} tasks • {totals.todo} to do • {totals.inProgress} in progress • {totals.done} done
        {showOwner ? ` • Owner: ${ownerLabel}` : ''}
      </p>
      {showOwner ? (
        <button
          onClick={onOpenOwnerChat}
          className="mt-1.5 h-7 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] text-slate-700 inline-flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat owner
          {ownerChatUnreadCount > 0 ? (
            <span className="h-4 min-w-4 px-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold inline-flex items-center justify-center">
              {ownerChatUnreadCount}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
};

export default KanbanHeaderTitle;
