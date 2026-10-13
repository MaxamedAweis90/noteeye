import type { QueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

const DB_NAME = 'noteeye_offline_db';
const DB_VERSION = 1;

export interface OutboxItem {
  id: string;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: unknown;
  createdAt: number;
  retryCount: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('outbox_queue')) {
        const outboxStore = db.createObjectStore('outbox_queue', { keyPath: 'id' });
        outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Adds a mutation to the persistent offline outbox queue
 */
export async function addToOutbox(
  item: Omit<OutboxItem, 'id' | 'createdAt' | 'retryCount'> & { id?: string }
): Promise<string> {
  try {
    const db = await openDb();
    const id = item.id || `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fullItem: OutboxItem = {
      ...item,
      id,
      createdAt: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox_queue', 'readwrite');
      const store = tx.objectStore('outbox_queue');
      const req = store.put(fullItem);
      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('noteeye:outbox-updated'));
        resolve(id);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[OfflineDB] Failed to add to outbox:', err);
    throw err;
  }
}

/**
 * Returns all pending outbox queue mutations
 */
export async function getPendingOutbox(): Promise<OutboxItem[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction('outbox_queue', 'readonly');
      const store = tx.objectStore('outbox_queue');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as OutboxItem[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Removes an item from the outbox after successful sync or permanent client error
 */
export async function removeOutboxItem(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction('outbox_queue', 'readwrite');
      const store = tx.objectStore('outbox_queue');
      const req = store.delete(id);
      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('noteeye:outbox-updated'));
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[OfflineDB] Failed to remove outbox item:', id, err);
  }
}

let isFlushing = false;

/**
 * Flushes all pending outbox mutations to MongoDB in chronological order
 */
export async function flushOutboxQueue(
  queryClient?: QueryClient
): Promise<{ synced: number; failed: number }> {
  if (isFlushing) return { synced: 0, failed: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  isFlushing = true;
  window.dispatchEvent(new CustomEvent('noteeye:sync-status', { detail: { isSyncing: true } }));

  let synced = 0;
  let failed = 0;

  try {
    const items = await getPendingOutbox();
    if (items.length === 0) {
      return { synced: 0, failed: 0 };
    }

    // Process items chronologically
    items.sort((a, b) => a.createdAt - b.createdAt);

    for (const item of items) {
      try {
        const response = await apiClient.request({
          url: item.endpoint,
          method: item.method,
          data: item.payload,
        });

        if (response.status >= 200 && response.status < 300) {
          await removeOutboxItem(item.id);
          synced++;
        } else {
          failed++;
          break;
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status >= 400 && status < 500) {
          // Drop invalid client errors (e.g. deleted resource) so queue is not blocked
          console.warn('[OfflineDB] Dropping invalid outbox item:', item, status);
          await removeOutboxItem(item.id);
          failed++;
        } else {
          // 5xx Server error or offline again - break and retry later
          failed++;
          break;
        }
      }
    }

    if (synced > 0 && queryClient) {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    }
  } finally {
    isFlushing = false;
    window.dispatchEvent(
      new CustomEvent('noteeye:sync-status', { detail: { isSyncing: false, synced, failed } })
    );
  }

  return { synced, failed };
}
