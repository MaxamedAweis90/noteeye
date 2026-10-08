import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  Folder as FolderIcon,
  Plus,
  Pencil,
  Trash2,
  Star,
  FileText,
  CheckSquare,
  MoreHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
  Home,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNoteStore } from '../store/useNoteStore';
import { NoteCard } from '../components/NoteCard';
import { GridSkeleton } from '../components/skeletons';
import { DetailsToggleButton } from '../components/DetailsToggleButton';
import type { Item } from '../types';
import { cn } from '../utils/cn';

/**
 * NoteListItem — Google Keep / Material 3 Horizontal List Row for Folder Notes
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

export interface FolderDetailProps {
  isLoading?: boolean;
}

/**
 * Screen 05: Folder Detail View
 * Google Drive / Material 3 Floating Workspace Island.
 *
 * Requirements:
 * 1. Breadcrumb Trail: "Collections" (or "Home") > Folder Name.
 * 2. Header Flex Row: Large folder badge, title, count pill, star toggle, rename, and delete options.
 * 3. Scoped Notes Grid: Strict 4-column responsive grid showing only notes assigned to this folder.
 * 4. Empty State: Illustrated empty state with "+ Create note here" CTA.
 * 5. Error / 404 State: Clean fallback with return link when folder does not exist.
 */
export const FolderDetail: React.FC<FolderDetailProps> = ({ isLoading = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const toggleFavoriteFolder = useNoteStore((state) => state.toggleFavoriteFolder);
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);

  // Synchronize active folder context with note store
  useEffect(() => {
    if (id) {
      setCurrentFolder(id);
    }
    return () => {
      setCurrentFolder(null);
    };
  }, [id, setCurrentFolder]);

  // Lookup active (non-deleted) folder
  const folder = useMemo(() => {
    return folders.find((f) => f.id === id && !f.isDeleted) || null;
  }, [folders, id]);

  // View Mode, Menu, and Sort states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Notes strictly assigned to this folder
  const folderNotes = useMemo(() => {
    if (!id) return [];
    const filtered = items.filter((i) => i.folderId === id && !i.isDeleted);
    if (sortOrder === 'name') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [items, id, sortOrder]);

  const handleCreateNote = (type: 'note' | 'checklist' = 'note') => {
    if (folder) {
      setCurrentFolder(folder.id);
      navigate(`/notes/new?type=${type}&folder=${folder.id}`);
    }
  };

  const handleOpenNote = (item: Item) => {
    navigate(`/notes/${item.id}`);
  };

  const formattedFolderDate = folder
    ? format(new Date(folder.updatedAt || folder.createdAt), 'd MMM yyyy')
    : '';

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="w-full space-y-8 flex-1 animate-fade-in select-none">
        <div className="h-6 w-48 bg-slate-100 rounded-md shimmer-mask" />
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl shimmer-mask" />
            <div className="space-y-2">
              <div className="h-8 w-56 bg-slate-200/80 rounded-xl shimmer-mask" />
              <div className="h-4 w-32 bg-slate-100 rounded-full shimmer-mask" />
            </div>
          </div>
          <div className="h-9 w-36 bg-slate-100 rounded-xl shimmer-mask" />
        </div>
        <GridSkeleton showFolders={false} noteCount={6} />
      </div>
    );
  }

  // Missing or Deleted Folder (404 state)
  if (!folder) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 text-center select-none animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-xs">
          <AlertCircle className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-[#1F1F1F]">Folder not found</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
          This collection may have been deleted, moved to trash, or does not exist.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B57D0] text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6 sm:space-y-8 flex-1 select-none relative"
    >
      {/* 1. Breadcrumb Trail */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 select-none"
      >
        <Link
          to="/"
          className="flex items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Collections</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-[#1F1F1F] font-bold truncate max-w-[240px] sm:max-w-md">
          {folder.name}
        </span>
      </nav>

      {/* 2. Folder Header & Meta Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        {/* Left: Badge, Title & Context Menu */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8F7BF0] to-[#5939C7] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FolderIcon className="w-6 h-6 fill-white text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] tracking-tight truncate">
                {folder.name}
              </h1>

              {/* Action Buttons: Rename, Star, More Menu */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Rename */}
                <button
                  type="button"
                  onClick={() => openFolderModal(folder)}
                  title="Rename folder"
                  aria-label="Rename folder"
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Star Toggle */}
                <button
                  type="button"
                  onClick={() => toggleFavoriteFolder(folder.id)}
                  title={folder.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  aria-label="Toggle favorite"
                  className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-slate-100"
                >
                  <Star
                    className={cn(
                      'w-4 h-4 transition-transform active:scale-125',
                      folder.isFavorite
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-400 hover:text-amber-500'
                    )}
                  />
                </button>

                {/* 3-Dots Action Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    title="Folder options"
                    aria-label="Folder options"
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <div className="absolute left-0 top-8 z-40 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-fade-in text-xs select-none">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            openFolderModal(folder);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rename folder</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            toggleFavoriteFolder(folder.id);
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
                            {folder.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            openDeleteDialog(folder.id, folder.name, 'folder');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 font-medium text-left cursor-pointer border-t border-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete folder</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Header Meta Pill */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {folderNotes.length} {folderNotes.length === 1 ? 'note' : 'notes'} inside
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-xs text-slate-400 font-medium">
                Updated {formattedFolderDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: New Note Button, Sort & View Mode */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* New Note in Folder CTA Button */}
          <button
            type="button"
            onClick={() => handleCreateNote('note')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New note</span>
          </button>

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

          {/* Details Toggle Button */}
          <DetailsToggleButton />

          {/* Sort Order */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'recent' ? 'name' : 'recent'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-medium border border-black/[0.04] transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {sortOrder === 'recent' ? 'Date modified' : 'Alphabetical (A-Z)'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Folder Notes Grid / List View */}
      {folderNotes.length === 0 ? (
        /* Empty Folder State */
        <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-xs">
            <FolderIcon className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-[#1F1F1F]">This folder is empty</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">
            Add your first note or checklist inside this collection.
          </p>
          <button
            type="button"
            onClick={() => handleCreateNote('note')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer shadow-xs active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create note here</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Continuous Responsive Notes Grid */
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            <AnimatePresence mode="popLayout">
              {folderNotes.map((note) => (
                <motion.div
                  key={note.id}
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
        /* List View */
        <div className="w-full space-y-2.5 max-w-4xl">
          <AnimatePresence mode="popLayout">
            {folderNotes.map((note) => (
              <motion.div
                key={note.id}
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

export default FolderDetail;
