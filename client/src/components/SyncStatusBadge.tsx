import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CloudOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { queryClient } from './SyncProvider';
import { cn } from '../utils/cn';

interface SyncStatusBadgeProps {
  className?: string;
  onManualSync?: () => void;
  showIconOnlyOnMobile?: boolean;
}

const formatTimeAgo = (ts: number | null): string => {
  if (!ts) return 'just now';
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 6) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.round(min / 60)}h ago`;
};

/**
 * Interactive Sync Status Badge
 * Reflects real-time MongoDB cloud synchronization and allows the user to
 * click and trigger an immediate workspace re-sync across all screens.
 */
export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  className,
  onManualSync,
  showIconOnlyOnMobile = false,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const status = useSyncStore((s) => s.status);
  const pending = useSyncStore((s) => s.pending);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const error = useSyncStore((s) => s.error);

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [, setTick] = useState(0);

  // Periodically refresh the "X seconds/minutes ago" label
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (onManualSync) {
        onManualSync();
        return;
      }

      if (pending > 0 || isManualSyncing) return;

      setIsManualSyncing(true);
      try {
        queryClient.invalidateQueries({ queryKey: ['workspace'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        window.dispatchEvent(new CustomEvent('noteeye:refetch-workspace'));
      } finally {
        setTimeout(() => setIsManualSyncing(false), 900);
      }
    },
    [pending, isManualSyncing, onManualSync]
  );

  if (!isAuthenticated) return null;

  const isSaving = status === 'saving' || pending > 0 || isManualSyncing;
  const isError = status === 'error' && !isSaving;
  const isOffline = status === 'offline' && !isSaving;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        isSaving
          ? 'Saving changes to MongoDB cloud...'
          : isError
          ? `Save failed: ${error || 'Unknown error'}. Click to retry.`
          : isOffline
          ? 'You are offline. Changes will sync once reconnected.'
          : 'Workspace synchronized with cloud. Click to re-sync.'
      }
      aria-label="Workspace sync status"
      className={cn(
        'group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer border shadow-2xs hover:shadow-xs active:scale-95',
        isSaving && 'bg-blue-50 text-[#0B57D0] border-blue-200/70',
        !isSaving && !isError && !isOffline && 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 border-slate-200/60 hover:text-slate-800',
        isError && 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/80',
        isOffline && 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/80',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="w-3 h-3 animate-spin text-[#0B57D0] shrink-0" />
            <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>Saving...</span>
          </motion.div>
        ) : isError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
            <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>Not saved · Retry</span>
          </motion.div>
        ) : isOffline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <CloudOff className="w-3 h-3 text-amber-600 shrink-0" />
            <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>Offline</span>
          </motion.div>
        ) : (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>
              Synced {formatTimeAgo(lastSyncedAt)}
            </span>
            <RefreshCw className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 group-hover:rotate-180 transition-transform duration-300 ml-0.5 opacity-0 group-hover:opacity-100 hidden sm:inline shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
