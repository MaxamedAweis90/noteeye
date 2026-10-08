import React from 'react';
import type { Item } from '../types';
import { useNoteStore } from '../store/useNoteStore';

interface NoteCardProps {
  item: Item;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean; // For trash page
}

/**
 * NoteCard — Google Drive-Style Pastel Note Surface (Image 3 Specification)
 * Dimensions: Standardized fixed 260px width x 220px height (matching FolderCard for identical grid alignment).
 * Features: 24px radius (rounded-3xl), pinned 34px circular action discs (#1F1F1F), text note and checklist variants.
 */
export const NoteCard: React.FC<NoteCardProps> = ({
  item,
  onEdit,
  onDelete,
  readOnly = false,
}) => {
  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const openQuickEditModal = useNoteStore((state) => state.openQuickEditModal);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const toggleChecklistItem = useNoteStore((state) => state.toggleChecklistItem);

  // Format date nicely: e.g. "25 Apr 2026"
  const formattedDate = new Date(item.updatedAt || item.createdAt).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );

  const isChecklist = item.type === 'checklist';
  const checklistItems = item.checklistItems || [];
  const completedCount = checklistItems.filter((ci) => ci.isCompleted).length;
  const totalCount = checklistItems.length;

  const handleCardClick = () => {
    if (readOnly) return;
    if (onEdit) {
      onEdit();
    } else {
      openNoteModal(item.type, item);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    } else {
      openQuickEditModal(item);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    } else {
      openDeleteDialog(item.id, item.title, isChecklist ? 'checklist' : 'note');
    }
  };

  // Default fallback pastel color if item has none
  const cardColor = item.color || (isChecklist ? '#CEEBFD' : '#FDE3C9');

  return (
    <div
      onClick={handleCardClick}
      style={{ backgroundColor: cardColor }}
      className="group relative w-full max-w-[270px] aspect-[1.18/1] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 lg:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 border border-black/[0.04] flex flex-col justify-between transition-all duration-200 cursor-pointer select-none"
    >
      {/* 1. Top Header Area: Title & Date */}
      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-bold text-[14px] sm:text-[16px] lg:text-[18px] leading-tight text-[#1F1F1F] tracking-tight truncate flex-1">
            {item.title}
          </h3>
          {item.isFavorite && (
            <span className="material-symbols-outlined text-amber-500 text-sm sm:text-base shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-slate-700/60 font-medium">
          {formattedDate}
        </p>

        {/* 2. Middle Content Preview */}
        <div className="pt-1 sm:pt-2 overflow-hidden">
          {isChecklist ? (
            <div className="space-y-1 sm:space-y-1.5">
              {checklistItems.slice(0, 3).map((ci) => (
                <div
                  key={ci.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) toggleChecklistItem(item.id, ci.id);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {ci.isCompleted ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center shrink-0">
                      <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-slate-500 shrink-0" />
                  )}
                  <span className={`truncate text-[11px] sm:text-xs ${ci.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {ci.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-800/80 leading-relaxed line-clamp-2 sm:line-clamp-3">
              {item.content || <span className="italic text-slate-400">Empty note...</span>}
            </p>
          )}
        </div>
      </div>

      {/* 3. Bottom Pinned Action Bar */}
      <div className="pt-1.5 sm:pt-3 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-700/65">
          {isChecklist ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>{completedCount}/{totalCount} done</span>
            </>
          ) : (
            <span>Note</span>
          )}
        </div>

        {/* Pinned Circular Action Buttons (Charcoal #1F1F1F) */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 sm:gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            {/* Edit Button */}
            <button
              type="button"
              onClick={handleEditClick}
              aria-label="Edit note"
              className="w-7 h-7 sm:w-[32px] sm:h-[32px] lg:w-[34px] lg:h-[34px] rounded-full bg-[#1F1F1F] text-white flex items-center justify-center hover:opacity-85 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={handleDeleteClick}
              aria-label="Delete note"
              className="w-7 h-7 sm:w-[32px] sm:h-[32px] lg:w-[34px] lg:h-[34px] rounded-full bg-[#1F1F1F] text-white flex items-center justify-center hover:opacity-85 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
