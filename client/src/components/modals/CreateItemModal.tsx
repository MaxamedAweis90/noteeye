import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { ItemType } from '../../types';
import { MorphingSaveButton } from './MorphingSaveButton';

export interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ItemType;
  folderId?: string | null;
  onSave: (data: {
    title: string;
    type: ItemType;
    color: string;
    folderId: string | null;
  }) => void;
}

import { PASTEL_SWATCHES } from './QuickEditModal';

const modalSpring = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 350,
};

/**
 * CreateItemModal Component
 * Ultra-clean creation dialog: Only sets Title and Color palette.
 * Content authoring is strictly deferred to the upcoming canvas view.
 */
export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'note',
  folderId = null,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(
    defaultType === 'checklist' ? '#CEEBFD' : '#FDE3C9'
  );
  const [initialColor, setInitialColor] = useState<string>(
    defaultType === 'checklist' ? '#CEEBFD' : '#FDE3C9'
  );
  const [isSaved, setIsSaved] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const startingColor = defaultType === 'checklist' ? '#CEEBFD' : '#FDE3C9';
      setSelectedColor(startingColor);
      setInitialColor(startingColor);
      setTitle('');
      setIsSaved(false);

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, defaultType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaved) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaved, onClose]);

  // Dirty when user enters a title or selects a different swatch
  const isDirty = title.trim().length > 0 || selectedColor !== initialColor;

  const handleSave = () => {
    if (isSaved || !isDirty) return;

    const finalTitle = title.trim() || (defaultType === 'checklist' ? 'New Checklist' : 'New Note');

    onSave({
      title: finalTitle,
      type: defaultType,
      color: selectedColor,
      folderId,
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isSaved) onClose();
            }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px]"
          />

          {/* Modal Card with Dynamic Pastel Background */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={modalSpring}
            style={{ backgroundColor: selectedColor }}
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
                placeholder={defaultType === 'checklist' ? 'Checklist title...' : 'Note title...'}
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

            {/* Footer Row: Pastel Palette Swatches & Morphing Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-black/5">
              {/* Palette Swatches */}
              <div className="flex items-center gap-2">
                {PASTEL_SWATCHES.map((swatch) => {
                  const isSelected = selectedColor === swatch.hex;
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setSelectedColor(swatch.hex)}
                      style={{ backgroundColor: swatch.hex }}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 shadow-2xs ${
                        isSelected
                          ? 'ring-2 ring-slate-800 ring-offset-2'
                          : 'border border-black/10'
                      }`}
                      title={swatch.name}
                      aria-label={swatch.name}
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
