import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MoreHorizontal,
  X,
  ExternalLink,
  Pencil,
  Copy,
  Clipboard,
  Check,
  Star,
  Info,
  Trash2,
  Palette,
  Plus,
  FolderPlus,
  Folder as FolderIcon,
  FileText,
  CheckSquare,
  Lightbulb,
  CornerDownRight,
} from '@/components/ui/icons';
import { useUIStore } from '../store/uiStore';
import { useNoteStore } from '../store/useNoteStore';
import { cn } from '../utils/cn';
import { PASTEL_PALETTE } from '../types';
import type { Item, Folder } from '../types';
import { htmlToPlainText } from '../utils/markdownToHtml';

export interface CardActionMenuProps {
  type: 'note' | 'checklist' | 'idea' | 'folder';
  item: Item | Folder;
  triggerButtonClassName?: string;
  isLightHeader?: boolean;
}

/**
 * CardActionMenu Component — Reusable Card Dropdown & Mobile Action Sheet
 * Serves both NoteCard and FolderCard:
 * - On Mobile (< md / 768px): Native-feeling slide-up Bottom Action Sheet with large touch targets.
 * - On Desktop (md+): Compact floating dropdown menu portaled to document.body (never clipped).
 * Desktop right-click ContextMenu remains completely separate and untouched.
 */
