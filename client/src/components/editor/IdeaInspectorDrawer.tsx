import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DeleteDialog } from '../modals/DeleteDialog';
import {
  Lightbulb,
  X,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlignLeft,
  Tag,
  User,
} from '@/components/ui/icons';
import type { IdeaItem } from '../../types';
import { cn } from '../../utils/cn';

interface IdeaInspectorDrawerProps {
  isOpen: boolean;
  idea: IdeaItem | null;
  onClose: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateStatus: (status: 'ideas' | 'completed') => void;
  onDelete: () => void;
}

/**
 * IdeaInspectorDrawer Component — Integrated Right-Side Idea Detail Companion Panel
 * Matches DetailsPanel.tsx spatial architecture:
 * - On mobile (< lg): fixed right slide-over drawer with backdrop blur.
 * - On desktop (lg+): docked static/sticky rounded-2xl / rounded-[24px] white island alongside the Kanban board.
 * Dedicated solely to "Plan & Notes" (no details tab).
 */
export const IdeaInspectorDrawer: React.FC<IdeaInspectorDrawerProps> = ({
  isOpen,
  idea,
  onClose,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateStatus,
  onDelete,
}) => {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize description textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(220, textareaRef.current.scrollHeight)}px`;
    }
  }, [idea?.description, isOpen]);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!idea) return null;

  const formattedDate = new Date(idea.date || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const wordCount = (idea.description || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay Backdrop (lg:hidden, exactly matching DetailsPanel) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-xs select-none"
            onClick={onClose}
          />

          {/* Companion Panel / Slide-over (matching DetailsPanel responsive geometry) */}
          <motion.aside
            data-idea-inspector
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm lg:static lg:z-20 lg:w-80 xl:w-88 shrink-0 bg-white rounded-l-2xl lg:rounded-2xl md:rounded-[24px] h-full lg:h-[calc(100vh-5rem)] shadow-2xl lg:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.08)] border-l lg:border border-slate-100 flex flex-col overflow-hidden lg:sticky lg:top-20 select-none"
          >
            {/* 1. Header Row (matching DetailsPanel.tsx anatomy) */}
            <div className="h-14 px-4 sm:px-5 flex items-center justify-between gap-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
                <h2 className="text-sm font-bold text-[#1F1F1F] truncate tracking-tight">
                  {idea.title || 'Untitled Idea'}
                </h2>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  title="Delete idea"
                  aria-label="Delete idea"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Close inspector"
                  aria-label="Close inspector"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Status & Sync Indicator Bar (No tabs, dedicated Plan & Notes) */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 shrink-0">
              <div className="inline-flex p-0.5 bg-slate-200/70 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => onUpdateStatus('ideas')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
                    idea.status === 'ideas'
                      ? 'bg-white text-purple-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Ideas</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus('completed')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
                    idea.status === 'completed'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Done</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Autosaved</span>
              </div>
            </div>

            {/* 3. Main Body: Plan & Notes Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 flex flex-col custom-scrollbar">
              {/* Title Field */}
              <div className="space-y-1.5 shrink-0">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Idea Title
                </label>
                <input
                  type="text"
                  value={idea.title}
                  onChange={(e) => onUpdateTitle(e.target.value)}
                  placeholder="Enter idea title..."
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white rounded-xl px-3.5 py-2.5 border border-slate-200/80 focus:border-purple-300 text-xs font-semibold text-[#1F1F1F] placeholder-slate-400 outline-none transition-all shadow-2xs focus:shadow-xs"
                />
              </div>

              {/* Description & Plan Textarea */}
              <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-purple-600" />
                    Plan & Notes
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Markdown supported
                  </span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={idea.description || ''}
                  onChange={(e) => onUpdateDescription(e.target.value)}
                  placeholder="Write detailed notes, specifications, implementation thoughts, or brainstorm points for this idea..."
                  className="flex-1 w-full min-h-[240px] bg-slate-50/70 hover:bg-white focus:bg-white rounded-2xl p-4 border border-slate-200/80 focus:border-purple-300 text-xs leading-relaxed text-[#1F1F1F] placeholder-slate-400 outline-none transition-all resize-none shadow-2xs focus:shadow-xs custom-scrollbar"
                />
              </div>

              {/* Bottom Meta Properties (Google Drive / DetailsPanel Style) */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs shrink-0">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Word count</span>
                  <span className="font-semibold text-slate-700">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'} • {(idea.description || '').length} chars
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Location</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[10px]">
                    <Tag className="w-2.5 h-2.5 text-purple-600" />
                    {idea.status === 'ideas' ? 'Ideas Column' : 'Completed Column'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Created</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formattedDate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Owner</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Alex Morgan (you)
                  </span>
                </div>
              </div>

              {/* Delete Button in Bottom Footer */}
              <div className="pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/70 rounded-xl transition-colors cursor-pointer border border-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete this Idea
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}

      {/* Confirmation Dialog for Deleting this Idea */}
      <DeleteDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          setIsConfirmDeleteOpen(false);
          onDelete();
        }}
        title="Delete Idea?"
        itemName={idea?.title || 'Untitled Idea'}
        itemType="idea"
        description="Are you sure you want to delete this idea? It will be removed from your idea board."
        confirmLabel="Delete Idea"
        isPermanent={true}
      />
    </AnimatePresence>
  );
};

export default IdeaInspectorDrawer;
