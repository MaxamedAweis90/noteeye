import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { NoteModal } from './NoteModal';
import { FolderModal, QuickEditModal, DeleteDialog } from './modals';
import { ContextMenu } from './ContextMenu';
import { DetailsPanel } from './DetailsPanel';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';

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
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);
  const isFolderModalOpen = useNoteStore((state) => state.isFolderModalOpen);
  const closeFolderModal = useNoteStore((state) => state.closeFolderModal);
  const editingFolder = useNoteStore((state) => state.editingFolder);
  const addFolder = useNoteStore((state) => state.addFolder);
  const renameFolder = useNoteStore((state) => state.renameFolder);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);

  const isQuickEditModalOpen = useNoteStore((state) => state.isQuickEditModalOpen);
  const closeQuickEditModal = useNoteStore((state) => state.closeQuickEditModal);
  const quickEditItem = useNoteStore((state) => state.quickEditItem);
  const updateItem = useNoteStore((state) => state.updateItem);

  const deleteDialogData = useNoteStore((state) => state.deleteDialogData);
  const closeDeleteDialog = useNoteStore((state) => state.closeDeleteDialog);
  const deleteItem = useNoteStore((state) => state.deleteItem);
  const deleteFolder = useNoteStore((state) => state.deleteFolder);

  const clearSelection = useUIStore((state) => state.clearSelection);
  const openContextMenu = useUIStore((state) => state.openContextMenu);

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
            className="bg-white rounded-2xl md:rounded-[24px] h-full max-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.08)] flex flex-col flex-1 transition-all min-w-0 overflow-y-auto custom-scrollbar"
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

          {/* Integrated Companion Details Panel Island */}
          <DetailsPanel />
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
    </div>
  );
};
