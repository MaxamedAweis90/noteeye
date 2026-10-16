import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Plus } from '@/components/ui/icons';
import type { ChecklistItem } from '../../types';
import { cn } from '../../utils/cn';

export interface ChecklistEditorSectionProps {
  checklistItems: ChecklistItem[];
  checklistTotalCount: number;
  checklistCompletedCount: number;
  checklistProgressPercent: number;
  newChecklistText: string;
  newChecklistInputRef: React.RefObject<HTMLInputElement | null>;
  onNewChecklistTextChange: (val: string) => void;
  onAddChecklistItem: (e?: React.FormEvent) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onUpdateChecklistItemText: (itemId: string, text: string) => void;
  onDeleteChecklistItem: (itemId: string) => void;
  onChecklistKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
}

/**
 * ChecklistEditorSection — Interactive checklist layout with progress metrics, animated item rows, and quick add form.
 */
export const ChecklistEditorSection: React.FC<ChecklistEditorSectionProps> = ({
  checklistItems,
  checklistTotalCount,
  checklistCompletedCount,
  checklistProgressPercent,
  newChecklistText,
  newChecklistInputRef,
  onNewChecklistTextChange,
  onAddChecklistItem,
  onToggleChecklistItem,
  onUpdateChecklistItemText,
  onDeleteChecklistItem,
  onChecklistKeyDown,
}) => {
  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Checklist Progress Overview & Metrics */}
      {checklistTotalCount > 0 && (
        <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1F1F1F] dark:text-slate-100">
                {checklistCompletedCount} of {checklistTotalCount} completed
              </span>
              <span className="text-slate-400 font-normal">•</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">
                {checklistProgressPercent}% ready
              </span>
            </div>
            <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">
              {checklistCompletedCount === checklistTotalCount
                ? "🎉 All tasks done"
                : "In progress"}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${checklistProgressPercent}%` }}
              className="h-full bg-[#10B981] rounded-full transition-all duration-300 ease-out"
            />
          </div>
        </div>
      )}

      {/* Checklist Items Stack */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {checklistItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Interactive Circular Checkbox Button */}
              <button
                type="button"
                onClick={() => onToggleChecklistItem(item.id)}
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105 active:scale-95",
                  item.isCompleted
                    ? "bg-[#10B981] text-white"
                    : "border border-slate-400 bg-white hover:border-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:hover:border-slate-300 text-transparent",
                )}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              {/* Text Input */}
              <input
                id={`cl-input-${item.id}`}
                type="text"
                value={item.text}
                onChange={(e) =>
                  onUpdateChecklistItemText(item.id, e.target.value)
                }
                onKeyDown={(e) => onChecklistKeyDown(e, index)}
                placeholder="List item..."
                className={cn(
                  "flex-1 bg-transparent border-0 outline-none text-sm sm:text-base text-[#1F1F1F] dark:text-slate-100 dark:placeholder-slate-500 focus:ring-0 py-0.5",
                  item.isCompleted && "line-through text-slate-400 dark:text-slate-500",
                )}
              />

              {/* Delete Item Button on Hover */}
              <button
                type="button"
                onClick={() => onDeleteChecklistItem(item.id)}
                aria-label="Remove item"
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Add Item Input / CTA */}
      <form
        onSubmit={onAddChecklistItem}
        className="flex items-center gap-2 pt-2"
      >
        <input
          ref={newChecklistInputRef}
          type="text"
          value={newChecklistText}
          onChange={(e) => onNewChecklistTextChange(e.target.value)}
          placeholder="+ Add an item and press Enter..."
          className="flex-1 bg-slate-50 focus:bg-white dark:bg-slate-800/80 dark:focus:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 dark:border-slate-700 dark:focus:border-slate-600 text-xs sm:text-sm text-[#1F1F1F] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-2xs"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};

export default ChecklistEditorSection;
