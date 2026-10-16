import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  CheckSquare,
  Folder as FolderIcon,
  ExternalLink,
  Palette,
  User,
  Lightbulb,
} from '@/components/ui/icons';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useNoteStore } from '../store/useNoteStore';
import { cn } from '../utils/cn';

/**
 * DetailsPanel Component — Google Drive Faithful Integrated Details Island
 * Standalone white island matching the exact rounded edges (rounded-[24px]) of the content loader.
 * Displays "Select an item to see the details" when idle, and comprehensive details/activity when selected.
 */
export const DetailsPanel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetailsPanelOpen = useUIStore((state) => state.isDetailsPanelOpen);
  const closeDetailsPanel = useUIStore((state) => state.closeDetailsPanel);
  const selectedItemId = useUIStore((state) => state.selectedItemId);
  const selectedItemType = useUIStore((state) => state.selectedItemType);

  const items = useNoteStore((state) => state.items);
  const folders = useNoteStore((state) => state.folders);

  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  // Lookup selected entity
  const selectedNote = selectedItemType !== 'folder' && selectedItemId
    ? items.find((i) => i.id === selectedItemId && !i.isDeleted)
    : null;

  const selectedFolder = selectedItemType === 'folder' && selectedItemId
    ? folders.find((f) => f.id === selectedItemId && !f.isDeleted)
    : null;

  const hasSelectedItem = Boolean(selectedNote || selectedFolder);

  const isChecklist = selectedNote?.type === 'checklist';
  const isIdea = selectedNote?.type === 'idea';

  // Derived metadata
  const itemTitle = selectedNote
    ? selectedNote.title
    : selectedFolder
    ? selectedFolder.name
    : '';

  const itemTypeLabel = selectedFolder
    ? 'Noteeye Collection'
    : isIdea
    ? 'Idea Board'
    : isChecklist
    ? 'Checklist Note'
    : 'Standard Note';

  // Parent location
  const parentFolder = selectedNote?.folderId
    ? folders.find((f) => f.id === selectedNote.folderId)
    : selectedFolder?.parentId
    ? folders.find((f) => f.id === selectedFolder.parentId)
    : null;
  const locationLabel = parentFolder
    ? parentFolder.name
    : selectedFolder
    ? 'Collections (Root)'
    : 'My Workspace';

  // Timestamps
  const rawCreatedAt = selectedNote?.createdAt || selectedFolder?.createdAt || new Date().toISOString();
  const rawUpdatedAt = selectedNote?.updatedAt || selectedFolder?.updatedAt || rawCreatedAt;

  const formattedCreated = format(new Date(rawCreatedAt), 'MMM d, yyyy');
  const formattedModified = format(new Date(rawUpdatedAt), 'MMM d, yyyy');
  const relativeModified = formatDistanceToNow(new Date(rawUpdatedAt), { addSuffix: true });

  const folderNotesCount = selectedFolder
    ? items.filter((i) => i.folderId === selectedFolder.id && !i.isDeleted).length
    : 0;
  const folderSubfolderCount = selectedFolder
    ? folders.filter((f) => f.parentId === selectedFolder.id && !f.isDeleted).length
    : 0;
  const totalFolderItemsCount = folderNotesCount + folderSubfolderCount;

  const handleOpenItem = () => {
    if (selectedFolder) {
      navigate(`/folders/${selectedFolder.id}`);
    } else if (selectedNote) {
      navigate(`/notes/${selectedNote.id}`);
    }
  };

  // DetailsPanel is disabled in note editor
  if (location.pathname.startsWith('/notes')) {
    return null;
  }

  return (
    <AnimatePresence>
      {isDetailsPanelOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-xs select-none"
            onClick={closeDetailsPanel}
          />
          <motion.aside
            data-details-panel
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm lg:static lg:z-20 lg:w-80 xl:w-88 shrink-0 bg-white dark:bg-[#111827] rounded-l-2xl lg:rounded-2xl md:rounded-[24px] h-full lg:h-[calc(100vh-5rem)] shadow-2xl lg:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none border-l lg:border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden lg:sticky lg:top-20 select-none transition-colors duration-200"
          >
          {!hasSelectedItem ? (
            /* Empty State: Matching Google Drive Reference (when no item is selected) */
            <div className="flex-1 flex flex-col h-full">
              {/* Top Row with Close Button */}
              <div className="h-14 px-4 sm:px-5 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={closeDetailsPanel}
                  title="Close details"
                  aria-label="Close details"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Centered Minimalist Message Matching Favorites and Trash */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 text-center select-none animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 shadow-xs">
                  <FileText className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-[#1F1F1F] dark:text-slate-100">
                  No item selected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] mt-1 leading-relaxed">
                  Select a note or folder to inspect its details and activity.
                </p>
              </div>
            </div>
          ) : (
            /* Populated Item Details & Activity State */
            <>
              {/* 1. Header Row */}
              <div className="h-14 px-4 sm:px-5 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedFolder ? (
                    <FolderIcon className="w-4 h-4 text-purple-600 fill-purple-100 dark:fill-purple-950/60 shrink-0" />
                  ) : isIdea ? (
                    <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  ) : isChecklist ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <h2 className="text-sm font-display font-bold text-[#1F1F1F] dark:text-slate-100 truncate tracking-tight">
                    {itemTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenItem}
                    title="Open item"
                    aria-label="Open item"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={closeDetailsPanel}
                    title="Close details"
                    aria-label="Close details"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. Tabs: Details | Activity */}
              <div className="flex items-center px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'flex-1 py-3 border-b-2 text-center transition-all cursor-pointer relative',
                    activeTab === 'details'
                      ? 'border-[#0B57D0] dark:border-blue-400 text-[#0B57D0] dark:text-blue-400 font-bold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={cn(
                    'flex-1 py-3 border-b-2 text-center transition-all cursor-pointer relative',
                    activeTab === 'activity'
                      ? 'border-[#0B57D0] dark:border-blue-400 text-[#0B57D0] dark:text-blue-400 font-bold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  Activity
                </button>
              </div>

              {/* 3. Scrollable Panel Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
                {activeTab === 'details' ? (
                  <>
                    {/* 3A. Hero Preview Badge */}
                    <div className="flex flex-col items-center justify-center pt-1 pb-2">
                      {selectedFolder ? (
                        <div className="w-full max-w-[210px] aspect-[1.4/1] rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-4 flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden group">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#5535C5] flex items-center justify-center text-white shadow-md">
                            <FolderIcon className="w-7 h-7 fill-white/20" />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
                            {totalFolderItemsCount === 0
                              ? 'Empty folder'
                              : folderSubfolderCount > 0 && folderNotesCount > 0
                              ? `${folderSubfolderCount} ${folderSubfolderCount === 1 ? 'folder' : 'folders'}, ${folderNotesCount} ${folderNotesCount === 1 ? 'note' : 'notes'}`
                              : folderSubfolderCount > 0
                              ? `${folderSubfolderCount} ${folderSubfolderCount === 1 ? 'folder' : 'folders'}`
                              : `${folderNotesCount} ${folderNotesCount === 1 ? 'note' : 'notes'}`}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor:
                              selectedNote?.color ||
                              (isIdea ? '#E5DEFA' : isChecklist ? '#CEEBFD' : '#FDE3C9'),
                          }}
                          className="w-full max-w-[210px] aspect-[1.3/1] rounded-2xl p-4 flex flex-col justify-between shadow-xs border border-black/[0.04] transition-all hover:shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-[#1F1F1F] truncate leading-tight">
                              {selectedNote?.title}
                            </p>
                            <p className="text-[11px] text-slate-700/70 mt-1 line-clamp-3 leading-relaxed">
                              {selectedNote?.content ||
                                (isIdea
                                  ? `${selectedNote?.ideaItems?.length || 0} ideas (${
                                      selectedNote?.ideaItems?.filter(
                                        (i) => i.status === 'completed',
                                      ).length || 0
                                    } completed)`
                                  : isChecklist
                                  ? `${selectedNote?.checklistItems?.length || 0} checklist tasks`
                                  : 'Empty note...')}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600/75 pt-2 border-t border-black/5">
                            <span>{itemTypeLabel}</span>
                            <span>{format(new Date(rawUpdatedAt), 'MMM d')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3B. Item Details Table */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-[#1F1F1F] dark:text-slate-100">
                        {selectedFolder ? 'Folder details' : 'Note details'}
                      </h3>

                      <div className="space-y-2 text-xs">
                        {/* Type */}
                        <div className="flex items-start justify-between py-1">
                          <span className="text-slate-400 font-medium">Type</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{itemTypeLabel}</span>
                        </div>

                        {/* Location Pill */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-400 font-medium">Location</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] truncate max-w-[150px]">
                            <FolderIcon className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span className="truncate">{locationLabel}</span>
                          </span>
                        </div>

                        {/* Owner */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-400 font-medium">Owner</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            Alex Morgan (you)
                          </span>
                        </div>

                        {/* Modified */}
                        <div className="flex items-start justify-between py-1">
                          <span className="text-slate-400 font-medium">Modified</span>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{formattedModified}</p>
                            <p className="text-[10px] text-slate-400">{relativeModified}</p>
                          </div>
                        </div>

                        {/* Created */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-400 font-medium">Created</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{formattedCreated}</span>
                        </div>

                        {/* Pastel Color Swatch (for Notes) */}
                        {selectedNote && (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400 font-medium flex items-center gap-1.5">
                              <Palette className="w-3.5 h-3.5 text-slate-400" />
                              Color
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                style={{ backgroundColor: selectedNote.color || '#FDE3C9' }}
                                className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                              />
                              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                {selectedNote.color || '#FDE3C9'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* 3C. Activity Tab */
                  <div className="space-y-4 pt-1">
                    <h3 className="text-xs font-bold text-[#1F1F1F] dark:text-slate-100">Timeline activity</h3>

                    <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                      <div className="relative text-xs">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-[#111827]" />
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Last activity</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{relativeModified}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          {format(new Date(rawUpdatedAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>

                      <div className="relative text-xs">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#111827]" />
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Item created</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {format(new Date(rawCreatedAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailsPanel;
