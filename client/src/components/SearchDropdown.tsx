import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Folder as FolderIcon,
  FileText,
  CheckSquare,
  CornerDownLeft,
  X,
} from 'lucide-react';
import type { Folder, Item } from '../types';

export interface SearchDropdownProps {
  isOpen: boolean;
  query: string;
  recentSearches: string[];
  folders: Folder[];
  items: Item[];
  onSelectRecent: (search: string) => void;
  onRemoveRecent: (search: string, e: React.MouseEvent) => void;
  onSelectFolder: (folderId: string, folderName: string) => void;
  onSelectItem: (item: Item) => void;
  onViewAllResults: () => void;
}

const springPhysics = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

type MatchItem =
  | { kind: 'folder'; data: Folder }
  | { kind: 'item'; data: Item };

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isOpen,
  query,
  recentSearches,
  folders,
  items,
  onSelectRecent,
  onRemoveRecent,
  onSelectFolder,
  onSelectItem,
  onViewAllResults,
}) => {
  const trimmedQuery = query.trim();
  const searchLower = trimmedQuery.toLowerCase();
  const isQueryMode = trimmedQuery.length > 0;

  // Active (non-deleted) matches capped at 5 total items
  const matches = useMemo<MatchItem[]>(() => {
    if (!isQueryMode) return [];

    const activeFolders = folders.filter(
      (f) => !f.isDeleted && f.name.toLowerCase().includes(searchLower)
    );

    const activeItems = items.filter(
      (i) =>
        !i.isDeleted &&
        (i.title.toLowerCase().includes(searchLower) ||
          (i.content && i.content.toLowerCase().includes(searchLower)))
    );

    const combined: MatchItem[] = [
      ...activeFolders.map((f) => ({ kind: 'folder' as const, data: f })),
      ...activeItems.map((i) => ({ kind: 'item' as const, data: i })),
    ];

    return combined.slice(0, 5);
  }, [folders, items, isQueryMode, searchLower]);

  // Dropdown Display Rules:
  // Rule A: If user focuses on empty input with NO recent searches, DO NOT open.
  // Rule B: If empty input and user HAS recent searches, show recent searches.
  // Rule C: If user types query (query.length > 0), filter and show matching items (max 5).
  if (!isOpen) return null;
  if (!isQueryMode && recentSearches.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={springPhysics}
        className="absolute top-12 left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-2"
        role="listbox"
        aria-label="Search suggestions"
        onMouseDown={(e) => {
          // Prevent input blur before click finishes
          e.preventDefault();
        }}
      >
        <motion.div layout transition={springPhysics} className="flex flex-col gap-0.5">
          {/* Mode 1: Recent Searches (When Query Is Empty) */}
          {!isQueryMode && (
            <>
              <div className="px-3 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none">
                  Recent Searches
                </span>
              </div>

              {recentSearches.slice(0, 5).map((search) => (
                <motion.div
                  key={search}
                  layout="position"
                  transition={springPhysics}
                  onClick={() => onSelectRecent(search)}
                  className="hover:bg-[#F1F5F9] rounded-xl px-3 py-2 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-[#1F1F1F] font-medium truncate">
                      {search}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => onRemoveRecent(search, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200/70 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                    aria-label={`Remove recent search for ${search}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </>
          )}

          {/* Mode 2: Live Search Matches (When Query Is Present) */}
          {isQueryMode && (
            <>
              {matches.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-slate-500">
                    No results found for &ldquo;<span className="font-semibold text-slate-700">{trimmedQuery}</span>&rdquo;
                  </p>
                </div>
              ) : (
                matches.map((match) => {
                  if (match.kind === 'folder') {
                    const folder = match.data;
                    return (
                      <motion.div
                        key={folder.id}
                        layout="position"
                        transition={springPhysics}
                        onClick={() => onSelectFolder(folder.id, folder.name)}
                        className="hover:bg-[#F1F5F9] rounded-xl px-3 py-2 cursor-pointer transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-sm font-medium text-[#1F1F1F] truncate">
                            {folder.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                          Folder
                        </span>
                      </motion.div>
                    );
                  }

                  const item = match.data;
                  const isChecklist = item.type === 'checklist';
                  return (
                    <motion.div
                      key={item.id}
                      layout="position"
                      transition={springPhysics}
                      onClick={() => onSelectItem(item)}
                      className="hover:bg-[#F1F5F9] rounded-xl px-3 py-2 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecklist ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-[#1F1F1F] truncate">
                          {item.title || (isChecklist ? 'Untitled Checklist' : 'Untitled Note')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        {isChecklist ? 'Checklist' : 'Note'}
                      </span>
                    </motion.div>
                  );
                })
              )}

              {/* Footer Row (Only Shown When Active Matches Exist) */}
              {matches.length > 0 && (
                <motion.div layout="position" transition={springPhysics}>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={onViewAllResults}
                      className="text-xs font-semibold text-[#0B57D0] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <span>All results</span>
                      <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
