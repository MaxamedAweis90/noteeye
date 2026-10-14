import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CheckSquare,
  Folder as FolderIcon,
  ExternalLink,
  Star,
  Info,
  Trash2,
  Copy,
  Clipboard,
  Check,
  Pencil,
  Plus,
  Palette,
  FolderPlus,
  Scissors,
  CornerDownRight,
  Lightbulb,
} from '@/components/ui/icons';
import { useUIStore } from '../store/uiStore';
import { useNoteStore } from '../store/useNoteStore';
import { cn } from '../utils/cn';
import { PASTEL_PALETTE } from '../types';

/**
 * ContextMenu Component — Google Drive & Desktop-Grade Custom Context Menu
 * Supports Canvas Empty Space and Item (Note/Folder) menus.
 * New Features & Ideas:
 * 1. Quick Pastel Palette: Change note color in 1-click directly from context menu.
 * 2. Cut, Copy & Paste: Full clipboard actions for moving and duplicating notes/folders.
 * 3. Copy Text to Clipboard: One-click clipboard copy.
 * 4. Folder Quick Actions: Rename & New note inside folder.
 */
export const ContextMenu: React.FC = () => {
  const navigate = useNavigate();
  const contextMenu = useUIStore((state) => state.contextMenu);
  const closeContextMenu = useUIStore((state) => state.closeContextMenu);
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);
  const toggleDetailsPanel = useUIStore((state) => state.toggleDetailsPanel);
  const clipboard = useUIStore((state) => state.clipboard);
  const clipboardItem = useUIStore((state) => state.clipboardItem);
  const copyItem = useUIStore((state) => state.copyItem);
  const cutItem = useUIStore((state) => state.cutItem);

  const items = useNoteStore((state) => state.items);
  const folders = useNoteStore((state) => state.folders);
  const addItem = useNoteStore((state) => state.addItem);
  const updateItem = useNoteStore((state) => state.updateItem);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);
  const toggleFavoriteFolder = useNoteStore((state) => state.toggleFavoriteFolder);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const executeTransfer = useNoteStore((state) => state.executeTransfer);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);

  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Dismiss menu whenever route changes
  useEffect(() => {
    closeContextMenu();
  }, [location.pathname, closeContextMenu]);

  // Dismiss listeners: click outside, scroll, Escape key
  useEffect(() => {
    if (!contextMenu?.isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleScroll = () => {
      closeContextMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu?.isOpen, closeContextMenu]);

  if (!contextMenu?.isOpen) return null;

  // Viewport boundary clamping
  const menuWidth = 224;
  const menuHeight = contextMenu.type === 'item' ? 440 : 260;
  const clampedX = Math.min(Math.max(12, contextMenu.x), window.innerWidth - menuWidth - 12);
  const clampedY = Math.min(Math.max(12, contextMenu.y), window.innerHeight - menuHeight - 12);

  // Determine active folder based on route or current context
  const activeFolderId = location.pathname.startsWith('/folders/')
    ? location.pathname.replace('/folders/', '')
    : (location.pathname === '/' ? null : currentFolderId);

  // Lookup target item/folder
  const targetNote = contextMenu.targetType !== 'folder' && contextMenu.targetId
    ? items.find((i) => i.id === contextMenu.targetId)
    : null;
  const targetFolder = contextMenu.targetType === 'folder' && contextMenu.targetId
    ? folders.find((f) => f.id === contextMenu.targetId)
    : null;

  const isFavorite = targetNote ? targetNote.isFavorite : targetFolder ? targetFolder.isFavorite : false;
  const targetTitle = targetNote ? targetNote.title : targetFolder ? targetFolder.name : 'Item';

  // Action handlers
  const handleOpen = () => {
    closeContextMenu();
    if (contextMenu.targetType === 'folder' && contextMenu.targetId) {
      navigate(`/folders/${contextMenu.targetId}`);
    } else if (contextMenu.targetId) {
      navigate(`/notes/${contextMenu.targetId}`);
    }
  };

  const handleCut = () => {
    closeContextMenu();
    if (contextMenu.targetId) {
      cutItem(
        contextMenu.targetType === 'folder' ? 'folder' : 'note',
        contextMenu.targetId,
        targetTitle
      );
    }
  };

  const handleCopy = () => {
    closeContextMenu();
    if (contextMenu.targetId) {
      copyItem(
        contextMenu.targetType === 'folder' ? 'folder' : 'note',
        contextMenu.targetId,
        targetTitle
      );
    }
  };

  const handlePaste = (destFolderId: string | null = activeFolderId) => {
    closeContextMenu();
    if (clipboard && clipboard.items && clipboard.items.length > 0) {
      executeTransfer(
        clipboard.items.map((i) => ({ ...i, action: clipboard.action })),
        destFolderId
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
        destFolderId
      );
    }
  };

  const handleToggleFavorite = () => {
    closeContextMenu();
    if (contextMenu.targetType === 'folder' && contextMenu.targetId) {
      toggleFavoriteFolder(contextMenu.targetId);
    } else if (contextMenu.targetId) {
      toggleFavoriteItem(contextMenu.targetId);
    }
  };

  const handleOpenDetails = () => {
    closeContextMenu();
    if (contextMenu.targetId) {
      setSelectedItem(contextMenu.targetId, contextMenu.targetType || 'note');
    }
    toggleDetailsPanel();
  };

  const handleDelete = () => {
    closeContextMenu();
    if (contextMenu.targetId) {
      openDeleteDialog(
        contextMenu.targetId,
        targetTitle,
        contextMenu.targetType === 'folder'
          ? 'folder'
          : targetNote?.type === 'checklist'
          ? 'checklist'
          : targetNote?.type === 'idea'
          ? 'idea'
          : 'note'
      );
    }
  };

  // Idea 1: Duplicate Note
  const handleDuplicate = () => {
    closeContextMenu();
    if (targetNote) {
      addItem({
        title: `${targetNote.title} (Copy)`,
        type: targetNote.type,
        folderId: targetNote.folderId,
        content: targetNote.content,
        checklistItems: targetNote.checklistItems
          ? targetNote.checklistItems.map((ci) => ({ ...ci, id: `ci-${Date.now()}-${Math.random()}` }))
          : [],
        ideaItems: targetNote.ideaItems
          ? targetNote.ideaItems.map((ii) => ({
              ...ii,
              id: `idea-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            }))
          : [],
        color: targetNote.color,
        isFavorite: false,
      });
    }
  };

  // Idea 2: Copy note text to clipboard
  const handleCopyText = async () => {
    if (targetNote) {
      const textToCopy = targetNote.type === 'checklist'
        ? `${targetNote.title}\n` + (targetNote.checklistItems?.map((c) => `[${c.isCompleted ? 'x' : ' '}] ${c.text}`).join('\n') || '')
        : targetNote.type === 'idea'
        ? `${targetNote.title}\n\n` +
          (targetNote.ideaItems && targetNote.ideaItems.length > 0
            ? targetNote.ideaItems
                .map(
                  (ii) =>
                    `• [${ii.status === 'completed' ? 'Completed' : 'Idea'}] ${ii.title}${
                      ii.description ? `\n  ${ii.description}` : ''
                    }`
                )
                .join('\n\n')
            : 'No ideas recorded yet.')
        : `${targetNote.title}\n\n${targetNote.content || ''}`;

      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          closeContextMenu();
        }, 500);
      } catch {
        closeContextMenu();
      }
    }
  };

  // Idea 3: Quick Color Change from Context Menu
  const handleSelectColor = (colorHex: string) => {
    if (targetNote) {
      updateItem(targetNote.id, { color: colorHex });
      closeContextMenu();
    }
  };

  // Idea 4: Folder Actions (Rename & Add note here)
  const handleRenameFolder = () => {
    closeContextMenu();
    if (targetFolder) {
      openFolderModal(targetFolder);
    }
  };

  const handleAddNoteToFolder = () => {
    closeContextMenu();
    if (targetFolder) {
      setCurrentFolder(targetFolder.id);
      openNoteModal('note');
    }
  };

  const handleAddFolderToFolder = () => {
    closeContextMenu();
    if (targetFolder) {
      setCurrentFolder(targetFolder.id);
      openFolderModal();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        data-context-menu
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        style={{ left: clampedX, top: clampedY }}
        className="fixed z-50 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 select-none text-xs"
      >
        {contextMenu.type === 'canvas' ? (
          // Variant A: Empty Space Context Menu
          <div className="space-y-0.5">
            {/* Clipboard Paste Option on Canvas */}
            {clipboardItem && (
              <>
                <button
                  type="button"
                  onClick={() => handlePaste(activeFolderId)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-[#0B57D0] hover:bg-blue-50 rounded-xl cursor-pointer transition-colors text-left"
                >
                  <Clipboard className="w-4 h-4 text-[#0B57D0] shrink-0" />
                  <span>
                    Paste {clipboardItem.type === 'folder' ? 'Folder' : 'Note'}
                    {clipboardItem.name ? ` (${clipboardItem.name.slice(0, 12)}${clipboardItem.name.length > 12 ? '...' : ''})` : ''}
                  </span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
              </>
            )}

            <button
              type="button"
              onClick={() => {
                closeContextMenu();
                openNoteModal('note');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              <span>New Note</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeContextMenu();
                openNoteModal('checklist');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <CheckSquare className="w-4 h-4 text-slate-500 shrink-0" />
              <span>New Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeContextMenu();
                openNoteModal('idea');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
              <span>New Idea</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeContextMenu();
                openFolderModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <FolderIcon className="w-4 h-4 text-purple-600 shrink-0" />
              <span>New Folder</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              type="button"
              onClick={() => {
                closeContextMenu();
                toggleDetailsPanel();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <Info className="w-4 h-4 text-[#0B57D0] shrink-0" />
              <span>Toggle Details Panel</span>
            </button>
          </div>
        ) : (
          // Variant B: Item Context Menu (Note or Folder)
          <div className="space-y-0.5">
            {/* 1. Quick Color Palette Swatches (For Notes) */}
            {targetNote && (
              <div className="px-3 py-1.5 mb-1 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-400" />
                    Color
                  </span>
                  <span>
                    {PASTEL_PALETTE.find(
                      (p) =>
                        p.hex.toLowerCase() === (targetNote.color || '').toLowerCase() ||
                        p.key === targetNote.color
                    )?.name || 'Warm Peach'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  {PASTEL_PALETTE.map((p) => {
                    const isSelected =
                      (targetNote.color || '').toLowerCase() === p.hex.toLowerCase() ||
                      targetNote.color === p.key;
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

            {/* Open Item */}
            <button
              type="button"
              onClick={handleOpen}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Open</span>
            </button>

            {/* Cut & Copy Actions */}
            <button
              type="button"
              onClick={handleCut}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <Scissors className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Cut</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <Copy className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Copy</span>
            </button>

            {/* Folder Specific Actions */}
            {targetFolder && (
              <>
                {clipboardItem && clipboardItem.id !== targetFolder.id && (
                  <button
                    type="button"
                    onClick={() => handlePaste(targetFolder.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-[#0B57D0] hover:bg-blue-50 rounded-xl cursor-pointer transition-colors text-left"
                  >
                    <CornerDownRight className="w-4 h-4 text-[#0B57D0] shrink-0" />
                    <span>Paste into folder</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddNoteToFolder}
                  className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
                >
                  <Plus className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Add note here</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddFolderToFolder}
                  className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Add subfolder here</span>
                </button>
                <button
                  type="button"
                  onClick={handleRenameFolder}
                  className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
                >
                  <Pencil className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Rename folder</span>
                </button>
              </>
            )}

            {/* Note Specific Actions: Duplicate & Copy Text */}
            {targetNote && (
              <>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
                >
                  <Copy className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Duplicate note</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clipboard className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span>{copied ? 'Copied to clipboard!' : 'Copy text'}</span>
                </button>
              </>
            )}

            <div className="h-px bg-slate-100 my-1" />

            {/* Star Favorite */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <Star
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isFavorite
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-500'
                )}
              />
              <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
            </button>

            {/* Details Panel Inspector */}
            <button
              type="button"
              onClick={handleOpenDetails}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-slate-700 hover:bg-[#F1F5F9] rounded-xl cursor-pointer transition-colors text-left"
            >
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Details</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            {/* Move to Trash */}
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Move to Trash</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ContextMenu;
