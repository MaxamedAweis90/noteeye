import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Folder, Item, ItemType, ChecklistItem } from '../types';
import { STARTER_FOLDERS, STARTER_ITEMS, DEFAULT_PASTEL_COLOR, generateMongoId } from '../types';
import { useUIStore } from './uiStore';
import { useSyncStore } from './syncStore';
import { notesApi } from '../api/notesApi';
import { foldersApi } from '../api/foldersApi';
export { useNotesStore } from './notesStore';
export { useFoldersStore } from './foldersStore';

// Instant sub-millisecond multi-tab / window sync channel
const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('noteeye_workspace_sync')
    : null;

const notifySync = () => {
  try {
    syncChannel?.postMessage({ type: 'workspace_mutation', timestamp: Date.now() });
  } catch {}
};

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
    checklistItems?: ChecklistItem[];
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

export interface WorkspaceAction {
  id: string;
  description: string;
  undo: () => void;
  redo: () => void;
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
  deleteFolder: (id: string, recordHistory?: boolean) => void;
  restoreFolder: (id: string, recordHistory?: boolean) => void;
  permanentlyDeleteFolder: (id: string) => void;
  setCurrentFolder: (folderId: string | null) => void;
  toggleFavoriteFolder: (id: string) => void;
  moveFolderToFolder: (folderId: string, targetFolderId: string | null, recordHistory?: boolean) => void;
  duplicateFolder: (folderId: string, targetParentId?: string | null) => Folder | null;

