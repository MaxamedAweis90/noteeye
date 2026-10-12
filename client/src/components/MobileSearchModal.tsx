import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Folder as FolderIcon, FileText, Clock, ArrowRight } from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';
import { getRecentSearches, saveRecentSearch, removeRecentSearch } from '../utils/recentSearches';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MobileSearchModal Component
 * Full-screen auto-focused morphing search popup for mobile screens.
 * Contains search input, recent searches chips, live folder & note results, and direct navigation.
 */
export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const items = useNoteStore((state) => state.items);
  const folders = useNoteStore((state) => state.folders);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const cleanQuery = query.trim().toLowerCase();

  const matchingFolders = cleanQuery
    ? folders.filter((f) => !f.isDeleted && f.name.toLowerCase().includes(cleanQuery)).slice(0, 5)
    : [];

  const matchingNotes = cleanQuery
    ? items
        .filter(
          (i) =>
            !i.isDeleted &&
            (i.title.toLowerCase().includes(cleanQuery) ||
              (i.body && i.body.toLowerCase().includes(cleanQuery)))
        )
        .slice(0, 8)
    : [];

  const handleSelectNote = (id: string, title: string) => {
    if (title.trim()) {
      setRecentSearches(saveRecentSearch(title.trim()));
    }
    onClose();
    navigate(`/notes/${id}`);
  };

  const handleSelectFolder = (id: string, name: string) => {
    if (name.trim()) {
      setRecentSearches(saveRecentSearch(name.trim()));
    }
    onClose();
    navigate(`/folders/${id}`);
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    setRecentSearches(saveRecentSearch(term));
  };

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches(removeRecentSearch(term));
  };

  const handleViewAll = () => {
    if (cleanQuery) {
      saveRecentSearch(cleanQuery);
      onClose();
      navigate(`/search?q=${encodeURIComponent(cleanQuery)}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.18 }}
          className="md:hidden fixed inset-0 z-50 bg-[#F8FAFD] flex flex-col select-none"
        >
          {/* Header Search Input Bar */}
          <div className="h-16 px-4 bg-white border-b border-slate-200/80 flex items-center gap-3">
            <div className="flex-1 flex items-center bg-[#F8FAFD] border border-slate-200/80 rounded-2xl px-3.5 py-2.5 focus-within:bg-white focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 transition-all">
              <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, checklists, and folders..."
                className="w-full bg-transparent text-sm text-[#1F1F1F] placeholder-slate-400 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recent Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleSelectRecent(term)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(e, term)}
                        className="p-0.5 text-slate-300 hover:text-slate-600 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Search Results */}
            {query && (
              <div className="flex flex-col gap-4">
                {/* Folders Section */}
                {matchingFolders.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Folders ({matchingFolders.length})
                    </span>
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 shadow-2xs">
                      {matchingFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleSelectFolder(folder.id, folder.name)}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FolderIcon className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-800 truncate">
                              {folder.name}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {matchingNotes.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Notes ({matchingNotes.length})
                    </span>
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 shadow-2xs">
                      {matchingNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => handleSelectNote(note.id, note.title)}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-slate-800 truncate">
                                {note.title}
                              </span>
                              {note.body && (
                                <span className="text-xs text-slate-400 truncate mt-0.5">
                                  {note.body}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results Fallback */}
                {matchingFolders.length === 0 && matchingNotes.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No matching results</p>
                    <p className="text-xs text-slate-400">
                      No notes or folders found matching "{query}"
                    </p>
                  </div>
                )}

                {/* View Full Search Page Link */}
                {(matchingFolders.length > 0 || matchingNotes.length > 0) && (
                  <button
                    type="button"
                    onClick={handleViewAll}
                    className="w-full py-3 rounded-2xl bg-[#1F1F1F] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer shadow-xs"
                  >
                    View All Results for "{query}"
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileSearchModal;
