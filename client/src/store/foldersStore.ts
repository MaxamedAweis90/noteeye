import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Folder } from '../types';
import { STARTER_FOLDERS } from '../types';
import { useUIStore } from './uiStore';
import { useNotesStore } from './notesStore';
import { foldersApi, type BreadcrumbItem } from '../api/foldersApi';

export type { BreadcrumbItem };

export interface FoldersStoreState {
  folders: Folder[];
  currentFolderId: string | null;
  isLoading: boolean;

  // Primary Actions
  createFolder: (name: string, parentId?: string | null) => Folder;
  renameFolder: (id: string, newName: string) => void;
  toggleFolderFavorite: (id: string) => void;
  softDeleteFolder: (id: string) => void;
  restoreFolder: (id: string) => void;
  deleteFolderForever: (id: string) => void;
  getBreadcrumbs: (folderId: string) => BreadcrumbItem[];

  // Navigation & Tree Helpers
  setCurrentFolder: (folderId: string | null) => void;
  getAllDescendantFolderIds: (rootId: string) => Set<string>;
  moveFolder: (folderId: string, targetParentId: string | null) => void;
  duplicateFolder: (folderId: string, targetParentId?: string | null) => Folder;

  // Server Network Sync & Hydration
  fetchFolders: () => Promise<void>;

  // Utility Actions
  setFolders: (folders: Folder[]) => void;
  resetFoldersToDefault: () => void;
}

/**
 * Traverses upwards via parentId from a given folderId to root, returning ordered breadcrumbs
 */
export const calculateBreadcrumbs = (
  allFolders: Folder[],
  folderId: string
): BreadcrumbItem[] => {
  const crumbs: BreadcrumbItem[] = [];
  let currId: string | null = folderId;
  const visited = new Set<string>();

  while (currId && !visited.has(currId)) {
    visited.add(currId);
    const found = allFolders.find((f) => f.id === currId);
    if (!found) break;

    crumbs.unshift({ id: found.id, name: found.name });
    currId = found.parentId;
  }

  return crumbs;
};

/**
 * Recursively retrieves the root folder id and all descendant subfolder ids
 */
