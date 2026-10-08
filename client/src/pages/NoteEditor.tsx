import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Plus,
  Trash2,
  Folder as FolderIcon,
  Star,
  X,
  ChevronDown,
  FileText,
  Clock,
  AlertCircle,
  Home,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { DEFAULT_PASTEL_COLOR } from '../types';
import type { ItemType, ChecklistItem } from '../types';
import { cn } from '../utils/cn';

/**
 * Screen 06: Full Note / Checklist Editor
 * Full-canvas distraction-free writing experience with dynamic pastel tinting,
 * debounced autosave, interactive checklist ergonomics, and folder assignment.
 */
export const NoteEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const items = useNoteStore((state) => state.items);
  const folders = useNoteStore((state) => state.folders);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const addItem = useNoteStore((state) => state.addItem);
  const updateItem = useNoteStore((state) => state.updateItem);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);
  const closeDetailsPanel = useUIStore((state) => state.closeDetailsPanel);

  // Automatically close details panel when opening full note editor
  useEffect(() => {
    closeDetailsPanel();
  }, [closeDetailsPanel]);

  const isNewRoute = id === 'new' || !id;

  // Active (non-deleted) folders for assignment dropdown
  const activeFolders = useMemo(() => folders.filter((f) => !f.isDeleted), [folders]);

  // Lookup existing item
  const existingItem = useMemo(() => {
    if (isNewRoute) return null;
    return items.find((i) => i.id === id && !i.isDeleted) || null;
  }, [items, id, isNewRoute]);

  // Track newly created ID if starting from /notes/new
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const activeId = existingItem ? existingItem.id : createdItemId;

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ItemType>('note');
  const [content, setContent] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [color, setColor] = useState(DEFAULT_PASTEL_COLOR);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');

  // Folder dropdown open state
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);

  // New checklist item text input for bottom CTA
  const [newChecklistText, setNewChecklistText] = useState('');
  const newChecklistInputRef = useRef<HTMLInputElement>(null);

  // Loaded ID ref to prevent autosave state feedback overwrite while typing
  const loadedIdRef = useRef<string | null>(null);

  // Initialize state from existing item or query params
  useEffect(() => {
    if (existingItem && existingItem.id !== loadedIdRef.current) {
      loadedIdRef.current = existingItem.id;
      setTitle(existingItem.title);
      setType(existingItem.type);
      setContent(existingItem.content || '');
      setChecklistItems(existingItem.checklistItems || []);
      setColor(existingItem.color || (existingItem.type === 'checklist' ? '#CEEBFD' : DEFAULT_PASTEL_COLOR));
      setFolderId(existingItem.folderId);
      setIsFavorite(Boolean(existingItem.isFavorite));
      setSaveStatus('saved');
      setLastSavedTime(
        existingItem.updatedAt
          ? format(new Date(existingItem.updatedAt), 'h:mm a')
          : 'Just now'
      );
    } else if (isNewRoute && loadedIdRef.current !== 'new') {
      loadedIdRef.current = 'new';
      const paramType = searchParams.get('type') === 'checklist' ? 'checklist' : 'note';
      const paramFolder = searchParams.get('folder') || currentFolderId || null;
      setTitle('');
      setType(paramType);
      setContent('');
      setChecklistItems([]);
      setColor(paramType === 'checklist' ? '#CEEBFD' : DEFAULT_PASTEL_COLOR);
      setFolderId(paramFolder);
      setIsFavorite(false);
      setSaveStatus('saved');
      setLastSavedTime('Just now');
    }
  }, [existingItem, isNewRoute, searchParams, currentFolderId]);

  // Ref to track if initial mount is ready
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    hasLoadedRef.current = true;
  }, []);

  // Debounced Autosave Timer
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSave = useCallback(() => {
    if (!hasLoadedRef.current) return;

    const trimmedTitle = title.trim();
    const hasData = trimmedTitle.length > 0 || content.trim().length > 0 || checklistItems.length > 0;
    const fallbackTitle = type === 'checklist' ? 'Untitled Checklist' : 'Untitled Note';

    if (!activeId) {
      // Create new note only if there is meaningful content or title
      if (hasData) {
        setSaveStatus('saving');
        const newItem = addItem({
          title: trimmedTitle || fallbackTitle,
          type,
          folderId,
          content,
          checklistItems,
          color,
          isFavorite,
        });
        loadedIdRef.current = newItem.id;
        setCreatedItemId(newItem.id);
        setSaveStatus('saved');
        setLastSavedTime(format(new Date(), 'h:mm:ss a'));
        navigate(`/notes/${newItem.id}`, { replace: true });
      }
    } else {
      // Update existing item
      setSaveStatus('saving');
      updateItem(activeId, {
        title: trimmedTitle || fallbackTitle,
        type,
        folderId,
        content,
        checklistItems,
        color,
        isFavorite,
      });
      setSaveStatus('saved');
      setLastSavedTime(format(new Date(), 'h:mm:ss a'));
    }
  }, [activeId, title, type, folderId, content, checklistItems, color, isFavorite, addItem, updateItem, navigate]);

  // Trigger debounced autosave on value changes
  const triggerAutosave = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 500);
  }, [performSave]);

  // Flush save on unmount or before navigating
  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      performSave();
    }
  }, [performSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Back Navigation Handler
  const handleBack = () => {
    flushSave();
    navigate(-1);
  };

  // Move to Trash Handler — shows confirmation dialog
  const handleDeleteNote = () => {
    if (activeId) {
      openDeleteDialog(
        activeId,
        title.trim() || (type === 'checklist' ? 'Untitled Checklist' : 'Untitled Note'),
        type === 'checklist' ? 'checklist' : 'note'
      );
    }
  };

  // If active note was moved to trash via confirmation dialog, navigate back
  useEffect(() => {
    if (activeId && !isNewRoute) {
      const itemInStore = items.find((i) => i.id === activeId);
      if (itemInStore && itemInStore.isDeleted) {
        navigate(-1);
      }
    }
  }, [items, activeId, isNewRoute, navigate]);

  // Star Toggle Handler
  const handleToggleStar = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    if (activeId) {
      toggleFavoriteItem(activeId);
    }
    triggerAutosave();
  };

  // Folder Reassignment Handler
  const handleSelectFolder = (newFolderId: string | null) => {
    setFolderId(newFolderId);
    setIsFolderDropdownOpen(false);
    triggerAutosave();
  };

  // Checklist Item Actions
  const handleToggleChecklistItem = (itemId: string) => {
    setChecklistItems((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, isCompleted: !c.isCompleted } : c))
    );
    triggerAutosave();
  };

  const handleUpdateChecklistItemText = (itemId: string, text: string) => {
    setChecklistItems((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, text } : c))
    );
    triggerAutosave();
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklistItems((prev) => prev.filter((c) => c.id !== itemId));
    triggerAutosave();
  };

  const handleAddChecklistItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newChecklistText.trim();
    if (trimmed) {
      const newItem: ChecklistItem = {
        id: `cl-${Date.now()}`,
        text: trimmed,
        isCompleted: false,
      };
      setChecklistItems((prev) => [...prev, newItem]);
      setNewChecklistText('');
      triggerAutosave();
      setTimeout(() => {
        newChecklistInputRef.current?.focus();
      }, 50);
    }
  };

  const handleChecklistKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newItem: ChecklistItem = {
        id: `cl-${Date.now()}`,
        text: '',
        isCompleted: false,
      };
      const nextList = [...checklistItems];
      nextList.splice(index + 1, 0, newItem);
      setChecklistItems(nextList);
      triggerAutosave();
      setTimeout(() => {
        const nextInput = document.getElementById(`cl-input-${newItem.id}`);
        nextInput?.focus();
      }, 50);
    } else if (e.key === 'Backspace' && checklistItems[index].text === '') {
      e.preventDefault();
      if (checklistItems.length > 1) {
        const prevId = checklistItems[index - 1]?.id;
        handleDeleteChecklistItem(checklistItems[index].id);
        if (prevId) {
          setTimeout(() => {
            const prevInput = document.getElementById(`cl-input-${prevId}`);
            prevInput?.focus();
          }, 50);
        }
      }
    }
  };

  // Word count & Checklist metrics
  const wordCount = useMemo(() => {
    if (type === 'checklist') {
      return checklistItems.reduce(
        (acc, item) => acc + (item.text.trim() ? item.text.trim().split(/\s+/).length : 0),
        0
      );
    }
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [type, content, checklistItems]);

  const checklistCompletedCount = checklistItems.filter((c) => c.isCompleted).length;
  const checklistTotalCount = checklistItems.length;
  const checklistProgressPercent =
    checklistTotalCount > 0
      ? Math.round((checklistCompletedCount / checklistTotalCount) * 100)
      : 0;

  const currentFolder = activeFolders.find((f) => f.id === folderId);

  // Missing Note (404)
  if (!isNewRoute && !existingItem) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 text-center select-none animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-xs">
          <AlertCircle className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-[#1F1F1F]">Note not found</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
          This note may have been deleted, moved to trash, or does not exist.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B57D0] text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Workspace</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col flex-1 bg-white relative select-none sm:select-text"
    >
      {/* 1. Top Navigation & Action Header */}
      <header className="h-14 flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 select-none">
        {/* Left: Back Pill + Folder Assignment + Auto-Save Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-700 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Folder Assignment Pill (Only rendered if assigned to a folder) */}
          {currentFolder && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100/70 text-purple-800 text-xs font-medium border border-purple-200/60 transition-colors shadow-2xs cursor-pointer truncate max-w-[140px] sm:max-w-[200px]"
              >
                <FolderIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">{currentFolder.name}</span>
                <ChevronDown className="w-3 h-3 text-purple-400 shrink-0" />
              </button>

              {isFolderDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFolderDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-9 z-40 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 animate-fade-in text-xs max-h-56 overflow-y-auto">
                    {activeFolders.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectFolder(f.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3.5 py-2 text-left cursor-pointer transition-colors truncate',
                          folderId === f.id
                            ? 'bg-purple-50 text-purple-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <FolderIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reassuring Auto-Save Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 shadow-2xs transition-all text-xs">
            {saveStatus === 'saving' ? (
              <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="hidden sm:inline font-semibold">Saving changes...</span>
                <span className="sm:hidden font-semibold">Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium animate-fade-in">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="hidden md:inline font-semibold">All changes saved automatically</span>
                <span className="hidden sm:inline md:hidden font-semibold">Auto-saved</span>
                <span className="sm:hidden font-semibold">Saved</span>
                <span className="text-slate-400 text-[10px] hidden lg:inline">• {lastSavedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Star Favorite + Move to Trash */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Star Favorite Button */}
          <button
            type="button"
            onClick={handleToggleStar}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title="Toggle favorite"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
          >
            <Star
              className={cn(
                'w-4 h-4 transition-transform active:scale-125',
                isFavorite
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-400 hover:text-amber-500'
              )}
            />
          </button>

          {/* Move to Trash Button */}
          <button
            type="button"
            onClick={handleDeleteNote}
            aria-label="Move to trash"
            title="Move to trash"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Centered Editorial Canvas Area */}
      <main className="w-full max-w-3xl mx-auto py-4 sm:py-6 flex flex-col flex-1">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerAutosave();
          }}
          placeholder={type === 'checklist' ? 'Untitled Checklist' : 'Untitled Note'}
          className="w-full bg-transparent border-0 outline-none text-2xl sm:text-4xl font-extrabold text-[#1F1F1F] placeholder-slate-400/80 mb-3 tracking-tight focus:ring-0 leading-tight"
        />

        {/* Meta Bar: Timestamp, Word Count, Autosaved Badge & Type Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600/80 pb-3 mb-6 border-b border-black/[0.04]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {existingItem
                  ? `Updated ${format(new Date(existingItem.updatedAt || existingItem.createdAt), 'd MMM yyyy, h:mm a')}`
                  : 'Draft'}
              </span>
            </span>
            <span>•</span>
            <span className="font-medium">{wordCount} words</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/50">
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Auto-saved</span>
            </span>
          </div>

          {/* Mode Badge Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-xs self-start sm:self-auto border border-slate-200/60">
            {type === 'checklist' ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checklist</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Note</span>
              </>
            )}
          </div>
        </div>

        {/* 3. Content Body Section */}
        {type === 'note' ? (
          /* Standard Note Content Body */
          <div className="flex-1 flex flex-col">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                triggerAutosave();
              }}
              placeholder="Start typing your note here..."
              className="w-full flex-1 min-h-[380px] bg-transparent border-0 outline-none resize-none text-sm sm:text-base leading-relaxed text-[#1F1F1F] placeholder-slate-400 font-normal focus:ring-0"
            />
          </div>
        ) : (
          /* Interactive Checklist Content Body */
          <div className="flex-1 flex flex-col space-y-4">
            {/* Checklist Progress Overview & Metrics */}
            {checklistTotalCount > 0 && (
              <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1F1F1F]">
                      {checklistCompletedCount} of {checklistTotalCount} completed
                    </span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-slate-500 font-normal">{checklistProgressPercent}% ready</span>
                  </div>
                  <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">
                    {checklistCompletedCount === checklistTotalCount ? '🎉 All tasks done' : 'In progress'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${checklistProgressPercent}%` }}
                    className="h-full bg-[#10B981] rounded-full transition-all duration-300 ease-out"
                  />
                </div>
              </div>
            )}

            {/* Checklist Items Stack */}
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {checklistItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl group hover:bg-slate-50 transition-colors"
                  >
                    {/* Interactive Circular Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105 active:scale-95',
                        item.isCompleted
                          ? 'bg-[#10B981] text-white'
                          : 'border border-slate-400 bg-white hover:border-slate-700 text-transparent'
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Text Input */}
                    <input
                      id={`cl-input-${item.id}`}
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateChecklistItemText(item.id, e.target.value)}
                      onKeyDown={(e) => handleChecklistKeyDown(e, index)}
                      placeholder="List item..."
                      className={cn(
                        'flex-1 bg-transparent border-0 outline-none text-sm sm:text-base text-[#1F1F1F] focus:ring-0 py-0.5',
                        item.isCompleted && 'line-through text-slate-400'
                      )}
                    />

                    {/* Delete Item Button on Hover */}
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      aria-label="Remove item"
                      className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Bottom Add Item Input / CTA */}
            <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 pt-2">
              <input
                ref={newChecklistInputRef}
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="+ Add an item and press Enter..."
                className="flex-1 bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 text-xs sm:text-sm text-[#1F1F1F] placeholder-slate-400 outline-none transition-all shadow-2xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default NoteEditor;