export const CardActionMenu: React.FC<CardActionMenuProps> = ({
  type,
  item,
  triggerButtonClassName,
  isLightHeader = false,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // UI Store
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);
  const openDetailsPanel = useUIStore((state) => state.openDetailsPanel);
  const clipboard = useUIStore((state) => state.clipboard);
  const clipboardItem = useUIStore((state) => state.clipboardItem);
  const showToast = useUIStore((state) => state.showToast);

  // Note Store
  const updateItem = useNoteStore((state) => state.updateItem);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const duplicateItem = useNoteStore((state) => state.duplicateItem);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const openQuickEditModal = useNoteStore((state) => state.openQuickEditModal);
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);
  const toggleFavoriteFolder = useNoteStore((state) => state.toggleFavoriteFolder);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const executeTransfer = useNoteStore((state) => state.executeTransfer);

  const isFolder = type === 'folder';
  const folder = isFolder ? (item as Folder) : null;
  const note = !isFolder ? (item as Item) : null;
  const isFavorite = item.isFavorite;
  const itemTitle = isFolder ? (folder?.name || 'Untitled Folder') : (note?.title || 'Untitled Note');

  // Track viewport width for responsive mobile bottom sheet vs desktop floating dropdown
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate desktop dropdown coordinates when opening
  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 216;
      const menuHeight = isFolder ? 280 : 420;

      let left = rect.right - menuWidth;
      let top = rect.bottom + 6;

      if (left < 12) left = 12;
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12;
      }
      if (top + menuHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - menuHeight - 6);
      }

      setMenuCoords({ left, top });
    }
    setIsOpen((prev) => !prev);
  };

  // Close on Escape or scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleScroll = () => {
      if (!isMobile) setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, isMobile]);

  // Action Handlers
  const handleOpen = () => {
    setIsOpen(false);
    if (isFolder) {
      navigate(`/folders/${item.id}`);
    } else {
      navigate(`/notes/${item.id}`);
    }
  };

  const handleEdit = () => {
    setIsOpen(false);
    if (isFolder && folder) {
      openFolderModal(folder);
    } else if (note) {
      openQuickEditModal(note);
    }
  };

  const handleDuplicate = () => {
    setIsOpen(false);
    if (note) {
      duplicateItem(note.id);
    }
  };

  const handleCopyText = async () => {
    if (!note) return;
    const plain = htmlToPlainText(note.content || note.body || '');
    if (plain) {
      try {
        await navigator.clipboard.writeText(plain);
        setCopied(true);
        showToast('Text copied to clipboard!');
        setTimeout(() => {
          setCopied(false);
          setIsOpen(false);
        }, 600);
      } catch {
        setIsOpen(false);
      }
    } else {
      showToast('Note has no text to copy');
      setIsOpen(false);
    }
  };

  const handleToggleFavorite = () => {
    setIsOpen(false);
    if (isFolder) {
      toggleFavoriteFolder(item.id);
    } else {
      toggleFavoriteItem(item.id);
    }
  };

  const handleDetails = () => {
    setIsOpen(false);
    setSelectedItem(item.id, isFolder ? 'folder' : type);
    openDetailsPanel();
  };

  const handleDelete = () => {
    setIsOpen(false);
    openDeleteDialog(item.id, itemTitle, isFolder ? 'folder' : type);
  };

  const handleSelectColor = (colorHex: string) => {
    if (note) {
      updateItem(note.id, { color: colorHex });
      setIsOpen(false);
    }
  };

  // Folder specific actions
  const handleAddNoteToFolder = () => {
    setIsOpen(false);
    if (folder) {
      setCurrentFolder(folder.id);
      openNoteModal('note');
    }
  };

  const handleAddFolderToFolder = () => {
    setIsOpen(false);
    if (folder) {
      setCurrentFolder(folder.id);
      openFolderModal();
    }
  };

  const handlePasteIntoFolder = () => {
    setIsOpen(false);
    if (!folder) return;
    if (clipboard && clipboard.items && clipboard.items.length > 0) {
      executeTransfer(
        clipboard.items.map((i) => ({ ...i, action: clipboard.action })),
        folder.id
      );
    } else if (clipboardItem) {
      executeTransfer(
        [
          {
            type: clipboardItem.type,
            id: clipboardItem.id,
            action: clipboardItem.action,
            name: clipboardItem.name,
          },
        ],
        folder.id
      );
    }
  };

  return (
    <>
      {/* 1. Trigger Button on Card */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleMenu}
        aria-label={`${itemTitle} options`}
        title="More options"
        className={cn(
          'transition-all duration-200 cursor-pointer select-none flex items-center justify-center shrink-0',
          triggerButtonClassName ||
            (isLightHeader
              ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/20 text-white shadow-2xs'
              : 'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/70 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 shadow-2xs hover:scale-105 active:scale-95')
        )}
      >
        <MoreHorizontal className={cn(isLightHeader ? 'w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]' : 'w-3.5 h-3.5 sm:w-4 sm:h-4')} />
      </button>

      {/* 2. Responsive Menu: Desktop Anchored Dropdown vs Mobile Bottom Action Sheet */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className={cn(
                    'fixed inset-0 select-none cursor-pointer',
                    isMobile ? 'z-50 bg-black/40 backdrop-blur-xs' : 'z-40'
                  )}
                  onClick={() => setIsOpen(false)}
                />

                {isMobile ? (
                  /* Mobile: Slide-Up Bottom Action Sheet */
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto select-none custom-scrollbar pb-8 border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Drag Handle */}
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3.5 shrink-0" />

                    {/* Sheet Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {isFolder ? (
                          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/50">
                            <FolderIcon className="w-4 h-4 fill-purple-100 dark:fill-purple-900" />
                          </div>
                        ) : type === 'idea' ? (
                          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/50">
                            <Lightbulb className="w-4 h-4 fill-purple-100 dark:fill-purple-900" />
                          </div>
                        ) : type === 'checklist' ? (
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/50">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#1F1F1F] dark:text-slate-100 truncate leading-tight">
                            {itemTitle}
                          </h3>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
                            {isFolder ? 'Folder' : type === 'idea' ? 'Idea Board' : type === 'checklist' ? 'Checklist' : 'Note'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Pastel Palette (for Notes on Mobile) */}
                    {note && (
                      <div className="p-3 mb-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            Card Color
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          {PASTEL_PALETTE.map((p) => {
                            const isSelected =
                              (note.color || '').toLowerCase() === p.hex.toLowerCase() ||
                              note.color === p.key;
                            return (
                              <button
                                key={p.hex}
                                type="button"
                                onClick={() => handleSelectColor(p.hex)}
                                title={p.name}
                                style={{ backgroundColor: p.hex }}
                                className={cn(
                                  'w-9 h-9 rounded-full border border-black/15 transition-transform cursor-pointer shadow-2xs flex items-center justify-center',
                                  isSelected && 'ring-2 ring-[#0B57D0] scale-110 shadow-xs'
                                )}
                              >
                                {isSelected && <Check className="w-4 h-4 text-slate-800 stroke-[2.5]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Rows */}
                    <div className="space-y-1 text-sm font-semibold">
                      {/* Open */}
                      <button
                        type="button"
                        onClick={handleOpen}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>Open {isFolder ? 'Folder' : 'File'}</span>
                      </button>

                      {/* Edit / Rename */}
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>{isFolder ? 'Rename folder' : 'Edit note'}</span>
                      </button>

                      {/* Note Actions: Duplicate & Copy Text */}
                      {note && (
                        <>
                          <button
                            type="button"
                            onClick={handleDuplicate}
                            className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>Duplicate note</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyText}
                            className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Clipboard className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                            )}
                            <span>{copied ? 'Copied to clipboard!' : 'Copy text to clipboard'}</span>
                          </button>
                        </>
                      )}

                      {/* Folder Actions */}
                      {folder && (
                        <>
                          {clipboardItem && clipboardItem.id !== folder.id && (
                            <button
                              type="button"
                              onClick={handlePasteIntoFolder}
                              className="w-full flex items-center gap-3 px-3.5 py-3 text-[#0B57D0] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:bg-blue-100 dark:active:bg-blue-900/40 rounded-xl cursor-pointer transition-colors text-left"
                            >
                              <CornerDownRight className="w-4 h-4 text-[#0B57D0] dark:text-blue-400 shrink-0" />
                              <span>Paste into folder</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleAddNoteToFolder}
                            className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Add note here</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAddFolderToFolder}
                            className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <FolderPlus className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span>Add subfolder here</span>
                          </button>
                        </>
                      )}

                      {/* Favorite */}
                      <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Star
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500 dark:text-slate-400'
                          )}
                        />
                        <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                      </button>

                      {/* Details */}
                      <button
                        type="button"
                        onClick={handleDetails}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>View Details</span>
                      </button>

                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                      {/* Move to Trash */}
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-900/40 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Move to Trash</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Desktop: Anchored Floating Dropdown Portaled to Body (Never Clipped) */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    style={{ position: 'fixed', left: menuCoords.left, top: menuCoords.top, zIndex: 50 }}
                    className="w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-1.5 select-none text-xs text-slate-800 dark:text-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Quick Pastel Palette (for Notes on Desktop) */}
                    {note && (
                      <div className="px-3 py-1.5 mb-1 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                          <span className="flex items-center gap-1">
                            <Palette className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            Color
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          {PASTEL_PALETTE.map((p) => {
                            const isSelected =
                              (note.color || '').toLowerCase() === p.hex.toLowerCase() ||
                              note.color === p.key;
                            return (
                              <button
                                key={p.hex}
                                type="button"
                                onClick={() => handleSelectColor(p.hex)}
                                title={p.name}
                                style={{ backgroundColor: p.hex }}
                                className={cn(
                                  'w-5 h-5 rounded-full border border-black/15 transition-transform hover:scale-125 cursor-pointer shadow-2xs',
                                  isSelected && 'ring-2 ring-[#0B57D0] scale-110'
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-0.5">
                      {/* Open */}
                      <button
                        type="button"
                        onClick={handleOpen}
                        className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>Open</span>
                      </button>

                      {/* Edit / Rename */}
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>{isFolder ? 'Rename folder' : 'Edit note'}</span>
                      </button>

                      {/* Note Specific */}
                      {note && (
                        <>
                          <button
                            type="button"
                            onClick={handleDuplicate}
                            className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>Duplicate note</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyText}
                            className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Clipboard className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                            )}
                            <span>{copied ? 'Copied!' : 'Copy text'}</span>
                          </button>
                        </>
                      )}

                      {/* Folder Specific */}
                      {folder && (
                        <>
                          {clipboardItem && clipboardItem.id !== folder.id && (
                            <button
                              type="button"
                              onClick={handlePasteIntoFolder}
                              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-[#0B57D0] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl cursor-pointer transition-colors text-left"
                            >
                              <CornerDownRight className="w-4 h-4 text-[#0B57D0] dark:text-blue-400 shrink-0" />
                              <span>Paste into folder</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleAddNoteToFolder}
                            className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Add note here</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAddFolderToFolder}
                            className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <FolderPlus className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span>Add subfolder here</span>
                          </button>
                        </>
                      )}

                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                      {/* Favorite */}
                      <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Star
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500 dark:text-slate-400'
                          )}
                        />
                        <span>{isFavorite ? 'Remove Favorite' : 'Favorite'}</span>
                      </button>

                      {/* Details */}
                      <button
                        type="button"
                        onClick={handleDetails}
                        className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Details</span>
                      </button>

                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Move to Trash</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default CardActionMenu;
