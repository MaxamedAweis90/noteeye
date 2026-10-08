import { create } from 'zustand';

export type ItemTargetType = 'note' | 'checklist' | 'folder';

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

  // Selection Actions
  setSelectedItem: (id: string | null, type?: ItemTargetType | null) => void;
  clearSelection: () => void;

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

export const useUIStore = create<UIStoreState>((set) => ({
  selectedItemId: null,
  selectedItemType: null,
  isDetailsPanelOpen: false,
  contextMenu: null,

  setSelectedItem: (id, type = null) =>
    set({
      selectedItemId: id,
      selectedItemType: type,
    }),

  clearSelection: () =>
    set({
      selectedItemId: null,
      selectedItemType: null,
    }),

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
