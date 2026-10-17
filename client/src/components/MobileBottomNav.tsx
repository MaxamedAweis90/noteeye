import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Clock,
  Star,
  Trash2,
  Plus,
  FileText,
  CheckSquare,
  Lightbulb,
  Folder,
  X,
} from '@/components/ui/icons';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/cn';

const springTransition = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 30,
};

/**
 * MobileBottomNav Component
 * Floating island bottom navigation bar for mobile viewports (< 768px).
 * Features:
 * - Floating capsule container detached from viewport bottom edge
 * - Center button that physically morphs directly into the creation menu
 * - Elevated circular blue action button with radiant glow
 * - Sliding active tab indicator pill underneath active tab label
 */
export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const requestNavigation = useUIStore((state) => state.requestNavigation);
  const requestAction = useUIStore((state) => state.requestAction);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);

  const isHomeActive = location.pathname === '/';
  const isRecentsActive = location.pathname === '/recents';
  const isFavoritesActive = location.pathname === '/favorites';
  const isTrashActive = location.pathname === '/trash';

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    const allowed = requestNavigation(to, (targetPath) => {
      setCurrentFolder(null);
      setIsCreateMenuOpen(false);
      navigate(targetPath);
    });
    if (!allowed) {
      e.preventDefault();
    } else {
      setCurrentFolder(null);
      setIsCreateMenuOpen(false);
    }
  };

  // Close create menu on route change
  useEffect(() => {
    setIsCreateMenuOpen(false);
  }, [location.pathname]);

  // Escape key listener to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateMenuOpen) {
        setIsCreateMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateMenuOpen]);

  return (
    <>
      {/* Dimmed backdrop when Create Menu is morphed open */}
      <AnimatePresence>
        {isCreateMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs select-none"
            onClick={() => setIsCreateMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Island Bottom Navigation Container */}
      <div className="md:hidden fixed bottom-3 inset-x-3 sm:bottom-5 sm:inset-x-6 max-w-md mx-auto z-40 select-none">
        <nav
          aria-label="Mobile Navigation"
          className="relative bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] sm:rounded-[32px] px-2 py-1.5 h-[62px] shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)] grid grid-cols-5 items-end justify-items-center transition-colors duration-200"
        >
          {/* Tab 1: Home */}
          <NavLink
            to="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="flex flex-col items-center justify-center w-full pb-1 text-center cursor-pointer select-none group"
          >
            <Home
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isHomeActive
                  ? 'text-slate-900 dark:text-white scale-105'
                  : 'text-slate-400 dark:text-slate-400/80 group-hover:text-slate-600 dark:group-hover:text-slate-200'
              )}
            />
            <span
              className={cn(
                'text-[10px] tracking-tight mt-1 transition-colors leading-none',
                isHomeActive
                  ? 'font-semibold text-slate-900 dark:text-white'
                  : 'font-medium text-slate-400 dark:text-slate-400/80'
              )}
            >
              Home
            </span>
            {/* Active Pill Indicator */}
            <div className="h-1 flex items-center justify-center mt-1">
              {isHomeActive ? (
                <motion.div
                  layoutId="mobileNavActiveIndicator"
                  className="w-5 h-1 rounded-full bg-slate-900 dark:bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              ) : (
                <div className="w-5 h-1 opacity-0 pointer-events-none" />
              )}
            </div>
          </NavLink>

          {/* Tab 2: Recents */}
          <NavLink
            to="/recents"
            onClick={(e) => handleNavClick(e, '/recents')}
            className="flex flex-col items-center justify-center w-full pb-1 text-center cursor-pointer select-none group"
          >
            <Clock
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isRecentsActive
                  ? 'text-slate-900 dark:text-white scale-105'
                  : 'text-slate-400 dark:text-slate-400/80 group-hover:text-slate-600 dark:group-hover:text-slate-200'
              )}
            />
            <span
              className={cn(
                'text-[10px] tracking-tight mt-1 transition-colors leading-none',
                isRecentsActive
                  ? 'font-semibold text-slate-900 dark:text-white'
                  : 'font-medium text-slate-400 dark:text-slate-400/80'
              )}
            >
              Recents
            </span>
            {/* Active Pill Indicator */}
            <div className="h-1 flex items-center justify-center mt-1">
              {isRecentsActive ? (
                <motion.div
                  layoutId="mobileNavActiveIndicator"
                  className="w-5 h-1 rounded-full bg-slate-900 dark:bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              ) : (
                <div className="w-5 h-1 opacity-0 pointer-events-none" />
              )}
            </div>
          </NavLink>

          {/* Center Column: Morphing Creation Action Button (Centered 50% on top rim) */}
          <div className="relative flex flex-col items-center justify-end w-full h-full pb-1 select-none">
            <motion.div
              layout
              transition={springTransition}
              style={{ transformOrigin: 'bottom center' }}
              className={cn(
                'select-none overflow-hidden cursor-pointer transition-colors duration-200 z-30',
                isCreateMenuOpen
                  ? 'absolute bottom-1 left-1/2 -translate-x-1/2 w-56 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-2 shadow-2xl z-50 flex flex-col text-[#1F1F1F] dark:text-slate-100 text-left'
                  : 'absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(37,99,235,0.45)] dark:shadow-[0_0_22px_rgba(37,99,235,0.6)] active:scale-95'
              )}
              onClick={!isCreateMenuOpen ? () => setIsCreateMenuOpen(true) : undefined}
            >
              <AnimatePresence mode="wait" initial={false}>
                {!isCreateMenuOpen ? (
                  /* Idle Raised Round FAB Button */
                  <motion.div
                    key="fab-idle"
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="w-full h-full flex items-center justify-center text-white cursor-pointer"
                    aria-label="Create note, checklist, or folder"
                    title="Create"
                  >
                    <Plus className="w-6 h-6 stroke-[2.2]" />
                  </motion.div>
                ) : (
                  /* Morphed Expanded Menu */
                  <motion.div
                    key="morphed-create-menu"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-full flex flex-col text-left"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center px-2 py-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
                        CREATE NEW
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreateMenuOpen(false);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                        aria-label="Close creation menu"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          requestAction(() => {
                            setIsCreateMenuOpen(false);
                            openNoteModal('note');
                          });
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                      >
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>New note</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          requestAction(() => {
                            setIsCreateMenuOpen(false);
                            openNoteModal('checklist');
                          });
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                      >
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>New checklist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          requestAction(() => {
                            setIsCreateMenuOpen(false);
                            openNoteModal('idea');
                          });
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                      >
                        <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>New idea</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 dark:bg-slate-700/60 my-1 mx-1" />

                    {/* Folder */}
                    <button
                      type="button"
                      onClick={() => {
                        requestAction(() => {
                          setIsCreateMenuOpen(false);
                          openFolderModal();
                        });
                      }}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] dark:text-slate-100 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                    >
                      <Folder className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>New folder</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <span className="text-[10px] font-medium tracking-tight text-slate-400 dark:text-slate-400/80 leading-none">
              Create
            </span>
            {/* Matching spacer so baseline aligns with sibling tabs */}
            <div className="h-1 w-5 opacity-0 mt-1 pointer-events-none" />
          </div>

          {/* Tab 3: Favorites */}
          <NavLink
            to="/favorites"
            onClick={(e) => handleNavClick(e, '/favorites')}
            className="flex flex-col items-center justify-center w-full pb-1 text-center cursor-pointer select-none group"
          >
            <Star
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isFavoritesActive
                  ? 'text-slate-900 dark:text-white scale-105'
                  : 'text-slate-400 dark:text-slate-400/80 group-hover:text-slate-600 dark:group-hover:text-slate-200'
              )}
            />
            <span
              className={cn(
                'text-[10px] tracking-tight mt-1 transition-colors leading-none',
                isFavoritesActive
                  ? 'font-semibold text-slate-900 dark:text-white'
                  : 'font-medium text-slate-400 dark:text-slate-400/80'
              )}
            >
              Favorites
            </span>
            {/* Active Pill Indicator */}
            <div className="h-1 flex items-center justify-center mt-1">
              {isFavoritesActive ? (
                <motion.div
                  layoutId="mobileNavActiveIndicator"
                  className="w-5 h-1 rounded-full bg-slate-900 dark:bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              ) : (
                <div className="w-5 h-1 opacity-0 pointer-events-none" />
              )}
            </div>
          </NavLink>

          {/* Tab 4: Trash */}
          <NavLink
            to="/trash"
            onClick={(e) => handleNavClick(e, '/trash')}
            className="flex flex-col items-center justify-center w-full pb-1 text-center cursor-pointer select-none group"
          >
            <Trash2
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isTrashActive
                  ? 'text-slate-900 dark:text-white scale-105'
                  : 'text-slate-400 dark:text-slate-400/80 group-hover:text-slate-600 dark:group-hover:text-slate-200'
              )}
            />
            <span
              className={cn(
                'text-[10px] tracking-tight mt-1 transition-colors leading-none',
                isTrashActive
                  ? 'font-semibold text-slate-900 dark:text-white'
                  : 'font-medium text-slate-400 dark:text-slate-400/80'
              )}
            >
              Trash
            </span>
            {/* Active Pill Indicator */}
            <div className="h-1 flex items-center justify-center mt-1">
              {isTrashActive ? (
                <motion.div
                  layoutId="mobileNavActiveIndicator"
                  className="w-5 h-1 rounded-full bg-slate-900 dark:bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              ) : (
                <div className="w-5 h-1 opacity-0 pointer-events-none" />
              )}
            </div>
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export default MobileBottomNav;
