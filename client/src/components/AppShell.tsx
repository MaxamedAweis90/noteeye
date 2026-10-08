import React from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { NoteModal } from './NoteModal';
import { FolderModal, QuickEditModal, DeleteDialog } from './modals';
import { useNoteStore } from '../store/useNoteStore';

interface AppShellProps {
  children?: React.ReactNode;
}

/**
 * Noteeye App Shell — Google Drive Material 3 Two-Layer Spatial Architecture
 * Layer 1 (Outer): Seamless #F8FAFD Canvas behind fixed Top Bar and Sidebar Rail
 * Layer 2 (Inner): Crisp, elevated #FFFFFF Floating Content Workspace (rounded-tl-[24px] rounded-bl-xl rounded-r-xl)
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
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

  return (
    <div className="min-h-screen w-full bg-[#F8FAFD] text-[#1F1F1F] font-sans antialiased relative selection:bg-[#C2E7FF] selection:text-[#001D35]">
      {/* 1. Outer App Shell: Top Navigation Bar (Fixed h-16, bg-#F8FAFD) */}
      <TopNav />

      {/* 2. Outer App Shell: Left Persistent Rail (Fixed top-16, w-64, seamless bg-#F8FAFD) */}
      <Sidebar />

      {/* 3. Inner Floating Content Workspace (24px rounded white canvas) */}
      <div className="pl-0 md:pl-64">
        <main className="pt-16 pr-0 md:pr-4 pb-4 min-h-screen bg-[#F8FAFD]">
          <div className="bg-white md:rounded-tl-[24px] md:rounded-bl-xl md:rounded-r-xl rounded-none min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.08)] flex flex-col flex-1 transition-all">
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
        </main>
      </div>

      {/* Global Interactive Modals */}
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
            addFolder(name, currentFolderId);
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
