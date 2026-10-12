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
}

// A write failed during the current batch of requests, or a failed write is unresolved
let writeFailure: string | null = null;

/**
 * Tracks whether the user's changes have been confirmed by the database.
 * Fed by axios interceptors (writes) and the TanStack Query workspace poller (reads).
 */
export const useSyncStore = create<SyncState>((set, get) => ({
  pending: 0,
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  beginWrite: () => set((s) => ({ pending: s.pending + 1, status: 'saving', error: null })),

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
      return { pending, status: 'saved', lastSyncedAt: Date.now(), error: null };
    });
  },

  markPulled: () => {
    const s = get();
    if (s.pending > 0) return;
    // A failed save must stay visible until the next successful write
    if (s.status === 'error' && s.error && !s.error.startsWith('Sync')) return;
    set({ lastSyncedAt: Date.now(), status: 'saved', error: null });
  },

  markPullFailed: (error) => {
    const s = get();
    if (s.pending > 0) return;
    if (s.status === 'error' && s.error && !s.error.startsWith('Sync')) return;
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    set({ status: offline ? 'offline' : 'error', error: `Sync failed · ${error}` });
  },
}));
