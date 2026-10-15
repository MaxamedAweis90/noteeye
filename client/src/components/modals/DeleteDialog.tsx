import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle } from '@/components/ui/icons';

export interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: 'note' | 'checklist' | 'folder' | 'item' | 'idea';
  confirmLabel?: string;
  cancelLabel?: string;
  isPermanent?: boolean;
}

const springConfig = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 350,
};

/**
 * DeleteDialog Component — Clean Minimal Confirmation Modal
 * Reusable across the entire application for single items, bulk deletes,
 * permanent deletions, and specific entities with customized titles and warnings.
 */
export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType = 'item',
  confirmLabel,
  cancelLabel = 'Cancel',
  isPermanent = false,
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

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  };

  const typeLabel =
    itemType === 'folder'
      ? 'folder'
      : itemType === 'checklist'
      ? 'checklist'
      : itemType === 'idea'
      ? 'idea'
      : 'note';

  const dialogTitle =
    title ||
    (isPermanent ? 'Delete Forever?' : 'Move to Trash?');

  const dialogDesc =
    description ||
    (isPermanent
      ? 'This action cannot be undone. You will not be able to recover this.'
      : `This ${typeLabel} will be moved to Trash and permanently deleted after 30 days.`);

  const dialogConfirmLabel =
    confirmLabel ||
    (isPermanent ? 'Delete Forever' : 'Move to Trash');

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
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={springConfig}
            className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-sm w-full z-50 relative flex flex-col"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimal Warning Icon Badge */}
            <div className="bg-rose-50 text-rose-600 p-2.5 rounded-2xl w-fit mb-3 flex items-center justify-center shadow-xs">
              {isPermanent ? (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              ) : (
                <Trash2 className="w-5 h-5 text-rose-600" />
              )}
            </div>

            {/* Header & Body */}
            <h3
              id="delete-dialog-title"
              className="text-lg font-bold text-[#1F1F1F] mb-1 tracking-tight"
            >
              {dialogTitle}
            </h3>

            {itemName && (
              <div className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl my-2 border border-slate-100 truncate">
                &ldquo;{itemName}&rdquo;
              </div>
            )}

            <p id="delete-dialog-desc" className="text-xs text-slate-500 leading-relaxed mb-6">
              {dialogDesc}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={handleConfirmClick}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{dialogConfirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteDialog;
