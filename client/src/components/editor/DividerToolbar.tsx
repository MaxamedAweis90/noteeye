import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Trash2 } from '@/components/ui/icons';
import { cn } from '../../utils/cn';

const DIVIDER_COLORS = [
  { name: 'Slate', hex: '#cbd5e1' },
  { name: 'Charcoal', hex: '#334155' },
  { name: 'Sky', hex: '#38bdf8' },
  { name: 'Peach', hex: '#fb923c' },
  { name: 'Mint', hex: '#34d399' },
  { name: 'Lavender', hex: '#c084fc' },
];

export interface DividerToolbarProps {
  isOpen: boolean;
  coords: { x: number; y: number };
  onClose: () => void;
  onStyleChange: (style: 'solid' | 'dashed' | 'dotted' | 'double') => void;
  onThicknessChange: (thickness: '1px' | '2px' | '4px') => void;
  onWidthChange: (width: '100%' | '75%' | '50%') => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

export const DividerToolbar: React.FC<DividerToolbarProps> = ({
  isOpen,
  coords,
  onStyleChange,
  onThicknessChange,
  onWidthChange,
  onColorChange,
  onDelete,
}) => {
  if (!isOpen) return null;

  const toolbarWidth = 340;
  const clampedX = Math.min(Math.max(16, coords.x - toolbarWidth / 2), window.innerWidth - toolbarWidth - 16);
  const clampedY = Math.max(16, coords.y - 56);

  return (
    <AnimatePresence>
      <motion.div
        data-divider-toolbar
        initial={{ opacity: 0, scale: 0.95, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 6 }}
        transition={{ duration: 0.12 }}
        style={{ left: clampedX, top: clampedY }}
        onMouseDown={(e) => e.preventDefault()}
        className="fixed z-50 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-2xl border border-slate-200/90 text-xs select-none animate-fade-in"
      >
        {/* Style Selector */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-100">
          <button
            type="button"
            title="Solid line"
            onClick={() => onStyleChange('solid')}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
          </button>
          <button
            type="button"
            title="Dashed line"
            onClick={() => onStyleChange('dashed')}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
          >
            - -
          </button>
          <button
            type="button"
            title="Dotted line"
            onClick={() => onStyleChange('dotted')}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
          >
            ···
          </button>
        </div>

        {/* Thickness / Size */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-100 text-[10px] font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => onThicknessChange('1px')}
            className="px-1.5 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            1px
          </button>
          <button
            type="button"
            onClick={() => onThicknessChange('2px')}
            className="px-1.5 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            2px
          </button>
          <button
            type="button"
            onClick={() => onThicknessChange('4px')}
            className="px-1.5 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            4px
          </button>
        </div>

        {/* Width */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-100 text-[10px] font-semibold text-slate-600">
          <button
            type="button"
            title="Full Width"
            onClick={() => onWidthChange('100%')}
            className="px-1.5 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            100%
          </button>
          <button
            type="button"
            title="75% Width"
            onClick={() => onWidthChange('75%')}
            className="px-1.5 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            75%
          </button>
          <button
            type="button"
            title="50% Width"
            onClick={() => onWidthChange('50%')}
            className="px-1.5 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            50%
          </button>
        </div>

        {/* Color Swatches */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-100">
          {DIVIDER_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => onColorChange(c.hex)}
              style={{ backgroundColor: c.hex }}
              className={cn(
                'w-3.5 h-3.5 rounded-full border border-black/10 transition-transform hover:scale-125 cursor-pointer shadow-2xs'
              )}
            />
          ))}
        </div>

        {/* Delete */}
        <button
          type="button"
          title="Delete Divider"
          onClick={onDelete}
          className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default DividerToolbar;
