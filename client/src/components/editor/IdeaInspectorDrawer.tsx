import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, X, Trash2, Calendar, CheckCircle2, Clock } from 'lucide-react';
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
 * IdeaInspectorDrawer Component — Integrated Right-Side Idea Detail Drawer
 * Matches DetailsPanel.tsx spring animations, rounded typography, and styling language.
 * Dedicated to editing individual Idea cards on the Kanban board on double-click.
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize description textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(180, textareaRef.current.scrollHeight)}px`;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-xs select-none"
            onClick={onClose}
          />

          {/* Slide-over Drawer Panel */}
          <motion.aside
            data-idea-inspector
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm lg:static lg:z-20 lg:w-80 xl:w-88 shrink-0 bg-white border-l border-slate-200/80 flex flex-col h-full shadow-2xl lg:shadow-none select-none overflow-hidden"
          >
            {/* 1. Header Bar: Idea Spark Pill, Title & Close Button */}
            <div className="h-16 px-4 sm:px-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/80">
                  <Lightbulb className="w-4 h-4 fill-purple-200/50 text-purple-600" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    Idea Inspector
                  </span>
                  <input
                    type="text"
                    value={idea.title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    placeholder="Idea title..."
                    className="text-sm font-bold text-[#1F1F1F] bg-transparent border-0 outline-none truncate w-full p-0 focus:ring-0 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close idea inspector"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Top Metadata Section */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5 shrink-0 bg-slate-50/50">
              {/* Status Switcher Segmented Pill */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </span>
                <div className="flex p-0.5 bg-slate-200/70 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => onUpdateStatus('ideas')}
                    className={cn(
                      'flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
                      idea.status === 'ideas'
                        ? 'bg-white text-purple-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>In Ideas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus('completed')}
                    className={cn(
                      'flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
                      idea.status === 'completed'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Completed</span>
                  </button>
                </div>
              </div>

              {/* Date & Delete Action Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formattedDate}</span>
                </div>

                <button
                  type="button"
                  onClick={onDelete}
                  title="Delete this idea"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* 3. Main Writing Canvas: Full Idea Description */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-2 custom-scrollbar">
              <label
                htmlFor="idea-description-canvas"
                className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between"
              >
                <span>Description & Plan</span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  Autosaves in real-time
                </span>
              </label>

              <textarea
                id="idea-description-canvas"
                ref={textareaRef}
                value={idea.description || ''}
                onChange={(e) => onUpdateDescription(e.target.value)}
                placeholder="Write detailed notes, specifications, implementation thoughts, or brainstorm points for this idea..."
                className="flex-1 w-full bg-slate-50/80 hover:bg-white focus:bg-white rounded-2xl p-4 border border-slate-200/80 focus:border-purple-400 text-sm leading-relaxed text-[#1F1F1F] placeholder-slate-400 outline-none transition-all resize-none shadow-2xs focus:shadow-sm"
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
