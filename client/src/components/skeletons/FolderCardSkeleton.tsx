import React from 'react';
import { cn } from '../../utils/cn';

export interface FolderCardSkeletonProps {
  className?: string;
  hasPaperSheet?: boolean;
}

/**
 * FolderCardSkeleton Component
 * Replicates the exact 3D folder silhouette from FolderCard.tsx:
 * - Top-left tab flap path (M 0 34 Q 0 16 16 16 L 82 16 Q 98 16 108 27 Q 118 38 134 38 L 244 38 Q 260 38 260 54...)
 * - Peeking white paper sheet
 * - 3D front pocket container with top-[46px] and rounded-[22px]
 * - Uniform 260px x 220px footprint for zero layout shift (CLS: 0).
 */
export const FolderCardSkeleton: React.FC<FolderCardSkeletonProps> = ({
  className,
  hasPaperSheet = true,
}) => {
  return (
    <div
      className={cn(
        'relative w-full max-w-[270px] aspect-[1.18/1] select-none shimmer-mask rounded-2xl sm:rounded-3xl overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* 1. Back Folder Body with Precise Top-Left Tab Flap SVG */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          viewBox="0 0 260 220"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.03)]"
          fill="none"
        >
          {/* Exact smooth curved back silhouette with top-left tab from FolderCard */}
          <path
            d="M 0 34 Q 0 16 16 16 L 82 16 Q 98 16 108 27 Q 118 38 134 38 L 244 38 Q 260 38 260 54 L 260 204 Q 260 220 244 220 L 16 220 Q 0 220 0 204 Z"
            fill="#DDE3EA"
          />
        </svg>
      </div>

      {/* 2. Peeking White Paper Sheet Placeholder */}
      {hasPaperSheet && (
        <div className="absolute left-4 right-4 sm:left-5 sm:right-5 top-[12%] h-[18%] bg-white/70 rounded-t-xl z-1 shadow-2xs" />
      )}

      {/* 3. Front Pocket Container (Matches top-[20%] and rounded-[22px]) */}
      <div className="absolute left-0 right-0 bottom-0 top-[20%] rounded-[16px] sm:rounded-[20px] lg:rounded-[22px] bg-[#E9EEF6] p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between border border-slate-200/70 shadow-xs z-2 overflow-hidden">
        {/* Top Header Row: Folder Name & Count on Left, 3-dot trigger on Right */}
        <div className="w-full flex items-start justify-between gap-2 pt-0.5">
          <div className="flex-1 min-w-0 pr-1">
            {/* Title bar placeholder */}
            <div className="h-4.5 w-3/5 bg-[#DDE3EA] rounded-md mb-2" />
            {/* Item counter placeholder */}
            <div className="h-3 w-1/4 bg-[#E2E7EE] rounded-md" />
          </div>

          {/* 3-dot circular options button placeholder */}
          <div className="w-6 h-6 rounded-full border border-slate-300/60 bg-white/40 shrink-0" />
        </div>

        {/* Middle Area Spacer */}
        <div className="flex-1" />

        {/* Bottom Metadata: "Last added time" placeholder */}
        <div className="pt-2">
          <div className="h-3 w-28 bg-[#E2E7EE]/80 rounded-md" />
        </div>
      </div>
    </div>
  );
};
