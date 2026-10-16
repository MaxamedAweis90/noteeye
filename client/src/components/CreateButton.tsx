import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  FileText,
  CheckSquare,
  Folder,
  Lightbulb,
} from "@/components/ui/icons";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/uiStore";
import type { ItemType } from "../types";

export type CreateActionType = "note" | "checklist" | "idea" | "folder";

interface CreateButtonProps {
  className?: string;
  onActionSelected?: () => void;
  onSelect?: (type: CreateActionType) => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 450,
  damping: 30,
};

/**
 * CreateButton — Morphing Create Action Button Component
 * Physically and smoothly morphs between idle pill state and expanded action menu
 * using React 19, motion/react layout animations, and Lucide icons.
 */
export const CreateButton: React.FC<CreateButtonProps> = ({
  className = "",
  onActionSelected,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);

  // Outside click listener to collapse back to idle State 1
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const requestAction = useUIStore((state) => state.requestAction);

  const handleAction = (type: CreateActionType) => {
    requestAction(() => {
      setIsOpen(false);
      onActionSelected?.();
      onSelect?.(type);

      if (type === "folder") {
        openFolderModal();
      } else {
        openNoteModal(type as ItemType);
      }
    });
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <motion.div
        layout
        transition={springTransition}
        className={`bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 select-none overflow-hidden ${
          isOpen
            ? "w-full sm:w-56 p-2 rounded-2xl shadow-xl flex flex-col z-50"
            : "w-full h-12 px-5 rounded-2xl shadow-md hover:shadow-lg dark:shadow-slate-950/40 flex items-center justify-center cursor-pointer transition-shadow"
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
              className="w-full flex items-center justify-center gap-2.5 text-[#1F1F1F] dark:text-slate-100 font-semibold text-sm cursor-pointer border-0 bg-transparent p-0 outline-none"
              aria-label="Create new item"
            >
              <Plus className="w-[18px] h-[18px] text-[#0B57D0] dark:text-blue-400 stroke-[2.5] shrink-0" />
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
                <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
                  CREATE NEW
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
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
                  onClick={() => handleAction("note")}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>New note</span>
                </button>

                {/* 2. New checklist */}
                <button
                  type="button"
                  onClick={() => handleAction("checklist")}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>New checklist</span>
                </button>

                {/* 3. New idea */}
                <button
                  type="button"
                  onClick={() => handleAction("idea")}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>New idea</span>
                </button>
              </div>

              {/* C. Divider */}
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-1" />

              {/* D. Folder Action */}
              <button
                type="button"
                onClick={() => handleAction("folder")}
                className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
              >
                <Folder className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>New folder</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
