import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CloudOff, AlertTriangle, Check } from 'lucide-react';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { queryClient } from './SyncProvider';
import { flushOutboxQueue } from '../lib/offlineDb';
import { cn } from '../utils/cn';

interface SyncStatusBadgeProps {
  className?: string;
  onManualSync?: () => void;
  showIconOnlyOnMobile?: boolean;
}

/**
 * Interactive, Animated Sync Status Badge
 * Only appears when saving or saved, then automatically animates out and hides.
 * Stays visible if an error occurs or the device is offline.
 */
export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  className,
  onManualSync,
  showIconOnlyOnMobile = false,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const status = useSyncStore((s) => s.status);
  const pending = useSyncStore((s) => s.pending);
  const error = useSyncStore((s) => s.error);

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (onManualSync) {
        onManualSync();
        return;
      }

      if (pending > 0 || isManualSyncing) return;

      setIsManualSyncing(true);
      try {
        await flushOutboxQueue(queryClient);
        await queryClient.invalidateQueries({ queryKey: ['workspace'] });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        window.dispatchEvent(new CustomEvent('noteeye:refetch-workspace'));
      } finally {
        setTimeout(() => setIsManualSyncing(false), 800);
      }
    },
    [pending, isManualSyncing, onManualSync]
  );

  if (!isAuthenticated) return null;

  const isSaving = status === 'saving' || pending > 0 || isManualSyncing;
  const isSaved = status === 'saved' && !isSaving;
  const isError = status === 'error' && !isSaving;
  const isOffline = status === 'offline' && !isSaving;

  const isVisible = isSaving || isSaved || isError || isOffline;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          key="sync-badge"
          type="button"
          onClick={handleClick}
          initial={{ opacity: 0, scale: 0.85, y: -2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -2 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          title={
            isSaving
              ? 'Saving changes to MongoDB cloud...'
              : isSaved
              ? 'All changes saved to cloud.'
              : isError
              ? `Save failed: ${error || 'Unknown error'}. Click to retry.`
              : 'You are offline. Changes will sync once reconnected.'
          }
          aria-label="Workspace sync status"
          className={cn(
            'group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer border shadow-2xs hover:shadow-xs active:scale-95',
            isSaving && 'bg-blue-50 text-[#0B57D0] border-blue-200/70',
            isSaved && 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
            isError && 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/80',
            isOffline && 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/80',
            className
          )}
        >
          {isSaving ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-[#0B57D0] shrink-0" />
              <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>Saving...</span>
            </div>
          ) : isSaved ? (
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>Saved</span>
            </div>
          ) : isError ? (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
              <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>Not saved · Retry</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <CloudOff className="w-3 h-3 text-amber-600 shrink-0" />
              <span className={cn('truncate', showIconOnlyOnMobile && 'hidden sm:inline')}>Offline</span>
            </div>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};
