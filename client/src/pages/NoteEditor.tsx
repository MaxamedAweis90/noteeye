import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { format } from "date-fns";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/uiStore";
import { useUserStore } from "../store/userStore";
import { useSyncStore } from "../store/syncStore";
import { DEFAULT_PASTEL_COLOR, colorKeyToHex } from "../types";
import type { ItemType, ChecklistItem, IdeaItem } from "../types";
import { cn } from "../utils/cn";
import { markdownToHtml, htmlToPlainText } from "../utils/markdownToHtml";

// Modular Note Subcomponents, File Editors & Command Hook
import {
  NoteEditorHeader,
  NoteEditorMetaBar,
  NoteEditorNotFound,
  Notefile_Editor,
  Checklistfile_Editor,
  Ideafile_Editor,
  useEditorCommands,
} from "../components/note";

/**
 * Screen 06: Full Note / Checklist / Idea Board Editor
 * Full-canvas distraction-free writing experience with dynamic pastel tinting,
 * debounced autosave, interactive checklist ergonomics, Idea Kanban, and folder assignment.
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
  const showToast = useUIStore((state) => state.showToast);

  // Automatically close details panel when opening full note editor
  useEffect(() => {
    closeDetailsPanel();
  }, [closeDetailsPanel]);

  const isNewRoute = id === "new" || !id;

  // Active (non-deleted) folders for assignment dropdown
  const activeFolders = useMemo(
    () => folders.filter((f) => !f.isDeleted),
    [folders],
  );

  // Lookup existing item
  const existingItem = useMemo(() => {
    if (isNewRoute) return null;
    return items.find((i) => i.id === id && !i.isDeleted) || null;
  }, [items, id, isNewRoute]);

  // Track newly created ID if starting from /notes/new
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const activeId = existingItem ? existingItem.id : createdItemId;

  // Form states initialized synchronously from existingItem if available
  const [title, setTitle] = useState(() => existingItem?.title || "");
  const [type, setType] = useState<ItemType>(
    () =>
      existingItem?.type ||
      (searchParams.get("type") === "checklist"
        ? "checklist"
        : searchParams.get("type") === "idea"
        ? "idea"
        : "note"),
  );
  const [content, setContent] = useState(() =>
    markdownToHtml(existingItem?.content || ""),
  );
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    () => existingItem?.checklistItems || [],
  );
  const [ideaItems, setIdeaItems] = useState<IdeaItem[]>(
    () => existingItem?.ideaItems || [],
  );
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isIdeaInspectorOpen, setIsIdeaInspectorOpen] = useState(false);
  const [color, setColor] = useState(() => {
    if (existingItem?.color) return existingItem.color;
    if (existingItem?.type === "checklist") return "#CEEBFD";
    if (existingItem?.type === "idea") return "#E5DEFA";
    const prefKey = useUserStore.getState().user.settings?.defaultNoteColor;
    const prefHex = prefKey ? colorKeyToHex(prefKey) : DEFAULT_PASTEL_COLOR;
    const rawType = searchParams.get("type");
    if (rawType === "checklist" && (!prefKey || prefKey === "peach")) return "#CEEBFD";
    if (rawType === "idea" && (!prefKey || prefKey === "peach")) return "#E5DEFA";
    return prefHex;
  });
  const [folderId, setFolderId] = useState<string | null>(
    () => existingItem?.folderId ?? searchParams.get("folder") ?? currentFolderId ?? null,
  );
  const [isFavorite, setIsFavorite] = useState(() => Boolean(existingItem?.isFavorite));
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");

  const syncStatus = useSyncStore((s) => s.status);
  const syncPending = useSyncStore((s) => s.pending);
  const syncError = useSyncStore((s) => s.error);

  const isSaving = saveStatus === "saving" || syncPending > 0 || syncStatus === "saving";
  const isSyncError = syncStatus === "error" && !isSaving;
  const isOffline = syncStatus === "offline" && !isSaving;

  // Folder dropdown open state
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);

  // New checklist item text input for bottom CTA
  const [newChecklistText, setNewChecklistText] = useState("");
  const newChecklistInputRef = useRef<HTMLInputElement>(null);

  // Rich Text Editor Ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Loaded ID ref to prevent autosave state feedback overwrite while typing
  const loadedIdRef = useRef<string | null>(
    existingItem ? existingItem.id : isNewRoute ? "new" : null,
  );
  const isLocallyDirtyRef = useRef(false);
  const initialSnapshotRef = useRef<{
    title: string;
    type: ItemType;
    folderId: string | null;
    content: string;
    checklistItems: ChecklistItem[];
    ideaItems: IdeaItem[];
    color: string;
    isFavorite: boolean;
  } | null>(null);
  const hasDiscardedRef = useRef(false);

  // Latest synchronous values ref — prevents stale closure data loss in autosave timeouts
  const latestValuesRef = useRef({
    title,
    type,
    folderId,
    content,
    checklistItems,
    ideaItems,
    color,
    isFavorite,
    activeId,
  });

  // Keep latestValuesRef synchronized on every render
  latestValuesRef.current = {
    title,
    type,
    folderId,
    content,
    checklistItems,
    ideaItems,
    color,
    isFavorite,
    activeId,
  };

  // Extract all rich text commands, tables, dividers, history stacks, and context menus into custom hook
  const {
    editorContextMenu,
    setEditorContextMenu,
    handleEditorContextMenu,
    selectionToolbar,
    activeTableInfo,
    selectedCells,
    isTableCustomizerOpen,
    setIsTableCustomizerOpen,
    selectedDivider,
    setSelectedDivider,
    handleEditorInput,
    handleEditorKeyDown,
    handleEditorInteraction,
    handleFormat,
    handleCut,
    handleCopy,
    handlePaste,
    handleTypography,
    handleInsertTable,
    handleInsertDivider,
    handleAddRowAbove,
    handleAddRowBelow,
    handleDeleteRow,
    handleAddColLeft,
    handleAddColRight,
    handleDeleteCol,
    handleDeleteTable,
    handleApplyTableColor,
    handleApplyTableAlignment,
    handleApplyTableDensity,
    handleDividerStyle,
    handleDividerThickness,
    handleDividerWidth,
    handleDividerColor,
    handleDeleteDivider,
    saveHistorySnapshot,
  } = useEditorCommands({
    editorRef,
    type,
    checklistItems,
    setChecklistItems,
    ideaItems,
    setIdeaItems,
    setContent,
    triggerAutosave: () => triggerAutosave(),
    showToast,
    isLocallyDirtyRef,
    latestValuesRef,
  });

  // Initialize state from existing item or query params
  useEffect(() => {
    if (existingItem && existingItem.id !== loadedIdRef.current) {
      loadedIdRef.current = existingItem.id;
      isLocallyDirtyRef.current = false;
      hasDiscardedRef.current = false;
      useUIStore.getState().setEditorDirtyState(null);
      setTitle(existingItem.title);
      setType(existingItem.type);
      const convertedHtml = markdownToHtml(existingItem.content || "");
      setContent(convertedHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = convertedHtml;
      }
      const initChecklist = existingItem.checklistItems ? JSON.parse(JSON.stringify(existingItem.checklistItems)) : [];
      const initIdeas = existingItem.ideaItems ? JSON.parse(JSON.stringify(existingItem.ideaItems)) : [];
      setChecklistItems(initChecklist);
      setIdeaItems(initIdeas);
      const initColor =
        existingItem.color ||
        (existingItem.type === "checklist"
          ? "#CEEBFD"
          : existingItem.type === "idea"
          ? "#E5DEFA"
          : DEFAULT_PASTEL_COLOR);
      setColor(initColor);
      setFolderId(existingItem.folderId);
      setIsFavorite(Boolean(existingItem.isFavorite));
      setSaveStatus("saved");
      setLastSavedTime(
        existingItem.updatedAt
          ? format(new Date(existingItem.updatedAt), "h:mm a")
          : "Just now",
      );
      initialSnapshotRef.current = {
        title: existingItem.title,
        type: existingItem.type,
        folderId: existingItem.folderId,
        content: convertedHtml,
        checklistItems: initChecklist,
        ideaItems: initIdeas,
        color: initColor,
        isFavorite: Boolean(existingItem.isFavorite),
      };
    } else if (
      existingItem &&
      existingItem.id === loadedIdRef.current &&
      saveStatus === "saved" &&
      syncPending === 0 &&
      !isLocallyDirtyRef.current
    ) {
      // Smoothly reflect external updates (e.g. text/folder edits arriving from another device/browser)
      const incomingHtml = markdownToHtml(existingItem.content || "");
      const currentEditorHtml = editorRef.current?.innerHTML || content;

      if (existingItem.title !== title) {
        setTitle(existingItem.title);
        latestValuesRef.current.title = existingItem.title;
      }
      if (incomingHtml !== currentEditorHtml) {
        setContent(incomingHtml);
        latestValuesRef.current.content = incomingHtml;
        if (editorRef.current) {
          editorRef.current.innerHTML = incomingHtml;
        }
      }
      if (JSON.stringify(existingItem.checklistItems || []) !== JSON.stringify(checklistItems)) {
        setChecklistItems(existingItem.checklistItems || []);
        latestValuesRef.current.checklistItems = existingItem.checklistItems || [];
      }
      if (JSON.stringify(existingItem.ideaItems || []) !== JSON.stringify(ideaItems)) {
        setIdeaItems(existingItem.ideaItems || []);
        latestValuesRef.current.ideaItems = existingItem.ideaItems || [];
      }
      if (existingItem.folderId !== folderId) {
        setFolderId(existingItem.folderId);
        latestValuesRef.current.folderId = existingItem.folderId;
      }
      if (Boolean(existingItem.isFavorite) !== isFavorite) {
        setIsFavorite(Boolean(existingItem.isFavorite));
        latestValuesRef.current.isFavorite = Boolean(existingItem.isFavorite);
      }
      if (existingItem.color && existingItem.color !== color) {
        setColor(existingItem.color);
        latestValuesRef.current.color = existingItem.color;
      }
      if (existingItem.updatedAt) {
        setLastSavedTime(format(new Date(existingItem.updatedAt), "h:mm a"));
      }
    } else if (isNewRoute && loadedIdRef.current !== "new") {
      loadedIdRef.current = "new";
      isLocallyDirtyRef.current = false;
      hasDiscardedRef.current = false;
      useUIStore.getState().setEditorDirtyState(null);
      const rawType = searchParams.get("type");
      const paramType: ItemType =
        rawType === "checklist" ? "checklist" : rawType === "idea" ? "idea" : "note";
      const paramFolder = searchParams.get("folder") || currentFolderId || null;
      setTitle("");
      setType(paramType);
      setContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setChecklistItems([]);
      setIdeaItems([]);
      const prefKey = useUserStore.getState().user.settings?.defaultNoteColor;
      const prefHex = prefKey ? colorKeyToHex(prefKey) : DEFAULT_PASTEL_COLOR;
      const initNewColor =
        paramType === "checklist" && (!prefKey || prefKey === "peach")
          ? "#CEEBFD"
          : paramType === "idea" && (!prefKey || prefKey === "peach")
          ? "#E5DEFA"
          : prefHex;
      setColor(initNewColor);
      setFolderId(paramFolder);
      setIsFavorite(false);
      setSaveStatus("saved");
      setLastSavedTime("Just now");
      initialSnapshotRef.current = {
        title: "",
        type: paramType,
        folderId: paramFolder,
        content: "",
        checklistItems: [],
        ideaItems: [],
        color: initNewColor,
        isFavorite: false,
      };
    }
  }, [
    existingItem,
    isNewRoute,
    searchParams,
    currentFolderId,
    saveStatus,
    syncPending,
    folderId,
    isFavorite,
    color,
    title,
    content,
    checklistItems,
    ideaItems,
  ]);

  // Sync content into editorRef when mounted
  useEffect(() => {
    if (editorRef.current && type === "note" && !editorRef.current.innerHTML && content) {
      editorRef.current.innerHTML = content;
    }
  }, [type, content]);

  // Ref to track if initial mount is ready
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    hasLoadedRef.current = true;
  }, []);

  // Debounced Autosave Timer
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSave = useCallback(
    (isManualConfirmed = false) => {
      if (!hasLoadedRef.current || hasDiscardedRef.current) return;

      // Read directly from latest values ref (guaranteed freshest state, zero closure staleness)
      const {
        title: curTitle,
        type: curType,
        folderId: curFolder,
        checklistItems: curChecklist,
        ideaItems: curIdeas,
        color: curColor,
        isFavorite: curFav,
        activeId: curActiveId,
      } = latestValuesRef.current;

      // For rich text notes, read directly from editorRef.current.innerHTML to capture every typed character
      const finalContent =
        curType === "note" && editorRef.current
          ? editorRef.current.innerHTML
          : latestValuesRef.current.content;

      latestValuesRef.current.content = finalContent;

      const trimmedTitle = curTitle.trim();
      const hasData =
        trimmedTitle.length > 0 ||
        finalContent.trim().length > 0 ||
        curChecklist.length > 0 ||
        (curIdeas && curIdeas.length > 0);
      const fallbackTitle =
        curType === "checklist"
          ? "Untitled Checklist"
          : curType === "idea"
          ? "Untitled Idea"
          : "Untitled Note";

      if (!curActiveId) {
        // Create new note only if there is meaningful content or title
        if (hasData) {
          setSaveStatus("saving");
          const newItem = addItem({
            title: trimmedTitle || fallbackTitle,
            type: curType,
            folderId: curFolder,
            content: finalContent,
            checklistItems: curChecklist,
            ideaItems: curIdeas,
            color: curColor,
            isFavorite: curFav,
          });
          if (newItem) {
            loadedIdRef.current = newItem.id;
            setCreatedItemId(newItem.id);
            latestValuesRef.current.activeId = newItem.id;
            setSaveStatus("saved");
            setLastSavedTime(format(new Date(), "h:mm:ss a"));
            if (isManualConfirmed) {
              isLocallyDirtyRef.current = false;
              initialSnapshotRef.current = {
                title: trimmedTitle || fallbackTitle,
                type: curType,
                folderId: curFolder,
                content: finalContent,
                checklistItems: JSON.parse(JSON.stringify(curChecklist)),
                ideaItems: curIdeas ? JSON.parse(JSON.stringify(curIdeas)) : [],
                color: curColor,
                isFavorite: curFav,
              };
              useUIStore.getState().setEditorDirtyState(null);
            }
            navigate(`/notes/${newItem.id}`, { replace: true });
          } else {
            setSaveStatus("saved");
          }
        }
      } else {
        // Guard against saving an existing item if it hasn't been modified locally,
        // or if the editor has not yet loaded this specific note ID.
        if (!isLocallyDirtyRef.current || loadedIdRef.current !== curActiveId) {
          return;
        }

        // Update existing item
        setSaveStatus("saving");
        updateItem(curActiveId, {
          title: trimmedTitle || fallbackTitle,
          type: curType,
          folderId: curFolder,
          content: finalContent,
          checklistItems: curChecklist,
          ideaItems: curIdeas,
          color: curColor,
          isFavorite: curFav,
        });
        setSaveStatus("saved");
        setLastSavedTime(format(new Date(), "h:mm:ss a"));
        if (isManualConfirmed) {
          isLocallyDirtyRef.current = false;
          initialSnapshotRef.current = {
            title: trimmedTitle || fallbackTitle,
            type: curType,
            folderId: curFolder,
            content: finalContent,
            checklistItems: JSON.parse(JSON.stringify(curChecklist)),
            ideaItems: curIdeas ? JSON.parse(JSON.stringify(curIdeas)) : [],
            color: curColor,
            isFavorite: curFav,
          };
          useUIStore.getState().setEditorDirtyState(null);
        }
      }
    },
    [addItem, updateItem, navigate],
  );

  const handleSaveAndExit = useCallback(async () => {
    performSave(true);
  }, [performSave]);

  const handleDiscardAndExit = useCallback(() => {
    hasDiscardedRef.current = true;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    isLocallyDirtyRef.current = false;
    const curActiveId = latestValuesRef.current.activeId;

    if (curActiveId && !isNewRoute && initialSnapshotRef.current) {
      updateItem(curActiveId, {
        title: initialSnapshotRef.current.title,
        type: initialSnapshotRef.current.type,
        folderId: initialSnapshotRef.current.folderId,
        content: initialSnapshotRef.current.content,
        checklistItems: initialSnapshotRef.current.checklistItems,
        ideaItems: initialSnapshotRef.current.ideaItems,
        color: initialSnapshotRef.current.color,
        isFavorite: initialSnapshotRef.current.isFavorite,
      });
    } else if (createdItemId) {
      useNoteStore.getState().deleteItem(createdItemId);
    }
    useUIStore.getState().setEditorDirtyState(null);
  }, [isNewRoute, updateItem, createdItemId]);

  // Trigger debounced autosave on value changes
  const triggerAutosave = useCallback(() => {
    isLocallyDirtyRef.current = true;
    setSaveStatus("saving");
    useUIStore.getState().setEditorDirtyState({
      isDirty: true,
      itemType: latestValuesRef.current.type,
      title:
        latestValuesRef.current.title ||
        (latestValuesRef.current.type === "checklist"
          ? "Untitled Checklist"
          : latestValuesRef.current.type === "idea"
          ? "Untitled Idea"
          : "Untitled Note"),
      onSaveAndExit: handleSaveAndExit,
      onDiscardAndExit: handleDiscardAndExit,
    });
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      performSave(false);
    }, 450);
  }, [performSave, handleSaveAndExit, handleDiscardAndExit]);

  // Flush save on unmount or before navigating
  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    performSave(false);
  }, [performSave]);

  // Flush on unmount, page reload, tab switch, app backgrounding, or Ctrl+S / Cmd+S
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLocallyDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = () => {
      if (isLocallyDirtyRef.current) {
        window.history.pushState(null, '', window.location.href);
        useUIStore.getState().openSaveDiscardModal(null, true);
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && !hasDiscardedRef.current) {
        flushSave();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performSave(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
      if (!hasDiscardedRef.current && isLocallyDirtyRef.current) {
        flushSave();
      }
      useUIStore.getState().setEditorDirtyState(null);
    };
  }, [flushSave, performSave]);

  // Back Navigation Handler
  const handleBack = () => {
    if (isLocallyDirtyRef.current) {
      useUIStore.getState().openSaveDiscardModal(null, true);
    } else {
      navigate(-1);
    }
  };

  // Move to Trash Handler — shows confirmation dialog
  const handleDeleteNote = () => {
    if (activeId) {
      openDeleteDialog(
        activeId,
        title.trim() ||
          (type === "checklist"
            ? "Untitled Checklist"
            : type === "idea"
            ? "Untitled Idea"
            : "Untitled Note"),
        type === "checklist" ? "checklist" : type === "idea" ? "idea" : "note",
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

  // Star Toggle Handler (immediate sync)
  const handleToggleStar = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    if (activeId) {
      toggleFavoriteItem(activeId);
    }
    setTimeout(() => performSave(), 10);
  };

  // Folder Reassignment Handler (immediate sync)
  const handleSelectFolder = (newFolderId: string | null) => {
    setFolderId(newFolderId);
    setIsFolderDropdownOpen(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (activeId) {
      useNoteStore.getState().moveNoteToFolder(activeId, newFolderId);
      setSaveStatus("saved");
      setLastSavedTime(format(new Date(), "h:mm a"));
    } else {
      setTimeout(() => performSave(), 10);
    }
  };

  // Checklist Item Actions
  const handleToggleChecklistItem = (itemId: string) => {
    saveHistorySnapshot();
    isLocallyDirtyRef.current = true;
    setChecklistItems((prev) => {
      const next = prev.map((c) =>
        c.id === itemId ? { ...c, isCompleted: !c.isCompleted, completed: !c.isCompleted } : c
      );
      latestValuesRef.current.checklistItems = next;
      return next;
    });
    triggerAutosave();
  };

  const handleUpdateChecklistItemText = (itemId: string, text: string) => {
    isLocallyDirtyRef.current = true;
    setChecklistItems((prev) => {
      const next = prev.map((c) => (c.id === itemId ? { ...c, text } : c));
      latestValuesRef.current.checklistItems = next;
      return next;
    });
    triggerAutosave();
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    saveHistorySnapshot();
    isLocallyDirtyRef.current = true;
    setChecklistItems((prev) => {
      const next = prev.filter((c) => c.id !== itemId);
      latestValuesRef.current.checklistItems = next;
      return next;
    });
    triggerAutosave();
  };

  const handleAddChecklistItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newChecklistText.trim();
    if (trimmed) {
      saveHistorySnapshot();
      const newItem: ChecklistItem = {
        id: `cl-${Date.now()}`,
        text: trimmed,
        completed: false,
        isCompleted: false,
      };
      isLocallyDirtyRef.current = true;
      setChecklistItems((prev) => {
        const next = [...prev, newItem];
        latestValuesRef.current.checklistItems = next;
        return next;
      });
      setNewChecklistText("");
      triggerAutosave();
      setTimeout(() => {
        newChecklistInputRef.current?.focus();
      }, 50);
    }
  };

  const handleChecklistKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveHistorySnapshot();
      const newItem: ChecklistItem = {
        id: `cl-${Date.now()}`,
        text: "",
        completed: false,
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
    } else if (e.key === "Backspace" && checklistItems[index].text === "") {
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

  // Idea Kanban Handlers
  const handleAddIdea = (status: 'ideas' | 'completed' = 'ideas', customTitle?: string) => {
    saveHistorySnapshot();
    isLocallyDirtyRef.current = true;
    const newIdea: IdeaItem = {
      id: `idea-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: customTitle?.trim() || 'New Idea',
      description: '',
      status,
      date: new Date().toISOString(),
      order: status === 'completed' ? 0 : ideaItems.filter((i) => i.status === status).length,
    };
    setIdeaItems((prev) => {
      let next: IdeaItem[];
      if (status === 'completed') {
        const others = prev.filter((i) => i.status !== 'completed');
        const completed = [newIdea, ...prev.filter((i) => i.status === 'completed')].map((item, idx) => ({
          ...item,
          order: idx,
        }));
        next = [...others, ...completed];
      } else {
        next = [...prev, newIdea];
      }
      latestValuesRef.current.ideaItems = next;
      return next;
    });
    setSelectedIdeaId(newIdea.id);
    triggerAutosave();
  };

  const handleSelectIdea = (ideaId: string) => {
    setSelectedIdeaId(ideaId);
  };

  const handleOpenIdeaInspector = (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    setIsIdeaInspectorOpen(true);
  };

  const handleMoveCard = (
    ideaId: string,
    targetStatus: 'ideas' | 'completed',
    targetIndex?: number,
  ) => {
    saveHistorySnapshot();
    isLocallyDirtyRef.current = true;
    setIdeaItems((prev) => {
      const target = prev.find((i) => i.id === ideaId);
      if (!target) return prev;

      const others = prev.filter((i) => i.id !== ideaId);
      
      // Cleanly separate and re-index both columns to prevent order drift
      const targetColItems = others
        .filter((i) => i.status === targetStatus)
        .sort((a, b) => a.order - b.order);
      const otherColItems = others
        .filter((i) => i.status !== targetStatus)
        .sort((a, b) => a.order - b.order)
        .map((item, idx) => ({ ...item, order: idx }));

      const updatedTarget: IdeaItem = {
        ...target,
        status: targetStatus,
      };

      if (typeof targetIndex === 'number' && targetIndex >= 0) {
        targetColItems.splice(targetIndex, 0, updatedTarget);
      } else if (targetStatus === 'completed') {
        // Last completed idea goes to the TOP of the completed column
        targetColItems.unshift(updatedTarget);
      } else {
        // Active ideas append to the bottom as before
        targetColItems.push(updatedTarget);
      }

      const reindexedTarget = targetColItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      const next = [...otherColItems, ...reindexedTarget];
      latestValuesRef.current.ideaItems = next;
      return next;
    });
    triggerAutosave();
  };

  const handleUpdateIdeaTitle = (newTitle: string) => {
    if (!selectedIdeaId) return;
    isLocallyDirtyRef.current = true;
    setIdeaItems((prev) => {
      const next = prev.map((i) =>
        i.id === selectedIdeaId ? { ...i, title: newTitle } : i,
      );
      latestValuesRef.current.ideaItems = next;
      return next;
    });
    triggerAutosave();
  };

  const handleUpdateIdeaDescription = (newDesc: string) => {
    if (!selectedIdeaId) return;
    isLocallyDirtyRef.current = true;
    setIdeaItems((prev) => {
      const next = prev.map((i) =>
        i.id === selectedIdeaId ? { ...i, description: newDesc } : i,
      );
      latestValuesRef.current.ideaItems = next;
      return next;
    });
    triggerAutosave();
  };

  const handleUpdateIdeaStatus = (newStatus: 'ideas' | 'completed') => {
    if (!selectedIdeaId) return;
    handleMoveCard(selectedIdeaId, newStatus);
  };

  const handleDeleteIdea = (idToDelete?: string) => {
    const targetId = idToDelete || selectedIdeaId;
    if (!targetId) return;
    saveHistorySnapshot();
    isLocallyDirtyRef.current = true;
    setIdeaItems((prev) => {
      const next = prev
        .filter((i) => i.id !== targetId)
        .map((item, idx) => ({ ...item, order: idx }));
      latestValuesRef.current.ideaItems = next;
      return next;
    });
    if (selectedIdeaId === targetId) {
      setSelectedIdeaId(null);
      setIsIdeaInspectorOpen(false);
    }
    triggerAutosave();
    showToast("Idea deleted");
  };

  // Word count & Checklist metrics
  const wordCount = useMemo(() => {
    if (type === "checklist") {
      return checklistItems.reduce(
        (acc, item) =>
          acc + (item.text.trim() ? item.text.trim().split(/\s+/).length : 0),
        0,
      );
    }
    if (type === "idea") {
      return ideaItems.reduce((acc, item) => {
        const tWords = item.title?.trim() ? item.title.trim().split(/\s+/).length : 0;
        const dWords = item.description?.trim() ? item.description.trim().split(/\s+/).length : 0;
        return acc + tWords + dWords;
      }, 0);
    }
    const plain = htmlToPlainText(content).trim();
    return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  }, [type, content, checklistItems, ideaItems]);

  const checklistCompletedCount = checklistItems.filter(
    (c) => c.isCompleted,
  ).length;
  const checklistTotalCount = checklistItems.length;
  const checklistProgressPercent =
    checklistTotalCount > 0
      ? Math.round((checklistCompletedCount / checklistTotalCount) * 100)
      : 0;

  const currentFolder = activeFolders.find((f) => f.id === folderId);

  // Missing Note (404)
  if (!isNewRoute && !existingItem) {
    return <NoteEditorNotFound onReturnHome={() => navigate("/")} />;
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
      <NoteEditorHeader
        onBack={handleBack}
        currentFolder={currentFolder}
        activeFolders={activeFolders}
        folderId={folderId}
        isFolderDropdownOpen={isFolderDropdownOpen}
        onToggleFolderDropdown={() => setIsFolderDropdownOpen((prev) => !prev)}
        onCloseFolderDropdown={() => setIsFolderDropdownOpen(false)}
        onSelectFolder={handleSelectFolder}
        isSaving={isSaving}
        isSyncError={isSyncError}
        isOffline={isOffline}
        syncError={syncError}
        lastSavedTime={lastSavedTime}
        isDirty={isLocallyDirtyRef.current}
        onSaveNow={() => performSave(true)}
        activeTableInfo={activeTableInfo}
        selectedCellsCount={selectedCells.length}
        onOpenTableCustomizer={() => setIsTableCustomizerOpen(true)}
        isFavorite={isFavorite}
        onToggleStar={handleToggleStar}
        onDelete={handleDeleteNote}
      />

      {/* 2. Centered Editorial Canvas Area */}
      <main
        data-editor-canvas
        onContextMenu={handleEditorContextMenu}
        className={cn(
          "w-full mx-auto pt-1 sm:pt-2 pb-6 sm:pb-8 flex flex-col flex-1",
          type === "idea" ? "max-w-5xl" : "max-w-3xl",
        )}
      >
        {/* Document Title & Meta Bar */}
        <NoteEditorMetaBar
          title={title}
          type={type}
          onTitleChange={(val) => {
            latestValuesRef.current.title = val;
            isLocallyDirtyRef.current = true;
            setTitle(val);
            triggerAutosave();
          }}
          onBlur={flushSave}
          updatedAt={existingItem?.updatedAt}
          createdAt={existingItem?.createdAt}
          wordCount={wordCount}
        />

        {/* 3. Dedicated Modular File Editor Section */}
        {type === "note" ? (
          <Notefile_Editor
            editorRef={editorRef}
            onContextMenu={handleEditorContextMenu}
            onInput={handleEditorInput}
            onBlur={flushSave}
            onClick={handleEditorInteraction}
            onKeyDown={handleEditorKeyDown}
            onKeyUp={handleEditorInteraction}
            onMouseUp={handleEditorInteraction}
            editorContextMenu={editorContextMenu}
            onCloseContextMenu={() =>
              setEditorContextMenu((prev) => ({ ...prev, isOpen: false }))
            }
            selectionToolbar={selectionToolbar}
            isTableCustomizerOpen={isTableCustomizerOpen}
            selectedCellsCount={selectedCells.length}
            onCloseTableCustomizer={() => setIsTableCustomizerOpen(false)}
            selectedDivider={selectedDivider}
            onCloseDividerToolbar={() => {
              if (selectedDivider?.element) {
                selectedDivider.element.classList.remove(
                  "ring-2",
                  "ring-[#0B57D0]",
                  "ring-offset-2",
                  "rounded-lg",
                  "rounded-xs",
                );
              }
              setSelectedDivider(null);
            }}
            onFormat={handleFormat}
            onCut={handleCut}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onTypography={handleTypography}
            onInsertTable={handleInsertTable}
            onInsertDivider={handleInsertDivider}
            onAddRowAbove={handleAddRowAbove}
            onAddRowBelow={handleAddRowBelow}
            onDeleteRow={handleDeleteRow}
            onAddColLeft={handleAddColLeft}
            onAddColRight={handleAddColRight}
            onDeleteCol={handleDeleteCol}
            onDeleteTable={handleDeleteTable}
            onApplyTableColor={handleApplyTableColor}
            onApplyTableAlignment={handleApplyTableAlignment}
            onApplyTableDensity={handleApplyTableDensity}
            onDividerStyle={handleDividerStyle}
            onDividerThickness={handleDividerThickness}
            onDividerWidth={handleDividerWidth}
            onDividerColor={handleDividerColor}
            onDeleteDivider={handleDeleteDivider}
            onOpenTableCustomizer={() => {
              setEditorContextMenu((prev) => ({ ...prev, isOpen: false }));
              setIsTableCustomizerOpen(true);
            }}
          />
        ) : type === "checklist" ? (
          <Checklistfile_Editor
            checklistItems={checklistItems}
            checklistTotalCount={checklistTotalCount}
            checklistCompletedCount={checklistCompletedCount}
            checklistProgressPercent={checklistProgressPercent}
            newChecklistText={newChecklistText}
            newChecklistInputRef={newChecklistInputRef}
            onNewChecklistTextChange={setNewChecklistText}
            onAddChecklistItem={handleAddChecklistItem}
            onToggleChecklistItem={handleToggleChecklistItem}
            onUpdateChecklistItemText={handleUpdateChecklistItemText}
            onDeleteChecklistItem={handleDeleteChecklistItem}
            onChecklistKeyDown={handleChecklistKeyDown}
          />
        ) : (
          <Ideafile_Editor
            ideaItems={ideaItems}
            selectedIdeaId={selectedIdeaId}
            isIdeaInspectorOpen={isIdeaInspectorOpen}
            onSelectIdea={handleSelectIdea}
            onOpenInspector={handleOpenIdeaInspector}
            onCloseInspector={() => setIsIdeaInspectorOpen(false)}
            onAddIdea={handleAddIdea}
            onMoveCard={handleMoveCard}
            onUpdateIdeaTitle={handleUpdateIdeaTitle}
            onUpdateIdeaDescription={handleUpdateIdeaDescription}
            onUpdateIdeaStatus={handleUpdateIdeaStatus}
            onDeleteIdea={handleDeleteIdea}
          />
        )}
      </main>
    </motion.div>
  );
};

export default NoteEditor;
