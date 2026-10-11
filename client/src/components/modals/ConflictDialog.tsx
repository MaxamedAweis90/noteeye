import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  X,
} from 'lucide-react';
import { useNoteStore } from '../../store/useNoteStore';

const springConfig = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 350,
};

/**
 * Minimalist ConflictDialog Component
 * Compact, modern, clean conflict resolver for file / folder collisions.
 */
export const ConflictDialog: React.FC = () => {
  const conflictDialogData = useNoteStore((state) => state.conflictDialogData);
  const closeConflictDialog = useNoteStore((state) => state.closeConflictDialog);
  const resolveCurrentConflict = useNoteStore((state) => state.resolveCurrentConflict);

  const [applyToAll, setApplyToAll] = useState(false);

  // Reset applyToAll whenever dialog opens
  useEffect(() => {
    if (conflictDialogData?.isOpen) {
      setApplyToAll(false);
    }
  }, [conflictDialogData?.isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && conflictDialogData?.isOpen) {
        closeConflictDialog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conflictDialogData?.isOpen, closeConflictDialog]);

  if (!conflictDialogData?.isOpen) return null;

  const { conflicts, currentIndex } = conflictDialogData;
  const current = conflicts[currentIndex];
  if (!current) return null;

  const totalConflicts = conflicts.length;
  const remainingCount = totalConflicts - currentIndex;
  const isMultiple = totalConflicts > 1;

  const handleReplace = () => {
    resolveCurrentConflict('replace', applyToAll);
  };

  const handleKeepBoth = () => {
    resolveCurrentConflict('make-copy', applyToAll);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
          onClick={closeConflictDialog}
          aria-hidden="true"
        />

        {/* Minimalist Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={springConfig}
          className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-[380px] w-full z-50 relative flex flex-col select-none"
          role="alertdialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Row: Subtle Icon Badge + Optional Multiple Indicator + Close Button */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              {isMultiple && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {currentIndex + 1} of {totalConflicts}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeConflictDialog}
              aria-label="Close dialog"
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Minimalist Title & Subtitle */}
          <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F] tracking-tight leading-snug">
            &ldquo;{current.incomingName}&rdquo; already exists
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
            An item with this name already exists in this destination. Replace it with the incoming item or keep both?
          </p>

          {/* Multiple Conflicts: Clean subtle checkbox */}
          {remainingCount > 1 && (
            <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer mb-4 select-none">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-3.5 h-3.5 text-[#0B57D0] rounded border-slate-300 focus:ring-0 cursor-pointer"
              />
              <span>Apply to all remaining ({remainingCount})</span>
            </label>
          )}

          {/* Minimalist Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeConflictDialog}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleKeepBoth}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
            >
              Keep both
            </button>

            <button
              type="button"
              onClick={handleReplace}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#0B57D0] hover:bg-[#0842A0] shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Replace
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConflictDialog;
