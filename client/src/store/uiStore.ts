import { create } from 'zustand';

export type ItemTargetType = 'note' | 'checklist' | 'folder';

export interface ClipboardEntry {
  type: 'note' | 'folder';
  id: string;
  name?: string;
}

export interface ClipboardItem {
  type: 'note' | 'folder';
  id: string;
  action: 'copy' | 'cut';
  name?: string;
}

export interface ClipboardState {
  items: ClipboardEntry[];
  action: 'copy' | 'cut';
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: 'canvas' | 'item';
  targetId?: string;
  targetType?: ItemTargetType;
}

interface UIStoreState {
  selectedItemId: string | null;
  selectedItemType: ItemTargetType | null;
  isDetailsPanelOpen: boolean;
  contextMenu: ContextMenuState | null;
  clipboard: ClipboardState | null;
  clipboardItem: ClipboardItem | null;
  toastMessage: string | null;

  // Multi-selection State & Actions
  selectedIds: Set<string>;
  isDraggingMulti: boolean;
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  toggleSelectId: (id: string) => void;
  clearMultiSelection: () => void;
  setIsDraggingMulti: (isDragging: boolean) => void;

  // Selection Actions
  setSelectedItem: (id: string | null, type?: ItemTargetType | null) => void;
  clearSelection: () => void;

  // Clipboard Actions
  copyItems: (items: ClipboardEntry[]) => void;
  cutItems: (items: ClipboardEntry[]) => void;
  copyItem: (type: 'note' | 'folder', id: string, name?: string) => void;
  cutItem: (type: 'note' | 'folder', id: string, name?: string) => void;
  clearClipboard: () => void;

  // Toast Actions
  showToast: (message: string) => void;
  hideToast: () => void;

  // Details Inspector Actions
  openDetailsPanel: () => void;
  closeDetailsPanel: () => void;
  toggleDetailsPanel: () => void;

  // Context Menu Actions
  openContextMenu: (
    coords: { x: number; y: number },
    type: 'canvas' | 'item',
    target?: { id: string; type: ItemTargetType }
  ) => void;
  closeContextMenu: () => void;
}

let toastTimer: any = null;

export const useUIStore = create<UIStoreState>((set) => ({
  selectedItemId: null,
  selectedItemType: null,
  selectedIds: new Set<string>(),
  isDraggingMulti: false,
  isDetailsPanelOpen: false,
  contextMenu: null,
  clipboard: null,
  clipboardItem: null,
  toastMessage: null,

  setSelectedIds: (ids) =>
    set((state) => ({
      selectedIds: typeof ids === 'function' ? ids(state.selectedIds) : ids,
    })),

  toggleSelectId: (id) =>
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

  setIsDraggingMulti: (isDragging) =>
    set({ isDraggingMulti: isDragging }),

  setSelectedItem: (id, type = null) =>
    set({
      selectedItemId: id,
      selectedItemType: type,
    }),

  clearSelection: () =>
    set({
      selectedItemId: null,
      selectedItemType: null,
      selectedIds: new Set<string>(),
      isDraggingMulti: false,
    }),

  copyItems: (entries) => {
    if (toastTimer) clearTimeout(toastTimer);
    if (!entries || entries.length === 0) return;
    const first = entries[0];
    const label =
      entries.length === 1
        ? first.name
          ? `"${first.name}"`
          : first.type === 'folder'
          ? 'Folder'
          : 'Note'
        : `${entries.length} items`;
    set({
      clipboard: { items: entries, action: 'copy' },
      clipboardItem: { type: first.type, id: first.id, action: 'copy', name: first.name },
      toastMessage: `${label} copied. Press Ctrl+V or right-click to paste.`,
    });
    toastTimer = setTimeout(() => set({ toastMessage: null }), 3500);
  },

  cutItems: (entries) => {
    if (toastTimer) clearTimeout(toastTimer);
    if (!entries || entries.length === 0) return;
    const first = entries[0];
    const label =
      entries.length === 1
        ? first.name
          ? `"${first.name}"`
          : first.type === 'folder'
          ? 'Folder'
          : 'Note'
        : `${entries.length} items`;
    set({
      clipboard: { items: entries, action: 'cut' },
      clipboardItem: { type: first.type, id: first.id, action: 'cut', name: first.name },
      toastMessage: `${label} cut. Press Ctrl+V or right-click to move here.`,
    });
    toastTimer = setTimeout(() => set({ toastMessage: null }), 3500);
  },

  copyItem: (type, id, name) => {
    useUIStore.getState().copyItems([{ type, id, name }]);
  },

  cutItem: (type, id, name) => {
    useUIStore.getState().cutItems([{ type, id, name }]);
  },

  clearClipboard: () => set({ clipboard: null, clipboardItem: null }),

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: message });
    toastTimer = setTimeout(() => set({ toastMessage: null }), 3500);
  },

  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: null });
  },

  openDetailsPanel: () => set({ isDetailsPanelOpen: true }),
  closeDetailsPanel: () => set({ isDetailsPanelOpen: false }),
  toggleDetailsPanel: () => set((state) => ({ isDetailsPanelOpen: !state.isDetailsPanelOpen })),

  openContextMenu: (coords, type, target) =>
    set({
      contextMenu: {
        isOpen: true,
        x: coords.x,
        y: coords.y,
        type,
        targetId: target?.id,
        targetType: target?.type,
      },
    }),

  closeContextMenu: () => set({ contextMenu: null }),
}));
