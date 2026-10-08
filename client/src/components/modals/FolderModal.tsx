import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Folder as FolderIcon, X } from 'lucide-react';
import type { Folder } from '../../types';

export interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder?: Folder | null;
  parentId?: string | null;
  onSave?: (name: string, folderId?: string, parentId?: string | null) => void;
}

const springConfig = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 350,
};

/**
 * FolderModal Component — Dedicated Dialog for Creating or Renaming Folders
 * Adheres to the tabbed folder silhouette aesthetic with an amber folder badge,
 * smooth spring physics, and keyboard navigation.
 */
export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  parentId = null,
  onSave,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isRenameMode = !!folder;

  useEffect(() => {
    if (isOpen) {
      setName(folder ? folder.name : '');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, folder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSave?.(trimmed, folder?.id, parentId);
      onClose();
    }
  };

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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={springConfig}
            className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-md w-full z-50 relative flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={isRenameMode ? 'Rename folder' : 'New folder'}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Row: Visual Tab Badge & Close Trigger */}
            <div className="flex items-start justify-between">
              {/* Stylized Folder Tab Badge */}
              <div className="bg-amber-100 text-amber-600 p-2.5 rounded-2xl w-fit mb-3 flex items-center justify-center shadow-xs">
                <FolderIcon className="w-5 h-5 fill-amber-500/20 text-amber-600" />
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Prompt */}
            <h3 className="text-xl font-bold text-[#1F1F1F] mb-1 tracking-tight">
              {isRenameMode ? 'Rename folder' : 'New folder'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isRenameMode
                ? 'Update the title of your folder collection'
                : 'Enter a name to create a new folder collection'}
            </p>

            {/* Folder Name Input Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Folder name"
                className="bg-[#EDF2FC] px-4 py-2.5 rounded-xl text-sm font-medium text-[#1F1F1F] outline-none border border-transparent focus:border-amber-400 focus:bg-white w-full transition-colors"
                required
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {isRenameMode ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
