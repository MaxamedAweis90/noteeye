import React from 'react';
import { MessageSquarePlus } from '@/components/ui/icons';
import { useUIStore } from '../../store/uiStore';

/**
 * FloatingFeedbackButton Component
 * Fixed circular trigger button on bottom-right of the viewport.
 * Tactile, minimalist human design (no glowing neon AI gradients).
 * Desktop: bottom-6 right-6
 * Mobile: bottom-[74px] right-4 (cleanly elevated above the mobile bottom nav bar)
 */
export const FloatingFeedbackButton: React.FC = () => {
  const isFeedbackOpen = useUIStore((state) => state.isFeedbackOpen);
  const openFeedbackModal = useUIStore((state) => state.openFeedbackModal);

  // If the feedback modal is already open, suppress the floating trigger button
  if (isFeedbackOpen) return null;

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-40 select-none">
      <button
        type="button"
        onClick={openFeedbackModal}
        className="group relative w-11 h-11 rounded-full bg-[#1F1F1F] hover:bg-black text-white shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/10"
        aria-label="Send feedback or report an issue"
        title="Feedback & Report"
      >
        <MessageSquarePlus className="w-5 h-5 text-slate-100 group-hover:text-white transition-colors" />

        {/* Minimalist Desktop Tooltip */}
        <span
          className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#1F1F1F] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md hidden sm:block border border-white/10"
          role="tooltip"
        >
          Feedback & Report
        </span>
      </button>
    </div>
  );
};

export default FloatingFeedbackButton;
