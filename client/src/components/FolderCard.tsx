import React, { useState } from 'react';
import { MoreVertical, Trash2, Edit3 } from 'lucide-react';
import type { Folder } from '../types';
import { useNoteStore } from '../store/useNoteStore';

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
  const deleteFolder = useNoteStore((state) => state.deleteFolder);
  const renameFolder = useNoteStore((state) => state.renameFolder);

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
    <div
      onClick={() => {
        if (!isRenaming && !readOnly) onOpen();
      }}
      className="group relative w-[260px] h-[220px] cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 select-none shrink-0"
    >
      {/* 1. Back Folder Body with Smooth Top-Left Tab Flap */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          viewBox="0 0 260 220"
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
        <div className="absolute left-5 right-5 top-[28px] h-[40px] bg-white rounded-t-xl shadow-xs transition-transform duration-300 group-hover:-translate-y-1 z-1" />
      )}

      {/* 3. Front Pocket Container (Modern 3D Violet Gradient Surface) */}
      <div className="absolute left-0 right-0 bottom-0 top-[46px] rounded-[22px] bg-gradient-to-b from-[#8266F5] via-[#6D4DE0] to-[#5535C5] p-5 flex flex-col justify-between shadow-[0_12px_28px_-6px_rgba(85,53,197,0.45),0_4px_12px_rgba(0,0,0,0.12)] group-hover:shadow-[0_18px_36px_-6px_rgba(85,53,197,0.58)] transition-all duration-300 border-t border-white/25 overflow-hidden z-2">
        
        {/* Top Header Row: Title & Subtitle on Left, 3-Dot Circle on Right */}
        <div className="w-full flex items-start justify-between gap-2 pt-0.5">
          <div className="flex-1 min-w-0 pr-1">
            <h3 className="font-bold text-[17px] text-white tracking-tight leading-tight truncate">
              {folder.name}
            </h3>
            <p className="text-xs text-white/80 font-normal mt-0.5">
              {count === 0 ? 'Empty' : `${count} ${count === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          {/* Context Options Trigger (3-dot circular button matching image) */}
          {!readOnly && (
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Folder options"
                className="w-6 h-6 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <MoreVertical className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              {/* Quick Actions Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-8 z-40 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-fade-in text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsRenaming(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Rename</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        deleteFolder(folder.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium text-left cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete Folder</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
        <div className="pt-2">
          <p className="text-[11px] text-white/75 font-normal select-none">
            Last added time {formattedDate}
          </p>
        </div>

      </div>
    </div>
  );
};
