import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, LogOut, X, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  className?: string;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 30,
};

/**
 * UserMenu Component
 * Elevated user profile avatar pill with smooth physical layout morphing animation
 * between collapsed avatar trigger and expanded profile & settings action card.
 */
export const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Ghost spacer to preserve exact navbar layout when morphed */}
      {isOpen && (
        <div
          className="invisible h-10 px-2 flex items-center gap-2 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-9 h-9 rounded-full" />
          <span className="text-sm font-medium hidden sm:inline">Alex Morgan</span>
          <div className="w-4 h-4" />
        </div>
      )}

      <motion.div
        layout
        transition={springTransition}
        style={{ transformOrigin: 'top right' }}
        className={`bg-white border select-none overflow-hidden ${
          isOpen
            ? 'absolute top-0 right-0 w-64 p-3 rounded-2xl shadow-2xl border-slate-200/80 flex flex-col z-50'
            : 'h-10 px-1.5 sm:px-2 rounded-full border-transparent bg-transparent hover:bg-[#E8EDF4] flex items-center gap-2 cursor-pointer transition-colors shadow-none'
        }`}
        onClick={!isOpen ? () => setIsOpen(true) : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isOpen ? (
            /* State 1: Collapsed Avatar Pill */
            <motion.div
              key="collapsed-avatar"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2 text-[#1F1F1F]"
              aria-label="Open user menu"
            >
              {/* Subtle Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300/60 overflow-hidden flex items-center justify-center font-semibold text-xs text-slate-700 shadow-2xs shrink-0">
                AM
              </div>

              <span className="text-sm font-medium text-[#1F1F1F] hidden sm:inline truncate max-w-[100px]">
                Alex Morgan
              </span>

              <ChevronDown className="w-4 h-4 text-[#737785] shrink-0" />
            </motion.div>
          ) : (
            /* State 2: Morphed Expanded Menu Card */
            <motion.div
              key="expanded-avatar-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full flex flex-col"
            >
              {/* User Header Summary */}
              <div className="flex items-center justify-between pb-2 mb-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3F6377] to-[#0B57D0] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    AM
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#1F1F1F] truncate">
                      Alex Morgan
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      alex.morgan@noteeye.app
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close profile menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              {/* Action Rows */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-xs font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-xs font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                >
                  <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="h-px bg-slate-100 my-1.5" />

              {/* Logout Row */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:bg-rose-50 text-rose-600 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-xs font-medium transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Log out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
