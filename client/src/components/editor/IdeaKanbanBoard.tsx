import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Lightbulb, CheckCircle2, Clock, Calendar, SlidersHorizontal } from '@/components/ui/icons';
import type { IdeaItem } from '../../types';
import { cn } from '../../utils/cn';

export interface IdeaKanbanBoardProps {
  ideas: IdeaItem[];
  selectedIdeaId: string | null;
  onSelectIdea: (id: string) => void;
  onOpenInspector: (id: string) => void;
  onAddIdea: (status: 'ideas' | 'completed', title?: string) => void;
  onMoveCard: (ideaId: string, targetStatus: 'ideas' | 'completed', targetIndex?: number) => void;
}

export const IdeaKanbanBoard: React.FC<IdeaKanbanBoardProps> = ({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  onOpenInspector,
  onAddIdea,
  onMoveCard,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'ideas' | 'completed' | null>(null);
  const [addingInColumn, setAddingInColumn] = useState<'ideas' | 'completed' | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [mobileTab, setMobileTab] = useState<'ideas' | 'completed'>('ideas');

  const ideasItems = ideas
    .filter((i) => i.status === 'ideas')
    .sort((a, b) => a.order - b.order);

  const completedItems = ideas
    .filter((i) => i.status === 'completed')
    .sort((a, b) => a.order - b.order);

  // Auto smooth-scroll to newly created idea at the bottom of the ideas list
  const ideasBottomRef = useRef<HTMLDivElement | null>(null);
  const prevIdeasCountRef = useRef(ideasItems.length);

  useEffect(() => {
    if (ideasItems.length > prevIdeasCountRef.current) {
      const timer = setTimeout(() => {
        ideasBottomRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 80);
      return () => clearTimeout(timer);
    }
    prevIdeasCountRef.current = ideasItems.length;
  }, [ideasItems.length]);

  const handleInlineSubmit = (status: 'ideas' | 'completed', e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inlineTitle.trim();
    onAddIdea(status, trimmed || undefined);
    setInlineTitle('');
    setAddingInColumn(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, targetStatus: 'ideas' | 'completed') => {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData('text/plain') || draggingId;
    if (droppedId) {
      onMoveCard(droppedId, targetStatus);
    }
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleCardDrop = (
    e: React.DragEvent,
    targetStatus: 'ideas' | 'completed',
    targetIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedId = e.dataTransfer.getData('text/plain') || draggingId;
    if (droppedId) {
      onMoveCard(droppedId, targetStatus, targetIndex);
    }
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const renderCard = (item: IdeaItem, index: number) => {
    const isSelected = selectedIdeaId === item.id;
    const isDragging = draggingId === item.id;
    const formattedDate = new Date(item.date || Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.16 }}
        draggable
        onDragStart={(e: any) => handleDragStart(e, item.id)}
        onDragEnd={handleDragEnd as any}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleCardDrop(e, item.status, index)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectIdea(item.id);
          // On mobile screens, single tap directly opens the companion inspector
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            onOpenInspector(item.id);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onOpenInspector(item.id);
        }}
        className={cn(
          'group/kcard relative rounded-2xl p-4 border transition-all cursor-grab active:cursor-grabbing select-none',
          isSelected
            ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 ring-2 ring-purple-200/70 dark:ring-purple-900/50 shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800/80 hover:shadow-xs shadow-2xs',
          isDragging && 'opacity-40 scale-[0.98] border-purple-300 ring-1 ring-purple-200'
        )}
      >
        {/* Header: Title */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-sm font-display font-semibold text-[#1F1F1F] dark:text-slate-100 leading-snug line-clamp-2">
            {item.title || 'Untitled Idea'}
          </h4>
        </div>

        {/* Body Preview: Truncated Description */}
        <div className="min-h-[2.2rem] mb-3">
          {item.description?.trim() ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400/80 dark:text-slate-500 italic leading-relaxed">
              <span className="sm:hidden">Tap to add details or plans...</span>
              <span className="hidden sm:inline">Double-click to add details or plans...</span>
            </p>
          )}
        </div>

        {/* Footer Row: Date, Notes/Inspect Button & Custom Circular Idea Icon Badge */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{formattedDate}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInspector(item.id);
              }}
              title="View details & notes"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors text-[10px] sm:text-[11px] font-semibold cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span>Notes</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveCard(
                item.id,
                item.status === 'ideas' ? 'completed' : 'ideas'
              );
            }}
            title={
              item.status === 'ideas'
                ? 'Click to mark as completed (or double-click card to edit details)'
                : 'Click to move back to ideas (or double-click card to edit details)'
            }
            aria-label={
              item.status === 'ideas'
                ? 'Mark idea completed'
                : 'Move idea back to active ideas'
            }
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center border transition-all shadow-2xs hover:scale-115 active:scale-90 cursor-pointer',
              item.status === 'completed'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/80'
                : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/80'
            )}
          >
            {item.status === 'completed' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Lightbulb className="w-3.5 h-3.5 fill-purple-200/50 text-purple-600" />
            )}
          </button>
        </div>
      </motion.div>
    );
  };

  const renderColumn = (
    title: string,
    status: 'ideas' | 'completed',
    itemsList: IdeaItem[],
    icon: React.ReactNode,
    badgeColor: string
  ) => {
    const isOver = dragOverColumn === status;
    const isAdding = addingInColumn === status;

    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverColumn(status);
        }}
        onDragLeave={() => {
          setDragOverColumn((prev) => (prev === status ? null : prev));
        }}
        onDrop={(e) => handleColumnDrop(e, status)}
        className={cn(
          'w-full lg:flex-1 min-w-0 lg:min-w-[320px] rounded-3xl p-4 sm:p-5 flex flex-col transition-all duration-200 border',
          mobileTab !== status && 'hidden lg:flex',
          isOver
            ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-300/40 shadow-md'
            : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800'
        )}
      >
        {/* Column Header Row */}
        <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700">
              {icon}
            </div>
            <h3 className="text-sm font-display font-bold text-[#1F1F1F] dark:text-slate-100 tracking-tight">{title}</h3>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-bold shadow-2xs',
                badgeColor
              )}
            >
              {itemsList.length}
            </span>
          </div>

          {status === 'ideas' && (
            <button
              type="button"
              onClick={() => {
                setAddingInColumn(status);
                setInlineTitle('');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add idea</span>
            </button>
          )}
        </div>

        {/* Quick Add Inline Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={(e) => handleInlineSubmit(status, e)}
              className="p-3 mb-3 bg-white dark:bg-slate-800 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-md space-y-2"
            >
              <input
                autoFocus
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                placeholder="What is your idea?"
                className="w-full text-xs sm:text-sm font-medium text-[#1F1F1F] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent border-0 outline-none p-0 focus:ring-0"
              />
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAddingInColumn(null)}
                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#0B57D0] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Cards Stack */}
        <div className="flex-1 lg:overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar min-h-[160px] sm:min-h-[220px]">
          <AnimatePresence mode="popLayout">
            {itemsList.map((item, index) => renderCard(item, index))}
          </AnimatePresence>

          {status === 'ideas' && (
            <div ref={ideasBottomRef} className="h-0 w-full pointer-events-none" />
          )}

          {itemsList.length === 0 && !isAdding && (
            <div
              onClick={() => {
                if (status === 'ideas') {
                  setAddingInColumn(status);
                  setInlineTitle('');
                }
              }}
              className={cn(
                'h-28 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center p-4 text-center select-none',
                status === 'ideas'
                  ? 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 transition-all'
                  : 'cursor-default'
              )}
            >
              {status === 'ideas' ? (
                <Lightbulb className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-1.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-1.5" />
              )}
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {status === 'ideas' ? 'No active ideas' : 'No completed ideas'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {status === 'ideas'
                  ? 'Click to capture a new thought'
                  : 'Drag resolved cards here'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 select-none pb-6">
      {/* Mobile Column Switcher (< lg) */}
      <div className="flex lg:hidden items-center justify-between p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/70 dark:border-slate-700 mb-3 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('ideas')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer',
            mobileTab === 'ideas'
              ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-2xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Ideas</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
            {ideasItems.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('completed')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer',
            mobileTab === 'completed'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Completed</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
            {completedItems.length}
          </span>
        </button>
      </div>

      {/* Columns: side-by-side on lg+, responsive stacked/filtered on mobile */}
      <div className="w-full flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-0">
        {/* Column 1: Ideas (Active Thoughts) */}
        {renderColumn(
          'Ideas',
          'ideas',
          ideasItems,
          <Clock className="w-4 h-4 text-purple-600" />,
          'bg-purple-100 text-purple-700'
        )}

        {/* Column 2: Completed (Executed Ideas) */}
        {renderColumn(
          'Completed',
          'completed',
          completedItems,
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          'bg-emerald-100 text-emerald-700'
        )}
      </div>
    </div>
  );
};

