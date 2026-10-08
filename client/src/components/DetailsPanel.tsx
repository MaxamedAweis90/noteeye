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
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
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

  // Derived metadata
  const itemTitle = selectedNote
    ? selectedNote.title
    : selectedFolder
    ? selectedFolder.name
    : '';

  const itemTypeLabel = selectedFolder
    ? 'Noteeye Collection'
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

  return (
    <AnimatePresence>
      {isDetailsPanelOpen && (
        <motion.aside
          data-details-panel
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-80 xl:w-88 shrink-0 bg-white rounded-2xl md:rounded-[24px] h-[calc(100vh-5rem)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col overflow-hidden sticky top-20 z-20 select-none"
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
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Centered Illustration & Message */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 text-center select-none">
                <div className="w-48 h-48 relative flex items-center justify-center">
                  <svg
                    width="180"
                    height="180"
                    viewBox="0 0 180 180"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    {/* Whimsical pencil doodle curve behind on left */}
                    <path
                      d="M42 68 C 34 106, 38 126, 56 132 C 67 135, 73 128, 77 122"
                      stroke="#2D3139"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Green circular accent dot */}
                    <circle cx="50" cy="52" r="14" fill="#34A853" />

                    {/* Soft Coral/Pink rounded rectangle card behind right */}
                    <rect
                      x="100"
                      y="74"
                      width="52"
                      height="44"
                      rx="10"
                      fill="#FCDDEC"
                    />

                    {/* Light blue folded document */}
                    <path
                      d="M60 40 C 60 34, 64 30, 70 30 L 106 30 L 126 50 L 126 114 C 126 120, 122 124, 116 124 L 70 124 C 64 124, 60 120, 60 114 Z"
                      fill="#C2E7FF"
                      stroke="#1F1F1F"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />

                    {/* Folded corner dog-ear */}
                    <path
                      d="M106 30 L 106 50 L 126 50"
                      fill="#A5D4FF"
                      stroke="#1F1F1F"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />

                    {/* Horizontal text lines on document */}
                    <line
                      x1="72"
                      y1="60"
                      x2="102"
                      y2="60"
                      stroke="#1F1F1F"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="72"
                      y1="74"
                      x2="114"
                      y2="74"
                      stroke="#1F1F1F"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="72"
                      y1="88"
                      x2="96"
                      y2="88"
                      stroke="#1F1F1F"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Magnifying Glass Yellow Handle */}
                    <path
                      d="M96 106 L 114 136"
                      stroke="#F9AB00"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />

                    {/* Magnifying Glass Yellow Rim & Lens */}
                    <circle
                      cx="82"
                      cy="90"
                      r="28"
                      fill="white"
                      fillOpacity="0.4"
                      stroke="#F9AB00"
                      strokeWidth="7"
                    />
                  </svg>
                </div>

                <p className="text-[14px] font-normal text-[#1F1F1F] mt-6 tracking-normal">
                  Select an item to see the details
                </p>
              </div>
            </div>
          ) : (
            /* Populated Item Details & Activity State */
            <>
              {/* 1. Header Row */}
              <div className="h-14 px-4 sm:px-5 flex items-center justify-between gap-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedFolder ? (
                    <FolderIcon className="w-4 h-4 text-purple-600 fill-purple-100 shrink-0" />
                  ) : isChecklist ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <h2 className="text-sm font-bold text-[#1F1F1F] truncate tracking-tight">
                    {itemTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenItem}
                    title="Open item"
                    aria-label="Open item"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={closeDetailsPanel}
                    title="Close details"
                    aria-label="Close details"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. Tabs: Details | Activity */}
              <div className="flex items-center px-4 sm:px-5 border-b border-slate-100 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'flex-1 py-3 border-b-2 text-center transition-all cursor-pointer relative',
                    activeTab === 'details'
                      ? 'border-[#0B57D0] text-[#0B57D0] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
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
                      ? 'border-[#0B57D0] text-[#0B57D0] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
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
                        <div className="w-full max-w-[210px] aspect-[1.4/1] rounded-2xl bg-slate-100/80 p-4 flex flex-col items-center justify-center border border-slate-200/50 relative overflow-hidden group">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#5535C5] flex items-center justify-center text-white shadow-md">
                            <FolderIcon className="w-7 h-7 fill-white/20" />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 mt-2">
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
                          style={{ backgroundColor: selectedNote?.color || '#FDE3C9' }}
                          className="w-full max-w-[210px] aspect-[1.3/1] rounded-2xl p-4 flex flex-col justify-between shadow-xs border border-black/[0.04] transition-all hover:shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-[#1F1F1F] truncate leading-tight">
                              {selectedNote?.title}
                            </p>
                            <p className="text-[11px] text-slate-700/70 mt-1 line-clamp-3 leading-relaxed">
                              {selectedNote?.content || (isChecklist ? `${selectedNote?.checklistItems?.length || 0} checklist tasks` : 'Empty note...')}
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
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-[#1F1F1F]">
                        {selectedFolder ? 'Folder details' : 'Note details'}
                      </h3>

                      <div className="space-y-2 text-xs">
                        {/* Type */}
                        <div className="flex items-start justify-between py-1">
                          <span className="text-slate-400 font-medium">Type</span>
                          <span className="font-semibold text-slate-800 text-right">{itemTypeLabel}</span>
                        </div>

                        {/* Location Pill */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-400 font-medium">Location</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px] truncate max-w-[150px]">
                            <FolderIcon className="w-3 h-3 text-purple-600 shrink-0" />
                            <span className="truncate">{locationLabel}</span>
                          </span>
                        </div>

                        {/* Owner */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-400 font-medium">Owner</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            Alex Morgan (you)
                          </span>
                        </div>

                        {/* Modified */}
                        <div className="flex items-start justify-between py-1">
                          <span className="text-slate-400 font-medium">Modified</span>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800">{formattedModified}</p>
                            <p className="text-[10px] text-slate-400">{relativeModified}</p>
                          </div>
                        </div>

                        {/* Created */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-400 font-medium">Created</span>
                          <span className="font-semibold text-slate-800">{formattedCreated}</span>
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
                              <span className="font-semibold text-slate-700 font-mono text-[11px]">
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
                    <h3 className="text-xs font-bold text-[#1F1F1F]">Timeline activity</h3>

                    <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      <div className="relative text-xs">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                        <p className="font-semibold text-slate-800">Last activity</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{relativeModified}</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {format(new Date(rawUpdatedAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>

                      <div className="relative text-xs">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                        <p className="font-semibold text-slate-800">Item created</p>
                        <p className="text-[11px] text-slate-500 mt-1">
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
      )}
    </AnimatePresence>
  );
};

export default DetailsPanel;
