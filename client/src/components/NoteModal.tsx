import React from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { CreateItemModal } from './modals/CreateItemModal';

/**
 * NoteModal Component — Canvas-First Note & Checklist Creator
 * Wraps CreateItemModal and connects it directly to useNoteStore.
 * Inherits the exact styling of QuickEditModal (pastel card, 6 swatches,
 * 4-step morphing save button) while keeping content authoring canvas-first.
 */
export const NoteModal: React.FC = () => {
  const isNoteModalOpen = useNoteStore((state) => state.isNoteModalOpen);
  const noteModalType = useNoteStore((state) => state.noteModalType);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const closeNoteModal = useNoteStore((state) => state.closeNoteModal);
  const addItem = useNoteStore((state) => state.addItem);

  return (
    <CreateItemModal
      isOpen={isNoteModalOpen}
      onClose={closeNoteModal}
      defaultType={noteModalType}
      folderId={currentFolderId}
      onSave={({ title, type, color, folderId }) => {
        addItem({
          title,
          type,
          color,
          folderId,
        });
      }}
    />
  );
};

export { CreateItemModal };
