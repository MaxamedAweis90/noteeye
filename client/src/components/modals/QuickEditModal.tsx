import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { Item } from '../../types';
import { MorphingSaveButton } from './MorphingSaveButton';

export interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Item | null;
  onSave?: (updatedItem: Partial<Item>) => void;
}

// 6 Authentic Noteeye Pastel Swatches
export const PASTEL_SWATCHES = [
  { name: 'Warm Peach', hex: '#FDE3C9' },
  { name: 'Mint Sage', hex: '#C7F3DE' },
  { name: 'Soft Lavender', hex: '#E5DEFA' },
  { name: 'Soft Sky', hex: '#CEEBFD' },
  { name: 'Rose Petal', hex: '#FCDDEC' },
  { name: 'Yellow Mellow', hex: '#FEF3C7' },
] as const;

const springConfig = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 350,
};

/**
 * QuickEditModal Component
 * Ultra-clean edit dialog: Updates Title and Color palette only.
 * Content authoring is handled directly in the upcoming canvas view.
 */
export const QuickEditModal: React.FC<QuickEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<string>('#FDE3C9');
  const [isSaved, setIsSaved] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever opened with item data
  useEffect(() => {
    if (isOpen && item) {
      setTitle(item.title || '');
      setColor(item.color || '#FDE3C9');
      setIsSaved(false);

      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, item]);

  // Escape key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaved) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaved, onClose]);

  const isDirty =
    (title.trim() !== (item?.title || '').trim() && title.trim().length > 0) ||
    color.toUpperCase() !== (item?.color || '#FDE3C9').toUpperCase();

  const handleSave = () => {
    if (!item || isSaved || !isDirty) return;

    onSave?.({
      title: title.trim() || item.title || 'Untitled',
      color,
      updatedAt: new Date().toISOString(),
    });

    setIsSaved(true);

    // State D: Exit velocity pipeline after feedback
    setTimeout(() => {
      onClose();
      setIsSaved(false);
    }, 450);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            onClick={() => {
              if (!isSaved) onClose();
            }}
            aria-hidden="true"
          />

          {/* Modal Card with Dynamic Pastel Background */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={springConfig}
            style={{ backgroundColor: color }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-3xl p-6 shadow-2xl border border-black/5 max-w-sm sm:max-w-md w-full relative z-50 overflow-hidden"
          >
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="Title"
                className="text-xl font-bold text-[#1F1F1F] placeholder-slate-400 outline-none w-full bg-transparent border-none p-0"
              />
              <button
                type="button"
                onClick={onClose}
                disabled={isSaved}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#1F1F1F]/70 hover:text-[#1F1F1F] transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Footer: Color Swatches + Morphing Save Button */}
            <div className="flex justify-between items-center pt-4 border-t border-black/5">
              {/* 6 Pastel Swatches */}
              <div className="flex items-center gap-2" title="Select card tint">
                {PASTEL_SWATCHES.map((swatch) => {
                  const isActive = color.toUpperCase() === swatch.hex.toUpperCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setColor(swatch.hex)}
                      aria-label={swatch.name}
                      style={{ backgroundColor: swatch.hex }}
                      className={`w-6 h-6 rounded-full border-2 border-white shadow-2xs transition-all cursor-pointer hover:scale-110 ${
                        isActive ? 'ring-2 ring-slate-800 ring-offset-2 scale-105' : 'ring-0'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Morphing Save Button (State A -> B -> C -> D) */}
              <MorphingSaveButton
                isDirty={isDirty}
                isSaved={isSaved}
                onSave={handleSave}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
