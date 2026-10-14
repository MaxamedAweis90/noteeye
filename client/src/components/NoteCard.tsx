import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, Check, Lightbulb, FileText, CheckSquare } from 'lucide-react';
import type { Item } from '../types';
import { CardActionMenu } from './CardActionMenu';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/cn';
import { createStackedDragGhost } from '../utils/dragGhost';
import { htmlToPlainText } from '../utils/markdownToHtml';

interface NoteCardProps {
  item: Item;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean; // For trash page
  isSelectedMulti?: boolean;
  isMultiSelectMode?: boolean;
  onToggleSelect?: () => void;
}

/**
 * NoteCard — Google Drive-Style Pastel Note Surface (Image 3 Specification)
 * Dimensions: Standardized fixed 260px width x 220px height (matching FolderCard for identical grid alignment).
 * Features: 24px radius (rounded-3xl), pinned 34px circular action discs (#1F1F1F), text note and checklist variants.
 */
export const NoteCard: React.FC<NoteCardProps> = ({
  item,
  onOpen,
  onEdit,
  onDelete,
  readOnly = false,
  isSelectedMulti = false,
  isMultiSelectMode = false,
  onToggleSelect,
}) => {
  const navigate = useNavigate();
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);
  const openQuickEditModal = useNoteStore((state) => state.openQuickEditModal);

  const selectedItemId = useUIStore((state) => state.selectedItemId);
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);
  const openContextMenu = useUIStore((state) => state.openContextMenu);
  const closeDetailsPanel = useUIStore((state) => state.closeDetailsPanel);
  const clipboardItem = useUIStore((state) => state.clipboardItem);
  const selectedIds = useUIStore((state) => state.selectedIds);
  const isDraggingMulti = useUIStore((state) => state.isDraggingMulti);

  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();

  const isSelected = selectedItemId === item.id;
  const isCut = clipboardItem?.id === item.id && clipboardItem?.action === 'cut';

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
  const isIdea = item.type === 'idea';
  const checklistItems = item.checklistItems || [];
  const completedCount = checklistItems.filter((ci) => ci.isCompleted).length;
  const totalCount = checklistItems.length;

  const ideaItems = item.ideaItems || [];
  const ideasCompletedCount = ideaItems.filter((ii) => ii.status === 'completed').length;
  const totalIdeasCount = ideaItems.length;

  const targetItemType = isIdea ? 'idea' : isChecklist ? 'checklist' : 'note';

  // Single-Click: Select item (or toggle multi-select when Ctrl held or in multi-select mode)
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    if (e.ctrlKey || e.metaKey) {
      if (onToggleSelect) {
        onToggleSelect();
      }
      return;
    }
    if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect();
      return;
    }
    setSelectedItem(item.id, targetItemType);
  };

  // Double-Click: Activate item (Open full note editor and close details panel)
  const handleCardDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    if (e.ctrlKey || e.metaKey || isMultiSelectMode) return;
    closeDetailsPanel();
    if (onOpen) {
      onOpen();
    } else {
      navigate(`/notes/${item.id}`);
    }
  };

  // Right-Click Context Menu (Only active on Home and Folders)
  const handleContextMenu = (e: React.MouseEvent) => {
    const isAllowedScreen = location.pathname === '/' || location.pathname.startsWith('/folders/');
    if (!isAllowedScreen || readOnly) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem(item.id, targetItemType);
    openContextMenu({ x: e.clientX, y: e.clientY }, 'item', {
      id: item.id,
      type: targetItemType,
    });
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
      openDeleteDialog(item.id, item.title, targetItemType);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readOnly) {
      toggleFavoriteItem(item.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) return;
    setIsDragging(true);

    const isThisSelected = selectedIds.has(item.id);
    const hasMultipleSelected = isThisSelected && selectedIds.size > 1;

    if (hasMultipleSelected) {
      useUIStore.getState().setIsDraggingMulti(true);

      const store = useNoteStore.getState();
      const batchItems = Array.from(selectedIds)
        .map((id) => {
          const f = store.folders.find((folder) => folder.id === id && !folder.isDeleted);
          if (f) return { type: 'folder' as const, id: f.id, name: f.name, color: '#7B61FF' };
          const n = store.items.find((note) => note.id === id && !note.isDeleted);
          if (n) return { type: 'note' as const, id: n.id, title: n.title, name: n.title, color: n.color };
          return null;
        })
        .filter(Boolean);

      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({
          type: 'batch',
          items: batchItems,
        })
      );
      e.dataTransfer.effectAllowed = 'move';

      const ghost = createStackedDragGhost(
        selectedIds.size,
        item.title,
        'note',
        item.color || (isChecklist ? '#CEEBFD' : '#FDE3C9')
      );
      e.dataTransfer.setDragImage(ghost, 50, 40);
      setTimeout(() => {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      }, 0);
    } else {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ type: 'note', id: item.id, title: item.title })
      );
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    useUIStore.getState().setIsDraggingMulti(false);
  };

  // Default fallback pastel color if item has none
  const cardColor = item.color || (isIdea ? '#E5DEFA' : isChecklist ? '#CEEBFD' : '#FDE3C9');

  return (
    <motion.div
      data-card
      data-card-id={item.id}
      draggable={!readOnly}
      onDragStartCapture={handleDragStart}
      onDragEndCapture={handleDragEnd}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      onContextMenu={handleContextMenu}
      whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      style={{ backgroundColor: cardColor }}
      className={cn(
        'group relative w-full max-w-[270px] aspect-[1.18/1] min-h-0 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 lg:p-5 border border-black/[0.04] flex flex-col justify-between transition-all duration-200 cursor-pointer select-none',
        isSelectedMulti
          ? 'ring-2 ring-[#0B57D0] shadow-xl -translate-y-1 scale-[1.01]'
          : isSelected
          ? 'ring-2 ring-[#0B57D0]/50 shadow-md'
          : 'shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.12)]',
        isDragging && 'opacity-60 scale-95 ring-2 ring-blue-500 shadow-2xl z-40',
        !isDragging && isDraggingMulti && isSelectedMulti && 'opacity-40 scale-95 ring-2 ring-blue-300',
        isCut && 'opacity-60 border-dashed border-2 border-slate-400'
      )}
    >
      {/* Visual Stack of Cards when dragging multiple selected items */}
      {isDragging && isSelectedMulti && selectedIds.size > 1 && (
        <>
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-slate-300/90 border border-slate-400/40 shadow-md pointer-events-none -z-10"
            style={{ transform: 'rotate(-6deg) translate(-7px, 6px)' }}
          />
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-slate-200/95 border border-slate-400/30 shadow-md pointer-events-none -z-5"
            style={{ transform: 'rotate(5deg) translate(7px, 3px)' }}
          />
          <div className="absolute -top-2 -right-2 z-40 bg-[#0B57D0] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 border-2 border-white">
            <span>{selectedIds.size}</span>
          </div>
        </>
      )}
      {/* 1. Top Header Area: Title & Date */}
      <div className="space-y-0.5 sm:space-y-1 min-w-0 shrink-0">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-bold text-[14px] sm:text-[16px] lg:text-[18px] leading-tight text-[#1F1F1F] tracking-tight truncate flex-1">
            {item.title}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            {/* Morphing Top-Right Action: Checkmark when selected, checkbox target in multi-select mode, or Favorite star */}
            {isSelectedMulti ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.();
                }}
                aria-label="Deselect item"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0B57D0] text-white ring-2 ring-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md shrink-0 scale-105 active:scale-95"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              </button>
            ) : isMultiSelectMode ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.();
                }}
                aria-label="Select item"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-slate-400/80 bg-white/80 hover:bg-white hover:border-[#0B57D0] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs shrink-0 active:scale-95 group/chk"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] text-[#0B57D0] opacity-0 group-hover/chk:opacity-60 transition-opacity" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={cn(
                  'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs shrink-0 hover:scale-105 active:scale-95',
                  item.isFavorite
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none sm:group-hover:opacity-100 sm:pointer-events-auto'
                )}
              >
                <Star
                  className={cn(
                    'w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125',
                    item.isFavorite
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-400 hover:text-amber-500 transition-colors'
                  )}
                />
              </button>
            )}

            {/* Context Options Trigger (Reusable CardActionMenu) */}
            {!readOnly && (
              <CardActionMenu
                type={targetItemType}
                item={item}
              />
            )}
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-700/60 font-medium truncate">
          {formattedDate}
        </p>

        {/* 2. Middle Content Preview (Display-only, non-interactive) */}
        <div className="pt-1 sm:pt-1.5 overflow-hidden flex-1 min-h-0">
          {isIdea ? (
            <div className="space-y-1 sm:space-y-1.5">
              {ideaItems.slice(0, 2).map((ii) => (
                <div
                  key={ii.id}
                  className="px-2.5 py-1 rounded-xl bg-white/80 border border-slate-200/60 shadow-2xs flex items-center justify-between text-[11px] text-[#1F1F1F]"
                >
                  <span className="truncate font-medium flex-1 mr-1">{ii.title || 'Untitled Idea'}</span>
                  <span
                    className={cn(
                      'text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold shrink-0',
                      ii.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-purple-50 text-purple-700'
                    )}
                  >
                    {ii.status === 'completed' ? 'Done' : 'Idea'}
                  </span>
                </div>
              ))}
              {ideaItems.length === 0 && (
                <p className="text-xs text-slate-500/80 italic pt-1">Empty idea board...</p>
              )}
            </div>
          ) : isChecklist ? (
            <div className="space-y-1 sm:space-y-1.5">
              {checklistItems.slice(0, 2).map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-800 pointer-events-none select-none"
                >
                  {ci.isCompleted ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center shrink-0">
                      <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-slate-500/70 shrink-0" />
                  )}
                  <span className={`truncate text-[11px] sm:text-xs ${ci.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {ci.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-800/80 leading-relaxed line-clamp-2">
              {htmlToPlainText(item.content) || <span className="italic text-slate-400">Empty note...</span>}
            </p>
          )}
        </div>
      </div>

      {/* 3. Bottom Pinned Action Bar */}
      <div className="pt-1.5 sm:pt-2 flex items-center justify-between mt-auto shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-700/65">
          {isIdea ? (
            <>
              <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
              <span>{ideasCompletedCount}/{totalIdeasCount} completed</span>
            </>
          ) : isChecklist ? (
            <>
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>{completedCount}/{totalCount} Done</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Note</span>
            </>
          )}
        </div>

        {/* Pinned Circular Action Buttons (Charcoal #1F1F1F — Desktop Hover Only) */}
        {!readOnly && (
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
    </motion.div>
  );
};
