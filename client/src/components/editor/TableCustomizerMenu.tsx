import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Table,
  Plus,
  Trash2,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const PASTEL_SWATCHES = [
  { name: 'Default', hex: 'transparent' },
  { name: 'Peach', hex: '#FDE3C9' },
  { name: 'Sky', hex: '#CEEBFD' },
  { name: 'Mint', hex: '#D1F4D9' },
  { name: 'Lavender', hex: '#F7D8FA' },
  { name: 'Lemon', hex: '#FFF3C4' },
  { name: 'Slate', hex: '#F1F5F9' },
];

export interface TableCustomizerMenuProps {
  isOpen: boolean;
  selectedCellCount?: number;
  onClose: () => void;
  onAddRowAbove: () => void;
  onAddRowBelow: () => void;
  onDeleteRow: () => void;
  onAddColLeft: () => void;
  onAddColRight: () => void;
  onDeleteCol: () => void;
  onDeleteTable: () => void;
  onApplyColor: (color: string, scope: 'cell' | 'row' | 'col') => void;
  onApplyAlignment: (align: 'left' | 'center' | 'right') => void;
  onApplyDensity: (density: 'compact' | 'normal' | 'spacious') => void;
}

export const TableCustomizerMenu: React.FC<TableCustomizerMenuProps> = ({
  isOpen,
  selectedCellCount = 1,
  onClose,
  onAddRowAbove,
  onAddRowBelow,
  onDeleteRow,
  onAddColLeft,
  onAddColRight,
  onDeleteCol,
  onDeleteTable,
  onApplyColor,
  onApplyAlignment,
  onApplyDensity,
}) => {
  const [colorScope, setColorScope] = useState<'cell' | 'row' | 'col'>('cell');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20 backdrop-blur-2xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-5 text-slate-700 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F1F1F]">Table Customization</h3>
                <p className="text-[11px] text-slate-400">Rows, columns, density & pastel tinting</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 pt-4 text-xs">
            {/* 1. Rows & Columns Management */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Rows & Columns</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Row Actions */}
                <div className="space-y-1.5 p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase px-1">Row</span>
                  <button
                    type="button"
                    onClick={onAddRowAbove}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-2xs transition-all text-left font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>Row Above</span>
                  </button>
                  <button
                    type="button"
                    onClick={onAddRowBelow}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-2xs transition-all text-left font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>Row Below</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteRow}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-left font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Delete Row</span>
                  </button>
                </div>

                {/* Column Actions */}
                <div className="space-y-1.5 p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase px-1">Column</span>
                  <button
                    type="button"
                    onClick={onAddColLeft}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-2xs transition-all text-left font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>Column Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={onAddColRight}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-2xs transition-all text-left font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>Column Right</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteCol}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-left font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Delete Column</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Pastel Color Palette */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Coloring</span>
                </span>

                {/* Target Scope Switcher */}
                <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setColorScope('cell')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      colorScope === 'cell' ? 'bg-white shadow-2xs text-[#0B57D0]' : 'text-slate-600'
                    )}
                  >
                    {selectedCellCount > 1 ? `${selectedCellCount} Cells` : 'Cell'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorScope('row')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      colorScope === 'row' ? 'bg-white shadow-2xs text-[#0B57D0]' : 'text-slate-600'
                    )}
                  >
                    Row
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorScope('col')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      colorScope === 'col' ? 'bg-white shadow-2xs text-[#0B57D0]' : 'text-slate-600'
                    )}
                  >
                    Column
                  </button>
                </div>
              </div>

              {/* Swatches */}
              <div className="flex items-center justify-between gap-1 p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
                {PASTEL_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    title={swatch.name}
                    onClick={() => onApplyColor(swatch.hex, colorScope)}
                    style={{ backgroundColor: swatch.hex === 'transparent' ? '#ffffff' : swatch.hex }}
                    className={cn(
                      'w-7 h-7 rounded-xl border border-black/10 transition-transform hover:scale-115 active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center text-[9px]',
                      swatch.hex === 'transparent' && 'border-dashed border-slate-300'
                    )}
                  >
                    {swatch.hex === 'transparent' ? '✕' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Text Alignment & Density */}
            <div className="grid grid-cols-2 gap-2">
              {/* Alignment */}
              <div className="p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 uppercase px-1 block mb-1">Align</span>
                <div className="flex items-center justify-around">
                  <button
                    type="button"
                    onClick={() => onApplyAlignment('left')}
                    className="p-1.5 rounded-lg hover:bg-white hover:shadow-2xs text-slate-700 cursor-pointer transition-all"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyAlignment('center')}
                    className="p-1.5 rounded-lg hover:bg-white hover:shadow-2xs text-slate-700 cursor-pointer transition-all"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyAlignment('right')}
                    className="p-1.5 rounded-lg hover:bg-white hover:shadow-2xs text-slate-700 cursor-pointer transition-all"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cell Density / Height */}
              <div className="p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 uppercase px-1 block mb-1">Density</span>
                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => onApplyDensity('compact')}
                    className="flex-1 py-1 rounded-lg hover:bg-white text-slate-700 hover:shadow-2xs text-center cursor-pointer transition-all"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyDensity('normal')}
                    className="flex-1 py-1 rounded-lg hover:bg-white text-slate-700 hover:shadow-2xs text-center cursor-pointer transition-all"
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyDensity('spacious')}
                    className="flex-1 py-1 rounded-lg hover:bg-white text-slate-700 hover:shadow-2xs text-center cursor-pointer transition-all"
                  >
                    Spacious
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Delete Entire Table */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onDeleteTable}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entire Table</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TableCustomizerMenu;
