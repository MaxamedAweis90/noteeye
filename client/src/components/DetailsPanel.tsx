import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  CheckSquare,
  Folder as FolderIcon,
  Shield,
  Globe,
  ExternalLink,
  Layers,
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
 * Displays "Who has access", "Security limitations", and comprehensive item/workspace details.
 */
export const DetailsPanel: React.FC = () => {
  const navigate = useNavigate();
  const isDetailsPanelOpen = useUIStore((state) => state.isDetailsPanelOpen);
  const closeDetailsPanel = useUIStore((state) => state.closeDetailsPanel);
  const selectedItemId = useUIStore((state) => state.selectedItemId);
  const selectedItemType = useUIStore((state) => state.selectedItemType);

  const items = useNoteStore((state) => state.items);
  const folders = useNoteStore((state) => state.folders);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);

  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  // Lookup selected entity
  const selectedNote = selectedItemType !== 'folder' && selectedItemId
    ? items.find((i) => i.id === selectedItemId && !i.isDeleted)
    : null;

  const selectedFolder = selectedItemType === 'folder' && selectedItemId
    ? folders.find((f) => f.id === selectedItemId && !f.isDeleted)
    : null;

  // Active folder context if no item is selected
  const activeScopeFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId && !f.isDeleted)
    : null;

  const isChecklist = selectedNote?.type === 'checklist';

  // Derived metadata
  const itemTitle = selectedNote
    ? selectedNote.title
    : selectedFolder
    ? selectedFolder.name
    : activeScopeFolder
    ? activeScopeFolder.name
    : 'Noteeye Workspace';

  const itemTypeLabel = selectedFolder
    ? 'Noteeye Collection'
    : isChecklist
    ? 'Checklist Note'
    : selectedNote
    ? 'Standard Note'
    : 'Workspace Root';

  // Parent location
  const parentFolder = selectedNote?.folderId
    ? folders.find((f) => f.id === selectedNote.folderId)
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

  const activeNotesCount = items.filter((i) => !i.isDeleted).length;
  const activeFoldersCount = folders.filter((f) => !f.isDeleted).length;
  const folderItemsCount = selectedFolder
    ? items.filter((i) => i.folderId === selectedFolder.id && !i.isDeleted).length
    : 0;

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
        className="w-full lg:w-80 xl:w-88 shrink-0 bg-white rounded-2xl md:rounded-[24px] min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col overflow-hidden sticky top-20 z-20 select-none"
      >
        {/* 1. Header Row (Matching Screenshots 1 & 2) */}
        <div className="h-14 px-4 sm:px-5 flex items-center justify-between gap-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedFolder ? (
              <FolderIcon className="w-4 h-4 text-purple-600 fill-purple-100 shrink-0" />
            ) : isChecklist ? (
              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
            ) : selectedNote ? (
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-[#0B57D0] shrink-0" />
            )}
            <h2 className="text-sm font-bold text-[#1F1F1F] truncate tracking-tight">
              {itemTitle}
            </h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(selectedNote || selectedFolder) && (
              <button
                type="button"
                onClick={handleOpenItem}
                title="Open item"
                aria-label="Open item"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
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

        {/* 2. Tabs: Details | Activity (Matching Screenshots 1 & 2) */}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin">
          {activeTab === 'details' ? (
            <>
              {/* 3A. Hero Preview Badge (Matching Screenshots 1 & 2) */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                {selectedFolder ? (
                  // Folder Silhouette Graphic (Matching Screenshot 1)
                  <div className="w-full max-w-[210px] aspect-[1.4/1] rounded-2xl bg-slate-100/80 p-4 flex flex-col items-center justify-center border border-slate-200/50 relative overflow-hidden group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#5535C5] flex items-center justify-center text-white shadow-md">
                      <FolderIcon className="w-7 h-7 fill-white/20" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 mt-2">
                      {folderItemsCount} {folderItemsCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                ) : selectedNote ? (
                  // Note / Checklist Document Preview (Matching Screenshot 2)
                  <div
                    style={{ backgroundColor: selectedNote.color || '#FDE3C9' }}
                    className="w-full max-w-[210px] aspect-[1.3/1] rounded-2xl p-4 flex flex-col justify-between shadow-xs border border-black/[0.04] transition-all hover:shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-[#1F1F1F] truncate leading-tight">
                        {selectedNote.title}
                      </p>
                      <p className="text-[11px] text-slate-700/70 mt-1 line-clamp-3 leading-relaxed">
                        {selectedNote.content || (isChecklist ? `${selectedNote.checklistItems?.length || 0} checklist tasks` : 'Empty note...')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600/75 pt-2 border-t border-black/5">
                      <span>{itemTypeLabel}</span>
                      <span>{format(new Date(rawUpdatedAt), 'MMM d')}</span>
                    </div>
                  </div>
                ) : (
                  // Workspace Root Graphic
                  <div className="w-full max-w-[210px] aspect-[1.4/1] rounded-2xl bg-blue-50/70 p-4 flex flex-col items-center justify-center border border-blue-100/60">
                    <div className="w-12 h-12 rounded-2xl bg-[#0B57D0] flex items-center justify-center text-white shadow-xs">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-2">Noteeye Workspace</p>
                    <p className="text-[10px] text-slate-500">
                      {activeNotesCount} notes • {activeFoldersCount} collections
                    </p>
                  </div>
                )}
              </div>

              {/* 3B. "Who has access" Section (Matching Screenshots 1 & 2) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <h3 className="text-xs font-bold text-[#1F1F1F]">Who has access</h3>
                <div className="flex items-center gap-2">
                  {/* User Avatar Circle */}
                  <div className="w-7 h-7 rounded-full bg-[#7B61FF] text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
                    AM
                  </div>
                  {/* Globe / Share Disc */}
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Owned by you. Anyone with workspace access can view and organize.
                </p>
                <button
                  type="button"
                  onClick={() => alert('Access is managed locally within your Noteeye workspace.')}
                  className="mt-1 px-3.5 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B57D0] transition-colors cursor-pointer shadow-2xs"
                >
                  Manage access
                </button>
              </div>

              {/* 3C. "Security limitations" Section (Matching Screenshots 1 & 2) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1F1F1F]">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Security limitations</span>
                </div>
                <div className="bg-slate-50/90 border border-slate-200/50 rounded-xl p-3 text-xs text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-700">No limitations applied</p>
                  <p className="text-[11px] text-slate-400">If any are applied, they will appear here</p>
                </div>
              </div>

              {/* 3D. "Folder details" / "Note details" (Matching Screenshots 1 & 2) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-[#1F1F1F]">
                  {selectedFolder ? 'Folder details' : selectedNote ? 'Note details' : 'Workspace details'}
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
            /* 3E. Activity Tab (Matching Screenshots 1 & 2) */
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
      </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default DetailsPanel;
