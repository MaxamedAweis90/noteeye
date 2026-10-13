import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
} from "lucide-react";
import { format } from "date-fns";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/uiStore";
import { useUserStore } from "../store/userStore";
import { DEFAULT_PASTEL_COLOR, colorKeyToHex } from "../types";
import type { ItemType, ChecklistItem } from "../types";
import { Table as TableIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { EditorContextMenu } from "../components/editor/EditorContextMenu";
import { SelectionFloatingToolbar } from "../components/editor/SelectionFloatingToolbar";
import { TableCustomizerMenu } from "../components/editor/TableCustomizerMenu";
import { DividerToolbar } from "../components/editor/DividerToolbar";
import { initTableColumnResizing } from "../utils/tableResize";
import { initTableMultiCellSelection } from "../utils/tableSelection";
import { markdownToHtml, htmlToPlainText } from "../utils/markdownToHtml";

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

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("note");
  const [content, setContent] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [color, setColor] = useState(DEFAULT_PASTEL_COLOR);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");

  // Folder dropdown open state
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);

  // New checklist item text input for bottom CTA
  const [newChecklistText, setNewChecklistText] = useState("");
  const newChecklistInputRef = useRef<HTMLInputElement>(null);

  // Rich Text Editor Refs & Context Menu State
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [editorContextMenu, setEditorContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    selectedText: string;
    targetType: "text" | "table" | "divider";
    selectionRange: { start: number; end: number };
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    selectedText: "",
    targetType: "text",
    selectionRange: { start: 0, end: 0 },
  });

  // Floating Selection Toolbar State (Highlight Text Trigger)
  const [selectionToolbar, setSelectionToolbar] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Active Focused Table Info State
  const [activeTableInfo, setActiveTableInfo] = useState<{
    table: HTMLTableElement;
    cell: HTMLTableCellElement;
    rowIdx: number;
    colIdx: number;
  } | null>(null);

  // Multi-cell selection state (Word / Docs Style)
  const [selectedCells, setSelectedCells] = useState<HTMLTableCellElement[]>([]);

  // Table Customizer Modal State
  const [isTableCustomizerOpen, setIsTableCustomizerOpen] = useState(false);

  // Selected Divider State
  const [selectedDivider, setSelectedDivider] = useState<{
    element: HTMLElement;
    x: number;
    y: number;
  } | null>(null);

  // Loaded ID ref to prevent autosave state feedback overwrite while typing
  const loadedIdRef = useRef<string | null>(null);

  // Initialize state from existing item or query params
  useEffect(() => {
    if (existingItem && existingItem.id !== loadedIdRef.current) {
      loadedIdRef.current = existingItem.id;
      setTitle(existingItem.title);
      setType(existingItem.type);
      const convertedHtml = markdownToHtml(existingItem.content || "");
      setContent(convertedHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = convertedHtml;
      }
      setChecklistItems(existingItem.checklistItems || []);
      setColor(
        existingItem.color ||
          (existingItem.type === "checklist"
            ? "#CEEBFD"
            : DEFAULT_PASTEL_COLOR),
      );
      setFolderId(existingItem.folderId);
      setIsFavorite(Boolean(existingItem.isFavorite));
      setSaveStatus("saved");
      setLastSavedTime(
        existingItem.updatedAt
          ? format(new Date(existingItem.updatedAt), "h:mm a")
          : "Just now",
      );
    } else if (isNewRoute && loadedIdRef.current !== "new") {
      loadedIdRef.current = "new";
      const paramType =
        searchParams.get("type") === "checklist" ? "checklist" : "note";
      const paramFolder = searchParams.get("folder") || currentFolderId || null;
      setTitle("");
      setType(paramType);
      setContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setChecklistItems([]);
      const prefKey = useUserStore.getState().user.settings?.defaultNoteColor;
      const prefHex = prefKey ? colorKeyToHex(prefKey) : DEFAULT_PASTEL_COLOR;
      setColor(
        paramType === "checklist" && (!prefKey || prefKey === "peach")
          ? "#CEEBFD"
          : prefHex,
      );
      setFolderId(paramFolder);
      setIsFavorite(false);
      setSaveStatus("saved");
      setLastSavedTime("Just now");
    }
  }, [existingItem, isNewRoute, searchParams, currentFolderId]);

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

  const performSave = useCallback(() => {
    if (!hasLoadedRef.current) return;

    const trimmedTitle = title.trim();
    const hasData =
      trimmedTitle.length > 0 ||
      content.trim().length > 0 ||
      checklistItems.length > 0;
    const fallbackTitle =
      type === "checklist" ? "Untitled Checklist" : "Untitled Note";

    if (!activeId) {
      // Create new note only if there is meaningful content or title
      if (hasData) {
        setSaveStatus("saving");
        const newItem = addItem({
          title: trimmedTitle || fallbackTitle,
          type,
          folderId,
          content,
          checklistItems,
          color,
          isFavorite,
        });
        if (newItem) {
          loadedIdRef.current = newItem.id;
          setCreatedItemId(newItem.id);
          setSaveStatus("saved");
          setLastSavedTime(format(new Date(), "h:mm:ss a"));
          navigate(`/notes/${newItem.id}`, { replace: true });
        } else {
          setSaveStatus("saved");
        }
      }
    } else {
      // Update existing item
      setSaveStatus("saving");
      updateItem(activeId, {
        title: trimmedTitle || fallbackTitle,
        type,
        folderId,
        content,
        checklistItems,
        color,
        isFavorite,
      });
      setSaveStatus("saved");
      setLastSavedTime(format(new Date(), "h:mm:ss a"));
    }
  }, [
    activeId,
    title,
    type,
    folderId,
    content,
    checklistItems,
    color,
    isFavorite,
    addItem,
    updateItem,
    navigate,
  ]);

  // Trigger debounced autosave on value changes
  const triggerAutosave = useCallback(() => {
    setSaveStatus("saving");
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
        title.trim() ||
          (type === "checklist" ? "Untitled Checklist" : "Untitled Note"),
        type === "checklist" ? "checklist" : "note",
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
      prev.map((c) =>
        c.id === itemId ? { ...c, isCompleted: !c.isCompleted } : c,
      ),
    );
    triggerAutosave();
  };

  const handleUpdateChecklistItemText = (itemId: string, text: string) => {
    setChecklistItems((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, text } : c)),
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
        completed: false,
        isCompleted: false,
      };
      setChecklistItems((prev) => [...prev, newItem]);
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

  // Save active selection whenever user clicks or presses key
  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      editorRef.current &&
      editorRef.current.contains(sel.anchorNode)
    ) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restore active selection before executing command
  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current && editorRef.current) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } catch {
        editorRef.current.focus();
      }
    } else if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Dual-Stack Undo / Redo Engine for NoteEditor
  const editorHistoryRef = useRef<{
    past: string[];
    future: string[];
  }>({ past: [], future: [] });

  const checklistHistoryRef = useRef<{
    past: ChecklistItem[][];
    future: ChecklistItem[][];
  }>({ past: [], future: [] });

  const typingTimerRef = useRef<any>(null);

  const saveHistorySnapshot = useCallback(() => {
    if (type === "note" && editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const past = editorHistoryRef.current.past;
      if (past.length === 0 || past[past.length - 1] !== currentHtml) {
        past.push(currentHtml);
        if (past.length > 50) past.shift();
        editorHistoryRef.current.future = [];
      }
    } else if (type === "checklist") {
      const past = checklistHistoryRef.current.past;
      const currentSnapshot = JSON.parse(JSON.stringify(checklistItems));
      past.push(currentSnapshot);
      if (past.length > 50) past.shift();
      checklistHistoryRef.current.future = [];
    }
  }, [type, checklistItems]);

  const handleUndo = useCallback(() => {
    if (type === "checklist") {
      const { past, future } = checklistHistoryRef.current;
      if (past.length === 0) {
        showToast("Nothing to undo");
        return;
      }
      future.push(JSON.parse(JSON.stringify(checklistItems)));
      const previous = past.pop()!;
      setChecklistItems(previous);
      triggerAutosave();
      showToast("Undo");
      return;
    }

    if (!editorRef.current) return;
    const { past, future } = editorHistoryRef.current;
    if (past.length === 0) {
      showToast("Nothing to undo");
      return;
    }
    const currentHtml = editorRef.current.innerHTML;
    future.push(currentHtml);
    const previousHtml = past.pop()!;
    editorRef.current.innerHTML = previousHtml;
    setContent(previousHtml);
    triggerAutosave();
    showToast("Undo");
  }, [type, checklistItems, triggerAutosave, showToast]);

  const handleRedo = useCallback(() => {
    if (type === "checklist") {
      const { past, future } = checklistHistoryRef.current;
      if (future.length === 0) {
        showToast("Nothing to redo");
        return;
      }
      past.push(JSON.parse(JSON.stringify(checklistItems)));
      const next = future.pop()!;
      setChecklistItems(next);
      triggerAutosave();
      showToast("Redo");
      return;
    }

    if (!editorRef.current) return;
    const { past, future } = editorHistoryRef.current;
    if (future.length === 0) {
      showToast("Nothing to redo");
      return;
    }
    const currentHtml = editorRef.current.innerHTML;
    past.push(currentHtml);
    const nextHtml = future.pop()!;
    editorRef.current.innerHTML = nextHtml;
    setContent(nextHtml);
    triggerAutosave();
    showToast("Redo");
  }, [type, checklistItems, triggerAutosave, showToast]);

  // Handle editor HTML input
  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setContent(html);
      triggerAutosave();

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        saveHistorySnapshot();
      }, 700);
    }
  }, [triggerAutosave, saveHistorySnapshot]);

  // Intercept KeyDown for Ctrl+Z undo, Ctrl+Shift+Z redo, and Backspace/Delete on dividers
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      handleUndo();
    } else if (
      (e.ctrlKey || e.metaKey) &&
      ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y")
    ) {
      e.preventDefault();
      handleRedo();
    } else if (
      (e.key === "Backspace" || e.key === "Delete") &&
      selectedDivider
    ) {
      e.preventDefault();
      handleDeleteDivider();
    }
  };

  // Helper to find inner hr if wrapped in block container
  const getInnerHr = (el: HTMLElement): HTMLElement => {
    return (el.querySelector("hr") as HTMLElement) || el;
  };

  // Handle editor selection and interaction (divider/table selection & floating toolbar)
  const handleEditorInteraction = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      saveCurrentSelection();

      const target = e.target as HTMLElement;

      // Check if clicked a divider (either container block or hr)
      const divider = target.closest("[data-noteeye-divider]") || target.closest("hr");
      if (divider) {
        editorRef.current?.querySelectorAll("[data-noteeye-divider], hr").forEach((el) => {
          el.classList.remove(
            "ring-2",
            "ring-[#0B57D0]",
            "ring-offset-2",
            "rounded-lg",
            "rounded-xs",
          );
        });
        divider.classList.add(
          "ring-2",
          "ring-[#0B57D0]",
          "ring-offset-2",
          "rounded-lg",
        );
        const rect = divider.getBoundingClientRect();
        setSelectedDivider({
          element: divider as HTMLElement,
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
        setActiveTableInfo(null);
        showToast("Divider selected");
      } else {
        if (selectedDivider && !target.closest("[data-divider-toolbar]")) {
          editorRef.current?.querySelectorAll("[data-noteeye-divider], hr").forEach((el) => {
            el.classList.remove(
              "ring-2",
              "ring-[#0B57D0]",
              "ring-offset-2",
              "rounded-lg",
              "rounded-xs",
            );
          });
          setSelectedDivider(null);
        }
      }

      // Check if focused inside a table
      const table = target.closest("table");
      const cell = target.closest("th, td") as HTMLTableCellElement | null;
      if (table && cell) {
        setActiveTableInfo({
          table,
          cell,
          rowIdx: (cell.parentElement as HTMLTableRowElement)?.rowIndex ?? 0,
          colIdx: cell.cellIndex ?? 0,
        });
      } else if (
        !target.closest("[data-table-customizer]") &&
        !target.closest("[data-editor-context-menu]")
      ) {
        setActiveTableInfo(null);
        setSelectedCells([]);
      }

      // Check for highlighted text to trigger SelectionFloatingToolbar
      const sel = window.getSelection();
      if (
        sel &&
        sel.rangeCount > 0 &&
        !sel.isCollapsed &&
        editorRef.current?.contains(sel.anchorNode)
      ) {
        const selectedStr = sel.toString().trim();
        if (selectedStr.length > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setSelectionToolbar({
              isOpen: true,
              x: rect.left + rect.width / 2,
              y: rect.top,
            });
            return;
          }
        }
      }
      setSelectionToolbar((prev) =>
        prev.isOpen ? { ...prev, isOpen: false } : prev,
      );
    },
    [saveCurrentSelection, selectedDivider, showToast],
  );

  // Column Drag-to-Resize & Table Multi-Cell Drag Selection Listeners
  useEffect(() => {
    if (editorRef.current && type === "note") {
      const resizeCleanup = initTableColumnResizing(
        editorRef.current,
        handleEditorInput,
      );
      const selectionManager = initTableMultiCellSelection(
        editorRef.current,
        (cells) => {
          setSelectedCells(cells);
          if (cells.length > 0) {
            const firstCell = cells[0];
            const table = firstCell.closest("table");
            if (table) {
              setActiveTableInfo({
                table,
                cell: firstCell,
                rowIdx: (firstCell.parentElement as HTMLTableRowElement)?.rowIndex ?? 0,
                colIdx: firstCell.cellIndex ?? 0,
              });
            }
          }
        },
      );
      return () => {
        resizeCleanup();
        selectionManager.cleanup();
      };
    }
  }, [type, handleEditorInput]);

  // Open Editor-Scoped Rich Text Context Menu (Context Aware)
  const handleEditorContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Dismiss floating selection toolbar when opening right-click context menu
    setSelectionToolbar({ isOpen: false, x: 0, y: 0 });

    const target = e.target as HTMLElement;
    let targetType: "text" | "table" | "divider" = "text";

    // Check if right-clicking a table
    const table = target.closest("table");
    const cell = target.closest("th, td") as HTMLTableCellElement | null;
    if (table && cell) {
      targetType = "table";
      setActiveTableInfo({
        table,
        cell,
        rowIdx: (cell.parentElement as HTMLTableRowElement)?.rowIndex ?? 0,
        colIdx: cell.cellIndex ?? 0,
      });
    }

    // Check if right-clicking a divider
    const hr = target.closest("hr");
    if (hr) {
      targetType = "divider";
      const rect = hr.getBoundingClientRect();
      setSelectedDivider({
        element: hr,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }

    let selected = "";
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      selected = sel.toString();
    }

    setEditorContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      selectedText: selected,
      targetType,
      selectionRange: { start: 0, end: selected.length },
    });
  };

  // Execute Formatting (Bold, Italic, Underline, Strikethrough)
  const handleFormat = (
    formatType: "bold" | "italic" | "underline" | "strikethrough",
  ) => {
    restoreSelection();
    if (formatType === "strikethrough") {
      document.execCommand("strikeThrough", false);
    } else {
      document.execCommand(formatType, false);
    }
    handleEditorInput();
  };

  // Clipboard Actions
  const handleCut = async () => {
    restoreSelection();
    try {
      document.execCommand("cut");
    } catch {
      // fallback
    }
    handleEditorInput();
  };

  const handleCopy = async () => {
    restoreSelection();
    try {
      document.execCommand("copy");
    } catch {
      // fallback
    }
  };

  const handlePaste = async () => {
    restoreSelection();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        document.execCommand("insertText", false, text);
        handleEditorInput();
        return;
      }
    } catch {
      // fallback
    }
    document.execCommand("paste");
    handleEditorInput();
  };

  // Typography & Headings Formatter
  const handleTypography = (
    typographyType: "paragraph" | "h1" | "h2" | "bullet" | "numbered",
  ) => {
    restoreSelection();
    switch (typographyType) {
      case "h1":
        document.execCommand("formatBlock", false, "<h1>");
        break;
      case "h2":
        document.execCommand("formatBlock", false, "<h2>");
        break;
      case "bullet":
        document.execCommand("insertUnorderedList", false);
        break;
      case "numbered":
        document.execCommand("insertOrderedList", false);
        break;
      case "paragraph":
      default:
        document.execCommand("formatBlock", false, "<p>");
        break;
    }
    handleEditorInput();
  };

  // Helper to insert a DOM node at the current caret / selection
  const insertNodeAtSelection = (node: Node) => {
    const sel = window.getSelection();
    let range: Range | null = null;
    if (savedRangeRef.current) {
      range = savedRangeRef.current;
    } else if (sel && sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
    }

    if (
      range &&
      editorRef.current &&
      editorRef.current.contains(range.commonAncestorContainer)
    ) {
      range.deleteContents();
      range.insertNode(node);

      // Create an empty paragraph after the node so user can keep typing below it
      const p = document.createElement("p");
      p.innerHTML = "<br>";
      if (node.nextSibling) {
        node.parentNode?.insertBefore(p, node.nextSibling);
      } else {
        node.parentNode?.appendChild(p);
      }

      const newRange = document.createRange();
      newRange.setStart(p, 0);
      newRange.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    } else if (editorRef.current) {
      editorRef.current.appendChild(node);
      const p = document.createElement("p");
      p.innerHTML = "<br>";
      editorRef.current.appendChild(p);
    }

    handleEditorInput();
  };

  // Insert Table Formatter (creates real, visual, editable HTML table)
  const handleInsertTable = (rows = 2, cols = 2) => {
    restoreSelection();
    const r = Math.max(1, rows);
    const c = Math.max(1, cols);

    const table = document.createElement("table");
    table.className =
      "w-full border-collapse border border-slate-300 my-3 rounded-lg overflow-hidden";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.className = "bg-slate-100";
    for (let colIdx = 1; colIdx <= c; colIdx++) {
      const th = document.createElement("th");
      th.className =
        "border border-slate-300 p-2 text-left font-semibold text-slate-700 text-sm";
      th.textContent = `Header ${colIdx}`;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (let rowIdx = 1; rowIdx <= r; rowIdx++) {
      const tr = document.createElement("tr");
      for (let colIdx = 1; colIdx <= c; colIdx++) {
        const td = document.createElement("td");
        td.className = "border border-slate-300 p-2 text-sm text-slate-700";
        td.textContent = `Cell ${rowIdx}-${colIdx}`;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    insertNodeAtSelection(table);
  };

  // Insert Divider Formatter (creates structured, selectable block divider)
  const handleInsertDivider = () => {
    saveHistorySnapshot();
    restoreSelection();
    const dividerContainer = document.createElement("div");
    dividerContainer.setAttribute("data-noteeye-divider", "true");
    dividerContainer.setAttribute("contenteditable", "false");
    dividerContainer.className =
      "noteeye-divider-block py-2.5 my-2 cursor-pointer group flex items-center justify-center select-none rounded-lg transition-all";
    dividerContainer.innerHTML = `<hr class="w-full border-t border-slate-300 pointer-events-none group-hover:border-blue-400 transition-colors" />`;
    insertNodeAtSelection(dividerContainer);
    showToast("Divider inserted");
  };

  // Table Structure & Styling Operations (Word / Canva Style)
  const handleAddRowAbove = useCallback(() => {
    if (!activeTableInfo) return;
    saveHistorySnapshot();
    const { table, rowIdx } = activeTableInfo;
    const targetRow = table.rows[rowIdx];
    const newRow = table.insertRow(rowIdx);
    newRow.className = targetRow?.className || "";
    const colCount = targetRow?.cells.length || 2;
    for (let c = 0; c < colCount; c++) {
      const newCell = newRow.insertCell(c);
      newCell.className = "border border-slate-300 p-2 text-sm text-slate-700";
      newCell.textContent = `New Cell`;
    }
    handleEditorInput();
    showToast("Row added above");
  }, [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast]);

  const handleAddRowBelow = useCallback(() => {
    if (!activeTableInfo) return;
    saveHistorySnapshot();
    const { table, rowIdx } = activeTableInfo;
    const newRow = table.insertRow(rowIdx + 1);
    const targetRow = table.rows[rowIdx];
    newRow.className = targetRow?.className || "";
    const colCount = targetRow?.cells.length || 2;
    for (let c = 0; c < colCount; c++) {
      const newCell = newRow.insertCell(c);
      newCell.className = "border border-slate-300 p-2 text-sm text-slate-700";
      newCell.textContent = `New Cell`;
    }
    handleEditorInput();
    showToast("Row added below");
  }, [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast]);

  const handleDeleteRow = useCallback(() => {
    if (!activeTableInfo) return;
    saveHistorySnapshot();
    const { table, rowIdx } = activeTableInfo;
    if (table.rows.length <= 1) {
      table.remove();
      setActiveTableInfo(null);
      setSelectedCells([]);
      showToast("Table deleted");
    } else {
      table.deleteRow(rowIdx);
      const nextCell =
        table.rows[Math.min(rowIdx, table.rows.length - 1)]?.cells[0];
      if (nextCell) {
        setActiveTableInfo((prev) =>
          prev
            ? {
                ...prev,
                cell: nextCell,
                rowIdx: Math.min(rowIdx, table.rows.length - 1),
              }
            : null,
        );
      } else {
        setActiveTableInfo(null);
        setSelectedCells([]);
      }
      showToast("Row deleted");
    }
    handleEditorInput();
  }, [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast]);

  const handleAddColLeft = useCallback(() => {
    if (!activeTableInfo) return;
    saveHistorySnapshot();
    const { table, colIdx } = activeTableInfo;
    Array.from(table.rows).forEach((row, rIdx) => {
      const isHeader =
        rIdx === 0 && row.cells[0]?.tagName.toLowerCase() === "th";
      const cell = isHeader
        ? document.createElement("th")
        : document.createElement("td");
      cell.className = isHeader
        ? "border border-slate-300 p-2 text-left font-semibold text-slate-700 text-sm"
        : "border border-slate-300 p-2 text-sm text-slate-700";
      cell.textContent = isHeader ? `Header` : `Cell`;
      const refCell = row.cells[colIdx];
      if (refCell) {
        row.insertBefore(cell, refCell);
      } else {
        row.appendChild(cell);
      }
    });
    handleEditorInput();
    showToast("Column added left");
  }, [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast]);

  const handleAddColRight = useCallback(() => {
    if (!activeTableInfo) return;
    saveHistorySnapshot();
    const { table, colIdx } = activeTableInfo;
    Array.from(table.rows).forEach((row, rIdx) => {
      const isHeader =
        rIdx === 0 && row.cells[0]?.tagName.toLowerCase() === "th";
      const cell = isHeader
        ? document.createElement("th")
        : document.createElement("td");
      cell.className = isHeader
        ? "border border-slate-300 p-2 text-left font-semibold text-slate-700 text-sm"
        : "border border-slate-300 p-2 text-sm text-slate-700";
      cell.textContent = isHeader ? `Header` : `Cell`;
      const nextCell = row.cells[colIdx + 1];
      if (nextCell) {
        row.insertBefore(cell, nextCell);
      } else {
        row.appendChild(cell);
      }
    });
    handleEditorInput();
    showToast("Column added right");
  }, [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast]);

  const handleDeleteCol = useCallback(() => {
    if (!activeTableInfo) return;
    saveHistorySnapshot();
    const { table, colIdx } = activeTableInfo;
    if ((table.rows[0]?.cells.length ?? 0) <= 1) {
      table.remove();
      setActiveTableInfo(null);
      setSelectedCells([]);
      showToast("Table deleted");
    } else {
      Array.from(table.rows).forEach((row) => {
        if (row.cells[colIdx]) {
          row.deleteCell(colIdx);
        }
      });
      const nextCell = table.rows[0]?.cells[Math.max(0, colIdx - 1)];
      if (nextCell) {
        setActiveTableInfo((prev) =>
          prev ? { ...prev, cell: nextCell, colIdx: Math.max(0, colIdx - 1) } : null,
        );
      } else {
        setActiveTableInfo(null);
        setSelectedCells([]);
      }
      showToast("Column deleted");
    }
    handleEditorInput();
  }, [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast]);

  const handleDeleteTable = useCallback(() => {
    if (!activeTableInfo) return;
    saveHistorySnapshot();
    activeTableInfo.table.remove();
    setActiveTableInfo(null);
    setSelectedCells([]);
    setIsTableCustomizerOpen(false);
    handleEditorInput();
    showToast("Table deleted");
  }, [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast]);

  const handleApplyTableColor = useCallback(
    (color: string, scope: "cell" | "row" | "col") => {
      if (!activeTableInfo) return;
      saveHistorySnapshot();
      const { table, cell, rowIdx, colIdx } = activeTableInfo;
      const bgVal = color === "transparent" ? "" : color;

      if (scope === "cell") {
        // Multi-cell batch application
        const targets = selectedCells.length > 0 ? selectedCells : [cell];
        targets.forEach((c) => {
          c.style.backgroundColor = bgVal;
        });
        showToast(targets.length > 1 ? `Color applied to ${targets.length} cells` : "Color applied to cell");
      } else if (scope === "row") {
        const rowIndices =
          selectedCells.length > 0
            ? Array.from(
                new Set(
                  selectedCells.map(
                    (c) => (c.parentElement as HTMLTableRowElement)?.rowIndex ?? rowIdx,
                  ),
                ),
              )
            : [rowIdx];

        rowIndices.forEach((rIdx) => {
          const row = table.rows[rIdx];
          if (row) {
            Array.from(row.cells).forEach((c) => {
              c.style.backgroundColor = bgVal;
            });
          }
        });
        showToast("Color applied to row");
      } else if (scope === "col") {
        const colIndices =
          selectedCells.length > 0
            ? Array.from(new Set(selectedCells.map((c) => c.cellIndex)))
            : [colIdx];

        Array.from(table.rows).forEach((r) => {
          colIndices.forEach((cIdx) => {
            if (r.cells[cIdx]) {
              r.cells[cIdx].style.backgroundColor = bgVal;
            }
          });
        });
        showToast("Color applied to column");
      }
      handleEditorInput();
    },
    [activeTableInfo, selectedCells, saveHistorySnapshot, handleEditorInput, showToast],
  );

  const handleApplyTableAlignment = useCallback(
    (align: "left" | "center" | "right") => {
      if (!activeTableInfo) return;
      saveHistorySnapshot();
      const targets = selectedCells.length > 0 ? selectedCells : [activeTableInfo.cell];
      targets.forEach((c) => {
        c.style.textAlign = align;
      });
      handleEditorInput();
      showToast(`Aligned ${align}`);
    },
    [activeTableInfo, selectedCells, saveHistorySnapshot, handleEditorInput, showToast],
  );

  const handleApplyTableDensity = useCallback(
    (density: "compact" | "normal" | "spacious") => {
      if (!activeTableInfo) return;
      saveHistorySnapshot();
      const { table } = activeTableInfo;
      const paddingMap = {
        compact: "4px 8px",
        normal: "8px 12px",
        spacious: "14px 18px",
      };
      const pad = paddingMap[density];
      Array.from(table.rows).forEach((row) => {
        Array.from(row.cells).forEach((cell) => {
          cell.style.padding = pad;
        });
      });
      handleEditorInput();
      showToast(`Density set to ${density}`);
    },
    [activeTableInfo, saveHistorySnapshot, handleEditorInput, showToast],
  );

  // Divider Operations
  const handleDividerStyle = useCallback(
    (style: "solid" | "dashed" | "dotted" | "double") => {
      if (!selectedDivider) return;
      saveHistorySnapshot();
      const hr = getInnerHr(selectedDivider.element);
      hr.style.borderTopStyle = style;
      handleEditorInput();
      showToast("Divider style updated");
    },
    [selectedDivider, saveHistorySnapshot, handleEditorInput, showToast],
  );

  const handleDividerThickness = useCallback(
    (thickness: "1px" | "2px" | "4px") => {
      if (!selectedDivider) return;
      saveHistorySnapshot();
      const hr = getInnerHr(selectedDivider.element);
      hr.style.borderTopWidth = thickness;
      handleEditorInput();
      showToast("Divider thickness updated");
    },
    [selectedDivider, saveHistorySnapshot, handleEditorInput, showToast],
  );

  const handleDividerWidth = useCallback(
    (width: "100%" | "75%" | "50%") => {
      if (!selectedDivider) return;
      saveHistorySnapshot();
      const hr = getInnerHr(selectedDivider.element);
      hr.style.width = width;
      hr.style.marginLeft = "auto";
      hr.style.marginRight = "auto";
      handleEditorInput();
      showToast("Divider width updated");
    },
    [selectedDivider, saveHistorySnapshot, handleEditorInput, showToast],
  );

  const handleDividerColor = useCallback(
    (color: string) => {
      if (!selectedDivider) return;
      saveHistorySnapshot();
      const hr = getInnerHr(selectedDivider.element);
      hr.style.borderTopColor = color;
      handleEditorInput();
      showToast("Divider color updated");
    },
    [selectedDivider, saveHistorySnapshot, handleEditorInput, showToast],
  );

  const handleDeleteDivider = useCallback(() => {
    if (!selectedDivider) return;
    saveHistorySnapshot();
    selectedDivider.element.remove();
    setSelectedDivider(null);
    handleEditorInput();
    showToast("Divider deleted");
  }, [selectedDivider, saveHistorySnapshot, handleEditorInput, showToast]);

  // Word count & Checklist metrics
  const wordCount = useMemo(() => {
    if (type === "checklist") {
      return checklistItems.reduce(
        (acc, item) =>
          acc + (item.text.trim() ? item.text.trim().split(/\s+/).length : 0),
        0,
      );
    }
    const plain = htmlToPlainText(content).trim();
    return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  }, [type, content, checklistItems]);

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
          onClick={() => navigate("/")}
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
      <header className="h-14 mt-2 flex items-center justify-between gap-3 pb-4 mb-2 border-b border-slate-100 select-none">
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
                          "w-full flex items-center gap-2 px-3.5 py-2 text-left cursor-pointer transition-colors truncate",
                          folderId === f.id
                            ? "bg-purple-50 text-purple-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50",
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
            {saveStatus === "saving" ? (
              <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="hidden sm:inline font-semibold">
                  Saving changes...
                </span>
                <span className="sm:hidden font-semibold">Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium animate-fade-in">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="hidden md:inline font-semibold">
                  All changes saved automatically
                </span>
                <span className="hidden sm:inline md:hidden font-semibold">
                  Auto-saved
                </span>
                <span className="sm:hidden font-semibold">Saved</span>
                <span className="text-slate-400 text-[10px] hidden lg:inline">
                  • {lastSavedTime}
                </span>
              </div>
            )}
          </div>

          {/* Table Customization Pill in Top Navigation (Word / Canva Style) */}
          <AnimatePresence>
            {activeTableInfo && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setIsTableCustomizerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#0B57D0] border border-blue-200/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              >
                <TableIcon className="w-3.5 h-3.5 text-[#0B57D0]" />
                <span className="hidden sm:inline">
                  {selectedCells.length > 1
                    ? `Table Customization (${selectedCells.length} cells)`
                    : "Table Customization"}
                </span>
                <span className="sm:hidden">
                  {selectedCells.length > 1
                    ? `Table (${selectedCells.length})`
                    : "Table"}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Star Favorite + Move to Trash */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Star Favorite Button */}
          <button
            type="button"
            onClick={handleToggleStar}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            title="Toggle favorite"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
          >
            <Star
              className={cn(
                "w-4 h-4 transition-transform active:scale-125",
                isFavorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-400 hover:text-amber-500",
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
      <main
        data-editor-canvas
        onContextMenu={handleEditorContextMenu}
        className="w-full max-w-3xl mx-auto pt-1 sm:pt-2 pb-6 sm:pb-8 flex flex-col flex-1"
      >
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerAutosave();
          }}
          placeholder={
            type === "checklist" ? "Untitled Checklist" : "Untitled Note"
          }
          className="w-full bg-transparent border-0 outline-none text-2xl sm:text-4xl font-extrabold text-[#1F1F1F] placeholder-slate-400/80 mb-3 tracking-tight focus:ring-0 leading-tight"
        />

        {/* Meta Bar: Timestamp, Word Count, Autosaved Badge & Type Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600/80 pb-3 mb-6 border-b border-black/[0.04]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {existingItem
                  ? `Updated ${format(new Date(existingItem.updatedAt || existingItem.createdAt), "d MMM yyyy, h:mm a")}`
                  : "Draft"}
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
            {type === "checklist" ? (
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
        {type === "note" ? (
          /* Visual Rich Text WYSIWYG Editor Body (Word / Canva Style) */
          <div className="flex-1 flex flex-col">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-editor-canvas
              onContextMenu={handleEditorContextMenu}
              onInput={handleEditorInput}
              onClick={handleEditorInteraction}
              onKeyDown={handleEditorKeyDown}
              onKeyUp={handleEditorInteraction}
              onMouseUp={handleEditorInteraction}
              data-placeholder="Start typing your note here..."
              className="rich-editor w-full flex-1 min-h-[420px] bg-transparent border-0 outline-none text-base leading-relaxed text-[#1F1F1F] font-normal focus:ring-0 select-text cursor-text"
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
                      {checklistCompletedCount} of {checklistTotalCount}{" "}
                      completed
                    </span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-slate-500 font-normal">
                      {checklistProgressPercent}% ready
                    </span>
                  </div>
                  <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">
                    {checklistCompletedCount === checklistTotalCount
                      ? "🎉 All tasks done"
                      : "In progress"}
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
                        "w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105 active:scale-95",
                        item.isCompleted
                          ? "bg-[#10B981] text-white"
                          : "border border-slate-400 bg-white hover:border-slate-700 text-transparent",
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Text Input */}
                    <input
                      id={`cl-input-${item.id}`}
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        handleUpdateChecklistItemText(item.id, e.target.value)
                      }
                      onKeyDown={(e) => handleChecklistKeyDown(e, index)}
                      placeholder="List item..."
                      className={cn(
                        "flex-1 bg-transparent border-0 outline-none text-sm sm:text-base text-[#1F1F1F] focus:ring-0 py-0.5",
                        item.isCompleted && "line-through text-slate-400",
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
            <form
              onSubmit={handleAddChecklistItem}
              className="flex items-center gap-2 pt-2"
            >
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

      {/* Rich Text Context Menu (Word / Docs Style) */}
      <EditorContextMenu
        isOpen={editorContextMenu.isOpen}
        x={editorContextMenu.x}
        y={editorContextMenu.y}
        selectedText={editorContextMenu.selectedText}
        targetType={editorContextMenu.targetType}
        onClose={() =>
          setEditorContextMenu((prev) => ({ ...prev, isOpen: false }))
        }
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
        onOpenTableCustomizer={() => {
          setEditorContextMenu((prev) => ({ ...prev, isOpen: false }));
          setIsTableCustomizerOpen(true);
        }}
        onOpenDividerCustomizer={() => {
          setEditorContextMenu((prev) => ({ ...prev, isOpen: false }));
        }}
        onDeleteDivider={handleDeleteDivider}
      />

      {/* Floating Selection Toolbar for highlighted text */}
      <SelectionFloatingToolbar
        isOpen={selectionToolbar.isOpen}
        coords={{ x: selectionToolbar.x, y: selectionToolbar.y }}
        onFormat={handleFormat}
        onTypography={handleTypography}
        onCopy={handleCopy}
        onCut={handleCut}
      />

      {/* Table Customization Modal / Palette */}
      <TableCustomizerMenu
        isOpen={isTableCustomizerOpen}
        selectedCellCount={selectedCells.length > 1 ? selectedCells.length : 1}
        onClose={() => setIsTableCustomizerOpen(false)}
        onAddRowAbove={handleAddRowAbove}
        onAddRowBelow={handleAddRowBelow}
        onDeleteRow={handleDeleteRow}
        onAddColLeft={handleAddColLeft}
        onAddColRight={handleAddColRight}
        onDeleteCol={handleDeleteCol}
        onDeleteTable={handleDeleteTable}
        onApplyColor={handleApplyTableColor}
        onApplyAlignment={handleApplyTableAlignment}
        onApplyDensity={handleApplyTableDensity}
      />

      {/* Divider Customization Toolbar */}
      {selectedDivider && (
        <DividerToolbar
          isOpen={!!selectedDivider}
          coords={{ x: selectedDivider.x, y: selectedDivider.y }}
          onStyleChange={handleDividerStyle}
          onThicknessChange={handleDividerThickness}
          onWidthChange={handleDividerWidth}
          onColorChange={handleDividerColor}
          onDelete={handleDeleteDivider}
          onClose={() => {
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
        />
      )}
    </motion.div>
  );
};

export default NoteEditor;
