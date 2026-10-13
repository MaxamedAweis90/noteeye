import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { ClipboardItem } from '../types';

export type ItemTargetType = 'note' | 'checklist' | 'folder';

export interface ContextMenuTarget {
  type: 'note' | 'folder' | 'canvas';
  id?: string;
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  target: ContextMenuTarget;
  // Backward compatibility fields
  type?: 'canvas' | 'item';
  targetId?: string;
  targetType?: ItemTargetType;
}

export interface DeleteAlertItem {
  type: 'note' | 'folder';
  id: string;
  name?: string;
}

export interface ClipboardState {
  items: Array<{ type: 'note' | 'folder'; id: string; name?: string }>;
  action: 'copy' | 'cut';
}

export interface UIStoreState {
  // Modals
  isQuickEditOpen: boolean;
  quickEditNoteId: string | null;
  isFolderModalOpen: boolean;
  editingFolderId: string | null;
  isDeleteAlertOpen: boolean;
  itemToDelete: DeleteAlertItem | null;
  isNoteModalOpen: boolean;
  noteModalType: 'note' | 'checklist';
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  isSessionsOpen: boolean;
  activeSettingsSection: string | null;

  // Inspector Panel
  selectedItem: { type: 'note' | 'folder'; id: string } | null;
  isDetailsPanelOpen: boolean;

  // Context Menu
  contextMenu: ContextMenuState | null;

  // Search & Filter
  searchQuery: string;
  recentSearches: string[];

  // Clipboard
  clipboard: ClipboardItem;
  clipboardState: ClipboardState | null; // For multi-entry clipboard

  // Multi-selection State
  selectedIds: Set<string>;
  isDraggingMulti: boolean;

  // Action Feedback Toast
  toastMessage: string | null;

  // Backward Compatibility Aliases for components
  selectedItemId: string | null;
  selectedItemType: ItemTargetType | null;
  clipboardItem: ClipboardItem | null;

  // Actions - Modals
  openQuickEdit: (noteId: string) => void;
  closeQuickEdit: () => void;
  openFolderModal: (folderId?: string | null) => void;
  closeFolderModal: () => void;
  openDeleteDialog: (type: 'note' | 'folder', id: string, name?: string) => void;
  closeDeleteDialog: () => void;
  openNoteModal: (type?: 'note' | 'checklist') => void;
  closeNoteModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  openSettingsModal: (initialSection?: string) => void;
  closeSettingsModal: () => void;
  openSessionsModal: () => void;
  closeSessionsModal: () => void;

  // Actions - Selection & Inspector
  selectItem: (type: 'note' | 'folder', id: string) => void;
  setSelectedItem: (id: string | null, type?: ItemTargetType | null) => void;
  clearSelection: () => void;
  toggleDetailsPanel: (isOpen?: boolean) => void;
  openDetailsPanel: () => void;
  closeDetailsPanel: () => void;

  // Actions - Context Menus
  openContextMenu: (
    coordsOrX: { x: number; y: number } | number,
    yOrType?: number | 'canvas' | 'item',
    target?: ContextMenuTarget | { id: string; type: ItemTargetType }
  ) => void;
  closeContextMenu: () => void;

  // Actions - Search & Recent Searches
  setSearchQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;

  // Actions - Clipboard
  copyItem: (type: 'note' | 'folder', id: string, name?: string) => void;
  cutItem: (type: 'note' | 'folder', id: string, name?: string) => void;
  copyItems: (items: Array<{ type: 'note' | 'folder'; id: string; name?: string }>) => void;
  cutItems: (items: Array<{ type: 'note' | 'folder'; id: string; name?: string }>) => void;
  clearClipboard: () => void;

  // Actions - Multi-selection
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  toggleSelectId: (id: string) => void;
  clearMultiSelection: () => void;
  setIsDraggingMulti: (isDragging: boolean) => void;

  // Actions - Toast
  showToast: (message: string) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial Modal States
        isQuickEditOpen: false,
        quickEditNoteId: null,
        isFolderModalOpen: false,
        editingFolderId: null,
        isDeleteAlertOpen: false,
        itemToDelete: null,
        isNoteModalOpen: false,
        noteModalType: 'note',
        isProfileOpen: false,
        isSettingsOpen: false,
        isSessionsOpen: false,
        activeSettingsSection: null,

