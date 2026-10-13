import { create } from 'zustand';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface SyncState {
  /** Number of write requests (POST/PUT/PATCH/DELETE) currently in flight to MongoDB */
  pending: number;
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  beginWrite: () => void;
  endWrite: (ok: boolean, error?: string) => void;
  markPulled: () => void;
  markPullFailed: (error: string) => void;
  resetToIdle: () => void;
}

let writeFailure: string | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const clearDismissTimer = () => {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
};

/**
 * Tracks whether the user's changes have been confirmed by MongoDB.
 * Features automatic 2.5-second dismissal from 'saved' back to 'idle'.
 */
export const useSyncStore = create<SyncState>((set, get) => ({
  pending: 0,
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  beginWrite: () => {
    clearDismissTimer();
    set((s) => ({ pending: s.pending + 1, status: 'saving', error: null }));
  },

  endWrite: (ok, error) => {
    if (!ok) writeFailure = error || 'Failed to save changes';
    set((s) => {
      const pending = Math.max(0, s.pending - 1);
      if (pending > 0) return { pending };

      if (writeFailure) {
        const msg = writeFailure;
        writeFailure = null;
        return { pending, status: 'error', error: msg };
      }

      // Schedule auto-dismiss to 'idle' after 2500ms
      clearDismissTimer();
      dismissTimer = setTimeout(() => {
        if (get().status === 'saved' && get().pending === 0) {
          set({ status: 'idle' });
        }
      }, 2500);

      return { pending, status: 'saved', lastSyncedAt: Date.now(), error: null };
    });
  },

  markPulled: () => {
    const s = get();
    if (s.pending > 0) return;
    // Do not overwrite an active write error with a routine pull result
    if (s.status === 'error' && s.error && !s.error.startsWith('Sync')) return;

    // Background pull only updates timestamp; doesn't force a visible 'saved' popup if idle
    if (s.status === 'idle') {
      set({ lastSyncedAt: Date.now(), error: null });
      return;
    }

    if (s.status === 'offline' || s.status === 'error') {
      // Reconnected and pull succeeded
      clearDismissTimer();
      dismissTimer = setTimeout(() => {
        if (get().status === 'saved' && get().pending === 0) {
          set({ status: 'idle' });
        }
      }, 2500);
      set({ status: 'saved', lastSyncedAt: Date.now(), error: null });
    }
  },

  markPullFailed: (error) => {
    const s = get();
    if (s.pending > 0) return;
    if (s.status === 'error' && s.error && !s.error.startsWith('Sync')) return;
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    clearDismissTimer();
    set({ status: offline ? 'offline' : 'error', error: `Sync failed · ${error}` });
  },

  resetToIdle: () => {
    clearDismissTimer();
    set({ status: 'idle' });
  },
}));
