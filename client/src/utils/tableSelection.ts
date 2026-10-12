/**
 * Microsoft Word / Google Docs style Table Multi-Cell Drag Selection Utility
 * Enables smooth rectangular cell drag-selection across table rows and columns.
 */

export interface TableSelectionManager {
  getSelectedCells: () => HTMLTableCellElement[];
  clearSelection: () => void;
  cleanup: () => void;
}

export const initTableMultiCellSelection = (
  container: HTMLElement,
  onSelectionChange: (selectedCells: HTMLTableCellElement[]) => void
): TableSelectionManager => {
  let isSelecting = false;
  let activeTable: HTMLTableElement | null = null;
  let startCell: HTMLTableCellElement | null = null;
  let currentSelection: HTMLTableCellElement[] = [];

  const getCellCoords = (cell: HTMLTableCellElement) => {
    const row = (cell.parentElement as HTMLTableRowElement)?.rowIndex ?? -1;
    const col = cell.cellIndex;
    return { row, col };
  };

  const clearSelection = () => {
    if (activeTable) {
      activeTable.querySelectorAll('th, td').forEach((el) => {
        el.removeAttribute('data-cell-selected');
      });
    } else {
      container.querySelectorAll('[data-cell-selected]').forEach((el) => {
        el.removeAttribute('data-cell-selected');
      });
    }
    currentSelection = [];
    activeTable = null;
    startCell = null;
    onSelectionChange([]);
  };

  const highlightRect = (table: HTMLTableElement, start: HTMLTableCellElement, end: HTMLTableCellElement) => {
    const s = getCellCoords(start);
    const e = getCellCoords(end);
    if (s.row === -1 || e.row === -1) return;

    const minRow = Math.min(s.row, e.row);
    const maxRow = Math.max(s.row, e.row);
    const minCol = Math.min(s.col, e.col);
    const maxCol = Math.max(s.col, e.col);

    const newSelected: HTMLTableCellElement[] = [];

    Array.from(table.rows).forEach((row, rIdx) => {
      Array.from(row.cells).forEach((cell) => {
        const cIdx = cell.cellIndex;
        if (rIdx >= minRow && rIdx <= maxRow && cIdx >= minCol && cIdx <= maxCol) {
          cell.setAttribute('data-cell-selected', 'true');
          newSelected.push(cell);
        } else {
          cell.removeAttribute('data-cell-selected');
        }
      });
    });

    currentSelection = newSelected;
    onSelectionChange(newSelected);
  };

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('th, td') as HTMLTableCellElement | null;
    if (!cell) {
      // If clicking outside any table or cell, clear existing selection
      if (!target.closest('[data-table-customizer]') && !target.closest('[data-editor-context-menu]')) {
        clearSelection();
      }
      return;
    }

    // Don't start multi-selection if user is hovering within 8px of column border (which is resize handle)
    const rect = cell.getBoundingClientRect();
    if (rect.right - e.clientX <= 8 && rect.right - e.clientX >= -4) {
      return;
    }

    const table = cell.closest('table');
    if (!table) return;

    isSelecting = true;
    activeTable = table;
    startCell = cell;

    // Initially select just this cell
    highlightRect(table, cell, cell);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSelecting || !activeTable || !startCell) return;

    const target = e.target as HTMLElement;
    const cell = target.closest('th, td') as HTMLTableCellElement | null;
    if (!cell || cell.closest('table') !== activeTable) return;

    highlightRect(activeTable, startCell, cell);
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      isSelecting = false;
    }
  };

  container.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  return {
    getSelectedCells: () => currentSelection,
    clearSelection,
    cleanup: () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      clearSelection();
    },
  };
};
