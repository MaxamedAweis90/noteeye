import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cardDropVariants, cardLayoutTransition } from '../utils/animations';
import {
  ArrowRight,
  Clock,
  Sparkles,
  FolderPlus,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Star,
  CheckSquare,
  Copy,
  Scissors,
  Lightbulb,
} from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FolderCard } from '../components/FolderCard';
import { NoteCard } from '../components/NoteCard';
import { GridSkeleton, NoteCardSkeleton } from '../components/skeletons';
import { DetailsToggleButton } from '../components/DetailsToggleButton';
import { cn } from '../utils/cn';

export interface HomeProps {
  isLoading?: boolean;
  userName?: string;
}

/**
 * Screen 01: Home Screen View
 * Google Drive / Material 3 Floating White Workspace Island View.
 *
 * Architecture:
 * 1. Hero Greeting: "Hi, Alex — ready to capture your thoughts?" with sync pill & metrics.
 * 2. Recent Row: Horizontal scrollable row displaying up to 5 recently edited notes with "View more →".
 * 3. My Collections: Continuous 4-column grid (folders first, notes immediately following).
 * 4. States: Loading (GridSkeleton), Empty, and Sub-folder browsing with breadcrumbs.
 */
export const Home: React.FC<HomeProps> = ({
  isLoading = false,
  userName: propUserName,
}) => {
  const profileName = useUserStore((state) => state.user?.name);
  const authUserName = useAuthStore((state) => state.user?.name);
  const displayName = propUserName || (profileName && profileName !== 'Guest' ? profileName : null) || authUserName || 'there';
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: folderParamId } = useParams<{ id?: string }>();

  const isRecentsRoute = location.pathname === '/recents';
  const isFavoritesRoute = location.pathname === '/favorites';

  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const searchQuery = useNoteStore((state) => state.searchQuery);
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const deleteFolder = useNoteStore((state) => state.deleteFolder);
  const deleteItem = useNoteStore((state) => state.deleteItem);
  const toggleFavoriteFolder = useNoteStore((state) => state.toggleFavoriteFolder);
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);
  const copyItems = useUIStore((state) => state.copyItems);
  const cutItems = useUIStore((state) => state.cutItems);
  const selectedIds = useUIStore((state) => state.selectedIds);
  const setSelectedIds = useUIStore((state) => state.setSelectedIds);
  const toggleSelectId = useUIStore((state) => state.toggleSelectId);
  const clearMultiSelection = useUIStore((state) => state.clearMultiSelection);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean }>({ isOpen: false });

  const recentScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollRecent = (direction: 'left' | 'right') => {
    if (recentScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      recentScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [hasEntered, setHasEntered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor workspace scroll position to reactively elevate sticky header
  useEffect(() => {
    const scrollContainer = document.getElementById('workspace-content-island');
    if (!scrollContainer) return;
    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 8);
    };
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Synchronize route parameter /folders/:id with note store
  useEffect(() => {
    if (folderParamId) {
      setCurrentFolder(folderParamId);
    }
  }, [folderParamId, setCurrentFolder]);

  // Synchronize URL query parameter ?q= with note store
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      useNoteStore.getState().setSearchQuery(q);
    }
  }, [searchParams]);

  // Active (non-deleted) collections
  const activeFolders = useMemo(() => {
    return folders.filter((f) => !f.isDeleted);
  }, [folders]);

  const activeItems = useMemo(() => {
    return items.filter((i) => !i.isDeleted);
  }, [items]);

  const isSearching = searchQuery.trim().length > 0;
  const searchLower = searchQuery.toLowerCase().trim();

  // Root vs Current Folder context
  const currentFolder = useMemo(() => {
    return activeFolders.find((f) => f.id === currentFolderId) || null;
  }, [activeFolders, currentFolderId]);

  // Recent 5 Items (ordered by latest update)
  const recentItems = useMemo(() => {
    return [...activeItems]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 5);
  }, [activeItems]);

  // Collections Grid Data
  const displayedFolders = useMemo(() => {
    if (isRecentsRoute) return [];
    if (isFavoritesRoute) return [];
    if (isSearching) {
      return activeFolders.filter((f) => f.name.toLowerCase().includes(searchLower));
    }
    // Only folders belonging to the current directory level
    return activeFolders.filter((f) => f.parentId === currentFolderId);
  }, [activeFolders, currentFolderId, isSearching, searchLower, isRecentsRoute, isFavoritesRoute]);

  const displayedNotes = useMemo(() => {
    if (isRecentsRoute) {
      return [...activeItems].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
    }
    if (isFavoritesRoute) {
      return activeItems.filter((i) => i.isFavorite);
    }
    if (isSearching) {
      return activeItems.filter((i) => {
        if (i.title.toLowerCase().includes(searchLower)) return true;
        if (i.content && i.content.toLowerCase().includes(searchLower)) return true;
        if (i.checklistItems && i.checklistItems.some((c) => c.text.toLowerCase().includes(searchLower))) return true;
        if (
          i.ideaItems &&
          i.ideaItems.some(
            (ii) =>
              ii.title.toLowerCase().includes(searchLower) ||
              (ii.description && ii.description.toLowerCase().includes(searchLower))
          )
        ) {
          return true;
        }
        return false;
      });
    }
    // Items inside current folder level
    return activeItems.filter((i) => i.folderId === currentFolderId);
  }, [activeItems, currentFolderId, isSearching, searchLower, isRecentsRoute, isFavoritesRoute]);

  const totalCollectionCount = displayedFolders.length + displayedNotes.length;
  const isRootDashboard = !currentFolderId && !isRecentsRoute && !isFavoritesRoute && !isSearching;

  // All selectable items currently displayed on this dashboard view
  const allDisplayedItemIds = useMemo(() => {
    return [
      ...displayedFolders.map((f) => f.id),
      ...displayedNotes.map((n) => n.id),
    ];
  }, [displayedFolders, displayedNotes]);

  const isAllSelected =
    allDisplayedItemIds.length > 0 &&
    allDisplayedItemIds.every((id) => selectedIds.has(id));

  const handleBatchCopy = () => {
    const entries: Array<{ type: 'note' | 'folder'; id: string; name: string }> = [];
    selectedIds.forEach((id) => {
      const f = folders.find((folder) => folder.id === id);
      if (f) entries.push({ type: 'folder', id: f.id, name: f.name });
      const n = items.find((item) => item.id === id);
      if (n) entries.push({ type: 'note', id: n.id, name: n.title });
    });
    copyItems(entries);
  };

  const handleBatchCut = () => {
    const entries: Array<{ type: 'note' | 'folder'; id: string; name: string }> = [];
    selectedIds.forEach((id) => {
      const f = folders.find((folder) => folder.id === id);
      if (f) entries.push({ type: 'folder', id: f.id, name: f.name });
      const n = items.find((item) => item.id === id);
      if (n) entries.push({ type: 'note', id: n.id, name: n.title });
    });
    cutItems(entries);
  };

  // Clear selection upon route / folder navigation
  useEffect(() => {
    clearMultiSelection();
  }, [currentFolderId, location.pathname, clearMultiSelection]);

  // Keyboard shortcut listener: Escape clears selection, Ctrl+A / Cmd+A selects all, Ctrl+C / Ctrl+X copies/cuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        clearMultiSelection();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        e.preventDefault();
        setSelectedIds(new Set(allDisplayedItemIds));
      }
      if ((e.ctrlKey || e.metaKey) && selectedIds.size > 0) {
        if (e.key === 'c' || e.key === 'C') {
          const activeTag = document.activeElement?.tagName?.toLowerCase();
          if (activeTag === 'input' || activeTag === 'textarea') return;
          e.preventDefault();
          handleBatchCopy();
        }
        if (e.key === 'x' || e.key === 'X') {
          const activeTag = document.activeElement?.tagName?.toLowerCase();
          if (activeTag === 'input' || activeTag === 'textarea') return;
          e.preventDefault();
          handleBatchCut();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, allDisplayedItemIds, folders, items, clearMultiSelection, setSelectedIds]);

  const handleToggleSelect = (id: string) => {
    toggleSelectId(id);
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      clearMultiSelection();
    } else {
      setSelectedIds(new Set(allDisplayedItemIds));
    }
  };

  const handleBatchStar = () => {
    const selectedFolders = folders.filter((f) => selectedIds.has(f.id));
    const selectedNotes = items.filter((i) => selectedIds.has(i.id));
    const allStarred =
      (selectedFolders.length === 0 || selectedFolders.every((f) => f.isFavorite)) &&
      (selectedNotes.length === 0 || selectedNotes.every((i) => i.isFavorite));

    selectedFolders.forEach((f) => {
      if (allStarred ? f.isFavorite : !f.isFavorite) {
        toggleFavoriteFolder(f.id);
      }
    });
    selectedNotes.forEach((i) => {
      if (allStarred ? i.isFavorite : !i.isFavorite) {
        toggleFavoriteItem(i.id);
      }
    });
  };

  const handleBatchTrash = () => {
    selectedIds.forEach((id) => {
      if (folders.some((f) => f.id === id)) {
        deleteFolder(id);
      } else {
        deleteItem(id);
      }
    });
    clearMultiSelection();
    setConfirmModal({ isOpen: false });
  };

  // Render Skeleton view if loading (Zero CLS Layout Transition)
  if (isLoading) {
    return (
      <div className="w-full space-y-8 flex-1 animate-fade-in select-none">
        {/* 1. Hero Skeleton (Root Dashboard only) */}
        {isRootDashboard && (
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="h-8 w-64 sm:w-80 bg-slate-200/80 rounded-xl shimmer-mask" />
              <div className="h-4 w-72 sm:w-96 bg-slate-200/60 rounded-lg shimmer-mask" />
            </div>
            <div className="h-10 w-44 bg-slate-100 rounded-2xl shimmer-mask self-start md:self-auto" />
          </header>
        )}

        {/* 2. Recent Section Skeleton (Root Dashboard only) */}
        {isRootDashboard && (
          <section className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 bg-slate-200/80 rounded-md shimmer-mask" />
                <div className="h-4 w-6 bg-slate-200/60 rounded-full shimmer-mask" />
              </div>
              <div className="h-4 w-20 bg-slate-200/60 rounded-md shimmer-mask" />
            </div>
            <div className="flex items-start gap-4 sm:gap-5 overflow-x-auto pt-3 pb-5 -mx-2 px-2 sm:-mx-3 sm:px-3 scrollbar-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`recent-skel-${i}`} className="w-[170px] sm:w-[215px] lg:w-[260px] shrink-0">
                  <NoteCardSkeleton />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. My Collections Grid Skeleton */}
        <GridSkeleton
          folderCount={isRootDashboard ? 3 : 0}
          noteCount={6}
          showFolders={isRootDashboard}
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
      onAnimationComplete={() => setHasEntered(true)}
      style={{ transform: hasEntered ? 'none' : undefined }}
      className="w-full space-y-8 flex-1"
    >
      {/* 1. TOP BREADCRUMB & CONTROLS (Rendered when inside a sub-folder or during search/filtering) */}
      {(!isRootDashboard || currentFolderId !== null) && (
        <div
          className={cn(
            'sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 bg-white/95 backdrop-blur-md rounded-t-2xl md:rounded-t-[24px] transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
            isScrolled
              ? 'border-b border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
              : 'border-b border-transparent shadow-none'
          )}
        >
          <Breadcrumbs
            currentFolderId={currentFolderId}
            folders={activeFolders}
            onNavigate={setCurrentFolder}
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => openFolderModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#1F1F1F] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>New Folder</span>
            </button>
            <button
              type="button"
              onClick={() => openNoteModal('note')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Note</span>
            </button>
            <button
              type="button"
              onClick={() => openNoteModal('idea')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
              <span>New Idea</span>
            </button>
            <DetailsToggleButton className="hidden md:flex" />
          </div>
        </div>
      )}

      {/* 2. SEARCH NOTIFICATION BANNER */}
      {isSearching && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-[#EDF2FC] border border-blue-100 text-[#0B57D0] text-xs font-medium">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 shrink-0" />
            <span>
              Searching for <strong>"{searchQuery}"</strong> • Found {totalCollectionCount} {totalCollectionCount === 1 ? 'result' : 'results'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* 3. HERO GREETING SECTION (Root View Only - Sticky at Top of Workspace Island) */}
      {isRootDashboard && (
        <header
          className={cn(
            'sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3.5 bg-white/95 backdrop-blur-md rounded-t-2xl md:rounded-t-[24px] transition-all duration-200 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6',
            isScrolled
              ? 'border-b border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
              : 'border-b border-transparent shadow-none'
          )}
        >
          <div className="max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-[32px] font-display font-bold text-[#1F1F1F] tracking-tight leading-tight">
              Hi, {displayName} —{' '}
              <span className="font-handwriting font-medium text-2xl sm:text-3xl text-[#FF6B4A]">
                ready to capture your thoughts?
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              You have {activeItems.length} active notes and {activeFolders.length} folders synchronized across your workspace.
            </p>
          </div>

          {/* Details Toggle (Desktop only) */}
          <div className="hidden md:flex items-center gap-2 self-start md:self-auto shrink-0">
            <DetailsToggleButton />
          </div>
        </header>
      )}

      {/* 4. "RECENT" QUICK-ACCESS HORIZONTAL ROW (Root View Only) */}
      {isRootDashboard && recentItems.length > 0 && (
        <section className="flex flex-col space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Recent</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {recentItems.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Desktop Scroll Chevrons */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScrollRecent('left')}
                  aria-label="Scroll recent left"
                  className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollRecent('right')}
                  aria-label="Scroll recent right"
                  className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Link
                to="/recents"
                className="text-xs font-semibold text-[#0B57D0] hover:underline flex items-center gap-1 cursor-pointer transition-all group"
              >
                <span>View more</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Horizontal Scrolling Row */}
          <div className="relative">
            <div
              ref={recentScrollRef}
              className="flex items-start gap-4 sm:gap-5 overflow-x-auto pt-3 pb-5 -mx-2 px-2 sm:-mx-3 sm:px-3 no-scrollbar scrollbar-none scroll-smooth"
            >
              <AnimatePresence>
                {recentItems.map((item) => (
                  <motion.div
                    key={`recent-${item.id}`}
                    layout
                    variants={cardDropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ layout: cardLayoutTransition }}
                    className="w-[170px] sm:w-[215px] lg:w-[260px] shrink-0"
                  >
                    <NoteCard
                      item={item}
                      isSelectedMulti={selectedIds.has(item.id)}
                      isMultiSelectMode={selectedIds.size > 0}
                      onToggleSelect={() => handleToggleSelect(item.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* 5. "MY COLLECTIONS" MAIN SECTION */}
      <section className="flex flex-col space-y-4 pt-1">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F1F1F] tracking-tight">
              {isRecentsRoute
                ? 'Recent Activity'
                : isFavoritesRoute
                ? 'Favorite Collections'
                : currentFolder
                ? currentFolder.name
                : 'My Collections'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRecentsRoute
                ? 'Notes and checklists ordered by latest modification'
                : isFavoritesRoute
                ? 'Starred quick reference notes and boards'
                : currentFolder
                ? `Viewing items inside ${currentFolder.name}`
                : 'Organized directories & pinned scratchpads'}
            </p>
          </div>

          {/* Right Count Chip */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              {totalCollectionCount} {totalCollectionCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* 6. CONTINUOUS GRID (Sidebar-aware responsive columns) */}
        {totalCollectionCount === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-[#F8FAFD]/50 p-6 sm:p-14 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-3 sm:my-6 space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EDF2FC] text-[#0B57D0] flex items-center justify-center shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1F1F1F]">
                {isSearching
                  ? 'No matching notes or folders found'
                  : currentFolder
                  ? `This folder is currently empty`
                  : 'Start by creating your first note!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Organize thoughts, ideas, and interactive checklists inside pastel note cards with Google Drive simplicity.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => openFolderModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#1F1F1F] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>New Folder</span>
              </button>
              <button
                type="button"
                onClick={() => openNoteModal('note')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Note</span>
              </button>
              <button
                type="button"
                onClick={() => openNoteModal('idea')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                <span>New Idea</span>
              </button>
            </div>
          </div>
        ) : (
          /* Continuous Grid: Folder cards first, Notes following directly */
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            <AnimatePresence>
              {/* 1. Folders render first */}
              {displayedFolders.map((folder) => (
                <motion.div
                  key={`folder-${folder.id}`}
                  layout
                  variants={cardDropVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ layout: cardLayoutTransition }}
                  className="w-full flex justify-center"
                >
                  <FolderCard
                    folder={folder}
                    onOpen={() => {
                      setCurrentFolder(folder.id);
                      navigate(`/folders/${folder.id}`);
                    }}
                    isSelectedMulti={selectedIds.has(folder.id)}
                    isMultiSelectMode={selectedIds.size > 0}
                    onToggleSelect={() => handleToggleSelect(folder.id)}
                  />
                </motion.div>
              ))}

              {/* 2. Notes and checklists follow immediately */}
              {displayedNotes.map((item) => (
                <motion.div
                  key={`note-${item.id}`}
                  layout
                  variants={cardDropVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ layout: cardLayoutTransition }}
                  className="w-full flex justify-center"
                >
                  <NoteCard
                    key={item.id}
                    item={item}
                    isSelectedMulti={selectedIds.has(item.id)}
                    isMultiSelectMode={selectedIds.size > 0}
                    onToggleSelect={() => handleToggleSelect(item.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* 7. Contextual Floating Multi-Select Action Dock (Active when ≥1 item selected) */}
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
                onClick={() => clearMultiSelection()}
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

              {/* Select All Toggle */}
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#7BB1FF]" />
                <span>{isAllSelected ? 'Deselect all' : 'Select all'}</span>
              </button>

              {/* Vertical divider */}
              <div className="w-px h-5 bg-slate-600/70" />

              {/* Batch Star Toggle */}
              <button
                type="button"
                onClick={handleBatchStar}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Star</span>
              </button>

              {/* Vertical divider */}
              <div className="w-px h-5 bg-slate-600/70" />

              {/* Batch Cut */}
              <button
                type="button"
                onClick={handleBatchCut}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <Scissors className="w-3.5 h-3.5 text-slate-300" />
                <span>Cut</span>
              </button>

              {/* Batch Copy */}
              <button
                type="button"
                onClick={handleBatchCopy}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copy</span>
              </button>

              {/* Vertical divider */}
              <div className="w-px h-5 bg-slate-600/70" />

              {/* Batch Delete / Move to Trash */}
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true })}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to trash</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. Minimalist Confirmation Modal Dialog for Batch Trash */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ isOpen: false })}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 space-y-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1F1F1F]">
                  Move {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} to Trash?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  These items will be moved to Trash. You can restore them anytime within 30 days.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false })}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchTrash}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
                >
                  Move to Trash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Home;
