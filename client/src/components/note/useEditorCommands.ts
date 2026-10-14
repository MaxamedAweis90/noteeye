import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import type { ItemType, ChecklistItem, IdeaItem } from '../../types';
import { initTableColumnResizing } from '../../utils/tableResize';
import { initTableMultiCellSelection } from '../../utils/tableSelection';

export interface UseEditorCommandsOptions {
  editorRef: React.RefObject<HTMLDivElement | null>;
  type: ItemType;
  checklistItems: ChecklistItem[];
  setChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  ideaItems?: IdeaItem[];
  setIdeaItems?: React.Dispatch<React.SetStateAction<IdeaItem[]>>;
  setContent: (html: string) => void;
  triggerAutosave: () => void;
  showToast: (msg: string) => void;
  isLocallyDirtyRef: React.MutableRefObject<boolean>;
  latestValuesRef: React.MutableRefObject<any>;
}

/**
 * Helper to find inner hr if wrapped in block container
 */
const getInnerHr = (el: HTMLElement): HTMLElement => {
  return (el.querySelector("hr") as HTMLElement) || el;
};

/**
 * useEditorCommands — Centralizes all rich text formatting, table tools, divider manipulation,
 * undo/redo dual history stacks, context menus, and selection toolbars.
 */
export function useEditorCommands({
  editorRef,
  type,
  checklistItems,
  setChecklistItems,
  ideaItems,
  setIdeaItems,
  setContent,
  triggerAutosave,
  showToast,
  isLocallyDirtyRef,
  latestValuesRef,
}: UseEditorCommandsOptions) {
  const savedRangeRef = useRef<Range | null>(null);

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

  // Editor-Scoped Rich Text Context Menu State
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

  // Dual-Stack Undo / Redo Engine for NoteEditor
  const editorHistoryRef = useRef<{
    past: string[];
    future: string[];
  }>({ past: [], future: [] });

  const checklistHistoryRef = useRef<{
    past: ChecklistItem[][];
    future: ChecklistItem[][];
  }>({ past: [], future: [] });

  const ideaHistoryRef = useRef<{
    past: IdeaItem[][];
    future: IdeaItem[][];
  }>({ past: [], future: [] });

  const typingTimerRef = useRef<any>(null);

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
  }, [editorRef]);

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
  }, [editorRef]);

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
    } else if (type === "idea" && ideaItems) {
      const past = ideaHistoryRef.current.past;
      const currentSnapshot = JSON.parse(JSON.stringify(ideaItems));
      past.push(currentSnapshot);
      if (past.length > 50) past.shift();
      ideaHistoryRef.current.future = [];
    }
  }, [type, checklistItems, ideaItems, editorRef]);

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
      latestValuesRef.current.checklistItems = previous;
      isLocallyDirtyRef.current = true;
      triggerAutosave();
      showToast("Undo");
      return;
    }

    if (type === "idea") {
      if (!setIdeaItems) return;
      const { past, future } = ideaHistoryRef.current;
      if (past.length === 0) {
        showToast("Nothing to undo");
        return;
      }
      future.push(JSON.parse(JSON.stringify(ideaItems || [])));
      const previous = past.pop()!;
      setIdeaItems(previous);
      latestValuesRef.current.ideaItems = previous;
      isLocallyDirtyRef.current = true;
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
    latestValuesRef.current.content = previousHtml;
    isLocallyDirtyRef.current = true;
    triggerAutosave();
    showToast("Undo");
  }, [type, checklistItems, ideaItems, triggerAutosave, showToast, editorRef, setChecklistItems, setIdeaItems, setContent, latestValuesRef, isLocallyDirtyRef]);

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
      latestValuesRef.current.checklistItems = next;
      isLocallyDirtyRef.current = true;
      triggerAutosave();
      showToast("Redo");
      return;
    }

    if (type === "idea") {
      if (!setIdeaItems) return;
      const { past, future } = ideaHistoryRef.current;
      if (future.length === 0) {
        showToast("Nothing to redo");
        return;
      }
      past.push(JSON.parse(JSON.stringify(ideaItems || [])));
      const next = future.pop()!;
      setIdeaItems(next);
      latestValuesRef.current.ideaItems = next;
      isLocallyDirtyRef.current = true;
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
    latestValuesRef.current.content = nextHtml;
    isLocallyDirtyRef.current = true;
    triggerAutosave();
    showToast("Redo");
  }, [type, checklistItems, ideaItems, triggerAutosave, showToast, editorRef, setChecklistItems, setIdeaItems, setContent, latestValuesRef, isLocallyDirtyRef]);

  // Handle editor HTML input
  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      latestValuesRef.current.content = html;
      isLocallyDirtyRef.current = true;
      setContent(html);
      triggerAutosave();

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        saveHistorySnapshot();
      }, 700);
    }
  }, [triggerAutosave, saveHistorySnapshot, editorRef, latestValuesRef, isLocallyDirtyRef, setContent]);

  // Helper to insert a DOM node at the current caret / selection
  const insertNodeAtSelection = useCallback((node: Node) => {
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
  }, [editorRef, handleEditorInput]);

  // Insert Divider Formatter (creates structured, selectable block divider)
  const handleInsertDivider = useCallback(() => {
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
  }, [saveHistorySnapshot, restoreSelection, insertNodeAtSelection, showToast]);

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

  // Intercept KeyDown for Ctrl+Z undo, Ctrl+Shift+Z redo, and Backspace/Delete on dividers
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, [handleUndo, handleRedo, selectedDivider, handleDeleteDivider]);

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
    [saveCurrentSelection, selectedDivider, showToast, editorRef],
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
  }, [type, handleEditorInput, editorRef]);

  // Open Editor-Scoped Rich Text Context Menu (Context Aware)
  const handleEditorContextMenu = useCallback((e: React.MouseEvent) => {
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
  }, []);

  // Execute Formatting (Bold, Italic, Underline, Strikethrough)
  const handleFormat = useCallback(
    (formatType: "bold" | "italic" | "underline" | "strikethrough") => {
      restoreSelection();
      if (formatType === "strikethrough") {
        document.execCommand("strikeThrough", false);
      } else {
        document.execCommand(formatType, false);
      }
      handleEditorInput();
    },
    [restoreSelection, handleEditorInput],
  );

  // Clipboard Actions
  const handleCut = useCallback(async () => {
    restoreSelection();
    try {
      document.execCommand("cut");
    } catch {
      // fallback
    }
    handleEditorInput();
  }, [restoreSelection, handleEditorInput]);

  const handleCopy = useCallback(async () => {
    restoreSelection();
    try {
      document.execCommand("copy");
    } catch {
      // fallback
    }
  }, [restoreSelection]);

  const handlePaste = useCallback(async () => {
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
  }, [restoreSelection, handleEditorInput]);

  // Typography & Headings Formatter
  const handleTypography = useCallback(
    (typographyType: "paragraph" | "h1" | "h2" | "bullet" | "numbered") => {
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
    },
    [restoreSelection, handleEditorInput],
  );

  // Insert Table Formatter (creates real, visual, editable HTML table)
  const handleInsertTable = useCallback(
    (rows = 2, cols = 2) => {
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
    },
    [restoreSelection, insertNodeAtSelection],
  );

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

  return {
    editorContextMenu,
    setEditorContextMenu,
    handleEditorContextMenu,
    selectionToolbar,
    setSelectionToolbar,
    activeTableInfo,
    setActiveTableInfo,
    selectedCells,
    setSelectedCells,
    isTableCustomizerOpen,
    setIsTableCustomizerOpen,
    selectedDivider,
    setSelectedDivider,
    saveCurrentSelection,
    restoreSelection,
    saveHistorySnapshot,
    handleUndo,
    handleRedo,
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
  };
}

export default useEditorCommands;
