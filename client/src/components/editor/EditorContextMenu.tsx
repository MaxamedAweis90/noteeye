import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Copy,
  Clipboard,
  Scissors,
  Table,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Type,
  Minus,
  ChevronRight,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EditorContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  selectedText: string;
  targetType?: 'text' | 'table' | 'divider';
  onClose: () => void;
  onFormat: (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onTypography: (type: 'paragraph' | 'h1' | 'h2' | 'bullet' | 'numbered') => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertDivider: () => void;
  // Context-aware actions
  onAddRowAbove?: () => void;
  onAddRowBelow?: () => void;
  onDeleteRow?: () => void;
  onAddColLeft?: () => void;
  onAddColRight?: () => void;
  onDeleteCol?: () => void;
  onDeleteTable?: () => void;
  onOpenTableCustomizer?: () => void;
  onOpenDividerCustomizer?: () => void;
  onDeleteDivider?: () => void;
}

export const EditorContextMenu: React.FC<EditorContextMenuProps> = ({
  isOpen,
  x,
  y,
  selectedText,
  targetType = 'text',
  onClose,
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
  onOpenTableCustomizer,
  onOpenDividerCustomizer,
  onDeleteDivider,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hoveredSize, setHoveredSize] = useState<{ rows: number; cols: number }>({
    rows: 2,
    cols: 2,
  });

  const hasSelection = Boolean(selectedText && selectedText.trim().length > 0);

  // Close listeners: outside click, window scroll, and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Screen collision clamping: ensure the menu stays inside viewport bounds
  const menuWidth = 256;
  const menuHeight = targetType === 'table' ? 380 : targetType === 'divider' ? 160 : 430;
  const clampedX = Math.min(Math.max(12, x), window.innerWidth - menuWidth - 12);
  const clampedY = Math.min(Math.max(12, y), window.innerHeight - menuHeight - 12);

  // Submenu placement clamping: prevent overflow on bottom or right screen edge
  const isNearRightEdge = clampedX + menuWidth + 160 > window.innerWidth;
  const isNearBottomEdge = clampedY + 280 > window.innerHeight;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        data-editor-context-menu
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{ left: clampedX, top: clampedY }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        className="fixed z-50 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 p-2 text-xs text-slate-700 select-none animate-fade-in"
      >
        {targetType === 'table' ? (
          /* VARIANT 1: Table-Specific Context Menu */
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Table className="w-3 h-3 text-[#0B57D0]" />
                Table Actions
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onAddRowBelow?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Insert Row Below</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onAddRowAbove?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Insert Row Above</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteRow?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Row</span>
              </div>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              type="button"
              onClick={() => {
                onAddColRight?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Insert Column Right</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onAddColLeft?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Insert Column Left</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteCol?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Column</span>
              </div>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              type="button"
              onClick={() => {
                onOpenTableCustomizer?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-[#0B57D0] transition-colors cursor-pointer text-left font-semibold"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#0B57D0]" />
                <span>Table Customization...</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteTable?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Entire Table</span>
              </div>
            </button>
          </div>
        ) : targetType === 'divider' ? (
          /* VARIANT 2: Divider-Specific Context Menu */
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Minus className="w-3 h-3 text-[#0B57D0]" />
                Divider Actions
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenDividerCustomizer?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-[#0B57D0] transition-colors cursor-pointer text-left font-semibold"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#0B57D0]" />
                <span>Customize Divider...</span>
              </div>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              type="button"
              onClick={() => {
                onDeleteDivider?.();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Divider</span>
              </div>
            </button>
          </div>
        ) : (
          /* VARIANT 3: Standard Rich Text Context Menu */
          <div>
            {/* Section A: Quick Formatting Toolbar Row (Horizontal) */}
            <div className="flex items-center justify-between gap-1 p-1 bg-slate-50/80 rounded-xl border border-slate-100">
              <button
                type="button"
                title="Bold (Ctrl+B)"
                onClick={() => {
                  onFormat('bold');
                  onClose();
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 active:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center flex-1 cursor-pointer"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                title="Italic (Ctrl+I)"
                onClick={() => {
                  onFormat('italic');
                  onClose();
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 active:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center flex-1 cursor-pointer"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                title="Underline (Ctrl+U)"
                onClick={() => {
                  onFormat('underline');
                  onClose();
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 active:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center flex-1 cursor-pointer"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                title="Strikethrough (Ctrl+Shift+X)"
                onClick={() => {
                  onFormat('strikethrough');
                  onClose();
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 active:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center flex-1 cursor-pointer"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 my-1.5" />

            {/* Section B: Clipboard Actions */}
            <div className="space-y-0.5">
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => {
                  onCut();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Cut</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">Ctrl+X</span>
              </button>

              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => {
                  onCopy();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-2.5">
                  <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Copy</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">Ctrl+C</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onPaste();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Clipboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Paste</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">Ctrl+V</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 my-1.5" />

            {/* Section C: Typography & Heading Submenu / Rows */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onTypography('paragraph');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Type className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Paragraph</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">Normal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTypography('h1');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Heading1 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Heading 1</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider"># H1</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTypography('h2');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Heading2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Heading 2</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">## H2</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTypography('bullet');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <List className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Bullet List</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">• List</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTypography('numbered');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <ListOrdered className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Numbered List</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">1. List</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 my-1.5" />

            {/* Section D: Insert Tools */}
            <div className="space-y-0.5">
              {/* Insert Table with 3x3 dimension picker (Overflow Clamped) */}
              <div
                className="relative"
                onMouseEnter={() => setShowTablePicker(true)}
                onMouseLeave={() => setShowTablePicker(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onInsertTable(2, 2);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Table className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-medium">Insert Table</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>3×3</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                </button>

                {/* Submenu Popover with Clean Upward/Downward and Left/Right Clamping */}
                {showTablePicker && (
                  <div
                    className={cn(
                      'absolute z-60 w-36 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 p-2.5 animate-fade-in',
                      isNearRightEdge ? 'right-full mr-2' : 'left-full ml-2',
                      isNearBottomEdge ? 'bottom-0' : 'top-0'
                    )}
                  >
                    <div className="text-[11px] font-semibold text-slate-600 mb-1.5 text-center">
                      {hoveredSize.rows} × {hoveredSize.cols} Table
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((r) =>
                        [1, 2, 3].map((c) => {
                          const isHighlighted =
                            r <= hoveredSize.rows && c <= hoveredSize.cols;
                          return (
                            <button
                              key={`${r}-${c}`}
                              type="button"
                              onMouseEnter={() =>
                                setHoveredSize({ rows: r, cols: c })
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                onInsertTable(r, c);
                                onClose();
                              }}
                              className={cn(
                                'w-8 h-8 rounded-lg border transition-all cursor-pointer flex items-center justify-center text-[10px]',
                                isHighlighted
                                  ? 'bg-[#0B57D0] border-blue-600 text-white font-semibold shadow-2xs'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-400'
                              )}
                            >
                              {r}×{c}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Insert Divider */}
              <button
                type="button"
                onClick={() => {
                  onInsertDivider();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium">Insert Divider</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">---</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default EditorContextMenu;
