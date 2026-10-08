import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Folder as FolderIcon,
  FileText,
  CheckSquare,
  LayoutGrid,
  List,
  ArrowUpDown,
  Edit3,
  Trash2,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNoteStore } from '../store/useNoteStore';
import { NoteCard } from '../components/NoteCard';
import { FolderCard } from '../components/FolderCard';
import { GridSkeleton } from '../components/skeletons';
import type { Item, Folder } from '../types';
import { cn } from '../utils/cn';

/**
 * NoteListItem — Google Keep / Material 3 Horizontal List Row for Notes & Checklists
 */
interface NoteListItemProps {
  item: Item;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({
  item,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const isChecklist = item.type === 'checklist';
  const checklistItems = item.checklistItems || [];
  const completedCount = checklistItems.filter((c) => c.isCompleted).length;
  const totalCount = checklistItems.length;

  const formattedDate = format(
    new Date(item.updatedAt || item.createdAt),
    'd MMM yyyy, h:mm a'
  );

  return (
    <div
      onClick={onOpen}
      style={{ backgroundColor: item.color || '#FDE3C9' }}
      className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-black/[0.04] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group select-none"
    >
      {/* Left Icon + Title + Snippet */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
          {isChecklist ? (
            <CheckSquare className="w-4 h-4 text-slate-700" />
          ) : (
            <FileText className="w-4 h-4 text-slate-700" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-[#1F1F1F] truncate">
              {item.title}
            </h3>
          </div>

          <p className="text-xs text-slate-700/75 truncate mt-0.5">
            {isChecklist
              ? `${completedCount}/${totalCount} completed • ${checklistItems.map((c) => c.text).join(', ') || 'No tasks'}`
              : item.content || <span className="italic text-slate-400">Empty note...</span>}
          </p>
        </div>
      </div>

      {/* Right Meta & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <span className="text-[11px] sm:text-xs text-slate-600/80 font-medium hidden md:inline">
          {formattedDate}
        </span>

        {/* Dedicated Star Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95',
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
                : 'text-slate-400 hover:text-amber-500'
            )}
          />
        </button>

        {/* Quick Edit & Delete Buttons */}
        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit note"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete note"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * FolderListItem — Material 3 Horizontal List Row for Folders
 */
interface FolderListItemProps {
  folder: Folder;
  itemCount: number;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const FolderListItem: React.FC<FolderListItemProps> = ({
  folder,
  itemCount,
  onOpen,
  onToggleFavorite,
  onRename,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const formattedDate = format(
    new Date(folder.updatedAt || folder.createdAt),
    'd MMM yyyy'
  );

  return (
    <div
      onClick={onOpen}
      className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 bg-[#F5F2FF] hover:bg-[#EFEAFF] border border-[#7B61FF]/15 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group select-none"
    >
      {/* Left Icon + Title + Count */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-[#7B61FF]/15 text-[#6D4DE0] flex items-center justify-center shrink-0">
          <FolderIcon className="w-4 h-4 fill-[#6D4DE0]" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm sm:text-base text-[#1F1F1F] truncate">
            {folder.name}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {itemCount === 0 ? 'Empty folder' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          </p>
        </div>
      </div>

      {/* Right Meta & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <span className="text-[11px] sm:text-xs text-slate-500 font-medium hidden md:inline">
          {formattedDate}
        </span>

        {/* Dedicated Star Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={folder.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          <Star
            className={cn(
              'w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125',
              folder.isFavorite
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-400 hover:text-amber-500'
            )}
          />
        </button>

        {/* 3-Dots Popover Action Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Folder options"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-9 z-40 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-fade-in text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRename();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleFavorite();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                >
                  <Star
                    className={cn(
                      'w-3.5 h-3.5',
                      folder.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                    )}
                  />
                  <span>
                    {folder.isFavorite ? 'Remove from Favorites' : 'Favorite'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 font-medium text-left cursor-pointer border-t border-slate-100"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export interface FavoritesProps {
  isLoading?: boolean;
}

/**
 * Screen 03: Favorites Screen View
 * Google Drive / Material 3 Floating Workspace Island.
 *
 * Requirements:
 * 1. Header Bar: "Favorites" title, amber star indicator, subtitle, and total count badge.
 * 2. Main Grid Architecture: Uniform continuous responsive grid with Folders first, Notes immediately following.
 * 3. Empty State: Centered container with amber star badge when no favorites exist.
 * 4. Interactive Updates: Smooth Framer Motion dismissal when an item or folder is unstarred.
 * 5. Navigation: Note click opens QuickEditModal; folder click navigates to `/folders/:id`.
 */
export const Favorites: React.FC<FavoritesProps> = ({ isLoading = false }) => {
  const navigate = useNavigate();

  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const toggleFavoriteFolder = useNoteStore((state) => state.toggleFavoriteFolder);
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);

  // View, Filter, and Sort states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'folders' | 'notes'>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');

  // Filter active starred folders (excluding trash)
  const favoriteFolders = useMemo(() => {
    return folders.filter((f) => !f.isDeleted && Boolean(f.isFavorite));
  }, [folders]);

  // Filter active starred notes and checklists (excluding trash)
  const favoriteNotes = useMemo(() => {
    return items.filter((i) => !i.isDeleted && Boolean(i.isFavorite));
  }, [items]);

  // Sort Folders
  const sortedFolders = useMemo(() => {
    const list = [...favoriteFolders];
    if (sortOrder === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [favoriteFolders, sortOrder]);

  // Sort Notes
  const sortedNotes = useMemo(() => {
    const list = [...favoriteNotes];
    if (sortOrder === 'name') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [favoriteNotes, sortOrder]);

  // Apply tab filter: 'all' | 'folders' | 'notes'
  const displayedFolders = filterType === 'notes' ? [] : sortedFolders;
  const displayedNotes = filterType === 'folders' ? [] : sortedNotes;

  const totalFavoritesCount = favoriteFolders.length + favoriteNotes.length;
  const isOverallEmpty = totalFavoritesCount === 0;
  const isCurrentFilterEmpty = displayedFolders.length === 0 && displayedNotes.length === 0;

  // Handlers
  const handleOpenFolder = (folderId: string) => {
    setCurrentFolder(folderId);
    navigate(`/folders/${folderId}`);
  };

  const handleOpenNote = (item: Item) => {
    navigate(`/notes/${item.id}`);
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="w-full space-y-8 flex-1 animate-fade-in select-none">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b border-slate-100">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200/80 rounded-xl shimmer-mask" />
            <div className="h-4 w-72 bg-slate-200/60 rounded-lg shimmer-mask" />
          </div>
          <div className="h-9 w-40 bg-slate-100 rounded-full shimmer-mask" />
        </div>

        {/* Unified Loading Grid Skeleton */}
        <GridSkeleton
          folderCount={3}
          noteCount={6}
          showFolders={true}
          showNotes={true}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6 sm:space-y-8 flex-1 select-none"
    >
      {/* 1. Header Bar Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] tracking-tight flex items-center gap-2.5">
              <span>Favorites</span>
              <Star className="w-6 h-6 fill-amber-400 text-amber-400 shrink-0" />
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#C2E7FF] text-[#001D35]">
              {totalFavoritesCount} {totalFavoritesCount === 1 ? 'Starred' : 'Starred'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quick access to your pinned notes and folders.
          </p>
        </div>

        {/* Right Controls Dock */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* View Mode Toggle (Grid / List) */}
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

          {/* Filter Pills (All, Folders, Notes) */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-black/[0.04] text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer',
                filterType === 'all'
                  ? 'bg-white text-[#1F1F1F] shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              All ({totalFavoritesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('folders')}
              className={cn(
                'px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer',
                filterType === 'folders'
                  ? 'bg-white text-[#1F1F1F] shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Folders ({favoriteFolders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('notes')}
              className={cn(
                'px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer',
                filterType === 'notes'
                  ? 'bg-white text-[#1F1F1F] shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Notes ({favoriteNotes.length})
            </button>
          </div>

          {/* Sort Pill Dropdown */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'recent' ? 'name' : 'recent'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-medium border border-black/[0.04] transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {sortOrder === 'recent' ? 'Recently updated' : 'Alphabetical (A-Z)'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      {isCurrentFilterEmpty ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-xs">
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-[#1F1F1F]">
            {isOverallEmpty ? 'No favorites yet' : 'No favorites in this category'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            {isOverallEmpty
              ? 'Click the star icon on any note, or use the menu on a folder to pin your favorites here for quick access.'
              : 'Try selecting "All" to view all your starred folders and notes.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* 3. Main Grid Architecture (Strict Uniform Geometry with Smooth Framer Motion Removal) */
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            <AnimatePresence mode="popLayout">
              {/* Starred Folders render first */}
              {displayedFolders.map((folder) => (
                <motion.div
                  key={`folder-${folder.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ layout: { duration: 0.25, ease: 'easeOut' } }}
                  className="w-full flex justify-center"
                >
                  <FolderCard
                    folder={folder}
                    onOpen={() => handleOpenFolder(folder.id)}
                  />
                </motion.div>
              ))}

              {/* Starred Notes follow immediately in continuous grid */}
              {displayedNotes.map((note) => (
                <motion.div
                  key={`note-${note.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ layout: { duration: 0.25, ease: 'easeOut' } }}
                  className="w-full flex justify-center"
                >
                  <NoteCard
                    item={note}
                    onEdit={() => handleOpenNote(note)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* 4. List View Architecture (Continuous List with Smooth Framer Motion Removal) */
        <div className="w-full space-y-2.5 max-w-4xl">
          <AnimatePresence mode="popLayout">
            {/* Starred Folders first */}
            {displayedFolders.map((folder) => {
              const count = items.filter(
                (i) => i.folderId === folder.id && !i.isDeleted
              ).length;
              return (
                <motion.div
                  key={`folder-row-${folder.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
                >
                  <FolderListItem
                    folder={folder}
                    itemCount={count}
                    onOpen={() => handleOpenFolder(folder.id)}
                    onToggleFavorite={() => toggleFavoriteFolder(folder.id)}
                    onRename={() => openFolderModal(folder)}
                    onDelete={() => openDeleteDialog(folder.id, folder.name, 'folder')}
                  />
                </motion.div>
              );
            })}

            {/* Starred Notes follow */}
            {displayedNotes.map((note) => (
              <motion.div
                key={`note-row-${note.id}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
              >
                <NoteListItem
                  item={note}
                  onOpen={() => handleOpenNote(note)}
                  onEdit={() => handleOpenNote(note)}
                  onDelete={() =>
                    openDeleteDialog(
                      note.id,
                      note.title,
                      note.type === 'checklist' ? 'checklist' : 'note'
                    )
                  }
                  onToggleFavorite={() => toggleFavoriteItem(note.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default Favorites;