  // Actions - Items (Notes & Checklists)
  addItem: (data: {
    id?: string;
    title: string;
    type: ItemType;
    folderId: string | null;
    content?: string;
    checklistItems?: ChecklistItem[];
    color?: string;
    isFavorite?: boolean;
  }) => Item | null;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string, recordHistory?: boolean) => void;
  restoreItem: (id: string, recordHistory?: boolean) => void;
  permanentlyDeleteItem: (id: string) => void;
  toggleChecklistItem: (itemId: string, checkItemId: string) => void;
  toggleFavoriteItem: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null, recordHistory?: boolean) => void;
  duplicateItem: (noteId: string, targetFolderId?: string | null) => Item | null;

  // Workspace-Level Undo / Redo
  workspaceUndoStack: WorkspaceAction[];
  workspaceRedoStack: WorkspaceAction[];
  pushWorkspaceAction: (action: Omit<WorkspaceAction, 'id'>) => void;
  undoWorkspaceAction: () => boolean;
  redoWorkspaceAction: () => boolean;

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

  // Network Sync & Hydration
  fetchWorkspaceData: () => Promise<void>;
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
      workspaceUndoStack: [],
      workspaceRedoStack: [],

      fetchWorkspaceData: async () => {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('noteeye_auth_token')
            : null;
        if (!token) return;

        // Never apply a pull while writes are in flight: the server snapshot would be stale
        if (useSyncStore.getState().pending > 0) return;

        try {
          // No per-request catch: if any request fails we throw and keep local state untouched
          const [activeNotes, trashedNotes, activeFolders, trashedFolders] =
            await Promise.all([
              notesApi.getAll(),
              notesApi.getAll({ isTrash: true }),
              foldersApi.getAll(),
              foldersApi.getAll({ isTrash: true }),
            ]);
          if (useSyncStore.getState().pending > 0) return;

          const combinedNotes = [
            ...(Array.isArray(activeNotes) ? activeNotes : []),
            ...(Array.isArray(trashedNotes) ? trashedNotes : []),
          ];
          const combinedFolders = [
            ...(Array.isArray(activeFolders) ? activeFolders : []),
            ...(Array.isArray(trashedFolders) ? trashedFolders : []),
          ];

          // Deduplicate notes by ID
          const notesMap = new Map<string, any>();
          for (const n of combinedNotes) {
            const raw = n as any;
            const id = raw.id || raw._id;
            if (id) notesMap.set(id, n);
          }

          // Deduplicate folders by ID
          const foldersMap = new Map<string, any>();
          for (const f of combinedFolders) {
            const raw = f as any;
            const id = raw.id || raw._id;
            if (id) foldersMap.set(id, f);
          }

          const normalizedItems: Item[] = Array.from(notesMap.values()).map(
            (sn: any) => ({
              id: sn.id || sn._id,
              userId: sn.userId,
              title: sn.title || 'Untitled Note',
              body: sn.body || sn.content || '',
              content: sn.content || sn.body || '',
              type: sn.type || 'note',
              checklistItems: (sn.checklistItems || []).map((ci: any) => ({
                id: ci.id || ci._id,
                text: ci.text || '',
                completed: ci.completed ?? ci.isCompleted ?? false,
                isCompleted: ci.isCompleted ?? ci.completed ?? false,
              })),
              color: sn.color || DEFAULT_PASTEL_COLOR,
              folderId: sn.folderId || null,
              isFavorite: Boolean(sn.isFavorite),
              isTrash: Boolean(sn.isTrash ?? sn.isDeleted),
              isDeleted: Boolean(sn.isDeleted ?? sn.isTrash),
              deletedAt: sn.deletedAt || null,
              createdAt: sn.createdAt || new Date().toISOString(),
              updatedAt: sn.updatedAt || new Date().toISOString(),
            })
          );

          const normalizedFolders: Folder[] = Array.from(foldersMap.values()).map(
            (sf: any) => ({
              id: sf.id || sf._id,
              userId: sf.userId,
              name: sf.name || 'Untitled Folder',
              parentId: sf.parentId || null,
              isFavorite: Boolean(sf.isFavorite),
              isTrash: Boolean(sf.isTrash ?? sf.isDeleted),
              isDeleted: Boolean(sf.isDeleted ?? sf.isTrash),
              deletedAt: sf.deletedAt || null,
              createdAt: sf.createdAt || new Date().toISOString(),
              updatedAt: sf.updatedAt || new Date().toISOString(),
            })
          );

          const currentItems = useNoteStore.getState().items;
          const mergedItems = normalizedItems.map((serverItem) => {
            const local = currentItems.find((i) => i.id === serverItem.id);
            if (local && local.updatedAt && serverItem.updatedAt) {
              const localTime = new Date(local.updatedAt).getTime();
              const serverTime = new Date(serverItem.updatedAt).getTime();
              if (localTime > serverTime) {
                return local;
              }
            }
            return serverItem;
          });

          // Retain any newly created items that are still syncing to server (< 45s old)
          const serverItemIds = new Set(normalizedItems.map((i) => i.id));
          const pendingItems = currentItems.filter(
            (i) => !serverItemIds.has(i.id) && Date.now() - new Date(i.createdAt).getTime() < 45000
          );

          const nextItems = [...mergedItems, ...pendingItems];
          const cur = useNoteStore.getState();
          // Only touch state when MongoDB data differs from what we already show
          if (
            JSON.stringify(nextItems) !== JSON.stringify(cur.items) ||
            JSON.stringify(normalizedFolders) !== JSON.stringify(cur.folders)
          ) {
            set({ items: nextItems, folders: normalizedFolders });
          }
        } catch (err: any) {
          console.warn('[useNoteStore] fetchWorkspaceData error:', err.message);
          throw err;
        }
      },

      addFolder: (name, parentId = null) => {
        const trimmed = name.trim();
        const finalName = trimmed || 'Untitled Folder';
        const targetParentId = parentId ?? null;
        const newFolderId = generateMongoId();

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
                  incomingId: newFolderId,
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
          id: newFolderId,
          userId: 'user-demo',
          name: finalName,
          parentId: targetParentId,
          isFavorite: false,
          isTrash: false,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((prevState) => ({
          folders: [...prevState.folders, newFolder],
          isFolderModalOpen: false,
        }));
        useUIStore.getState().showToast(`Created folder "${finalName}"`);
        notifySync();

        // Background network sync
        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi
            .create(finalName, targetParentId, newFolderId)
            .then((serverFolder) => {
              if (serverFolder?.id) {
                set((s) => ({
                  folders: s.folders.map((f) =>
                    f.id === newFolder.id ? { ...f, ...serverFolder, id: serverFolder.id } : f
                  ),
                }));
                notifySync();
              }
            })
            .catch((err) => console.warn('[useNoteStore] createFolder sync error:', err.message));
        }

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
        notifySync();

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi.rename(id, trimmed).catch((err) =>
            console.warn('[useNoteStore] renameFolder sync error:', err.message)
          );
        }
      },

      deleteFolder: (id, recordHistory = true) => {
        const folder = useNoteStore.getState().folders.find((f) => f.id === id);
        // Soft delete folder and cascade to all nested subfolders and items
        set((state) => {
          const targetIds = getAllDescendantFolderIds(state.folders, id);
          return {
            folders: state.folders.map((f) =>
              targetIds.has(f.id) ? { ...f, isDeleted: true, isTrash: true } : f
            ),
            items: state.items.map((i) =>
              i.folderId && targetIds.has(i.folderId) ? { ...i, isDeleted: true, isTrash: true } : i
            ),
          };
        });
        notifySync();

        if (folder) {
          if (recordHistory) {
            useNoteStore.getState().pushWorkspaceAction({
              description: `Moved folder "${folder.name}" to Trash`,
              undo: () => useNoteStore.getState().restoreFolder(id, false),
              redo: () => useNoteStore.getState().deleteFolder(id, false),
            });
          }
          useUIStore.getState().showToast(`Moved folder "${folder.name}" to Trash`);
        }

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi.softDelete(id).catch((err) =>
            console.warn('[useNoteStore] softDelete folder sync error:', err.message)
          );
        }
      },

      restoreFolder: (id, recordHistory = true) => {
        const folder = useNoteStore.getState().folders.find((f) => f.id === id);
        // Restore folder and cascade to all nested subfolders and items
        set((state) => {
          const targetIds = getAllDescendantFolderIds(state.folders, id);
          return {
            folders: state.folders.map((f) =>
              targetIds.has(f.id) ? { ...f, isDeleted: false, isTrash: false } : f
            ),
            items: state.items.map((i) =>
              i.folderId && targetIds.has(i.folderId) ? { ...i, isDeleted: false, isTrash: false } : i
            ),
          };
        });
        notifySync();

        if (folder) {
          if (recordHistory) {
            useNoteStore.getState().pushWorkspaceAction({
              description: `Restored folder "${folder.name}"`,
              undo: () => useNoteStore.getState().deleteFolder(id, false),
              redo: () => useNoteStore.getState().restoreFolder(id, false),
            });
          }
          useUIStore.getState().showToast(`Restored folder "${folder.name}"`);
        }

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi.restore(id).catch((err) =>
            console.warn('[useNoteStore] restore folder sync error:', err.message)
          );
        }
      },

      permanentlyDeleteFolder: (id) => {
        const folder = useNoteStore.getState().folders.find((f) => f.id === id);
        // Permanently delete folder, all nested subfolders, and items
        set((state) => {
          const targetIds = getAllDescendantFolderIds(state.folders, id);
          return {
            folders: state.folders.filter((f) => !targetIds.has(f.id)),
            items: state.items.filter((i) => !i.folderId || !targetIds.has(i.folderId)),
          };
        });
        notifySync();
        useUIStore.getState().showToast(`Permanently deleted folder "${folder?.name || 'folder'}"`);

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi.deleteForever(id).catch((err) =>
            console.warn('[useNoteStore] deleteForever folder sync error:', err.message)
          );
        }
      },

      setCurrentFolder: (folderId) => {
        set({ currentFolderId: folderId });
      },

      toggleFavoriteFolder: (id) => {
        const folder = useNoteStore.getState().folders.find((f) => f.id === id);
        if (!folder) return;
        const willBeFav = !folder.isFavorite;
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id
              ? {
                  ...f,
                  isFavorite: willBeFav,
                  updatedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
        notifySync();
        useUIStore.getState().showToast(willBeFav ? `Added folder "${folder.name}" to Favorites` : `Removed folder "${folder.name}" from Favorites`);

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi.toggleFavorite(id, willBeFav).catch((err) =>
            console.warn('[useNoteStore] toggleFavoriteFolder sync error:', err.message)
          );
        }
      },

      moveFolderToFolder: (folderId, targetFolderId, recordHistory = true) => {
        if (folderId === targetFolderId) return;
        const folder = useNoteStore.getState().folders.find((f) => f.id === folderId);
        if (!folder) return;
        const prevParentId = folder.parentId;
        const targetParent = targetFolderId ? useNoteStore.getState().folders.find((f) => f.id === targetFolderId) : null;
        const targetName = targetParent ? targetParent.name : 'Home';

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
        notifySync();

        if (recordHistory) {
          useNoteStore.getState().pushWorkspaceAction({
            description: `Moved folder "${folder.name}" to ${targetName}`,
            undo: () => useNoteStore.getState().moveFolderToFolder(folderId, prevParentId, false),
            redo: () => useNoteStore.getState().moveFolderToFolder(folderId, targetFolderId, false),
          });
        }
        useUIStore.getState().showToast(`Moved folder "${folder.name}" to ${targetName}`);

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi.update(folderId, { parentId: targetFolderId }).catch((err) =>
            console.warn('[useNoteStore] moveFolderToFolder sync error:', err.message)
          );
        }
      },

      duplicateFolder: (folderId, targetParentId) => {
        let createdFolder: Folder | null = null;
        const newFolderId = generateMongoId();
        set((state) => {
          const original = state.folders.find((f) => f.id === folderId);
          if (!original) return state;

          const now = new Date().toISOString();
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
            id: generateMongoId(),
            folderId: newFolderId,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
            checklistItems: note.checklistItems
              ? note.checklistItems.map((ci) => ({
                  ...ci,
                  id: generateMongoId(),
                }))
              : [],
          }));

          return {
            folders: [...state.folders, createdFolder],
            items: [...duplicatedNotes, ...state.items],
          };
        });
        notifySync();

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          foldersApi
            .duplicate(folderId, targetParentId)
            .then((serverFolder) => {
              if (serverFolder?.id && createdFolder) {
                set((s) => ({
                  folders: s.folders.map((f) =>
                    f.id === (createdFolder as Folder).id ? { ...f, ...serverFolder, id: serverFolder.id } : f
                  ),
                }));
                notifySync();
              }
            })
            .catch((err) => console.warn('[useNoteStore] duplicateFolder sync error:', err.message));
        }

        return createdFolder;
      },

      addItem: (data) => {
        const trimmedTitle = data.title.trim() || (data.type === 'checklist' ? 'Untitled Checklist' : 'Untitled Note');
        const targetFolderId = data.folderId ?? null;
        const newNoteId = data.id && /^[0-9a-fA-F]{24}$/.test(data.id) ? data.id : generateMongoId();

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
                  incomingId: newNoteId,
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
          id: newNoteId,
          userId: 'user-demo',
          title: trimmedTitle,
          body: data.content || '',
          content: data.content || '',
          type: data.type,
          folderId: targetFolderId,
          checklistItems: data.checklistItems?.map((ci) => ({
            ...ci,
            completed: ci.completed ?? ci.isCompleted ?? false,
            isCompleted: ci.isCompleted ?? ci.completed ?? false,
          })) || [],
          color: data.color || DEFAULT_PASTEL_COLOR,
          isTrash: false,
          isDeleted: false,
          deletedAt: null,
          isFavorite: Boolean(data.isFavorite),
          createdAt: now,
          updatedAt: now,
        };
        set((prevState) => ({
          items: [newItem, ...prevState.items],
          isNoteModalOpen: false,
          editingItem: null,
        }));
        notifySync();

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .create({
              id: newNoteId,
              title: trimmedTitle,
              body: data.content || '',
              type: data.type,
              checklistItems: newItem.checklistItems,
              color: newItem.color,
              folderId: targetFolderId,
              isFavorite: newItem.isFavorite,
            })
            .then((serverNote) => {
              if (serverNote?.id) {
                set((s) => ({
                  items: s.items.map((i) =>
                    i.id === newItem.id ? { ...i, ...serverNote, id: serverNote.id } : i
                  ),
                }));
                notifySync();
              }
            })
            .catch((err) => console.warn('[useNoteStore] addItem sync error:', err.message));
        }

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
        notifySync();

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          const apiUpdates: Partial<Item> = { ...updates };
          if (updates.content !== undefined && updates.body === undefined) {
            apiUpdates.body = updates.content;
          }
          notesApi
            .update(id, apiUpdates)
            .then((serverNote) => {
              if (serverNote?.id) {
                set((s) => ({
                  items: s.items.map((i) =>
                    i.id === id ? { ...i, ...serverNote, id: serverNote.id } : i
                  ),
                }));
                notifySync();
              }
            })
            .catch((err) => console.warn('[useNoteStore] updateItem sync error:', err.message));
        }
      },

      deleteItem: (id, recordHistory = true) => {
        const item = useNoteStore.getState().items.find((i) => i.id === id);
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, isDeleted: true, isTrash: true } : i)),
          isNoteModalOpen: false,
          editingItem: null,
        }));
        notifySync();

        if (item) {
          if (recordHistory) {
            useNoteStore.getState().pushWorkspaceAction({
              description: `Moved "${item.title}" to Trash`,
              undo: () => useNoteStore.getState().restoreItem(id, false),
              redo: () => useNoteStore.getState().deleteItem(id, false),
            });
          }
          useUIStore.getState().showToast(`Moved "${item.title}" to Trash`);
        }

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .softDelete(id)
            .catch((err) => console.warn('[useNoteStore] softDelete sync error:', err.message));
        }
      },

      restoreItem: (id, recordHistory = true) => {
        const item = useNoteStore.getState().items.find((i) => i.id === id);
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, isDeleted: false, isTrash: false } : i)),
        }));
        notifySync();

        if (item) {
          if (recordHistory) {
            useNoteStore.getState().pushWorkspaceAction({
              description: `Restored "${item.title}"`,
              undo: () => useNoteStore.getState().deleteItem(id, false),
              redo: () => useNoteStore.getState().restoreItem(id, false),
            });
          }
          useUIStore.getState().showToast(`Restored "${item.title}"`);
        }

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .restore(id)
            .catch((err) => console.warn('[useNoteStore] restore sync error:', err.message));
        }
      },

      permanentlyDeleteItem: (id) => {
        const item = useNoteStore.getState().items.find((i) => i.id === id);
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
        notifySync();
        useUIStore.getState().showToast(`Permanently deleted "${item?.title || 'item'}"`);

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .deleteForever(id)
            .catch((err) => console.warn('[useNoteStore] deleteForever sync error:', err.message));
        }
      },

      toggleChecklistItem: (itemId, checkItemId) => {
        let updatedList: ChecklistItem[] = [];
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId || !item.checklistItems) return item;
            updatedList = item.checklistItems.map((ci) =>
              ci.id === checkItemId
                ? {
                    ...ci,
                    isCompleted: !ci.isCompleted,
                    completed: !ci.completed,
                  }
                : ci
            );
            return {
              ...item,
              updatedAt: new Date().toISOString(),
              checklistItems: updatedList,
            };
          }),
        }));
        notifySync();

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token') && updatedList.length > 0) {
          notesApi
            .update(itemId, { checklistItems: updatedList })
            .catch((err) => console.warn('[useNoteStore] toggleChecklistItem sync error:', err.message));
        }
      },

      toggleFavoriteItem: (id) => {
        const item = useNoteStore.getState().items.find((i) => i.id === id);
        if (!item) return;
        const willBeFav = !item.isFavorite;
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  isFavorite: willBeFav,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
        }));
        notifySync();
        useUIStore.getState().showToast(willBeFav ? `Added "${item.title}" to Favorites` : `Removed "${item.title}" from Favorites`);

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .update(id, { isFavorite: willBeFav })
            .catch((err) => console.warn('[useNoteStore] toggleFavoriteItem sync error:', err.message));
        }
      },

      moveNoteToFolder: (noteId, folderId, recordHistory = true) => {
        const item = useNoteStore.getState().items.find((i) => i.id === noteId);
        if (!item) return;
        const prevFolderId = item.folderId;
        const targetFolder = folderId ? useNoteStore.getState().folders.find((f) => f.id === folderId) : null;
        const targetName = targetFolder ? targetFolder.name : 'Home';

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
        notifySync();

        if (recordHistory) {
          useNoteStore.getState().pushWorkspaceAction({
            description: `Moved "${item.title}" to ${targetName}`,
            undo: () => useNoteStore.getState().moveNoteToFolder(noteId, prevFolderId, false),
            redo: () => useNoteStore.getState().moveNoteToFolder(noteId, folderId, false),
          });
        }
        useUIStore.getState().showToast(`Moved "${item.title}" to ${targetName}`);

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .update(noteId, { folderId })
            .catch((err) => console.warn('[useNoteStore] moveNoteToFolder sync error:', err.message));
        }
      },

      duplicateItem: (noteId, targetFolderId) => {
        let createdItem: Item | null = null;
        const newDuplicateId = generateMongoId();
        set((state) => {
          const original = state.items.find((i) => i.id === noteId);
          if (!original) return state;

          const now = new Date().toISOString();
          createdItem = {
            ...original,
            id: newDuplicateId,
            title: `${original.title} (Copy)`,
            folderId: targetFolderId !== undefined ? targetFolderId : original.folderId,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
            checklistItems: original.checklistItems
              ? original.checklistItems.map((ci) => ({
                  ...ci,
                  id: generateMongoId(),
                }))
              : [],
          };

          return {
            items: [createdItem, ...state.items],
          };
        });
        notifySync();

        if (createdItem) {
          useUIStore.getState().showToast(`Duplicated "${(createdItem as Item).title}"`);
        }

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .duplicate(noteId, targetFolderId)
            .then((serverNote) => {
              if (serverNote?.id && createdItem) {
                set((s) => ({
                  items: s.items.map((i) =>
                    i.id === (createdItem as Item).id ? { ...i, ...serverNote, id: serverNote.id } : i
                  ),
                }));
                notifySync();
              }
            })
            .catch((err) => console.warn('[useNoteStore] duplicateItem sync error:', err.message));
        }

        return createdItem;
      },

      pushWorkspaceAction: (action) => {
        const record: WorkspaceAction = {
          ...action,
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
        const past = useNoteStore.getState().workspaceUndoStack;
        set({
          workspaceUndoStack: [...past.slice(-49), record],
          workspaceRedoStack: [],
        });
      },

      undoWorkspaceAction: () => {
        const { workspaceUndoStack, workspaceRedoStack } = useNoteStore.getState();
        if (workspaceUndoStack.length === 0) return false;
        const lastAction = workspaceUndoStack[workspaceUndoStack.length - 1];
        lastAction.undo();
        set({
          workspaceUndoStack: workspaceUndoStack.slice(0, -1),
          workspaceRedoStack: [...workspaceRedoStack, lastAction],
        });
        useUIStore.getState().showToast(`Undo: ${lastAction.description}`);
        return true;
      },

      redoWorkspaceAction: () => {
        const { workspaceUndoStack, workspaceRedoStack } = useNoteStore.getState();
        if (workspaceRedoStack.length === 0) return false;
        const nextAction = workspaceRedoStack[workspaceRedoStack.length - 1];
        nextAction.redo();
        set({
          workspaceUndoStack: [...workspaceUndoStack, nextAction],
          workspaceRedoStack: workspaceRedoStack.slice(0, -1),
        });
        useUIStore.getState().showToast(`Redo: ${nextAction.description}`);
        return true;
      },

      emptyTrash: () => {
        set((state) => ({
          folders: state.folders.filter((f) => !f.isDeleted && !f.isTrash),
          items: state.items.filter((i) => !i.isDeleted && !i.isTrash),
        }));
        notifySync();
        useUIStore.getState().showToast('Trash emptied');

        if (typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')) {
          notesApi
            .emptyTrash()
            .catch((err) => console.warn('[useNoteStore] emptyTrash sync error:', err.message));
        }
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
                          checklistItems: data?.checklistItems
                            ? data.checklistItems.map((ci) => ({
                                ...ci,
                                completed: ci.completed ?? ci.isCompleted ?? false,
                                isCompleted: ci.isCompleted ?? ci.completed ?? false,
                              }))
                            : i.checklistItems,
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
                        id: generateMongoId(),
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
                      const newFolderId = generateMongoId();
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
                    id: conflict.incomingId && /^[0-9a-fA-F]{24}$/.test(conflict.incomingId) ? conflict.incomingId : generateMongoId(),
                    userId: 'user-demo',
                    title: uniqueName,
                    type: data?.type || 'note',
                    folderId: conflict.targetFolderId,
                    body: data?.content || '',
                    content: data?.content || '',
                    checklistItems: data?.checklistItems?.map((ci) => ({
                      ...ci,
                      completed: ci.completed ?? ci.isCompleted ?? false,
                      isCompleted: ci.isCompleted ?? ci.completed ?? false,
                    })) || [],
                    color: data?.color || DEFAULT_PASTEL_COLOR,
                    isTrash: false,
                    isDeleted: false,
                    deletedAt: null,
                    isFavorite: Boolean(data?.isFavorite),
                    createdAt: now,
                    updatedAt: now,
                  };
                  updatedItems = [createdItem, ...updatedItems];
                  createdOrTargetId = createdItem.id;
                  createdOrTargetType = 'note';
                } else {
                  const createdFolder: Folder = {
                    id: conflict.incomingId && /^[0-9a-fA-F]{24}$/.test(conflict.incomingId) ? conflict.incomingId : generateMongoId(),
                    userId: 'user-demo',
                    name: uniqueName,
                    parentId: conflict.targetFolderId,
                    isFavorite: false,
                    isTrash: false,
                    isDeleted: false,
                    deletedAt: null,
                    createdAt: now,
                    updatedAt: now,
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
                        id: generateMongoId(),
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
                      const newFolderId = generateMongoId();
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
            notifySync();
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
                  const newFolderId = generateMongoId();
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
                    id: generateMongoId(),
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
                    id: generateMongoId(),
                    title: noteToMove.title,
                    folderId: targetFolderId,
                    createdAt: now,
                    updatedAt: now,
                    isFavorite: false,
                    checklistItems: noteToMove.checklistItems
                      ? noteToMove.checklistItems.map((ci) => ({ ...ci, id: generateMongoId() }))
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
            notifySync();
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

// Reset workspace content on logout. Pulling (login, focus, polling, cross-tab) is driven
// by TanStack Query in <WorkspaceSync />.
if (typeof window !== 'undefined') {
  window.addEventListener('noteeye:logout', () => {
    useNoteStore.getState().resetToDefault();
  });

  // Another tab mutated the workspace: ask the query layer to refetch once its write has landed
  syncChannel?.addEventListener('message', (event) => {
    if (event.data?.type === 'workspace_mutation' && localStorage.getItem('noteeye_auth_token')) {
      setTimeout(() => window.dispatchEvent(new CustomEvent('noteeye:refetch-workspace')), 1500);
    }
  });
}

