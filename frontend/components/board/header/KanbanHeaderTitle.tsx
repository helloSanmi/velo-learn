import React from 'react';
import { User } from '../../../types';

interface KanbanHeaderTitleProps {
  projectName: string;
  totals: { total: number; todo: number; inProgress: number; done: number };
  ownerId?: string;
  currentUserId: string;
  allUsers: User[];
  showOwner: boolean;
}

const KanbanHeaderTitle: React.FC<KanbanHeaderTitleProps> = ({
  projectName,
  totals,
  ownerId,
  currentUserId,
  allUsers,
  showOwner
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
    </div>
  );
};

export default KanbanHeaderTitle;
