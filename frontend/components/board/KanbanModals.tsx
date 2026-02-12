import React from 'react';
import { ProjectStage } from '../../types';
import SaveViewModal from './SaveViewModal';
import SavedViewsManagerModal from './SavedViewsManagerModal';
import ProjectStageEditorModal from './ProjectStageEditorModal';
import { SavedBoardView } from '../../services/savedViewService';

interface KanbanModalsProps {
  isSavedViewsOpen: boolean;
  savedViews: SavedBoardView[];
  onCloseSavedViews: () => void;
  onSaveManagedViews: (views: SavedBoardView[]) => void;
  onApplySavedView: (id: string) => void;
  showStageEditor: boolean;
  draftStages: ProjectStage[];
  setDraftStages: React.Dispatch<React.SetStateAction<ProjectStage[]>>;
  newStageName: string;
  setNewStageName: React.Dispatch<React.SetStateAction<string>>;
  onCloseStageEditor: () => void;
  onAddStage: () => void;
  onRemoveStage: (stageId: string) => void;
  onSaveStages: () => void;
  isSaveViewOpen: boolean;
  saveViewName: string;
  setSaveViewName: React.Dispatch<React.SetStateAction<string>>;
  onCloseSaveView: () => void;
  onSaveView: () => void;
}

const KanbanModals: React.FC<KanbanModalsProps> = ({
  isSavedViewsOpen,
  savedViews,
  onCloseSavedViews,
  onSaveManagedViews,
  onApplySavedView,
  showStageEditor,
  draftStages,
  setDraftStages,
  newStageName,
  setNewStageName,
  onCloseStageEditor,
  onAddStage,
  onRemoveStage,
  onSaveStages,
  isSaveViewOpen,
  saveViewName,
  setSaveViewName,
  onCloseSaveView,
  onSaveView
}) => {
  return (
    <>
      <SavedViewsManagerModal
        isOpen={isSavedViewsOpen}
        views={savedViews}
        onClose={onCloseSavedViews}
        onSave={onSaveManagedViews}
        onApply={onApplySavedView}
      />

      <ProjectStageEditorModal
        isOpen={showStageEditor}
        draftStages={draftStages}
        setDraftStages={setDraftStages}
        newStageName={newStageName}
        setNewStageName={setNewStageName}
        onClose={onCloseStageEditor}
        onAddStage={onAddStage}
        onRemoveStage={onRemoveStage}
        onSave={onSaveStages}
      />

      <SaveViewModal
        isOpen={isSaveViewOpen}
        name={saveViewName}
        setName={setSaveViewName}
        onClose={onCloseSaveView}
        onSave={onSaveView}
      />
    </>
  );
};

export default KanbanModals;
