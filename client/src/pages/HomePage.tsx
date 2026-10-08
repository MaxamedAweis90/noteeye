import React, { useMemo, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  FolderPlus,
  Plus,
  Search,
} from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FolderCard } from '../components/FolderCard';
import { NoteCard } from '../components/NoteCard';

export const HomePage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isRecents = location.pathname === '/recents';
  const isFavorites = location.pathname === '/favorites';

  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const searchQuery = useNoteStore((state) => state.searchQuery);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);

  // Synchronize URL query parameter ?q= with note store
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      useNoteStore.getState().setSearchQuery(q);
    }
  }, [searchParams]);

  // Active (non-deleted) folders and items
  const activeFolders = useMemo(() => {
    return folders.filter((f) => !f.isDeleted);
  }, [folders]);

  const activeItems = useMemo(() => {
    return items.filter((i) => !i.isDeleted);
  }, [items]);

  // Current folder's children or search results
  const isSearching = searchQuery.trim().length > 0;
  const searchLower = searchQuery.toLowerCase().trim();

  // Folders to display
  const displayedFolders = useMemo(() => {
    if (isRecents) return [];
    if (isSearching) {
      return activeFolders.filter((f) => f.name.toLowerCase().includes(searchLower));
    }
    // Only display folders whose parent matches currentFolderId
    return activeFolders.filter((f) => f.parentId === currentFolderId);
  }, [activeFolders, currentFolderId, isSearching, searchLower, isRecents]);

  // Items to display
  const displayedItems = useMemo(() => {
    if (isRecents) {
      return [...activeItems].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    if (isSearching) {
      return activeItems.filter((i) => i.title.toLowerCase().includes(searchLower));
    }
    // Only display items in currentFolderId (or root items if currentFolderId is null)
    return activeItems.filter((i) => i.folderId === currentFolderId);
  }, [activeItems, currentFolderId, isSearching, searchLower, isRecents]);

  const currentFolder = activeFolders.find((f) => f.id === currentFolderId);

  const pageTitle = isRecents
    ? 'Recents'
    : isFavorites
    ? 'Favorites'
    : currentFolder
    ? currentFolder.name
    : 'Notes & Checklists';

  return (
    <div className="w-full space-y-6 flex-1">
      {/* Top Breadcrumb & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <Breadcrumbs
          currentFolderId={currentFolderId}
          folders={activeFolders}
          onNavigate={setCurrentFolder}
        />

        {/* Quick Trigger Buttons */}
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
        </div>
      </div>

      {/* Search active notice */}
      {isSearching && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#EDF2FC] border border-blue-100 text-[#0B57D0] text-xs font-medium">
          <Search className="w-4 h-4 shrink-0" />
          <span>
            Search results for "<strong>{searchQuery}</strong>" (across all folders)
          </span>
        </div>
      )}

      {/* SECTION 1: FOLDERS ROW / GRID */}
      {displayedFolders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Folders
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              {displayedFolders.length} {displayedFolders.length === 1 ? 'folder' : 'folders'}
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,260px)] gap-5 sm:gap-6">
            {displayedFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={() => setCurrentFolder(folder.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: PASTEL NOTE CARDS GRID */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {pageTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {displayedItems.length}
            </span>
          </div>
        </div>

        {displayedItems.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-[#F8FAFD]/50 p-10 sm:p-14 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF2FC] text-[#0B57D0] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">lightbulb</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1F1F1F]">
                {isSearching
                  ? 'No matching notes found'
                  : currentFolder
                  ? `This folder is currently empty`
                  : 'Start by creating your first note!'}
              </h3>
              <p className="text-xs text-[#444746] max-w-sm mx-auto leading-relaxed">
                Organize thoughts, ideas, and interactive checklists inside pastel note cards with Google Drive simplicity.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => openNoteModal('note')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                <span>Create Regular Note</span>
              </button>
              <button
                type="button"
                onClick={() => openNoteModal('checklist')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EDF2FC] hover:bg-[#E4EBFA] text-[#0B57D0] text-xs font-semibold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#10B981]">checklist</span>
                <span>Create Checklist</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,260px)] gap-5 sm:gap-6">
            {displayedItems.map((item) => (
              <NoteCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
