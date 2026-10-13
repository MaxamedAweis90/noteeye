import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { NoteModal } from './NoteModal';
import { FolderModal, QuickEditModal, DeleteDialog, ConflictDialog } from './modals';
import { ProfileModal } from './profile/ProfileModal';
import { SettingsModal } from './settings/SettingsModal';
import { SessionsModal } from './settings/SessionsModal';
import { FeedbackModal } from './feedback/FeedbackModal';
import { FloatingFeedbackButton } from './feedback/FloatingFeedbackButton';
import { ContextMenu } from './ContextMenu';
import { DetailsPanel } from './DetailsPanel';
import { MobileBottomNav } from './MobileBottomNav';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface AppShellProps {
  children?: React.ReactNode;
}

/**
 * Noteeye App Shell — Google Drive Material 3 Two-Layer Spatial Architecture
 * Layer 1 (Outer): Seamless #F8FAFD Canvas behind fixed Top Bar and Sidebar Rail
 * Layer 2 (Inner): Crisp, elevated #FFFFFF Floating Content Workspace (rounded-tl-[24px] rounded-bl-xl rounded-r-xl)
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = useNoteStore((state) => state.items);
  const folders = useNoteStore((state) => state.folders);
  const isFolderModalOpen = useNoteStore((state) => state.isFolderModalOpen);
  const closeFolderModal = useNoteStore((state) => state.closeFolderModal);
  const editingFolder = useNoteStore((state) => state.editingFolder);
  const addFolder = useNoteStore((state) => state.addFolder);
  const renameFolder = useNoteStore((state) => state.renameFolder);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const executeTransfer = useNoteStore((state) => state.executeTransfer);

  const isQuickEditModalOpen = useNoteStore((state) => state.isQuickEditModalOpen);
  const closeQuickEditModal = useNoteStore((state) => state.closeQuickEditModal);
  const quickEditItem = useNoteStore((state) => state.quickEditItem);
  const updateItem = useNoteStore((state) => state.updateItem);

  const deleteDialogData = useNoteStore((state) => state.deleteDialogData);
  const closeDeleteDialog = useNoteStore((state) => state.closeDeleteDialog);
  const deleteItem = useNoteStore((state) => state.deleteItem);
  const deleteFolder = useNoteStore((state) => state.deleteFolder);

  const selectedItemId = useUIStore((state) => state.selectedItemId);
  const selectedItemType = useUIStore((state) => state.selectedItemType);
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);
  const clearSelection = useUIStore((state) => state.clearSelection);
  const openContextMenu = useUIStore((state) => state.openContextMenu);
  const clipboard = useUIStore((state) => state.clipboard);
  const clipboardItem = useUIStore((state) => state.clipboardItem);
  const copyItem = useUIStore((state) => state.copyItem);
  const cutItem = useUIStore((state) => state.cutItem);
  const clearClipboard = useUIStore((state) => state.clearClipboard);
  const toastMessage = useUIStore((state) => state.toastMessage);
  const showToast = useUIStore((state) => state.showToast);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+N, Ctrl+Shift+N, Escape, Delete, Ctrl+I)
  useKeyboardShortcuts();

  // Global Keyboard Shortcuts for Clipboard (Ctrl/Cmd + C, X, V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is editing in an input, textarea, or contentEditable element
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable ||
          activeEl.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      const isModKey = e.ctrlKey || e.metaKey;

      // Escape: Cancel cut / clear clipboard
      if (e.key === 'Escape' && (clipboard?.action === 'cut' || clipboardItem?.action === 'cut')) {
        clearClipboard();
        return;
      }

      if (!isModKey) return;

      const key = e.key.toLowerCase();

      // Ctrl/Cmd + C: Copy selected item
      if (key === 'c') {
        if (!selectedItemId) return;
        const targetFolder = folders.find((f) => f.id === selectedItemId);
        if (targetFolder) {
          e.preventDefault();
          copyItem('folder', targetFolder.id, targetFolder.name);
          return;
        }
        const targetNote = items.find((i) => i.id === selectedItemId);
        if (targetNote) {
          e.preventDefault();
          copyItem('note', targetNote.id, targetNote.title);
          return;
        }
      }

      // Ctrl/Cmd + X: Cut selected item
      if (key === 'x') {
        if (!selectedItemId) return;
        const targetFolder = folders.find((f) => f.id === selectedItemId);
        if (targetFolder) {
          e.preventDefault();
          cutItem('folder', targetFolder.id, targetFolder.name);
          return;
        }
        const targetNote = items.find((i) => i.id === selectedItemId);
        if (targetNote) {
          e.preventDefault();
          cutItem('note', targetNote.id, targetNote.title);
          return;
        }
      }

      // Ctrl/Cmd + V: Paste into current view/folder
      if (key === 'v') {
        const isAllowedScreen = location.pathname === '/' || location.pathname.startsWith('/folders/');
        if (!isAllowedScreen) return;

        const destFolderId = location.pathname.startsWith('/folders/')
          ? location.pathname.replace('/folders/', '')
          : (location.pathname === '/' ? null : currentFolderId);

        if (clipboard && clipboard.items && clipboard.items.length > 0) {
          e.preventDefault();
          executeTransfer(
            clipboard.items.map((i) => ({ ...i, action: clipboard.action })),
            destFolderId
          );
        } else if (clipboardItem) {
          e.preventDefault();
          executeTransfer(
            [
              {
                type: clipboardItem.type,
                id: clipboardItem.id,
                action: clipboardItem.action,
                name: clipboardItem.name,
              },
            ],
            destFolderId
          );
        }
      }

      // Ctrl/Cmd + Z: Workspace Undo (outside editor)
      if (key === 'z' && !e.shiftKey) {
        const isEditorPage = location.pathname.startsWith('/note') || location.pathname.startsWith('/checklist');
        if (!isEditorPage) {
          e.preventDefault();
          const undone = useNoteStore.getState().undoWorkspaceAction();
          if (!undone) {
            useUIStore.getState().showToast('Nothing to undo');
          }
          return;
        }
      }

      // Ctrl/Cmd + Shift + Z or Ctrl + Y: Workspace Redo (outside editor)
      if ((key === 'z' && e.shiftKey) || key === 'y') {
        const isEditorPage = location.pathname.startsWith('/note') || location.pathname.startsWith('/checklist');
        if (!isEditorPage) {
          e.preventDefault();
          const redone = useNoteStore.getState().redoWorkspaceAction();
          if (!redone) {
            useUIStore.getState().showToast('Nothing to redo');
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedItemId,
    selectedItemType,
    clipboard,
    clipboardItem,
    copyItem,
    cutItem,
    clearClipboard,
    showToast,
    items,
    folders,
    location.pathname,
    currentFolderId,
    executeTransfer,
  ]);

  // Deselect on empty canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-card]') ||
      target.closest('[data-details-panel]') ||
      target.closest('[data-context-menu]') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }
    clearSelection();
  };

  // Canvas-level right click context menu (Empty space) — Only on Home and Folders
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    const isAllowedScreen = location.pathname === '/' || location.pathname.startsWith('/folders/');
    if (!isAllowedScreen) {
      return;
    }

    const target = e.target as HTMLElement;
    if (
      target.closest('[data-card]') ||
      target.closest('[data-details-panel]') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }
    e.preventDefault();
    openContextMenu({ x: e.clientX, y: e.clientY }, 'canvas');
  };

  return (
    <div className="h-screen w-full bg-[#F8FAFD] text-[#1F1F1F] font-sans antialiased relative selection:bg-[#C2E7FF] selection:text-[#001D35] overflow-hidden">
      {/* 1. Outer App Shell: Top Navigation Bar (Fixed h-16, bg-#F8FAFD) */}
      <TopNav />

      {/* 2. Outer App Shell: Left Persistent Rail (Fixed top-16, w-64, seamless bg-#F8FAFD) */}
      <Sidebar />

      {/* 3. Inner Floating Content Workspace (Google Drive Multi-Island Spatial Architecture) */}
      <div className="pl-0 md:pl-64 h-screen overflow-hidden">
        <main className="pt-16 pr-2 md:pr-4 pb-4 h-full bg-[#F8FAFD] flex gap-3 lg:gap-4 items-start overflow-hidden">
          {/* Main Floating Content Workspace Island ("content loader") */}
          <div
            id="workspace-content-island"
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
            className="bg-white rounded-2xl md:rounded-[24px] h-full max-h-[calc(100vh-5rem)] px-4 sm:px-6 lg:px-8 pb-24 sm:pb-6 lg:pb-8 pt-0 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.08)] flex flex-col flex-1 transition-all min-w-0 overflow-y-auto custom-scrollbar"
          >
            {children ? (
              children
            ) : (
              <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] items-center justify-center">
                <p className="text-base text-[#737785] font-normal tracking-normal select-none">
                  nothing to show!
                </p>
              </div>
            )}
          </div>

          {/* Integrated Companion Details Panel Island (Active outside note editor) */}
          {!location.pathname.startsWith('/notes') && <DetailsPanel />}
        </main>
      </div>

      {/* Global Interactive Modals & Menus */}
      <ContextMenu />
      <NoteModal />
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={closeFolderModal}
        folder={editingFolder}
        parentId={currentFolderId}
        onSave={(name, folderId) => {
          if (folderId) {
            renameFolder(folderId, name);
          } else {
            const newFolder = addFolder(name, currentFolderId);
            if (newFolder) {
              if (newFolder.parentId) {
                if (location.pathname !== `/folders/${newFolder.parentId}`) {
                  navigate(`/folders/${newFolder.parentId}`);
                }
              } else {
                if (location.pathname !== '/') {
                  navigate('/');
                }
              }
              setSelectedItem(newFolder.id, 'folder');
              setTimeout(() => {
                const element = document.querySelector(`[data-card-id="${newFolder.id}"]`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
            }
          }
        }}
      />
      <QuickEditModal
        isOpen={isQuickEditModalOpen}
        onClose={closeQuickEditModal}
        item={quickEditItem}
        onSave={(updates) => {
          if (quickEditItem) {
            updateItem(quickEditItem.id, updates);
          }
        }}
      />
      <DeleteDialog
        isOpen={!!deleteDialogData?.isOpen}
        onClose={closeDeleteDialog}
        itemName={deleteDialogData?.name}
        itemType={deleteDialogData?.type === 'folder' ? 'folder' : 'note'}
        onConfirm={() => {
          if (deleteDialogData) {
            if (deleteDialogData.type === 'folder') {
              deleteFolder(deleteDialogData.id);
            } else {
              deleteItem(deleteDialogData.id);
            }
          }
        }}
      />
      <ConflictDialog />
      <ProfileModal />
      <SettingsModal />
      <SessionsModal />
      <FeedbackModal />

      {/* Floating Bottom-Right Feedback & Report Trigger Button */}
      <FloatingFeedbackButton />

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <MobileBottomNav />

      {/* Floating Micro-Toast Action Feedback Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed bottom-20 md:bottom-7 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1F1F1F]/95 text-white text-xs sm:text-sm font-medium rounded-full shadow-2xl backdrop-blur-md border border-white/10 select-none">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
