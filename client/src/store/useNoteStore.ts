import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Folder, Item, ItemType } from '../types';
import { STARTER_FOLDERS, STARTER_ITEMS, DEFAULT_PASTEL_COLOR } from '../types';

interface NoteStoreState {
  folders: Folder[];
  items: Item[];
  searchQuery: string;
  currentFolderId: string | null; // null = root / all
  isNoteModalOpen: boolean;
  isFolderModalOpen: boolean;
  editingItem: Item | null;
  noteModalType: ItemType;
  isMobileSidebarOpen: boolean;

  // Actions - Folders
  addFolder: (name: string, parentId?: string | null) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  restoreFolder: (id: string) => void;
  permanentlyDeleteFolder: (id: string) => void;
  setCurrentFolder: (folderId: string | null) => void;

  // Actions - Items (Notes & Checklists)
  addItem: (data: {
    title: string;
    type: ItemType;
    folderId: string | null;
    content?: string;
    checklistItems?: Array<{ id: string; text: string; isCompleted: boolean }>;
    color?: string;
  }) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  restoreItem: (id: string) => void;
  permanentlyDeleteItem: (id: string) => void;
  toggleChecklistItem: (itemId: string, checkItemId: string) => void;

  // Trash
  emptyTrash: () => void;

  // UI state
  setSearchQuery: (query: string) => void;
  openNoteModal: (type?: ItemType, itemToEdit?: Item | null) => void;
  closeNoteModal: () => void;
  openFolderModal: () => void;
  closeFolderModal: () => void;
  toggleMobileSidebar: (open?: boolean) => void;
  resetToDefault: () => void;
}

export const useNoteStore = create<NoteStoreState>()(
  persist(
    (set) => ({
      folders: STARTER_FOLDERS,
      items: STARTER_ITEMS,
      searchQuery: '',
      currentFolderId: null,
      isNoteModalOpen: false,
      isFolderModalOpen: false,
      editingItem: null,
      noteModalType: 'note',
      isMobileSidebarOpen: false,

      addFolder: (name, parentId = null) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          userId: 'user-demo',
          name: trimmed,
          parentId: parentId ?? null,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
          isFolderModalOpen: false,
        }));
      },

      renameFolder: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name: trimmed, updatedAt: new Date().toISOString() } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        // Soft delete folder and cascade to its immediate items & subfolders
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id || f.parentId === id ? { ...f, isDeleted: true } : f
          ),
          items: state.items.map((i) =>
            i.folderId === id ? { ...i, isDeleted: true } : i
          ),
        }));
      },

      restoreFolder: (id) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, isDeleted: false } : f
          ),
          items: state.items.map((i) =>
            i.folderId === id ? { ...i, isDeleted: false } : i
          ),
        }));
      },

      permanentlyDeleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id && f.parentId !== id),
          items: state.items.filter((i) => i.folderId !== id),
        }));
      },

      setCurrentFolder: (folderId) => {
        set({ currentFolderId: folderId });
      },

      addItem: (data) => {
        const now = new Date().toISOString();
        const newItem: Item = {
          id: `item-${Date.now()}`,
          userId: 'user-demo',
          title: data.title.trim() || 'Untitled',
          type: data.type,
          folderId: data.folderId,
          content: data.content || '',
          checklistItems: data.checklistItems || [],
          color: data.color || DEFAULT_PASTEL_COLOR,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          items: [newItem, ...state.items],
          isNoteModalOpen: false,
          editingItem: null,
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
          isNoteModalOpen: false,
          editingItem: null,
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, isDeleted: true } : i)),
          isNoteModalOpen: false,
          editingItem: null,
        }));
      },

      restoreItem: (id) => {
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, isDeleted: false } : i)),
        }));
      },

      permanentlyDeleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      toggleChecklistItem: (itemId, checkItemId) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId || !item.checklistItems) return item;
            return {
              ...item,
              updatedAt: new Date().toISOString(),
              checklistItems: item.checklistItems.map((ci) =>
                ci.id === checkItemId ? { ...ci, isCompleted: !ci.isCompleted } : ci
              ),
            };
          }),
        }));
      },

      emptyTrash: () => {
        set((state) => ({
          folders: state.folders.filter((f) => !f.isDeleted),
          items: state.items.filter((i) => !i.isDeleted),
        }));
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      openNoteModal: (type = 'note', itemToEdit = null) => {
        set({
          isNoteModalOpen: true,
          noteModalType: itemToEdit ? itemToEdit.type : type,
          editingItem: itemToEdit,
        });
      },

      closeNoteModal: () => {
        set({
          isNoteModalOpen: false,
          editingItem: null,
        });
      },

      openFolderModal: () => {
        set({ isFolderModalOpen: true });
      },

      closeFolderModal: () => {
        set({ isFolderModalOpen: false });
      },

      toggleMobileSidebar: (open) => {
        set((state) => ({
          isMobileSidebarOpen:
            typeof open === 'boolean' ? open : !state.isMobileSidebarOpen,
        }));
      },

      resetToDefault: () => {
        set({
          folders: STARTER_FOLDERS,
          items: STARTER_ITEMS,
          currentFolderId: null,
          searchQuery: '',
          isNoteModalOpen: false,
          isFolderModalOpen: false,
          editingItem: null,
        });
      },
    }),
    {
      name: 'noteeye-drive-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        folders: state.folders,
        items: state.items,
        currentFolderId: state.currentFolderId,
      }),
    }
  )
);
