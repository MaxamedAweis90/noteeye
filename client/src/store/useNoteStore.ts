import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Folder, Item, ItemType } from '../types';
import { STARTER_FOLDERS, STARTER_ITEMS, DEFAULT_PASTEL_COLOR } from '../types';
import { useUIStore } from './uiStore';

export interface ConflictRecord {
  incomingId: string;
  incomingType: 'note' | 'folder';
  incomingName: string;
  incomingColor?: string;
  incomingUpdatedAt?: string;
  existingId: string;
  existingType: 'note' | 'folder';
  existingName: string;
  existingColor?: string;
  existingUpdatedAt?: string;
  action: 'copy' | 'cut';
  targetFolderId: string | null;
  isCreation?: boolean;
  incomingItemData?: {
    title: string;
    type: ItemType;
    folderId: string | null;
    content?: string;
    checklistItems?: Array<{ id: string; text: string; isCompleted: boolean }>;
    color?: string;
    isFavorite?: boolean;
  };
  incomingFolderData?: {
    name: string;
    parentId: string | null;
  };
}

export interface ConflictDialogState {
  isOpen: boolean;
  conflicts: ConflictRecord[];
  currentIndex: number;
}

/**
 * Recursively retrieves the root folder id and all descendant subfolder ids
 */
export const getAllDescendantFolderIds = (allFolders: Folder[], rootId: string): Set<string> => {
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

/**
 * Generates an incremented unique name when a conflict is resolved via "make copy"
 */
const getUniqueName = (
  baseName: string,
  targetFolderId: string | null,
  type: 'note' | 'folder',
  items: Item[],
  folders: Folder[]
): string => {
  const exists = (name: string) => {
    if (type === 'note') {
      return items.some(
        (i) =>
          !i.isDeleted &&
          i.folderId === targetFolderId &&
          i.title.trim().toLowerCase() === name.trim().toLowerCase()
      );
    } else {
      return folders.some(
        (f) =>
          !f.isDeleted &&
          f.parentId === targetFolderId &&
          f.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
    }
  };

  if (!exists(baseName)) return baseName;

  let candidate = `${baseName} (Copy)`;
  if (!exists(candidate)) return candidate;

  let counter = 2;
  while (exists(`${baseName} (Copy ${counter})`)) {
    counter++;
  }
  return `${baseName} (Copy ${counter})`;
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
  conflictDialogData: ConflictDialogState | null;

  // Actions - Folders
  addFolder: (name: string, parentId?: string | null) => Folder | null;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  restoreFolder: (id: string) => void;
  permanentlyDeleteFolder: (id: string) => void;
  setCurrentFolder: (folderId: string | null) => void;
  toggleFavoriteFolder: (id: string) => void;
  moveFolderToFolder: (folderId: string, targetFolderId: string | null) => void;
  duplicateFolder: (folderId: string, targetParentId?: string | null) => Folder | null;

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
  }) => Item | null;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  restoreItem: (id: string) => void;
  permanentlyDeleteItem: (id: string) => void;
  toggleChecklistItem: (itemId: string, checkItemId: string) => void;
  toggleFavoriteItem: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
  duplicateItem: (noteId: string, targetFolderId?: string | null) => Item | null;

  // Conflict actions
  openConflictDialog: (conflicts: ConflictRecord[]) => void;
  closeConflictDialog: () => void;
  resolveCurrentConflict: (
    resolution: 'replace' | 'make-copy' | 'skip',
    applyToAll?: boolean
  ) => void;
  resolveAllConflicts: (resolution: 'replace' | 'make-copy') => void;
  executeTransfer: (
    entries: Array<{ type: 'note' | 'folder'; id: string; action: 'copy' | 'cut'; name?: string }>,
    targetFolderId: string | null
  ) => void;

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
      conflictDialogData: null,

      addFolder: (name, parentId = null) => {
        const trimmed = name.trim();
        const finalName = trimmed || 'Untitled Folder';
        const targetParentId = parentId ?? null;

        const state = useNoteStore.getState();
        const existingFolder = state.folders.find(
          (f) =>
            !f.isDeleted &&
            f.parentId === targetParentId &&
            f.name.trim().toLowerCase() === finalName.toLowerCase()
        );

        if (existingFolder) {
          set({
            isFolderModalOpen: false,
            conflictDialogData: {
              isOpen: true,
              conflicts: [
                {
                  incomingId: `folder-${Date.now()}`,
                  incomingType: 'folder',
                  incomingName: finalName,
                  incomingUpdatedAt: new Date().toISOString(),
                  existingId: existingFolder.id,
                  existingType: 'folder',
                  existingName: existingFolder.name,
                  existingUpdatedAt: existingFolder.updatedAt,
                  action: 'copy',
                  targetFolderId: targetParentId,
                  isCreation: true,
                  incomingFolderData: {
                    name: finalName,
                    parentId: targetParentId,
                  },
                },
              ],
              currentIndex: 0,
            },
          });
          return null;
        }

        const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          userId: 'user-demo',
          name: finalName,
          parentId: targetParentId,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((prevState) => ({
          folders: [...prevState.folders, newFolder],
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

      moveFolderToFolder: (folderId, targetFolderId) => {
        if (folderId === targetFolderId) return;
        set((state) => {
          // Prevent cyclical moves: targetFolderId cannot be a descendant of folderId
          if (targetFolderId) {
            const descendants = getAllDescendantFolderIds(state.folders, folderId);
            if (descendants.has(targetFolderId)) return state;
          }
          return {
            folders: state.folders.map((f) =>
              f.id === folderId
                ? {
                    ...f,
                    parentId: targetFolderId,
                    updatedAt: new Date().toISOString(),
                  }
                : f
            ),
          };
        });
      },

      duplicateFolder: (folderId, targetParentId) => {
        let createdFolder: Folder | null = null;
        set((state) => {
          const original = state.folders.find((f) => f.id === folderId);
          if (!original) return state;

          const now = new Date().toISOString();
          const newFolderId = `folder-${Date.now()}`;
          createdFolder = {
            ...original,
            id: newFolderId,
            name: `${original.name} (Copy)`,
            parentId: targetParentId !== undefined ? targetParentId : original.parentId,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
          };

          // Also duplicate direct notes inside the folder
          const directNotes = state.items.filter((i) => i.folderId === folderId && !i.isDeleted);
          const duplicatedNotes: Item[] = directNotes.map((note) => ({
            ...note,
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            folderId: newFolderId,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
            checklistItems: note.checklistItems
              ? note.checklistItems.map((ci) => ({
                  ...ci,
                  id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                }))
              : [],
          }));

          return {
            folders: [...state.folders, createdFolder],
            items: [...duplicatedNotes, ...state.items],
          };
        });
        return createdFolder;
      },

      addItem: (data) => {
        const trimmedTitle = data.title.trim() || (data.type === 'checklist' ? 'Untitled Checklist' : 'Untitled Note');
        const targetFolderId = data.folderId ?? null;

        const state = useNoteStore.getState();
        const existingItem = state.items.find(
          (i) =>
            !i.isDeleted &&
            i.folderId === targetFolderId &&
            i.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
        );

        if (existingItem) {
          set({
            isNoteModalOpen: false,
            editingItem: null,
            conflictDialogData: {
              isOpen: true,
              conflicts: [
                {
                  incomingId: data.id || `item-${Date.now()}`,
                  incomingType: 'note',
                  incomingName: trimmedTitle,
                  incomingColor: data.color || DEFAULT_PASTEL_COLOR,
                  incomingUpdatedAt: new Date().toISOString(),
                  existingId: existingItem.id,
                  existingType: 'note',
                  existingName: existingItem.title,
                  existingColor: existingItem.color,
                  existingUpdatedAt: existingItem.updatedAt,
                  action: 'copy',
                  targetFolderId,
                  isCreation: true,
                  incomingItemData: {
                    ...data,
                    title: trimmedTitle,
                    folderId: targetFolderId,
                  },
                },
              ],
              currentIndex: 0,
            },
          });
          return null;
        }

        const now = new Date().toISOString();
        const newItem: Item = {
          id: data.id || `item-${Date.now()}`,
          userId: 'user-demo',
          title: trimmedTitle,
          type: data.type,
          folderId: targetFolderId,
          content: data.content || '',
          checklistItems: data.checklistItems || [],
          color: data.color || DEFAULT_PASTEL_COLOR,
          isDeleted: false,
          isFavorite: Boolean(data.isFavorite),
          createdAt: now,
          updatedAt: now,
        };
        set((prevState) => ({
          items: [newItem, ...prevState.items],
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

      moveNoteToFolder: (noteId, folderId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === noteId
              ? {
                  ...i,
                  folderId,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
        }));
      },

      duplicateItem: (noteId, targetFolderId) => {
        let createdItem: Item | null = null;
        set((state) => {
          const original = state.items.find((i) => i.id === noteId);
          if (!original) return state;

          const now = new Date().toISOString();
          createdItem = {
            ...original,
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: `${original.title} (Copy)`,
            folderId: targetFolderId !== undefined ? targetFolderId : original.folderId,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
            checklistItems: original.checklistItems
              ? original.checklistItems.map((ci) => ({
                  ...ci,
                  id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                }))
              : [],
          };

          return {
            items: [createdItem, ...state.items],
          };
        });
        return createdItem;
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

      openConflictDialog: (conflicts) => {
        set({
          conflictDialogData: {
            isOpen: true,
            conflicts,
            currentIndex: 0,
          },
        });
      },

      closeConflictDialog: () => {
        useUIStore.getState().clearMultiSelection();
        useUIStore.getState().setIsDraggingMulti(false);
        set({ conflictDialogData: null });
      },

      resolveCurrentConflict: (resolution, applyToAll = false) => {
        set((state) => {
          if (!state.conflictDialogData || !state.conflictDialogData.isOpen) return state;
          const { conflicts, currentIndex } = state.conflictDialogData;
          if (currentIndex >= conflicts.length) return state;

          let updatedItems = [...state.items];
          let updatedFolders = [...state.folders];

          const conflictsToProcess = applyToAll
            ? conflicts.slice(currentIndex)
            : [conflicts[currentIndex]];

          let createdOrTargetId: string | null = null;
          let createdOrTargetType: 'note' | 'folder' = 'note';

          for (const conflict of conflictsToProcess) {
            if (resolution === 'replace') {
              if (conflict.isCreation) {
                const now = new Date().toISOString();
                if (conflict.incomingType === 'note') {
                  const data = conflict.incomingItemData;
                  updatedItems = updatedItems.map((i) =>
                    i.id === conflict.existingId
                      ? {
                          ...i,
                          ...(data || {}),
                          id: conflict.existingId,
                          title: conflict.incomingName,
                          folderId: conflict.targetFolderId,
                          updatedAt: now,
                        }
                      : i
                  );
                  createdOrTargetId = conflict.existingId;
                  createdOrTargetType = 'note';
                } else {
                  updatedFolders = updatedFolders.map((f) =>
                    f.id === conflict.existingId
                      ? { ...f, updatedAt: now }
                      : f
                  );
                  createdOrTargetId = conflict.existingId;
                  createdOrTargetType = 'folder';
                }
              } else {
                if (conflict.incomingType === 'note') {
                  updatedItems = updatedItems.map((i) =>
                    i.id === conflict.existingId ? { ...i, isDeleted: true } : i
                  );
                  if (conflict.action === 'cut') {
                    updatedItems = updatedItems.map((i) =>
                      i.id === conflict.incomingId
                        ? { ...i, folderId: conflict.targetFolderId, updatedAt: new Date().toISOString() }
                        : i
                    );
                  } else {
                    const incomingNote = updatedItems.find((i) => i.id === conflict.incomingId);
                    if (incomingNote) {
                      const now = new Date().toISOString();
                      const cloned: Item = {
                        ...incomingNote,
                        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        title: conflict.incomingName,
                        folderId: conflict.targetFolderId,
                        createdAt: now,
                        updatedAt: now,
                        isFavorite: false,
                      };
                      updatedItems = [cloned, ...updatedItems];
                    }
                  }
                } else {
                  updatedFolders = updatedFolders.map((f) =>
                    f.id === conflict.existingId ? { ...f, isDeleted: true } : f
                  );
                  if (conflict.action === 'cut') {
                    updatedFolders = updatedFolders.map((f) =>
                      f.id === conflict.incomingId
                        ? { ...f, parentId: conflict.targetFolderId, updatedAt: new Date().toISOString() }
                        : f
                    );
                  } else {
                    const incomingFolder = updatedFolders.find((f) => f.id === conflict.incomingId);
                    if (incomingFolder) {
                      const now = new Date().toISOString();
                      const newFolderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                      const cloned: Folder = {
                        ...incomingFolder,
                        id: newFolderId,
                        name: conflict.incomingName,
                        parentId: conflict.targetFolderId,
                        createdAt: now,
                        updatedAt: now,
                        isFavorite: false,
                      };
                      updatedFolders.push(cloned);
                    }
                  }
                }
              }
            } else if (resolution === 'make-copy') {
              const uniqueName = getUniqueName(
                conflict.incomingName,
                conflict.targetFolderId,
                conflict.incomingType,
                updatedItems,
                updatedFolders
              );

              if (conflict.isCreation) {
                const now = new Date().toISOString();
                if (conflict.incomingType === 'note') {
                  const data = conflict.incomingItemData;
                  const createdItem: Item = {
                    id: conflict.incomingId || `item-${Date.now()}`,
                    userId: 'user-demo',
                    title: uniqueName,
                    type: data?.type || 'note',
                    folderId: conflict.targetFolderId,
                    content: data?.content || '',
                    checklistItems: data?.checklistItems || [],
                    color: data?.color || DEFAULT_PASTEL_COLOR,
                    isDeleted: false,
                    isFavorite: Boolean(data?.isFavorite),
                    createdAt: now,
                    updatedAt: now,
                  };
                  updatedItems = [createdItem, ...updatedItems];
                  createdOrTargetId = createdItem.id;
                  createdOrTargetType = 'note';
                } else {
                  const createdFolder: Folder = {
                    id: conflict.incomingId || `folder-${Date.now()}`,
                    userId: 'user-demo',
                    name: uniqueName,
                    parentId: conflict.targetFolderId,
                    isDeleted: false,
                    createdAt: now,
                    updatedAt: now,
                    isFavorite: false,
                  };
                  updatedFolders = [...updatedFolders, createdFolder];
                  createdOrTargetId = createdFolder.id;
                  createdOrTargetType = 'folder';
                }
              } else {
                if (conflict.incomingType === 'note') {
                  if (conflict.action === 'cut') {
                    updatedItems = updatedItems.map((i) =>
                      i.id === conflict.incomingId
                        ? { ...i, title: uniqueName, folderId: conflict.targetFolderId, updatedAt: new Date().toISOString() }
                        : i
                    );
                  } else {
                    const incomingNote = updatedItems.find((i) => i.id === conflict.incomingId);
                    if (incomingNote) {
                      const now = new Date().toISOString();
                      const cloned: Item = {
                        ...incomingNote,
                        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        title: uniqueName,
                        folderId: conflict.targetFolderId,
                        createdAt: now,
                        updatedAt: now,
                        isFavorite: false,
                      };
                      updatedItems = [cloned, ...updatedItems];
                    }
                  }
                } else {
                  if (conflict.action === 'cut') {
                    updatedFolders = updatedFolders.map((f) =>
                      f.id === conflict.incomingId
                        ? { ...f, name: uniqueName, parentId: conflict.targetFolderId, updatedAt: new Date().toISOString() }
                        : f
                    );
                  } else {
                    const incomingFolder = updatedFolders.find((f) => f.id === conflict.incomingId);
                    if (incomingFolder) {
                      const now = new Date().toISOString();
                      const newFolderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                      const cloned: Folder = {
                        ...incomingFolder,
                        id: newFolderId,
                        name: uniqueName,
                        parentId: conflict.targetFolderId,
                        createdAt: now,
                        updatedAt: now,
                        isFavorite: false,
                      };
                      updatedFolders.push(cloned);
                    }
                  }
                }
              }
            }
          }

          if (applyToAll || currentIndex + 1 >= conflicts.length) {
            useUIStore.getState().showToast(
              resolution === 'replace'
                ? 'Item replaced successfully'
                : resolution === 'make-copy'
                ? 'Created with new name'
                : 'Action completed'
            );
            useUIStore.getState().clearClipboard();
            useUIStore.getState().clearMultiSelection();
            useUIStore.getState().setIsDraggingMulti(false);

            if (createdOrTargetId) {
              useUIStore.getState().setSelectedItem(createdOrTargetId, createdOrTargetType);
              setTimeout(() => {
                const el = document.querySelector(`[data-card-id="${createdOrTargetId}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
            }

            return {
              items: updatedItems,
              folders: updatedFolders,
              conflictDialogData: null,
            };
          }

          return {
            items: updatedItems,
            folders: updatedFolders,
            conflictDialogData: {
              ...state.conflictDialogData,
              currentIndex: currentIndex + 1,
            },
          };
        });
      },

      resolveAllConflicts: (resolution) => {
        useNoteStore.getState().resolveCurrentConflict(resolution, true);
      },

      executeTransfer: (entries, targetFolderId) => {
        set((state) => {
          const conflicts: ConflictRecord[] = [];
          let updatedItems = [...state.items];
          let updatedFolders = [...state.folders];
          let transferredCount = 0;

          for (const entry of entries) {
            if (entry.type === 'folder') {
              const folderToMove = updatedFolders.find((f) => f.id === entry.id && !f.isDeleted);
              if (!folderToMove) continue;

              if (targetFolderId === entry.id) {
                useUIStore.getState().showToast('Cannot move a folder into itself');
                continue;
              }

              if (targetFolderId) {
                const descendants = getAllDescendantFolderIds(updatedFolders, entry.id);
                if (descendants.has(targetFolderId)) {
                  useUIStore.getState().showToast('Cannot move folder into its own subfolder');
                  continue;
                }
              }

              if (entry.action === 'cut' && folderToMove.parentId === targetFolderId) {
                continue;
              }

              const existingFolder = updatedFolders.find(
                (f) =>
                  !f.isDeleted &&
                  f.parentId === targetFolderId &&
                  f.id !== entry.id &&
                  f.name.trim().toLowerCase() === folderToMove.name.trim().toLowerCase()
              );

              if (existingFolder) {
                conflicts.push({
                  incomingId: entry.id,
                  incomingType: 'folder',
                  incomingName: folderToMove.name,
                  incomingUpdatedAt: folderToMove.updatedAt,
                  existingId: existingFolder.id,
                  existingType: 'folder',
                  existingName: existingFolder.name,
                  existingUpdatedAt: existingFolder.updatedAt,
                  action: entry.action,
                  targetFolderId,
                });
              } else {
                if (entry.action === 'cut') {
                  updatedFolders = updatedFolders.map((f) =>
                    f.id === entry.id
                      ? { ...f, parentId: targetFolderId, updatedAt: new Date().toISOString() }
                      : f
                  );
                } else {
                  const newFolderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                  const now = new Date().toISOString();
                  const clonedFolder: Folder = {
                    ...folderToMove,
                    id: newFolderId,
                    name: folderToMove.name,
                    parentId: targetFolderId,
                    createdAt: now,
                    updatedAt: now,
                    isFavorite: false,
                  };
                  const directNotes = updatedItems.filter((i) => i.folderId === folderToMove.id && !i.isDeleted);
                  const clonedNotes: Item[] = directNotes.map((note) => ({
                    ...note,
                    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    folderId: newFolderId,
                    createdAt: now,
                    updatedAt: now,
                    isFavorite: false,
                  }));
                  updatedFolders.push(clonedFolder);
                  updatedItems.push(...clonedNotes);
                }
                transferredCount++;
              }
            } else {
              const noteToMove = updatedItems.find((i) => i.id === entry.id && !i.isDeleted);
              if (!noteToMove) continue;

              if (entry.action === 'cut' && noteToMove.folderId === targetFolderId) {
                continue;
              }

              const existingNote = updatedItems.find(
                (i) =>
                  !i.isDeleted &&
                  i.folderId === targetFolderId &&
                  i.id !== entry.id &&
                  i.title.trim().toLowerCase() === noteToMove.title.trim().toLowerCase()
              );

              if (existingNote) {
                conflicts.push({
                  incomingId: entry.id,
                  incomingType: 'note',
                  incomingName: noteToMove.title,
                  incomingColor: noteToMove.color,
                  incomingUpdatedAt: noteToMove.updatedAt,
                  existingId: existingNote.id,
                  existingType: 'note',
                  existingName: existingNote.title,
                  existingColor: existingNote.color,
                  existingUpdatedAt: existingNote.updatedAt,
                  action: entry.action,
                  targetFolderId,
                });
              } else {
                if (entry.action === 'cut') {
                  updatedItems = updatedItems.map((i) =>
                    i.id === entry.id
                      ? { ...i, folderId: targetFolderId, updatedAt: new Date().toISOString() }
                      : i
                  );
                } else {
                  const now = new Date().toISOString();
                  const clonedNote: Item = {
                    ...noteToMove,
                    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    title: noteToMove.title,
                    folderId: targetFolderId,
                    createdAt: now,
                    updatedAt: now,
                    isFavorite: false,
                    checklistItems: noteToMove.checklistItems
                      ? noteToMove.checklistItems.map((ci) => ({ ...ci, id: `ci-${Date.now()}-${Math.random()}` }))
                      : [],
                  };
                  updatedItems = [clonedNote, ...updatedItems];
                }
                transferredCount++;
              }
            }
          }

          // Automatically disable selection from items when they are dropped
          useUIStore.getState().clearMultiSelection();
          useUIStore.getState().setIsDraggingMulti(false);

          if (conflicts.length > 0) {
            return {
              items: updatedItems,
              folders: updatedFolders,
              conflictDialogData: {
                isOpen: true,
                conflicts,
                currentIndex: 0,
              },
            };
          }

          if (transferredCount > 0) {
            const actionVerb = entries[0]?.action === 'copy' ? 'copied' : 'moved';
            useUIStore.getState().showToast(
              transferredCount === 1
                ? `1 item ${actionVerb} successfully`
                : `${transferredCount} items ${actionVerb} successfully`
            );
            if (entries[0]?.action === 'cut') {
              useUIStore.getState().clearClipboard();
            }
          }

          return {
            items: updatedItems,
            folders: updatedFolders,
          };
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
