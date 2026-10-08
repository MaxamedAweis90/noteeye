import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  RotateCcw,
  AlertCircle,
  Check,
  LayoutGrid,
  List,
  ArrowUpDown,
  Folder as FolderIcon,
  FileText,
  X,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNoteStore } from '../store/useNoteStore';
import { GridSkeleton } from '../components/skeletons';
import type { Folder, Item } from '../types';
import { cn } from '../utils/cn';

/**
 * TrashFolderCard — Google Drive / Noteeye 3D Folder in Trashed State
 * Dimensions: Standardized fixed aspect-[1.18/1] max-w-[270px] matching FolderCard.
 */
interface TrashFolderCardProps {
  folder: Folder;
  itemCount: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}

const TrashFolderCard: React.FC<TrashFolderCardProps> = ({
  folder,
  itemCount,
  isSelected,
  onToggleSelect,
  onRestore,
  onDeleteForever,
}) => {
  const formattedDate = format(
    new Date(folder.updatedAt || folder.createdAt),
    'd MMM yyyy'
  );

  return (
    <div
      onClick={onToggleSelect}
      className={cn(
        'group relative w-full max-w-[270px] aspect-[1.18/1] rounded-[20px] sm:rounded-[24px] cursor-pointer transition-all duration-200 select-none overflow-hidden',
        isSelected
          ? 'ring-2 ring-[#0B57D0] shadow-md opacity-100 scale-[1.01]'
          : 'opacity-85 hover:opacity-100 hover:-translate-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md'
      )}
    >
      {/* 1. Back Folder Body Silhouette */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          viewBox="0 0 260 220"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-[0_2px_6px_rgba(86,54,200,0.15)]"
          fill="none"
        >
          <defs>
            <linearGradient id={`trashFolderGrad-${folder.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8F7BF0" />
              <stop offset="100%" stopColor="#6747D0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 34 Q 0 16 16 16 L 82 16 Q 98 16 108 27 Q 118 38 134 38 L 244 38 Q 260 38 260 54 L 260 204 Q 260 220 244 220 L 16 220 Q 0 220 0 204 Z"
            fill={`url(#trashFolderGrad-${folder.id})`}
          />
        </svg>
      </div>

      {/* 2. Peeking Sheet when populated */}
      {itemCount > 0 && (
        <div className="absolute left-4 right-4 sm:left-5 sm:right-5 top-[12%] h-[18%] bg-white/90 rounded-t-xl shadow-2xs z-1" />
      )}

      {/* 3. Front Pocket Container */}
      <div className="absolute left-0 right-0 bottom-0 top-[20%] rounded-[16px] sm:rounded-[20px] lg:rounded-[22px] bg-gradient-to-b from-[#7A5CE5] to-[#5939C7] p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between border-t border-white/20 z-2">
        {/* Top Header Row: Title & Checkbox */}
        <div className="w-full flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 pr-1">
            <h3 className="font-bold text-[14px] sm:text-[16px] text-white tracking-tight leading-tight truncate">
              {folder.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-white/75 font-normal mt-0.5">
              {itemCount === 0 ? 'Empty folder' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          {/* Selection Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            aria-label={isSelected ? 'Deselect folder' : 'Select folder'}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0',
              isSelected
                ? 'bg-[#0B57D0] text-white ring-2 ring-white opacity-100 scale-105'
                : 'border border-white/60 bg-white/30 text-transparent hover:bg-white/50 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
            )}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {/* Bottom Metadata & Quick Action Discs */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] sm:text-xs text-white/65 font-medium">
            {formattedDate}
          </span>

          {/* Quick Action Discs (Restore & Delete Forever) */}
          <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
              title="Restore folder"
              aria-label="Restore folder"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#0B57D0] flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteForever();
              }}
              title="Delete forever"
              aria-label="Delete forever"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TrashNoteCard — Google Drive / Noteeye Pastel Note in Trashed State
 * Dimensions: Standardized fixed aspect-[1.18/1] max-w-[270px] matching NoteCard.
 */
interface TrashNoteCardProps {
  item: Item;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}

const TrashNoteCard: React.FC<TrashNoteCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onRestore,
  onDeleteForever,
}) => {
  const isChecklist = item.type === 'checklist';
  const checklistItems = item.checklistItems || [];
  const completedCount = checklistItems.filter((ci) => ci.isCompleted).length;
  const totalCount = checklistItems.length;

  const formattedDate = format(
    new Date(item.updatedAt || item.createdAt),
    'd MMM yyyy'
  );

  const cardColor = item.color || (isChecklist ? '#CEEBFD' : '#FDE3C9');

  return (
    <div
      onClick={onToggleSelect}
      style={{ backgroundColor: cardColor }}
      className={cn(
        'group relative w-full max-w-[270px] aspect-[1.18/1] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 lg:p-5 border border-black/[0.04] flex flex-col justify-between transition-all duration-200 cursor-pointer select-none',
        isSelected
          ? 'ring-2 ring-[#0B57D0] shadow-md opacity-100 scale-[1.01]'
          : 'opacity-85 hover:opacity-100 hover:-translate-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md'
      )}
    >
      {/* 1. Top Header Area: Title & Selection Checkbox */}
      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-bold text-[14px] sm:text-[16px] leading-tight text-[#1F1F1F] tracking-tight truncate flex-1">
            {item.title}
          </h3>

          {/* Selection Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            aria-label={isSelected ? 'Deselect note' : 'Select note'}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0',
              isSelected
                ? 'bg-[#0B57D0] text-white ring-2 ring-white opacity-100 scale-105'
                : 'border border-black/20 bg-white/60 text-transparent hover:bg-white opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
            )}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        <p className="text-[10px] sm:text-xs text-slate-700/60 font-medium">
          {formattedDate}
        </p>

        {/* 2. Middle Content Preview */}
        <div className="pt-1 sm:pt-2 overflow-hidden">
          {isChecklist ? (
            <div className="space-y-1 sm:space-y-1.5 opacity-75">
              {checklistItems.slice(0, 3).map((ci) => (
                <div key={ci.id} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-800">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-500 shrink-0" />
                  <span className={cn('truncate', ci.isCompleted && 'line-through text-slate-500')}>
                    {ci.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-800/75 leading-relaxed line-clamp-2 sm:line-clamp-3">
              {item.content || <span className="italic text-slate-400">Empty note...</span>}
            </p>
          )}
        </div>
      </div>

      {/* 3. Bottom Action Dock */}
      <div className="pt-1.5 sm:pt-2 flex items-center justify-between mt-auto">
        <span className="text-[10px] sm:text-[11px] font-medium text-slate-700/65">
          {isChecklist ? `${completedCount}/${totalCount} tasks` : 'Note'}
        </span>

        {/* Action Discs */}
        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
            title="Restore note"
            aria-label="Restore note"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#0B57D0] flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteForever();
            }}
            title="Delete forever"
            aria-label="Delete forever"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export interface TrashProps {
  isLoading?: boolean;
}

/**
 * Screen 04: Trash & Recovery Screen View
 * Google Drive / Material 3 Floating Workspace Island.
 *
 * Requirements:
 * 1. 30-Day Auto-Purge Alert Banner with "Empty Trash now" action.
 * 2. Multi-Select Action Bar with "Select all", "Restore", and "Delete forever".
 * 3. Strict Uniform Responsive Grid with soft-deleted cards.
 * 4. Empty State illustration when trash is clear.
 * 5. Minimalist confirmation modals for batch/permanent purge.
 */
export const Trash: React.FC<TrashProps> = ({ isLoading = false }) => {
  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const restoreFolder = useNoteStore((state) => state.restoreFolder);
  const permanentlyDeleteFolder = useNoteStore((state) => state.permanentlyDeleteFolder);
  const restoreItem = useNoteStore((state) => state.restoreItem);
  const permanentlyDeleteItem = useNoteStore((state) => state.permanentlyDeleteItem);
  const emptyTrash = useNoteStore((state) => state.emptyTrash);

  // Filter soft-deleted collections
  const trashedFolders = useMemo(() => folders.filter((f) => f.isDeleted), [folders]);
  const trashedNotes = useMemo(() => items.filter((i) => i.isDeleted), [items]);
  const totalTrashCount = trashedFolders.length + trashedNotes.length;

  // Selection & UI states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'empty' | 'batch_delete' | 'single_delete';
    targetId?: string;
    targetName?: string;
    targetKind?: 'folder' | 'item';
  }>({
    isOpen: false,
    type: 'empty',
  });

  // Sort Folders
  const sortedFolders = useMemo(() => {
    const list = [...trashedFolders];
    if (sortOrder === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [trashedFolders, sortOrder]);

  // Sort Notes
  const sortedNotes = useMemo(() => {
    const list = [...trashedNotes];
    if (sortOrder === 'name') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [trashedNotes, sortOrder]);

  // All valid IDs currently in trash
  const allTrashedIds = useMemo(() => {
    return [...trashedFolders.map((f) => f.id), ...trashedNotes.map((n) => n.id)];
  }, [trashedFolders, trashedNotes]);

  const isAllSelected =
    allTrashedIds.length > 0 && selectedIds.size === allTrashedIds.length;

  // Toggle selection for a single item
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allTrashedIds));
    }
  };

  // Batch Restore
  const handleBatchRestore = () => {
    selectedIds.forEach((id) => {
      if (trashedFolders.some((f) => f.id === id)) {
        restoreFolder(id);
      } else {
        restoreItem(id);
      }
    });
    setSelectedIds(new Set());
  };

  // Confirm delete handler
  const handleConfirmAction = () => {
    if (confirmModal.type === 'empty') {
      emptyTrash();
      setSelectedIds(new Set());
    } else if (confirmModal.type === 'batch_delete') {
      selectedIds.forEach((id) => {
        if (trashedFolders.some((f) => f.id === id)) {
          permanentlyDeleteFolder(id);
        } else {
          permanentlyDeleteItem(id);
        }
      });
      setSelectedIds(new Set());
    } else if (confirmModal.type === 'single_delete' && confirmModal.targetId) {
      if (confirmModal.targetKind === 'folder') {
        permanentlyDeleteFolder(confirmModal.targetId);
      } else {
        permanentlyDeleteItem(confirmModal.targetId);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(confirmModal.targetId!);
        return next;
      });
    }
    setConfirmModal({ isOpen: false, type: 'empty' });
  };

  // Loading skeleton view
  if (isLoading) {
    return (
      <div className="w-full space-y-8 flex-1 animate-fade-in select-none">
        <div className="h-14 w-full bg-slate-100 rounded-2xl shimmer-mask" />
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-8 w-44 bg-slate-200/80 rounded-xl shimmer-mask" />
          <div className="h-8 w-32 bg-slate-100 rounded-full shimmer-mask" />
        </div>
        <GridSkeleton folderCount={2} noteCount={4} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 flex-1 animate-fade-in select-none relative pb-20">
      {/* 1. Auto-Purge Alert Banner */}
      <div className="w-full bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-amber-950">
            Items in Trash are permanently deleted after 30 days.
          </span>
        </div>

        {totalTrashCount > 0 && (
          <button
            type="button"
            onClick={() => setConfirmModal({ isOpen: true, type: 'empty' })}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer self-start sm:self-auto shrink-0 transition-colors"
          >
            Empty Trash now
          </button>
        )}
      </div>

      {/* 2. Header Bar & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] tracking-tight flex items-center gap-2.5">
              <span>Trash</span>
              <Trash2 className="w-6 h-6 text-slate-700 shrink-0" />
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {totalTrashCount} {totalTrashCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Items in trash can be restored back to your workspace or permanently deleted.
          </p>
        </div>

        {/* Right Controls Dock */}
        {totalTrashCount > 0 && (
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-full flex items-center gap-0.5 border border-black/[0.04]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-white text-[#0B57D0] shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-white text-[#0B57D0] shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Order */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'recent' ? 'name' : 'recent'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-medium border border-black/[0.04] transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {sortOrder === 'recent' ? 'Date trashed' : 'Alphabetical (A-Z)'}
              </span>
            </button>

            {/* Select All Toggle */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs font-medium text-slate-600 hover:text-[#0B57D0] bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-full border border-black/[0.04] transition-colors cursor-pointer"
            >
              {isAllSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Content Area */}
      {totalTrashCount === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4 shadow-xs">
            <Trash2 className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-[#1F1F1F]">Trash is empty</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Items you delete will show up here for 30 days before being permanently removed.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View: Continuous Responsive Grid (Folders first, Notes following) */
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            <AnimatePresence mode="popLayout">
              {/* Trashed Folders */}
              {sortedFolders.map((folder) => {
                const count = items.filter(
                  (i) => i.folderId === folder.id && i.isDeleted
                ).length;
                const isSelected = selectedIds.has(folder.id);
                return (
                  <motion.div
                    key={`folder-${folder.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                    transition={{ layout: { duration: 0.25, ease: 'easeOut' } }}
                    className="w-full flex justify-center"
                  >
                    <TrashFolderCard
                      folder={folder}
                      itemCount={count}
                      isSelected={isSelected}
                      onToggleSelect={() => toggleSelect(folder.id)}
                      onRestore={() => restoreFolder(folder.id)}
                      onDeleteForever={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: 'single_delete',
                          targetId: folder.id,
                          targetName: folder.name,
                          targetKind: 'folder',
                        })
                      }
                    />
                  </motion.div>
                );
              })}

              {/* Trashed Notes & Checklists */}
              {sortedNotes.map((note) => {
                const isSelected = selectedIds.has(note.id);
                return (
                  <motion.div
                    key={`note-${note.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                    transition={{ layout: { duration: 0.25, ease: 'easeOut' } }}
                    className="w-full flex justify-center"
                  >
                    <TrashNoteCard
                      item={note}
                      isSelected={isSelected}
                      onToggleSelect={() => toggleSelect(note.id)}
                      onRestore={() => restoreItem(note.id)}
                      onDeleteForever={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: 'single_delete',
                          targetId: note.id,
                          targetName: note.title,
                          targetKind: 'item',
                        })
                      }
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* List View: Muted List Rows */
        <div className="w-full space-y-2.5 max-w-4xl">
          <AnimatePresence mode="popLayout">
            {/* Trashed Folders */}
            {sortedFolders.map((folder) => {
              const isSelected = selectedIds.has(folder.id);
              const count = items.filter(
                (i) => i.folderId === folder.id && i.isDeleted
              ).length;
              return (
                <motion.div
                  key={`folder-row-${folder.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
                  onClick={() => toggleSelect(folder.id)}
                  className={cn(
                    'w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-[#E8F0FE]/70 border-[#0B57D0] ring-1 ring-[#0B57D0] shadow-sm'
                      : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 opacity-85 hover:opacity-100'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(folder.id);
                      }}
                      className={cn(
                        'w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-[#0B57D0] text-white'
                          : 'border border-slate-300 bg-white text-transparent hover:border-slate-400'
                      )}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <FolderIcon className="w-4 h-4 fill-purple-700" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-[#1F1F1F] truncate">
                        {folder.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {count === 0 ? 'Empty folder' : `${count} items`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreFolder(folder.id);
                      }}
                      title="Restore"
                      className="p-1.5 text-slate-600 hover:text-[#0B57D0] hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({
                          isOpen: true,
                          type: 'single_delete',
                          targetId: folder.id,
                          targetName: folder.name,
                          targetKind: 'folder',
                        })
                      }}
                      title="Delete forever"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Trashed Notes */}
            {sortedNotes.map((note) => {
              const isSelected = selectedIds.has(note.id);
              return (
                <motion.div
                  key={`note-row-${note.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
                  onClick={() => toggleSelect(note.id)}
                  style={{ backgroundColor: isSelected ? undefined : note.color || '#FDE3C9' }}
                  className={cn(
                    'w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-[#E8F0FE]/80 border-[#0B57D0] ring-1 ring-[#0B57D0] shadow-sm'
                      : 'border-black/[0.04] opacity-85 hover:opacity-100 shadow-2xs'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(note.id);
                      }}
                      className={cn(
                        'w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-[#0B57D0] text-white'
                          : 'border border-black/20 bg-white/70 text-transparent hover:border-black/40'
                      )}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-700" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-[#1F1F1F] truncate">
                        {note.title}
                      </h3>
                      <p className="text-xs text-slate-700/75 truncate mt-0.5">
                        {note.content || 'Note'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreItem(note.id);
                      }}
                      title="Restore"
                      className="p-1.5 text-slate-600 hover:text-[#0B57D0] hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({
                          isOpen: true,
                          type: 'single_delete',
                          targetId: note.id,
                          targetName: note.title,
                          targetKind: 'item',
                        });
                      }}
                      title="Delete forever"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Contextual Floating Multi-Select Action Bar (Active when ≥1 item selected) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          >
            <div className="h-12 bg-[#001D35] text-white rounded-full px-5 py-2.5 flex items-center gap-3.5 sm:gap-4 shadow-2xl border border-slate-700/40 select-none">
              {/* Clear button */}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                aria-label="Clear selection"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Selection summary */}
              <span className="text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                {selectedIds.size} {selectedIds.size === 1 ? 'item selected' : 'items selected'}
              </span>

              {/* Vertical divider */}
              <div className="w-px h-5 bg-slate-600/70" />

              {/* Batch Restore */}
              <button
                type="button"
                onClick={handleBatchRestore}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>

              {/* Batch Delete Forever */}
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, type: 'batch_delete' })}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete forever</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Minimalist Confirmation Modal Dialog */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ isOpen: false, type: 'empty' })}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 space-y-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1F1F1F]">
                  {confirmModal.type === 'empty'
                    ? 'Empty Trash?'
                    : confirmModal.type === 'batch_delete'
                    ? `Permanently delete ${selectedIds.size} ${selectedIds.size === 1 ? 'item' : 'items'}?`
                    : `Permanently delete "${confirmModal.targetName || 'this item'}"?`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {confirmModal.type === 'empty'
                    ? `All ${totalTrashCount} items in Trash will be permanently deleted from your account. This action cannot be undone.`
                    : 'This action cannot be undone. You will not be able to recover these files.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, type: 'empty' })}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
                >
                  {confirmModal.type === 'empty' ? 'Empty Trash' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trash;
