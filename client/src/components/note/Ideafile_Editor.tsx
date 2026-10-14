import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
 * Integrates the dynamic 2-column minimalist Kanban board.
 * Renders the companion Idea Inspector into the AppShell companion slot (where DetailsPanel sits).
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
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const activeSelectedIdea = ideaItems.find((i) => i.id === selectedIdeaId) || null;

  useEffect(() => {
    const el = document.getElementById('companion-panel-portal');
    if (el) {
      setPortalTarget(el);
    }
  }, []);

  const inspectorNode = (
    <IdeaInspectorDrawer
      isOpen={isIdeaInspectorOpen}
      idea={activeSelectedIdea}
      onClose={onCloseInspector}
      onUpdateTitle={onUpdateIdeaTitle}
      onUpdateDescription={onUpdateIdeaDescription}
      onUpdateStatus={onUpdateIdeaStatus}
      onDelete={() => onDeleteIdea()}
    />
  );

  return (
    <>
      <div className="flex-1 flex flex-col pt-1 w-full">
        <IdeaKanbanBoard
          ideas={ideaItems}
          selectedIdeaId={selectedIdeaId}
          onSelectIdea={onSelectIdea}
          onOpenInspector={onOpenInspector}
          onAddIdea={onAddIdea}
          onMoveCard={onMoveCard}
        />
      </div>

      {/* Companion Idea Inspector portaled to AppShell companion slot */}
      {portalTarget ? createPortal(inspectorNode, portalTarget) : inspectorNode}
    </>
  );
};

export default Ideafile_Editor;
