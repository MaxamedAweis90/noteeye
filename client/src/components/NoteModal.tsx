import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { CreateItemModal } from './modals/CreateItemModal';

/**
 * NoteModal Component — Canvas-First Note & Checklist Creator
 * Wraps CreateItemModal and connects it directly to useNoteStore.
 * Auto-routes to Home when created from other screens, auto-selects the item,
 * and smoothly scrolls into view in the workspace content island.
 */
export const NoteModal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isNoteModalOpen = useNoteStore((state) => state.isNoteModalOpen);
  const noteModalType = useNoteStore((state) => state.noteModalType);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const closeNoteModal = useNoteStore((state) => state.closeNoteModal);
  const addItem = useNoteStore((state) => state.addItem);
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);

  return (
    <CreateItemModal
      isOpen={isNoteModalOpen}
      onClose={closeNoteModal}
      defaultType={noteModalType}
      folderId={currentFolderId}
      onSave={({ title, type, color, folderId }) => {
        const newItem = addItem({
          title,
          type,
          color,
          folderId,
        });

        if (newItem) {
          if (newItem.folderId) {
            if (location.pathname !== `/folders/${newItem.folderId}`) {
              navigate(`/folders/${newItem.folderId}`);
            }
          } else {
            if (location.pathname !== '/') {
              navigate('/');
            }
          }

          setSelectedItem(newItem.id, newItem.type === 'checklist' ? 'checklist' : 'note');

          setTimeout(() => {
            const element = document.querySelector(`[data-card-id="${newItem.id}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      }}
    />
  );
};

export { CreateItemModal };
