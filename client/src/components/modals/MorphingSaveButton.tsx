import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

export interface MorphingSaveButtonProps {
  /** True when user has typed a title, toggled an item, or changed a swatch */
  isDirty: boolean;
  /** True during success feedback state */
  isSaved?: boolean;
  /** Callback fired when user clicks the active save trigger */
  onSave: () => void;
  disabled?: boolean;
  className?: string;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 30,
};

/**
 * MorphingSaveButton Component — Atomic 4-step state machine:
 * State A: Inactive Check (Muted translucent circle w-9 h-9)
 * State B: Active Check (Crisp white circle w-9 h-9 with shadow-md)
 * State C: Saved Pill Expansion (Elongated white pill with emerald checkmark and 'Saved' text)
 * State D: Handled by parent container triggering downward slide-down exit after delay.
 */
export const MorphingSaveButton: React.FC<MorphingSaveButtonProps> = ({
  isDirty,
  isSaved = false,
  onSave,
  disabled = false,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved || !isDirty || disabled) return;
    onSave();
  };

  if (isSaved) {
    return (
      <motion.div
        layout
        transition={springConfig}
        className={`h-9 px-4 rounded-full bg-white text-emerald-700 flex items-center justify-center gap-1.5 shadow-md select-none ${className}`}
        aria-live="polite"
      >
        <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
        <span className="text-xs font-semibold tracking-tight">Saved</span>
      </motion.div>
    );
  }

  if (isDirty && !disabled) {
    return (
      <motion.button
        layout
        type="button"
        onClick={handleClick}
        transition={springConfig}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className={`w-9 h-9 rounded-full bg-white text-slate-800 hover:bg-white/95 flex items-center justify-center shadow-md hover:shadow-lg cursor-pointer transition-shadow ${className}`}
        aria-label="Save changes"
        title="Save"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
      </motion.button>
    );
  }

  return (
    <motion.button
      layout
      type="button"
      disabled
      transition={springConfig}
      className={`w-9 h-9 rounded-full bg-black/10 text-neutral-500/80 flex items-center justify-center shadow-none cursor-not-allowed select-none ${className}`}
      aria-label="No pending changes"
      title="No changes to save"
    >
      <Check className="w-4 h-4 stroke-[2.5]" />
    </motion.button>
  );
};
