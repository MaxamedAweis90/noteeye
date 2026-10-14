import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  Copy,
  Scissors,
} from '@/components/ui/icons';

export interface SelectionFloatingToolbarProps {
  isOpen: boolean;
  coords: { x: number; y: number };
  onFormat: (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  onTypography: (type: 'h1' | 'h2' | 'bullet' | 'paragraph') => void;
  onCut: () => void;
  onCopy: () => void;
}

/**
 * Floating Selection Toolbar (Medium / Canva / Google Docs Style)
 * Automatically appears centered above highlighted text in the editor.
 */
export const SelectionFloatingToolbar: React.FC<SelectionFloatingToolbarProps> = ({
  isOpen,
  coords,
  onFormat,
  onTypography,
  onCut,
  onCopy,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Auto-clamp within viewport
  const toolbarWidth = 320;
  const clampedX = Math.min(Math.max(16, coords.x - toolbarWidth / 2), window.innerWidth - toolbarWidth - 16);
  const clampedY = Math.max(16, coords.y - 48);

  useEffect(() => {
    // Prevent toolbar click from deselecting text
    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={toolbarRef}
          data-selection-toolbar
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          style={{ left: clampedX, top: clampedY }}
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-50 flex items-center gap-0.5 bg-[#1F1F1F]/95 text-white backdrop-blur-md px-1.5 py-1 rounded-2xl shadow-2xl border border-white/10 select-none text-xs"
        >
          {/* Quick Mark Styles */}
          <button
            type="button"
            title="Bold"
            onClick={() => onFormat('bold')}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => onFormat('italic')}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Underline"
            onClick={() => onFormat('underline')}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => onFormat('strikethrough')}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Heading & Lists */}
          <button
            type="button"
            title="Heading 1"
            onClick={() => onTypography('h1')}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() => onTypography('h2')}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Bullet List"
            onClick={() => onTypography('bullet')}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Clipboard */}
          <button
            type="button"
            title="Copy"
            onClick={onCopy}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Cut"
            onClick={onCut}
            className="p-1.5 rounded-xl hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectionFloatingToolbar;
