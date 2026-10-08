import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MoreHorizontal, Trash2, Pencil, Star } from 'lucide-react';
import type { Folder } from '../types';
import { useNoteStore } from '../store/useNoteStore';
import { cn } from '../utils/cn';

interface FolderCardProps {
  folder: Folder;
  onOpen: () => void;
  readOnly?: boolean;
}

/**
 * FolderCard — Modern 3D Vibrant Purple Folder Container
 * Matches the reference image with top-left tab, peeking white paper sheet when populated,
 * 'Empty' status and no paper when empty, and 'Last added time {date}' bottom metadata.
 * Fixed 260px x 220px footprint for uniform grid reusability.
 */
export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onOpen,
  readOnly = false,
}) => {
  const items = useNoteStore((state) => state.items);
  const renameFolder = useNoteStore((state) => state.renameFolder);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const toggleFavoriteFolder = useNoteStore((state) => state.toggleFavoriteFolder);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);

  // Count active items inside this folder (excluding trash)
  const count = items.filter((i) => i.folderId === folder.id && !i.isDeleted).length;

  // Format date nicely e.g. "Oct 13, 2025"
  const formattedDate = new Date(folder.updatedAt || folder.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim()) {
      renameFolder(folder.id, renameValue);
      setIsRenaming(false);
    }
  };

  return (
    <motion.div
      onClick={() => {
        if (!isRenaming && !readOnly) onOpen();
      }}
      whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className="group relative w-full max-w-[270px] aspect-[1.18/1] min-h-0 cursor-pointer transition-shadow duration-300 ease-out select-none"
    >
      {/* 1. Back Folder Body with Smooth Top-Left Tab Flap */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          viewBox="0 0 260 220"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-[0_4px_10px_rgba(86,54,200,0.2)]"
          fill="none"
        >
          <defs>
            <linearGradient id={`backFolderGrad-${folder.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7B61FF" />
              <stop offset="100%" stopColor="#5535C5" />
            </linearGradient>
          </defs>
          {/* Smooth curved back silhouette with top-left tab */}
          <path
            d="M 0 34 Q 0 16 16 16 L 82 16 Q 98 16 108 27 Q 118 38 134 38 L 244 38 Q 260 38 260 54 L 260 204 Q 260 220 244 220 L 16 220 Q 0 220 0 204 Z"
            fill={`url(#backFolderGrad-${folder.id})`}
          />
        </svg>
      </div>

      {/* 2. Peeking White Paper Sheet (Visible ONLY when folder is populated; removed when empty) */}
      {count > 0 && (
        <div className="absolute left-4 right-4 sm:left-5 sm:right-5 top-[12%] h-[18%] bg-white rounded-t-xl shadow-xs transition-transform duration-300 group-hover:-translate-y-1 z-1" />
      )}

      {/* 3. Front Pocket Container (Modern 3D Violet Gradient Surface) */}
      <div className="absolute left-0 right-0 bottom-0 top-[20%] rounded-[16px] sm:rounded-[20px] lg:rounded-[22px] bg-gradient-to-b from-[#8266F5] via-[#6D4DE0] to-[#5535C5] p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between shadow-[0_12px_28px_-6px_rgba(85,53,197,0.45),0_4px_12px_rgba(0,0,0,0.12)] group-hover:shadow-[0_18px_36px_-6px_rgba(85,53,197,0.58)] transition-all duration-300 border-t border-white/25 overflow-hidden z-2">
        
        {/* Top Header Row: Title & Subtitle on Left, Star & 3-Dot Circle on Right */}
        <div className="w-full flex items-start justify-between gap-1.5 sm:gap-2 pt-0.5">
          <div className="flex-1 min-w-0 pr-1">
            <h3 className="font-bold text-[14px] sm:text-[16px] lg:text-[18px] text-white tracking-tight leading-tight truncate">
              {folder.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5">
              {count === 0 ? 'Empty' : `${count} ${count === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Star Indicator Button on Folder */}
            {folder.isFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteFolder(folder.id);
                }}
                title="Starred folder"
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 hover:bg-white/30 text-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
              >
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-300 text-amber-300" />
              </button>
            )}

            {/* Context Options Trigger (3-dot circular button) */}
            {!readOnly && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-label="Folder options"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                >
                  <MoreHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                </button>

                {/* Quick Actions Dropdown Menu */}
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-8 z-40 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-fade-in text-xs">
                      {/* 1. Rename */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          openFolderModal(folder);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        <span>Rename</span>
                      </button>

                      {/* 2. Favorite / Remove from Favorites */}
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
                            folder.isFavorite
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-400'
                          )}
                        />
                        <span>
                          {folder.isFavorite ? 'Remove from Favorites' : 'Favorite'}
                        </span>
                      </button>

                      {/* 3. Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          openDeleteDialog(folder.id, folder.name, 'folder');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium text-left cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Middle Area: Clean Surface or Inline Rename Form */}
        <div className="flex-1 flex items-center justify-center my-1">
          {isRenaming && (
            <form
              onSubmit={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full"
            >
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                className="w-full text-xs font-bold text-slate-900 bg-white/95 border border-indigo-300 rounded-lg px-2.5 py-1 focus:outline-none shadow-sm"
              />
            </form>
          )}
        </div>

        {/* Bottom Metadata: "Last added time {date}" matching reference image */}
        <div className="pt-1.5 sm:pt-2">
          <p className="text-[10px] sm:text-[11px] text-white/75 font-normal select-none truncate">
            Last added time {formattedDate}
          </p>
        </div>

      </div>
    </motion.div>
  );
};
