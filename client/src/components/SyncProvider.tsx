import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CloudOff, Loader2, TriangleAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/useNoteStore';
import { useUserStore } from '../store/userStore';
import { useSyncStore } from '../store/syncStore';
import { userApi } from '../api';
import { flushOutboxQueue } from '../lib/offlineDb';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3_000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

// Smooth, responsive 3.5-second polling when tab is active
const POLL_MS = 3_500;

/**
 * Pulls the MongoDB source of truth into the local stores (workspace + profile).
 * Local state is only replaced when the database returned something different.
 */
const WorkspaceSync: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const workspace = useQuery({
    queryKey: ['workspace'],
    enabled: isAuthenticated,
    refetchInterval: () =>
      typeof document !== 'undefined' && document.hidden ? false : POLL_MS,
    queryFn: async () => {
      await useNoteStore.getState().fetchWorkspaceData();
      return Date.now();
    },
  });

  useQuery({
    queryKey: ['profile'],
    enabled: isAuthenticated,
    refetchInterval: () =>
      typeof document !== 'undefined' && document.hidden ? false : POLL_MS * 3,
    queryFn: async () => {
      const data = await userApi.getProfile();
      if (data?.user) {
        const current = useUserStore.getState().user;
        const next = {
          ...current,
          ...data.user,
          remainingRecoveryDays: data.remainingRecoveryDays ?? current.remainingRecoveryDays,
        };
        if (JSON.stringify(next) !== JSON.stringify(current)) {
          useUserStore.setState({ user: next });
        }
      }
      return Date.now();
    },
  });

  // Reflect pull results in the sync indicator
  useEffect(() => {
    if (workspace.isSuccess && workspace.dataUpdatedAt) useSyncStore.getState().markPulled();
  }, [workspace.isSuccess, workspace.dataUpdatedAt]);

  useEffect(() => {
    if (workspace.isError) {
      useSyncStore.getState().markPullFailed((workspace.error as Error)?.message || 'Sync failed');
    }
  }, [workspace.isError, workspace.errorUpdatedAt, workspace.error]);

  // Login / logout / cross-tab / window focus / reconnect => refresh immediately
  useEffect(() => {
    const refetch = () => {
      // Flush any queued mutations from offline/sleep first
      flushOutboxQueue(queryClient).catch(() => null);
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refetch();
      }
    };

    const clear = () => queryClient.clear();

    window.addEventListener('noteeye:login', refetch);
    window.addEventListener('noteeye:refetch-workspace', refetch);
    window.addEventListener('noteeye:logout', clear);
    window.addEventListener('online', refetch);
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('noteeye:login', refetch);
      window.removeEventListener('noteeye:refetch-workspace', refetch);
      window.removeEventListener('noteeye:logout', clear);
      window.removeEventListener('online', refetch);
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
};

/**
 * Centered Bottom Sync Pill
 * Suppressed inside NoteEditor (which has its own header indicator).
 * On browse screens, alerts ONLY for incoming cloud updates, offline state, or sync errors.
 */
export const SyncIndicator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const status = useSyncStore((s) => s.status);
  const error = useSyncStore((s) => s.error);

  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  useEffect(() => {
    const updatePath = () => {
      if (typeof window !== 'undefined') setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', updatePath);
    const interval = setInterval(updatePath, 400);
    return () => {
      window.removeEventListener('popstate', updatePath);
      clearInterval(interval);
    };
  }, []);

  // Suppress completely inside note editor (note editor has its own header pill)
  const isEditor = pathname.includes('/notes') || pathname.includes('/note/');
  if (!isAuthenticated || isEditor) return null;

  // Only show for cross-device incoming changes, errors, or offline (routine local writes save silently)
  const isVisible =
    status === 'loading_changes' ||
    status === 'loaded_changes' ||
    status === 'error' ||
    status === 'offline';

  const configMap: Record<
    string,
    { icon: React.ReactNode; text: string; cls: string }
  > = {
    loading_changes: {
      icon: <Loader2 size={13} className="animate-spin shrink-0 text-indigo-600" />,
      text: 'Updating from cloud...',
      cls: 'bg-indigo-50/95 text-indigo-700 border-indigo-200/80 shadow-md',
    },
    loaded_changes: {
      icon: <Check size={13} className="shrink-0 text-emerald-600 stroke-[3]" />,
      text: 'Updated from cloud',
      cls: 'bg-emerald-50/95 text-emerald-700 border-emerald-200/80 shadow-md',
    },
    error: {
      icon: <TriangleAlert size={13} className="shrink-0 text-[#B3261E]" />,
      text: error?.startsWith('Sync') ? error : `Not saved · ${error || 'Retry'}`,
      cls: 'bg-[#FCE8E6]/95 text-[#B3261E] border-rose-200/80 shadow-md',
    },
    offline: {
      icon: <CloudOff size={13} className="shrink-0 text-[#B06000]" />,
      text: 'Offline · Changes queued',
      cls: 'bg-[#FEF7E0]/95 text-[#B06000] border-amber-200/80 shadow-md',
    },
  };

  const cfg = configMap[status];

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      aria-live="polite"
      id="sync-indicator"
    >
      <AnimatePresence mode="wait">
        {isVisible && cfg && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md select-none ${cfg.cls}`}
          >
            {cfg.icon}
            <span className="truncate max-w-[70vw]">{cfg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <WorkspaceSync />
    <SyncIndicator />
  </QueryClientProvider>
);
