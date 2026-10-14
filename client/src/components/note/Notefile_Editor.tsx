import React from 'react';
import { RichTextEditorSection } from './RichTextEditorSection';
import { EditorContextMenu } from '../editor/EditorContextMenu';
import { SelectionFloatingToolbar } from '../editor/SelectionFloatingToolbar';
import { TableCustomizerMenu } from '../editor/TableCustomizerMenu';
import { DividerToolbar } from '../editor/DividerToolbar';

export interface Notefile_EditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onContextMenu: (e: React.MouseEvent) => void;
  onInput: () => void;
  onBlur: () => void;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onKeyUp: (e: React.KeyboardEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  // Toolbar states & handlers
  editorContextMenu: {
    isOpen: boolean;
    x: number;
    y: number;
    selectedText: string;
    targetType: "text" | "table" | "divider";
    selectionRange: { start: number; end: number };
  };
  onCloseContextMenu: () => void;
  selectionToolbar: {
    isOpen: boolean;
    x: number;
    y: number;
  };
  isTableCustomizerOpen: boolean;
  selectedCellsCount: number;
  onCloseTableCustomizer: () => void;
  selectedDivider: {
    element: HTMLElement;
    x: number;
    y: number;
  } | null;
  onCloseDividerToolbar: () => void;
  // Commands
  onFormat: (type: "bold" | "italic" | "underline" | "strikethrough") => void;
  onCut: () => Promise<void>;
  onCopy: () => Promise<void>;
  onPaste: () => Promise<void>;
  onTypography: (type: "paragraph" | "h1" | "h2" | "bullet" | "numbered") => void;
  onInsertTable: (rows?: number, cols?: number) => void;
  onInsertDivider: () => void;
  onAddRowAbove: () => void;
  onAddRowBelow: () => void;
  onDeleteRow: () => void;
  onAddColLeft: () => void;
  onAddColRight: () => void;
  onDeleteCol: () => void;
  onDeleteTable: () => void;
  onApplyTableColor: (color: string, scope: "cell" | "row" | "col") => void;
  onApplyTableAlignment: (align: "left" | "center" | "right") => void;
  onApplyTableDensity: (density: "compact" | "normal" | "spacious") => void;
  onDividerStyle: (style: "solid" | "dashed" | "dotted" | "double") => void;
  onDividerThickness: (thickness: "1px" | "2px" | "4px") => void;
  onDividerWidth: (width: "100%" | "75%" | "50%") => void;
  onDividerColor: (color: string) => void;
  onDeleteDivider: () => void;
  onOpenTableCustomizer: () => void;
}

/**
 * Notefile_Editor — Dedicated Rich Text Note File Editor Component.
 * Integrates the contentEditable canvas with selection toolbars, table customizer, divider styling, and context menus.
 */
export const Notefile_Editor: React.FC<Notefile_EditorProps> = ({
  editorRef,
  onContextMenu,
  onInput,
  onBlur,
  onClick,
  onKeyDown,
  onKeyUp,
  onMouseUp,
  editorContextMenu,
  onCloseContextMenu,
  selectionToolbar,
  isTableCustomizerOpen,
  selectedCellsCount,
  onCloseTableCustomizer,
  selectedDivider,
  onCloseDividerToolbar,
  onFormat,
  onCut,
  onCopy,
  onPaste,
  onTypography,
  onInsertTable,
  onInsertDivider,
  onAddRowAbove,
  onAddRowBelow,
  onDeleteRow,
  onAddColLeft,
  onAddColRight,
  onDeleteCol,
  onDeleteTable,
  onApplyTableColor,
  onApplyTableAlignment,
  onApplyTableDensity,
  onDividerStyle,
  onDividerThickness,
  onDividerWidth,
  onDividerColor,
  onDeleteDivider,
  onOpenTableCustomizer,
}) => {
  return (
    <>
      <RichTextEditorSection
        ref={editorRef}
        onContextMenu={onContextMenu}
        onInput={onInput}
        onBlur={onBlur}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onMouseUp={onMouseUp}
      />

      {/* Rich Text Context Menu (Word / Docs Style) */}
      <EditorContextMenu
        isOpen={editorContextMenu.isOpen}
        x={editorContextMenu.x}
        y={editorContextMenu.y}
        selectedText={editorContextMenu.selectedText}
        targetType={editorContextMenu.targetType}
        onClose={onCloseContextMenu}
        onFormat={onFormat}
        onCut={onCut}
        onCopy={onCopy}
        onPaste={onPaste}
        onTypography={onTypography}
        onInsertTable={onInsertTable}
        onInsertDivider={onInsertDivider}
        onAddRowAbove={onAddRowAbove}
        onAddRowBelow={onAddRowBelow}
        onDeleteRow={onDeleteRow}
        onAddColLeft={onAddColLeft}
        onAddColRight={onAddColRight}
        onDeleteCol={onDeleteCol}
        onDeleteTable={onDeleteTable}
        onOpenTableCustomizer={onOpenTableCustomizer}
        onOpenDividerCustomizer={onCloseContextMenu}
        onDeleteDivider={onDeleteDivider}
      />

      {/* Floating Selection Toolbar for highlighted text */}
      <SelectionFloatingToolbar
        isOpen={selectionToolbar.isOpen}
        coords={{ x: selectionToolbar.x, y: selectionToolbar.y }}
        onFormat={onFormat}
        onTypography={onTypography}
        onCopy={onCopy}
        onCut={onCut}
      />

      {/* Table Customization Modal / Palette */}
      <TableCustomizerMenu
        isOpen={isTableCustomizerOpen}
        selectedCellCount={selectedCellsCount > 1 ? selectedCellsCount : 1}
        onClose={onCloseTableCustomizer}
        onAddRowAbove={onAddRowAbove}
        onAddRowBelow={onAddRowBelow}
        onDeleteRow={onDeleteRow}
        onAddColLeft={onAddColLeft}
        onAddColRight={onAddColRight}
        onDeleteCol={onDeleteCol}
        onDeleteTable={onDeleteTable}
        onApplyColor={onApplyTableColor}
        onApplyAlignment={onApplyTableAlignment}
        onApplyDensity={onApplyTableDensity}
      />

      {/* Divider Customization Toolbar */}
      {selectedDivider && (
        <DividerToolbar
          isOpen={!!selectedDivider}
          coords={{ x: selectedDivider.x, y: selectedDivider.y }}
          onStyleChange={onDividerStyle}
          onThicknessChange={onDividerThickness}
          onWidthChange={onDividerWidth}
          onColorChange={onDividerColor}
          onDelete={onDeleteDivider}
          onClose={onCloseDividerToolbar}
        />
      )}
    </>
  );
};

export default Notefile_Editor;
