import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, FileText, CheckSquare, Sparkles, Folder } from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';

export type CreateActionType = 'note' | 'checklist' | 'idea' | 'folder';

interface CreateButtonProps {
  className?: string;
  onActionSelected?: () => void;
  onSelect?: (type: CreateActionType) => void;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 30,
};

/**
 * CreateButton — Morphing Create Action Button Component
 * Physically and smoothly morphs between idle pill state and expanded action menu
 * using React 19, motion/react layout animations, and Lucide icons.
 */
export const CreateButton: React.FC<CreateButtonProps> = ({
  className = '',
  onActionSelected,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);

  // Outside click listener to collapse back to idle State 1
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (type: CreateActionType) => {
    setIsOpen(false);
    onActionSelected?.();
    onSelect?.(type);

    if (type === 'folder') {
      openFolderModal();
    } else if (type === 'checklist') {
      openNoteModal('checklist');
    } else if (type === 'idea') {
      // Placeholder handler for future recommendations/features: opens a fresh note template
      openNoteModal('note', undefined);
    } else {
      openNoteModal('note');
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <motion.div
        layout
        transition={springTransition}
        className={`bg-white border border-slate-200/80 select-none overflow-hidden ${
          isOpen
            ? 'w-full sm:w-56 p-2 rounded-2xl shadow-xl flex flex-col z-50'
            : 'w-full h-12 px-5 rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer transition-shadow'
        }`}
        onClick={!isOpen ? () => setIsOpen(true) : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isOpen ? (
            /* State 1: Idle Button */
            <motion.button
              key="idle-state"
              type="button"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="w-full flex items-center justify-center gap-2.5 text-[#1F1F1F] font-semibold text-sm cursor-pointer border-0 bg-transparent p-0 outline-none"
              aria-label="Create new item"
            >
              <Plus className="w-[18px] h-[18px] text-[#0B57D0] stroke-[2.5] shrink-0" />
              <span>Create</span>
            </motion.button>
          ) : (
            /* State 2: Morphed Expanded Menu */
            <motion.div
              key="expanded-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full flex flex-col"
            >
              {/* A. Top Header Row */}
              <div className="flex justify-between items-center px-2 py-1.5 mb-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none">
                  CREATE NEW
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close creation menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* B. Action Items Stack */}
              <div className="flex flex-col gap-0.5">
                {/* 1. New note */}
                <button
                  type="button"
                  onClick={() => handleAction('note')}
                  className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>New note</span>
                </button>

                {/* 2. New checklist */}
                <button
                  type="button"
                  onClick={() => handleAction('checklist')}
                  className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>New checklist</span>
                </button>

                {/* 3. New idea */}
                <button
                  type="button"
                  onClick={() => handleAction('idea')}
                  className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>New idea</span>
                </button>
              </div>

              {/* C. Divider */}
              <div className="h-px bg-slate-100 my-1 mx-1" />

              {/* D. Folder Action */}
              <button
                type="button"
                onClick={() => handleAction('folder')}
                className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
              >
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                <span>New folder</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
