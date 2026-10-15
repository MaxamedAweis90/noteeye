import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '../api/client';
import { flushOutboxQueue, getPendingOutbox } from '../lib/offlineDb';
import { isMarketingDomain } from '../utils/domain';

const OFFLINE_STORAGE_KEY = 'noteeye_is_offline';

function getStoredOffline(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    return false;
  }
  try {
    const val = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (val !== null) return val === 'true';
  } catch {}
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

function setStoredOffline(offline: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, offline ? 'true' : 'false');
  } catch {}
}

// Shared singleton state across all pages and components
let globalIsOffline = getStoredOffline();
let globalIsNetworkReconnected = false;
let globalIsChecking = false;
let globalIsSyncing = false;
let globalPendingCount = 0;

const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

/**
 * Perform a real network ping check to verify true internet and API reachability
 */
export async function pingConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const pingUrl = `${BASE_URL}/health`;
    const res = await fetch(pingUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.status === 200 || res.ok;
  } catch {
    // If /api/health fails or aborted, fallback to navigator.onLine check
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

/**
 * Authoritative boot/splash connectivity verification
 */
export async function verifyInitialConnection(): Promise<boolean> {
  const reachable = await pingConnection();
  if (reachable) {
    globalIsOffline = false;
    globalIsNetworkReconnected = false;
    setStoredOffline(false);
  } else {
    globalIsOffline = true;
    globalIsNetworkReconnected = false;
    setStoredOffline(true);
  }
  notifyAll();
  return reachable;
}

/**
 * Exportable helper: allows any failing query / API call to report network failure
 */
export async function reportNetworkFailure() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (!globalIsOffline) {
      globalIsOffline = true;
      globalIsNetworkReconnected = false;
      setStoredOffline(true);
      notifyAll();
    }
    return;
  }

  const reachable = await pingConnection();
  if (!reachable) {
    if (!globalIsOffline) {
      globalIsOffline = true;
      globalIsNetworkReconnected = false;
      setStoredOffline(true);
      notifyAll();
    }
  }
}

// Global browser event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    if (isMarketingDomain()) return;
    globalIsOffline = true;
    globalIsNetworkReconnected = false;
    setStoredOffline(true);
    notifyAll();
  });

  window.addEventListener('online', () => {
    if (isMarketingDomain()) return;
    if (globalIsOffline) {
      globalIsNetworkReconnected = true;
      notifyAll();
    }
  });

  // Re-verify network status when the tab or PWA is resumed from background
  document.addEventListener('visibilitychange', () => {
    if (isMarketingDomain()) return;
    if (document.visibilityState === 'visible') {
      pingConnection().then((reachable) => {
        if (!reachable) {
          if (!globalIsOffline) {
            globalIsOffline = true;
            globalIsNetworkReconnected = false;
            setStoredOffline(true);
            notifyAll();
          }
        } else {
          if (globalIsOffline) {
            globalIsNetworkReconnected = true;
            notifyAll();
          }
        }
      });
    }
  });

  window.addEventListener('noteeye:sync-status', (e: Event) => {
    const custom = e as CustomEvent<{ isSyncing: boolean }>;
    globalIsSyncing = Boolean(custom.detail?.isSyncing);
    notifyAll();
  });
}

export function useOnlineStatus() {
  const queryClient = useQueryClient();
  const [, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    listeners.add(onChange);

    // Initial check of outbox count
    getPendingOutbox()
      .then((items) => {
        globalPendingCount = items.length;
        notifyAll();
      })
      .catch(() => {});

    // Initial verification of real network reachability on boot / refresh
    verifyInitialConnection();

    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const retryConnection = useCallback(async (): Promise<boolean> => {
    globalIsChecking = true;
    notifyAll();

    const reachable = await pingConnection();

    globalIsChecking = false;

    if (reachable) {
      globalIsOffline = false;
      globalIsNetworkReconnected = false;
      setStoredOffline(false);
      notifyAll();

      try {
        await flushOutboxQueue(queryClient);
        const items = await getPendingOutbox();
        globalPendingCount = items.length;
      } catch {}

      queryClient.invalidateQueries();
      return true;
    } else {
      globalIsOffline = true;
      globalIsNetworkReconnected = false;
      setStoredOffline(true);
      notifyAll();
      return false;
    }
  }, [queryClient]);

  const syncNow = useCallback(async () => {
    if (globalIsOffline) return;
    return await flushOutboxQueue(queryClient);
  }, [queryClient]);

  return {
    isOnline: !globalIsOffline,
    isOffline: globalIsOffline,
    isNetworkReconnected: globalIsNetworkReconnected,
    isChecking: globalIsChecking,
    isSyncing: globalIsSyncing,
    pendingCount: globalPendingCount,
    retryConnection,
    syncNow,
  };
}
