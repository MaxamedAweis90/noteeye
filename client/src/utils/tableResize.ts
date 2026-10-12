/**
 * Interactive Table Column Drag-to-Resize utility (Word / Google Docs Style)
 * Detects hovering near column borders, displays 'col-resize' double-arrow cursor,
 * and resizes columns in real-time on drag.
 */
export const initTableColumnResizing = (
  container: HTMLElement,
  onResizeComplete: () => void
): (() => void) => {
  let activeCell: HTMLTableCellElement | null = null;
  let activeTable: HTMLTableElement | null = null;
  let startX = 0;
  let startWidth = 0;
  let colIndex = -1;
  let isDragging = false;

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) return;

    const target = e.target as HTMLElement;
    const cell = target.closest('th, td') as HTMLTableCellElement | null;
    if (!cell) {
      container.style.cursor = '';
      return;
    }

    const rect = cell.getBoundingClientRect();
    const isNearRightEdge = rect.right - e.clientX <= 8 && rect.right - e.clientX >= -4;

    if (isNearRightEdge) {
      container.style.cursor = 'col-resize';
      cell.style.cursor = 'col-resize';
    } else {
      container.style.cursor = '';
      cell.style.cursor = '';
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('th, td') as HTMLTableCellElement | null;
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const isNearRightEdge = rect.right - e.clientX <= 8 && rect.right - e.clientX >= -4;

    if (!isNearRightEdge) return;

    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    activeCell = cell;
    activeTable = cell.closest('table');
    colIndex = cell.cellIndex;
    startX = e.clientX;
    startWidth = cell.offsetWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onDragMove = (moveEvent: MouseEvent) => {
      if (!isDragging || !activeCell || !activeTable) return;

      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + delta);

      Array.from(activeTable.rows).forEach((row) => {
        if (row.cells[colIndex]) {
          row.cells[colIndex].style.width = `${newWidth}px`;
          row.cells[colIndex].style.minWidth = `${newWidth}px`;
        }
      });
    };

    const onDragEnd = () => {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      onResizeComplete();
    };

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  };

  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mousedown', handleMouseDown);

  return () => {
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mousedown', handleMouseDown);
    container.style.cursor = '';
  };
};