        // Initial Inspector & Selection
        selectedItem: null,
        isDetailsPanelOpen: false,
        selectedItemId: null,
        selectedItemType: null,

        // Context Menu
        contextMenu: null,

        // Search
        searchQuery: '',
        recentSearches: [],

        // Clipboard
        clipboard: null,
        clipboardState: null,
        clipboardItem: null,

        // Multi-selection
        selectedIds: new Set<string>(),
        isDraggingMulti: false,

        // Toast
        toastMessage: null,

        // Modal Actions
        openQuickEdit: (noteId: string) =>
          set({
            isQuickEditOpen: true,
            quickEditNoteId: noteId,
          }),

        closeQuickEdit: () =>
          set({
            isQuickEditOpen: false,
            quickEditNoteId: null,
          }),

        openFolderModal: (folderId = null) =>
          set({
            isFolderModalOpen: true,
            editingFolderId: folderId,
          }),

        closeFolderModal: () =>
          set({
            isFolderModalOpen: false,
            editingFolderId: null,
          }),

        openDeleteDialog: (type: 'note' | 'folder', id: string, name?: string) =>
          set({
            isDeleteAlertOpen: true,
            itemToDelete: { type, id, name },
          }),

        closeDeleteDialog: () =>
          set({
            isDeleteAlertOpen: false,
            itemToDelete: null,
          }),

        openNoteModal: (type = 'note') =>
          set({
            isNoteModalOpen: true,
            noteModalType: type,
          }),

        closeNoteModal: () =>
          set({
            isNoteModalOpen: false,
          }),

        openProfileModal: () =>
          set({
            isProfileOpen: true,
            isSettingsOpen: false,
            isSessionsOpen: false,
          }),

        closeProfileModal: () =>
          set({
            isProfileOpen: false,
          }),

        openSettingsModal: (initialSection?: string) =>
          set({
            isSettingsOpen: true,
            isProfileOpen: false,
            isSessionsOpen: false,
            activeSettingsSection: initialSection || null,
          }),

        closeSettingsModal: () =>
          set({
            isSettingsOpen: false,
            activeSettingsSection: null,
          }),

        openSessionsModal: () =>
          set({
            isSessionsOpen: true,
            isProfileOpen: false,
            isSettingsOpen: false,
          }),

        closeSessionsModal: () =>
          set({
            isSessionsOpen: false,
          }),

        // Selection Actions
        selectItem: (type: 'note' | 'folder', id: string) =>
          set({
            selectedItem: { type, id },
            selectedItemId: id,
            selectedItemType: type,
          }),

        setSelectedItem: (id, type = null) =>
          set({
            selectedItemId: id,
            selectedItemType: type,
            selectedItem: id && type && (type === 'note' || type === 'folder') ? { type, id } : null,
          }),

        clearSelection: () =>
          set({
            selectedItem: null,
            selectedItemId: null,
            selectedItemType: null,
            selectedIds: new Set<string>(),
            isDraggingMulti: false,
          }),

        toggleDetailsPanel: (isOpen) =>
          set((state) => ({
            isDetailsPanelOpen: isOpen !== undefined ? isOpen : !state.isDetailsPanelOpen,
          })),

        openDetailsPanel: () => set({ isDetailsPanelOpen: true }),
        closeDetailsPanel: () => set({ isDetailsPanelOpen: false }),

        // Context Menu Action (Supports dual signatures for backward compatibility)
        openContextMenu: (coordsOrX, yOrType, target) => {
          let x = 0;
          let y = 0;
          let normalizedTarget: ContextMenuTarget = { type: 'canvas' };

          if (typeof coordsOrX === 'object') {
            x = coordsOrX.x;
            y = coordsOrX.y;
            const targetType = (yOrType as 'canvas' | 'item') === 'canvas' ? 'canvas' : 'note';
            if (target && 'id' in target && 'type' in target) {
              const mappedType = target.type === 'folder' ? 'folder' : 'note';
              normalizedTarget = { type: mappedType, id: target.id };
            } else {
              normalizedTarget = { type: targetType };
            }
          } else {
            x = coordsOrX;
            y = typeof yOrType === 'number' ? yOrType : 0;
            if (target && 'type' in target) {
              normalizedTarget = target as ContextMenuTarget;
            }
          }

          set({
            contextMenu: {
              isOpen: true,
              x,
              y,
              target: normalizedTarget,
              type: normalizedTarget.type === 'canvas' ? 'canvas' : 'item',
              targetId: normalizedTarget.id,
              targetType: normalizedTarget.type === 'folder' ? 'folder' : 'note',
            },
          });
        },

