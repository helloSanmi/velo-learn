import React from 'react';
import { ListOrdered, Loader2, Settings2, X } from 'lucide-react';
import { KanbanHeaderProps } from './types';

type KanbanHeaderActionsProps = Pick<
  KanbanHeaderProps,
  | 'onSaveView'
  | 'savedViews'
  | 'onApplyView'
  | 'appliedViewId'
  | 'onDeleteAppliedView'
  | 'onOpenManageViews'
  | 'activeProject'
  | 'onOptimizeOrder'
  | 'isTriaging'
  | 'projectStages'
  | 'canManageStages'
  | 'onOpenStages'
  | 'selectedTaskIds'
  | 'onClearSelected'
>;

const KanbanHeaderActions: React.FC<KanbanHeaderActionsProps> = ({
  onSaveView,
  savedViews,
  onApplyView,
  appliedViewId,
  onDeleteAppliedView,
  onOpenManageViews,
  activeProject,
  onOptimizeOrder,
  isTriaging,
  projectStages,
  canManageStages,
  onOpenStages,
  selectedTaskIds,
  onClearSelected
}) => {
  return (
    <div className="flex flex-wrap items-center justify-start lg:justify-end gap-1.5">
      <button
        onClick={onSaveView}
        className="h-7 px-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors"
      >
        Save view
      </button>

      {savedViews.length > 0 && (
        <select
          className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 outline-none"
          onChange={(event) => onApplyView(event.target.value)}
          value={appliedViewId || ''}
        >
          <option value="" disabled>
            Apply view
          </option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      )}

      {savedViews.length > 0 && (
        <button
          onClick={onDeleteAppliedView}
          disabled={!appliedViewId}
          className="h-7 px-2 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[11px] font-medium text-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Delete view
        </button>
      )}

      {savedViews.length > 0 && (
        <button
          onClick={onOpenManageViews}
          className="h-7 px-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-600 transition-colors"
        >
          Manage views
        </button>
      )}

      {activeProject && (
        <button
          onClick={onOptimizeOrder}
          disabled={isTriaging}
          className="h-7 px-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
        >
          {isTriaging ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListOrdered className="w-3 h-3" />}
          Optimize {projectStages[0]?.name || 'Backlog'}
        </button>
      )}

      {activeProject && canManageStages && (
        <button
          onClick={onOpenStages}
          className="h-7 px-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors inline-flex items-center gap-1"
        >
          <Settings2 className="w-3 h-3" />
          Stages
        </button>
      )}

      {selectedTaskIds.length > 0 && (
        <div className="h-7 px-2 rounded-md border border-slate-200 bg-slate-50 inline-flex items-center gap-1">
          <span className="text-[12px] text-slate-700">{selectedTaskIds.length} selected</span>
          <button onClick={onClearSelected} className="p-0.5 rounded hover:bg-slate-200">
            <X className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default KanbanHeaderActions;
