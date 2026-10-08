import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Folder, Item, ItemType } from '../types';
import { STARTER_FOLDERS, STARTER_ITEMS, DEFAULT_PASTEL_COLOR } from '../types';

/**
 * Recursively retrieves the root folder id and all descendant subfolder ids
 */
const getAllDescendantFolderIds = (allFolders: Folder[], rootId: string): Set<string> => {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        added = true;
      }
    }
  }
  return ids;
};

interface NoteStoreState {
  folders: Folder[];
  items: Item[];
  searchQuery: string;
  currentFolderId: string | null; // null = root / all
  isNoteModalOpen: boolean;
  isFolderModalOpen: boolean;
  editingFolder: Folder | null;
  editingItem: Item | null;
  noteModalType: ItemType;
  isMobileSidebarOpen: boolean;
  isQuickEditModalOpen: boolean;
  quickEditItem: Item | null;
  deleteDialogData: {
    isOpen: boolean;
    id: string;
    name: string;
    type: 'item' | 'folder' | 'note' | 'checklist';
  } | null;

  // Actions - Folders
  addFolder: (name: string, parentId?: string | null) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  restoreFolder: (id: string) => void;
  permanentlyDeleteFolder: (id: string) => void;
  setCurrentFolder: (folderId: string | null) => void;
  toggleFavoriteFolder: (id: string) => void;

  // Actions - Items (Notes & Checklists)
  addItem: (data: {
    id?: string;
    title: string;
    type: ItemType;
    folderId: string | null;
    content?: string;
    checklistItems?: Array<{ id: string; text: string; isCompleted: boolean }>;
    color?: string;
    isFavorite?: boolean;
  }) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  restoreItem: (id: string) => void;
  permanentlyDeleteItem: (id: string) => void;
  toggleChecklistItem: (itemId: string, checkItemId: string) => void;
  toggleFavoriteItem: (id: string) => void;

  // Trash
  emptyTrash: () => void;

  // UI state
  setSearchQuery: (query: string) => void;
  openNoteModal: (type?: ItemType, itemToEdit?: Item | null) => void;
  closeNoteModal: () => void;
  openFolderModal: (folderToEdit?: Folder | null) => void;
  closeFolderModal: () => void;
  openQuickEditModal: (item: Item) => void;
  closeQuickEditModal: () => void;
  openDeleteDialog: (id: string, name: string, type?: 'item' | 'folder' | 'note' | 'checklist') => void;
  closeDeleteDialog: () => void;
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
      editingFolder: null,
      editingItem: null,
      noteModalType: 'note',
      isMobileSidebarOpen: false,
      isQuickEditModalOpen: false,
      quickEditItem: null,
      deleteDialogData: null,

      addFolder: (name, parentId = null) => {
        const trimmed = name.trim();
        const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          userId: 'user-demo',
          name: trimmed || 'Untitled Folder',
          parentId: parentId ?? null,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
          isFolderModalOpen: false,
        }));
        return newFolder;
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
        // Soft delete folder and cascade to all nested subfolders and items
        set((state) => {
          const targetIds = getAllDescendantFolderIds(state.folders, id);
          return {
            folders: state.folders.map((f) =>
              targetIds.has(f.id) ? { ...f, isDeleted: true } : f
            ),
            items: state.items.map((i) =>
              i.folderId && targetIds.has(i.folderId) ? { ...i, isDeleted: true } : i
            ),
          };
        });
      },

      restoreFolder: (id) => {
        // Restore folder and cascade to all nested subfolders and items
        set((state) => {
          const targetIds = getAllDescendantFolderIds(state.folders, id);
          return {
            folders: state.folders.map((f) =>
              targetIds.has(f.id) ? { ...f, isDeleted: false } : f
            ),
            items: state.items.map((i) =>
              i.folderId && targetIds.has(i.folderId) ? { ...i, isDeleted: false } : i
            ),
          };
        });
      },

      permanentlyDeleteFolder: (id) => {
        // Permanently delete folder, all nested subfolders, and items
        set((state) => {
          const targetIds = getAllDescendantFolderIds(state.folders, id);
          return {
            folders: state.folders.filter((f) => !targetIds.has(f.id)),
            items: state.items.filter((i) => !i.folderId || !targetIds.has(i.folderId)),
          };
        });
      },

      setCurrentFolder: (folderId) => {
        set({ currentFolderId: folderId });
      },

      toggleFavoriteFolder: (id) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id
              ? {
                  ...f,
                  isFavorite: !f.isFavorite,
                  updatedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
      },

      addItem: (data) => {
        const now = new Date().toISOString();
        const newItem: Item = {
          id: data.id || `item-${Date.now()}`,
          userId: 'user-demo',
          title: data.title.trim() || 'Untitled',
          type: data.type,
          folderId: data.folderId,
          content: data.content || '',
          checklistItems: data.checklistItems || [],
          color: data.color || DEFAULT_PASTEL_COLOR,
          isDeleted: false,
          isFavorite: Boolean(data.isFavorite),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          items: [newItem, ...state.items],
          isNoteModalOpen: false,
          editingItem: null,
        }));
        return newItem;
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

      toggleFavoriteItem: (id) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  isFavorite: !i.isFavorite,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
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
        if (itemToEdit) {
          set({
            isQuickEditModalOpen: true,
            quickEditItem: itemToEdit,
            isNoteModalOpen: false,
            editingItem: null,
          });
        } else {
          set({
            isNoteModalOpen: true,
            noteModalType: type,
            editingItem: null,
          });
        }
      },

      closeNoteModal: () => {
        set({
          isNoteModalOpen: false,
          editingItem: null,
        });
      },

      openFolderModal: (folderToEdit = null) => {
        set({
          isFolderModalOpen: true,
          editingFolder: folderToEdit || null,
        });
      },

      closeFolderModal: () => {
        set({
          isFolderModalOpen: false,
          editingFolder: null,
        });
      },

      openQuickEditModal: (item) => {
        set({
          isQuickEditModalOpen: true,
          quickEditItem: item,
        });
      },

      closeQuickEditModal: () => {
        set({
          isQuickEditModalOpen: false,
          quickEditItem: null,
        });
      },

      openDeleteDialog: (id, name, type = 'item') => {
        set({
          deleteDialogData: {
            isOpen: true,
            id,
            name,
            type,
          },
        });
      },

      closeDeleteDialog: () => {
        set({
          deleteDialogData: null,
        });
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