export const getAllDescendantFolderIds = (
  allFolders: Folder[],
  rootId: string
): Set<string> => {
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

export const useFoldersStore = create<FoldersStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        folders: STARTER_FOLDERS,
        currentFolderId: null,
        isLoading: false,

        createFolder: (name, parentId = null) => {
          const now = new Date().toISOString();
          const trimmed = name.trim();
          const finalName = trimmed || 'Untitled Folder';
          const tempId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          const newFolder: Folder = {
            id: tempId,
            userId: 'user-demo',
            name: finalName,
            parentId: parentId ?? null,
            isFavorite: false,
            isTrash: false,
            isDeleted: false,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
          };

          // Optimistic local update
          set((state) => ({
            folders: [newFolder, ...state.folders],
          }));

          useUIStore.getState().showToast(`Created folder "${finalName}"`);

          // Background network sync
          foldersApi
            .create(finalName, parentId)
            .then((serverFolder) => {
              if (serverFolder && serverFolder.id) {
                set((state) => ({
                  folders: state.folders.map((f) =>
                    f.id === tempId ? { ...f, ...serverFolder } : f
                  ),
                }));
              }
            })
            .catch((err) => {
              console.warn('[foldersStore] Background create sync error (offline/cached):', err.message);
            });

          return newFolder;
        },

        renameFolder: (id, newName) => {
          const trimmed = newName.trim();
          if (!trimmed) return;
          const now = new Date().toISOString();

          set((state) => ({
            folders: state.folders.map((f) =>
              f.id === id ? { ...f, name: trimmed, updatedAt: now } : f
            ),
          }));

          useUIStore.getState().showToast(`Renamed to "${trimmed}"`);

          // Background network sync
          foldersApi.rename(id, trimmed).catch((err) => {
            console.warn('[foldersStore] Background rename sync error:', err.message);
          });
        },

        toggleFolderFavorite: (id) => {
          let updatedName = '';
          let nextFav = false;

          set((state) => ({
            folders: state.folders.map((f) => {
              if (f.id === id) {
                nextFav = !f.isFavorite;
                updatedName = f.name;
                return {
                  ...f,
                  isFavorite: nextFav,
                  updatedAt: new Date().toISOString(),
                };
              }
              return f;
            }),
          }));

          if (updatedName) {
            useUIStore
              .getState()
              .showToast(
                nextFav
                  ? `Added "${updatedName}" to favorites`
                  : `Removed "${updatedName}" from favorites`
              );
          }

          // Background network sync
          foldersApi.toggleFavorite(id, nextFav).catch((err) => {
            console.warn('[foldersStore] Background toggleFavorite sync error:', err.message);
          });
        },

        softDeleteFolder: (id) => {
          const now = new Date().toISOString();
          const state = get();
          const allDescendantIds = getAllDescendantFolderIds(state.folders, id);
          const target = state.folders.find((f) => f.id === id);

          // Soft-delete folder and all subfolders locally
          set((s) => ({
            folders: s.folders.map((f) =>
              allDescendantIds.has(f.id)
                ? {
                    ...f,
                    isTrash: true,
                    isDeleted: true,
                    deletedAt: now,
                    updatedAt: now,
                  }
                : f
            ),
          }));

          // Cascade soft-delete to notes inside these folders
          useNotesStore.getState().softDeleteNotesInFolders(allDescendantIds);

          if (target) {
            useUIStore.getState().showToast(`Moved folder "${target.name}" to Trash`);
          }

          // Background network sync
          foldersApi.softDelete(id).catch((err) => {
            console.warn('[foldersStore] Background softDelete sync error:', err.message);
          });
        },

        restoreFolder: (id) => {
          const now = new Date().toISOString();
          const state = get();
          const allDescendantIds = getAllDescendantFolderIds(state.folders, id);
          const target = state.folders.find((f) => f.id === id);

          // Restore folder and all subfolders locally
          set((s) => ({
            folders: s.folders.map((f) =>
              allDescendantIds.has(f.id)
                ? {
                    ...f,
                    isTrash: false,
                    isDeleted: false,
                    deletedAt: null,
                    updatedAt: now,
                  }
                : f
            ),
          }));

          // Cascade restore to notes inside these folders
          useNotesStore.getState().restoreNotesInFolders(allDescendantIds);

          if (target) {
            useUIStore.getState().showToast(`Restored folder "${target.name}"`);
          }

          // Background network sync
          foldersApi.restore(id).catch((err) => {
            console.warn('[foldersStore] Background restore sync error:', err.message);
          });
        },

        deleteFolderForever: (id) => {
          const state = get();
          const allDescendantIds = getAllDescendantFolderIds(state.folders, id);
          const target = state.folders.find((f) => f.id === id);

          // Permanently remove folder and subfolders locally
          set((s) => ({
            folders: s.folders.filter((f) => !allDescendantIds.has(f.id)),
          }));

          // Cascade permanent deletion to notes inside these folders
          useNotesStore.getState().deleteNotesInFoldersForever(allDescendantIds);

          if (target) {
            useUIStore.getState().showToast(`Deleted folder "${target.name}" forever`);
          }

          // Background network sync
          foldersApi.deleteForever(id).catch((err) => {
            console.warn('[foldersStore] Background deleteForever sync error:', err.message);
          });
        },

        getBreadcrumbs: (folderId: string) => {
          return calculateBreadcrumbs(get().folders, folderId);
        },

        setCurrentFolder: (folderId) => {
          set({ currentFolderId: folderId });
        },

        getAllDescendantFolderIds: (rootId: string) => {
          return getAllDescendantFolderIds(get().folders, rootId);
        },

        moveFolder: (folderId, targetParentId) => {
          const state = get();
          const descendants = getAllDescendantFolderIds(state.folders, folderId);
          if (targetParentId && descendants.has(targetParentId)) {
            useUIStore
              .getState()
              .showToast('Cannot move a folder into itself or its subfolder');
            return;
          }

          set((s) => ({
            folders: s.folders.map((f) =>
              f.id === folderId
                ? {
                    ...f,
                    parentId: targetParentId,
                    updatedAt: new Date().toISOString(),
                  }
                : f
            ),
          }));

          // Background network sync
          foldersApi.update(folderId, { parentId: targetParentId }).catch((err) => {
            console.warn('[foldersStore] Background moveFolder sync error:', err.message);
          });
        },

        duplicateFolder: (folderId, targetParentId) => {
          const state = get();
          const source = state.folders.find((f) => f.id === folderId);
          if (!source) {
            throw new Error(`Folder with id ${folderId} not found.`);
          }

          const now = new Date().toISOString();
          const finalParentId =
            targetParentId !== undefined ? targetParentId : source.parentId;
          const copyName = `${source.name} (Copy)`;
          const tempId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          const newFolder: Folder = {
            ...source,
            id: tempId,
            name: copyName,
            parentId: finalParentId,
            isTrash: false,
            isDeleted: false,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
          };

          set((s) => ({
            folders: [newFolder, ...s.folders],
          }));

          useUIStore.getState().showToast(`Duplicated folder "${source.name}"`);

          // Background network sync
          foldersApi
            .duplicate(folderId, finalParentId)
            .then((serverFolder) => {
              if (serverFolder && serverFolder.id) {
                set((s) => ({
                  folders: s.folders.map((f) =>
                    f.id === tempId ? { ...f, ...serverFolder } : f
                  ),
                }));
              }
            })
            .catch((err) => {
              console.warn('[foldersStore] Background duplicate sync error:', err.message);
            });

          return newFolder;
        },

        fetchFolders: async () => {
          set({ isLoading: true });
          try {
            const serverFolders = await foldersApi.getAll();
            if (Array.isArray(serverFolders)) {
              set({ folders: serverFolders });
            }
          } catch (err: any) {
            console.warn(
              '[foldersStore] Fetch folders error (relying on persisted cache):',
              err.message
            );
          } finally {
            set({ isLoading: false });
          }
        },

        setFolders: (folders) => set({ folders }),

        resetFoldersToDefault: () => set({ folders: STARTER_FOLDERS }),
      }),
      {
        name: 'noteeye_folders_store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ folders: state.folders }),
      }
    ),
    { name: 'FoldersStore' }
  )
);

// Reset folders to default starter content on logout or fetch on login
if (typeof window !== 'undefined') {
  window.addEventListener('noteeye:logout', () => {
    useFoldersStore.getState().resetFoldersToDefault();
  });
  window.addEventListener('noteeye:login', () => {
    useFoldersStore.getState().fetchFolders();
  });
}
