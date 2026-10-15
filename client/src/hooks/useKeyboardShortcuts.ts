import { useEffect } from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';

/**
 * Global Keyboard Shortcuts Hook
 * Handles application-level shortcuts:
 * - Ctrl/Cmd + K or '/': Focus search bar
 * - Ctrl/Cmd + N: Open Quick Note creation modal
 * - Ctrl/Cmd + Shift + N: Open New Folder modal
 * - Escape: Close active modals, menus, Details Inspector, deselect cards
 * - Delete / Backspace: Move selected card to trash (bypasses in text inputs)
 * - Ctrl/Cmd + I: Toggle Details Inspector drawer
 */
export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable ||
          activeEl.getAttribute('role') === 'textbox');

      const isModKey = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // 1. Escape: Global cancel / deselect / close
      if (e.key === 'Escape') {
        const ui = useUIStore.getState();
        const notes = useNoteStore.getState();

        // Close search focus if active
        const searchInput = document.getElementById('noteeye-main-search-input') as HTMLInputElement | null;
        if (searchInput && document.activeElement === searchInput) {
          searchInput.blur();
          return;
        }

        // Close context menu
        if (ui.contextMenu?.isOpen) {
          ui.closeContextMenu();
          return;
        }

        // Close modals
        if (notes.isNoteModalOpen) {
          notes.closeNoteModal();
          return;
        }
        if (notes.isFolderModalOpen) {
          notes.closeFolderModal();
          return;
        }
        if (notes.isQuickEditModalOpen) {
          notes.closeQuickEditModal();
          return;
        }
        if (ui.isProfileOpen) {
          ui.closeProfileModal();
          return;
        }
        if (ui.isSettingsOpen) {
          ui.closeSettingsModal();
          return;
        }

        // Close Details Inspector
        if (ui.isDetailsPanelOpen) {
          ui.closeDetailsPanel();
          return;
        }

        // Clear multi/single card selection
        if (ui.selectedItemId || ui.selectedIds.size > 0) {
          ui.clearSelection();
          return;
        }
        return;
      }

      // If user is typing inside an input/textarea, ignore further hotkeys
      if (isInputFocused) {
        return;
      }

      // 2. '/' or Ctrl/Cmd + K: Focus Search
      if ((key === '/' && !isModKey) || (isModKey && key === 'k')) {
        e.preventDefault();
        const searchInput = document.getElementById('noteeye-main-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          // In mobile, trigger search modal
          window.dispatchEvent(new CustomEvent('noteeye:open-mobile-search'));
        }
        return;
      }

      // 3. Ctrl/Cmd + Shift + N: New Folder
      if (isModKey && e.shiftKey && key === 'n') {
        e.preventDefault();
        useNoteStore.getState().openFolderModal();
        return;
      }

      // 4. Ctrl/Cmd + N: New Note
      if (isModKey && !e.shiftKey && key === 'n') {
        e.preventDefault();
        useNoteStore.getState().openNoteModal('note');
        return;
      }

      // 5. Ctrl/Cmd + I: Toggle Details Inspector
      if (isModKey && key === 'i') {
        e.preventDefault();
        useUIStore.getState().toggleDetailsPanel();
        return;
      }

      // 6. Delete or Backspace: Move selected item(s) to Trash with confirmation dialog
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedItemId, selectedItemType, selectedIds, clearSelection } = useUIStore.getState();
        const { openDeleteDialog, items, folders, deleteItem, deleteFolder } = useNoteStore.getState();

        if (selectedIds.size > 0) {
          e.preventDefault();
          const count = selectedIds.size;
          openDeleteDialog(
            'batch',
            `${count} ${count === 1 ? 'item' : 'items'}`,
            'item',
            {
              title: `Move ${count} ${count === 1 ? 'item' : 'items'} to Trash?`,
              description: 'These items will be moved to Trash. You can restore them anytime within 30 days.',
              confirmLabel: 'Move to Trash',
              onConfirm: () => {
                selectedIds.forEach((id: string) => {
                  deleteItem(id);
                  deleteFolder(id);
                });
                clearSelection();
              },
            }
          );
          return;
        }

        if (selectedItemId) {
          e.preventDefault();
          const targetName =
            selectedItemType === 'folder'
              ? folders.find((f) => f.id === selectedItemId)?.name || 'Folder'
              : items.find((i) => i.id === selectedItemId)?.title || 'Note';

          openDeleteDialog(
            selectedItemId,
            targetName,
            selectedItemType === 'folder' ? 'folder' : 'note',
            {
              onConfirm: () => {
                if (selectedItemType === 'folder') {
                  deleteFolder(selectedItemId);
                } else {
                  deleteItem(selectedItemId);
                }
                clearSelection();
              },
            }
          );
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};

export default useKeyboardShortcuts;
