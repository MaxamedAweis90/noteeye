import React, { useEffect } from 'react';
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
      staleTime: 5_000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const POLL_MS = 10_000;

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
      typeof document !== 'undefined' && document.hidden ? false : POLL_MS * 2,
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

/** Small animated pill telling the user when changes are saving and saved, then self-hiding. */
export const SyncIndicator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const status = useSyncStore((s) => s.status);
  const error = useSyncStore((s) => s.error);

  if (!isAuthenticated) return null;

  const isVisible = status === 'saving' || status === 'saved' || status === 'error' || status === 'offline';

  return (
    <div className="fixed bottom-20 md:bottom-5 right-5 z-40 pointer-events-none" aria-live="polite" id="sync-indicator">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-md border border-black/5 select-none ${
              status === 'saving'
                ? 'bg-[#E8F0FE] text-[#0B57D0]'
                : status === 'saved'
                ? 'bg-[#E6F4EA] text-[#137333]'
                : status === 'error'
                ? 'bg-[#FCE8E6] text-[#B3261E]'
                : 'bg-[#FEF7E0] text-[#B06000]'
            }`}
          >
            {status === 'saving' && <Loader2 size={13} className="animate-spin shrink-0 text-[#0B57D0]" />}
            {status === 'saved' && <Check size={13} className="shrink-0 text-[#137333]" />}
            {status === 'error' && <TriangleAlert size={13} className="shrink-0 text-[#B3261E]" />}
            {status === 'offline' && <CloudOff size={13} className="shrink-0 text-[#B06000]" />}

            <span className="truncate">
              {status === 'saving' && 'Saving...'}
              {status === 'saved' && 'Saved'}
              {status === 'error' && (error?.startsWith('Sync') ? error : `Not saved · ${error || 'Retry'}`)}
              {status === 'offline' && 'Offline · Changes queued'}
            </span>
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
