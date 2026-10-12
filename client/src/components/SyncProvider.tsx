import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CloudOff, Loader2, TriangleAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/useNoteStore';
import { useUserStore } from '../store/userStore';
import { useSyncStore } from '../store/syncStore';
import { userApi } from '../api';

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

const POLL_MS = 12_000;

/**
 * Pulls the MongoDB source of truth into the local stores (workspace + profile).
 * Local state is only replaced when the database returned something different.
 */
const WorkspaceSync: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const workspace = useQuery({
    queryKey: ['workspace'],
    enabled: isAuthenticated,
    refetchInterval: POLL_MS,
    queryFn: async () => {
      await useNoteStore.getState().fetchWorkspaceData();
      return Date.now();
    },
  });

  useQuery({
    queryKey: ['profile'],
    enabled: isAuthenticated,
    refetchInterval: POLL_MS * 2,
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

  // Login / logout / cross-tab / writes finishing => refresh immediately
  useEffect(() => {
    const refetch = () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    };
    const clear = () => queryClient.clear();
    window.addEventListener('noteeye:login', refetch);
    window.addEventListener('noteeye:refetch-workspace', refetch);
    window.addEventListener('noteeye:logout', clear);
    window.addEventListener('online', refetch);
    return () => {
      window.removeEventListener('noteeye:login', refetch);
      window.removeEventListener('noteeye:refetch-workspace', refetch);
      window.removeEventListener('noteeye:logout', clear);
      window.removeEventListener('online', refetch);
    };
  }, []);

  return null;
};

const timeAgo = (ts: number | null) => {
  if (!ts) return '';
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
};

/** Small pill telling the user whether their work is safely stored in MongoDB. */
export const SyncIndicator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const error = useSyncStore((s) => s.error);
  const [, tick] = React.useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!isAuthenticated || status === 'idle') return null;

  const cfg = {
    saving: { icon: <Loader2 size={14} className="animate-spin" />, text: 'Saving…', cls: 'bg-[#E8F0FE] text-[#0B57D0]' },
    saved: { icon: <Check size={14} />, text: `Saved to cloud · ${timeAgo(lastSyncedAt)}`, cls: 'bg-[#E6F4EA] text-[#137333]' },
    error: { icon: <TriangleAlert size={14} />, text: error?.startsWith('Sync') ? error : `Not saved${error ? ` · ${error}` : ''}`, cls: 'bg-[#FCE8E6] text-[#B3261E]' },
    offline: { icon: <CloudOff size={14} />, text: 'Offline · changes not synced', cls: 'bg-[#FEF7E0] text-[#B06000]' },
  }[status as 'saving' | 'saved' | 'error' | 'offline'];

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-40 pointer-events-none" aria-live="polite" id="sync-indicator">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className={`flex items-center gap-1.5 max-w-[80vw] px-3 py-1.5 rounded-full text-xs font-medium shadow-md border border-black/5 select-none ${cfg.cls}`}
        >
          {cfg.icon}
          <span className="truncate">{cfg.text}</span>
        </motion.div>
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
