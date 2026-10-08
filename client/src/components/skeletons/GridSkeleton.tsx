import React from 'react';
import { cn } from '../../utils/cn';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import { FolderCardSkeleton } from './FolderCardSkeleton';

export interface GridSkeletonProps {
  /** Number of folder skeletons to display (default: 4) */
  folderCount?: number;
  /** Number of note skeletons to display (default: 8) */
  noteCount?: number;
  /** Whether to render the folders section (default: true) */
  showFolders?: boolean;
  /** Whether to render the notes section (default: true) */
  showNotes?: boolean;
  /** Outer container class */
  className?: string;
  /** Inner cards grid container class (defaults to Noteeye 260px auto-fill grid) */
  gridClassName?: string;
}

/**
 * GridSkeleton Component — Composite Loading Grid View
 * Matches the exact two-section (Folders + Notes) workspace layout in HomePage.
 * Guarantees zero layout shift (CLS: 0) when transitioning from loading to mounted content.
 */
export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  folderCount = 5,
  noteCount = 10,
  showFolders = true,
  showNotes = true,
  className,
  gridClassName = 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]',
}) => {
  return (
    <div className={cn('space-y-8 animate-fade-in select-none', className)}>
      {/* 1. Folders Skeleton Section */}
      {showFolders && folderCount > 0 && (
        <section className="space-y-3">
          {/* Section header bar */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-slate-200/80 rounded-md shimmer-mask" />
            <div className="h-3 w-14 bg-slate-200/60 rounded-md shimmer-mask" />
          </div>

          {/* Folder cards grid */}
          <div className={gridClassName}>
            {Array.from({ length: folderCount }).map((_, idx) => (
              <FolderCardSkeleton
                key={`folder-skel-${idx}`}
                hasPaperSheet={idx % 2 === 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Notes & Checklists Skeleton Section */}
      {showNotes && noteCount > 0 && (
        <section className="space-y-4 pt-1">
          {/* Section header bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 bg-slate-200/80 rounded-md shimmer-mask" />
              <div className="h-4 w-6 bg-slate-200/60 rounded-full shimmer-mask" />
            </div>
          </div>

          {/* Note cards grid */}
          <div className={gridClassName}>
            {Array.from({ length: noteCount }).map((_, idx) => (
              <NoteCardSkeleton key={`note-skel-${idx}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
