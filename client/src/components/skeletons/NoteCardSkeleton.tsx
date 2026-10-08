import React from 'react';
import { cn } from '../../utils/cn';

export interface NoteCardSkeletonProps {
  className?: string;
}

/**
 * NoteCardSkeleton Component
 * Neutral pastel grey skeleton placeholder matching NoteCard's exact 260px x 220px
 * footprint, rounded-3xl geometry, and internal element hierarchy for zero layout shift (CLS: 0).
 */
export const NoteCardSkeleton: React.FC<NoteCardSkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'relative w-full max-w-[270px] aspect-[1.18/1] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 lg:p-5 bg-[#F1F4F9]',
        'border border-slate-200/70 shadow-xs flex flex-col justify-between',
        'select-none overflow-hidden shimmer-mask',
        className
      )}
      aria-hidden="true"
    >
      {/* 1. Top Header Area: Title & Date Placeholders */}
      <div className="space-y-0.5 sm:space-y-1">
        {/* Title bar */}
        <div className="h-4 sm:h-5 w-3/4 bg-[#DDE3EA] rounded-md mb-1.5 sm:mb-2" />
        {/* Date / meta bar */}
        <div className="h-2.5 sm:h-3 w-1/3 bg-[#E2E7EE] rounded-md" />

        {/* 2. Middle Content Preview (3 placeholder lines) */}
        <div className="pt-2 sm:pt-3 space-y-1.5 sm:space-y-2">
          <div className="h-3 sm:h-3.5 w-full bg-[#E2E7EE] rounded-md" />
          <div className="h-3 sm:h-3.5 w-5/6 bg-[#E2E7EE] rounded-md" />
          <div className="h-3 sm:h-3.5 w-2/3 bg-[#E2E7EE] rounded-md" />
        </div>
      </div>

      {/* 3. Bottom Pinned Action Area */}
      <div className="pt-2 sm:pt-3 border-t border-slate-200/50 flex items-center justify-between mt-auto">
        {/* Left type pill badge */}
        <div className="h-3 sm:h-3.5 w-10 sm:w-12 bg-[#E2E7EE]/80 rounded-full" />

        {/* Right circular action button discs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-7 h-7 sm:w-[32px] sm:h-[32px] lg:w-[34px] lg:h-[34px] rounded-full bg-[#DDE3EA] shadow-2xs" />
          <div className="w-7 h-7 sm:w-[32px] sm:h-[32px] lg:w-[34px] lg:h-[34px] rounded-full bg-[#DDE3EA] shadow-2xs" />
        </div>
      </div>
    </div>
  );
};