        closeContextMenu: () => set({ contextMenu: null }),

        // Search Actions
        setSearchQuery: (query: string) => set({ searchQuery: query }),

        addRecentSearch: (query: string) => {
          const trimmed = query.trim();
          if (!trimmed) return;
          set((state) => {
            const filtered = state.recentSearches.filter(
              (s) => s.toLowerCase() !== trimmed.toLowerCase()
            );
            return {
              recentSearches: [trimmed, ...filtered].slice(0, 10),
            };
          });
        },

        removeRecentSearch: (query: string) =>
          set((state) => ({
            recentSearches: state.recentSearches.filter(
              (s) => s.toLowerCase() !== query.toLowerCase()
            ),
          })),

        // Clipboard Actions
        copyItem: (type, id, name) => {
          get().copyItems([{ type, id, name }]);
        },

        cutItem: (type, id, name) => {
          get().cutItems([{ type, id, name }]);
        },

        copyItems: (items) => {
          if (!items || items.length === 0) return;
          const first = items[0];
          const clipItem: ClipboardItem = {
            type: first.type,
            id: first.id,
            action: 'copy',
            name: first.name,
          };
          const label =
            items.length === 1
              ? first.name
                ? `"${first.name}"`
                : first.type === 'folder'
                ? 'Folder'
                : 'Note'
              : `${items.length} items`;

          set({
            clipboard: clipItem,
            clipboardItem: clipItem,
            clipboardState: { items, action: 'copy' },
          });
          get().showToast(`Copied ${label}`);
        },

        cutItems: (items) => {
          if (!items || items.length === 0) return;
          const first = items[0];
          const clipItem: ClipboardItem = {
            type: first.type,
            id: first.id,
            action: 'cut',
            name: first.name,
          };
          const label =
            items.length === 1
              ? first.name
                ? `"${first.name}"`
                : first.type === 'folder'
                ? 'Folder'
                : 'Note'
              : `${items.length} items`;

          set({
            clipboard: clipItem,
            clipboardItem: clipItem,
            clipboardState: { items, action: 'cut' },
          });
          get().showToast(`Cut ${label}`);
        },

        clearClipboard: () =>
          set({
            clipboard: null,
            clipboardItem: null,
            clipboardState: null,
          }),

        // Multi-selection Actions
        setSelectedIds: (ids) =>
          set((state) => ({
            selectedIds: typeof ids === 'function' ? ids(state.selectedIds) : ids,
          })),

        toggleSelectId: (id: string) =>
          set((state) => {
            const next = new Set(state.selectedIds);
            if (next.has(id)) {
              next.delete(id);
            } else {
              next.add(id);
            }
            return { selectedIds: next };
          }),

        clearMultiSelection: () =>
          set({
            selectedIds: new Set<string>(),
            isDraggingMulti: false,
          }),

        setIsDraggingMulti: (isDragging: boolean) =>
          set({ isDraggingMulti: isDragging }),

        // Toast Feedback Action
        showToast: (message: string) => {
          if (toastTimer) clearTimeout(toastTimer);
          set({ toastMessage: message });
          toastTimer = setTimeout(() => {
            set({ toastMessage: null });
          }, 3500);
        },

        hideToast: () => {
          if (toastTimer) clearTimeout(toastTimer);
          set({ toastMessage: null });
        },
      }),
      {
        name: 'noteeye_ui_store',
        storage: createJSONStorage(() => localStorage),
        // Persist only recent searches across page reloads
        partialize: (state) => ({
          recentSearches: state.recentSearches,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);
