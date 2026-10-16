import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Save, Trash2, Loader2 } from '@/components/ui/icons';

export interface SaveDiscardModalProps {
  isOpen: boolean;
  onClose: () => void; // Keep Editing / Dismiss
  onSave: () => void | Promise<void>; // Save & Exit
  onDiscard: () => void; // Discard Changes
  itemName?: string;
  itemType?: 'note' | 'checklist' | 'idea' | 'item';
  isSaving?: boolean;
}

const springConfig = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 350,
};

/**
 * SaveDiscardModal Component — Modern Unsaved Changes Confirmation Dialog
 * Displayed when user attempts to navigate away / close an editor while changes are pending.
 * Offers:
 * - "Save & Exit" (Primary Noteeye Blue #0B57D0)
 * - "Discard Changes" (Soft Rose Subtle Action)
 * - "Keep Editing" (Cancel and stay in editor)
 */
export const SaveDiscardModal: React.FC<SaveDiscardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  itemName,
  itemType = 'note',
  isSaving = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const typeLabel =
    itemType === 'checklist'
      ? 'checklist'
      : itemType === 'idea'
      ? 'idea board'
      : 'note';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={springConfig}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-w-sm w-full z-50 relative flex flex-col"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="save-discard-title"
            aria-describedby="save-discard-desc"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimal Amber Warning Badge */}
            <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl w-fit mb-3 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Header & Body */}
            <h3
              id="save-discard-title"
              className="text-lg font-bold text-[#1F1F1F] dark:text-slate-100 mb-1 tracking-tight"
            >
              Unsaved Changes
            </h3>

            {itemName && (
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl my-2 border border-slate-100 dark:border-slate-700 truncate">
                &ldquo;{itemName}&rdquo;
              </div>
            )}

            <p id="save-discard-desc" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              You have unsaved changes in this {typeLabel}. Would you like to save them before leaving?
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep Editing
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDiscard}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>

                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Exit</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SaveDiscardModal;
