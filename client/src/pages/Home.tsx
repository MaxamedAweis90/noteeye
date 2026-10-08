import React, { useMemo, useEffect, useRef } from 'react';
import { useLocation, useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Sparkles,
  FolderPlus,
  Plus,
  Search,
  X,
  FileText,
  Folder as FolderIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FolderCard } from '../components/FolderCard';
import { NoteCard } from '../components/NoteCard';
import { GridSkeleton, NoteCardSkeleton } from '../components/skeletons';

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
  userName = 'Alex',
}) => {
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

  const recentScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollRecent = (direction: 'left' | 'right') => {
    if (recentScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      recentScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
      return activeItems.filter((i) => i.title.toLowerCase().includes(searchLower));
    }
    // Items inside current folder level
    return activeItems.filter((i) => i.folderId === currentFolderId);
  }, [activeItems, currentFolderId, isSearching, searchLower, isRecentsRoute, isFavoritesRoute]);

  const totalCollectionCount = displayedFolders.length + displayedNotes.length;
  const isRootDashboard = !currentFolderId && !isRecentsRoute && !isFavoritesRoute && !isSearching;

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
    <div className="w-full space-y-8 flex-1">
      {/* 1. TOP BREADCRUMB & CONTROLS (Rendered when inside a sub-folder or during search/filtering) */}
      {(!isRootDashboard || currentFolderId !== null) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
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
              onClick={() => navigate('/notes/new?type=note')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Note</span>
            </button>
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

      {/* 3. HERO GREETING SECTION (Root View Only) */}
      {isRootDashboard && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#1F1F1F] tracking-tight leading-tight">
              Hi, {userName} —{' '}
              <span className="italic font-normal text-[#FF6B4A]">
                ready to capture your thoughts?
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 flex flex-wrap items-center gap-2 leading-relaxed">
              <span>
                You have {activeItems.length} active notes and {activeFolders.length} folders synchronized across your workspace.
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100/90 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synced just now</span>
              </span>
            </p>
          </div>

          {/* Quick Metric Pills */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl shadow-2xs border border-slate-200/60 text-xs font-semibold text-[#1F1F1F]">
              <FolderIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeFolders.length} Folders</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeItems.length} Notes</span>
            </div>
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
              className="flex items-start gap-4 sm:gap-5 overflow-x-auto pt-3 pb-5 -mx-2 px-2 sm:-mx-3 sm:px-3 scrollbar-none scroll-smooth"
            >
              {recentItems.map((item) => (
                <div key={`recent-${item.id}`} className="w-[170px] sm:w-[215px] lg:w-[260px] shrink-0">
                  <NoteCard item={item} />
                </div>
              ))}
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
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-[#F8FAFD]/50 p-10 sm:p-14 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF2FC] text-[#0B57D0] flex items-center justify-center shadow-2xs">
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
                onClick={() => navigate('/notes/new?type=note')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Note</span>
              </button>
            </div>
          </div>
        ) : (
          /* Continuous Grid: Folder cards first, Notes following directly */
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            {/* 1. Folders render first */}
            {displayedFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={() => {
                  setCurrentFolder(folder.id);
                  navigate(`/folders/${folder.id}`);
                }}
              />
            ))}

            {/* 2. Notes and checklists follow immediately */}
            {displayedNotes.map((item) => (
              <NoteCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
