import React from 'react';
import { IdeaKanbanBoard } from '../editor/IdeaKanbanBoard';
import { IdeaInspectorDrawer } from '../editor/IdeaInspectorDrawer';
import type { IdeaItem } from '../../types';

export interface Ideafile_EditorProps {
  ideaItems: IdeaItem[];
  selectedIdeaId: string | null;
  isIdeaInspectorOpen: boolean;
  onSelectIdea: (id: string) => void;
  onOpenInspector: (id: string) => void;
  onCloseInspector: () => void;
  onAddIdea: (status: 'ideas' | 'completed', customTitle?: string) => void;
  onMoveCard: (ideaId: string, targetStatus: 'ideas' | 'completed', targetIndex?: number) => void;
  onUpdateIdeaTitle: (title: string) => void;
  onUpdateIdeaDescription: (description: string) => void;
  onUpdateIdeaStatus: (status: 'ideas' | 'completed') => void;
  onDeleteIdea: (id?: string) => void;
}

/**
 * Ideafile_Editor — Dedicated Idea Board File Editor Component.
 * Integrates the dynamic 2-column minimalist Kanban board with the right-side Idea Inspector Drawer.
 */
export const Ideafile_Editor: React.FC<Ideafile_EditorProps> = ({
  ideaItems,
  selectedIdeaId,
  isIdeaInspectorOpen,
  onSelectIdea,
  onOpenInspector,
  onCloseInspector,
  onAddIdea,
  onMoveCard,
  onUpdateIdeaTitle,
  onUpdateIdeaDescription,
  onUpdateIdeaStatus,
  onDeleteIdea,
}) => {
  const activeSelectedIdea = ideaItems.find((i) => i.id === selectedIdeaId) || null;

  return (
    <>
      <div className="flex-1 flex flex-col pt-1">
        <IdeaKanbanBoard
          ideas={ideaItems}
          selectedIdeaId={selectedIdeaId}
          onSelectIdea={onSelectIdea}
          onOpenInspector={onOpenInspector}
          onAddIdea={onAddIdea}
          onMoveCard={onMoveCard}
        />
      </div>

      {/* Slide-out Idea Inspector Drawer */}
      <IdeaInspectorDrawer
        isOpen={isIdeaInspectorOpen}
        idea={activeSelectedIdea}
        onClose={onCloseInspector}
        onUpdateTitle={onUpdateIdeaTitle}
        onUpdateDescription={onUpdateIdeaDescription}
        onUpdateStatus={onUpdateIdeaStatus}
        onDelete={() => onDeleteIdea()}
      />
    </>
  );
};

export default Ideafile_Editor;
