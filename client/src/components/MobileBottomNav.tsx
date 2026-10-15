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

const springTransition = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 30,
};

/**
 * MobileBottomNav Component
 * Elevated bottom navigation bar for mobile viewports (< 768px), replacing the sidebar rail.
 * Features:
 * - Home, Recents, Favorites, Trash
 * - Center Create Button that physically morphs upwards into the exact desktop creation menu
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
            className="md:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-xs select-none"
            onClick={() => setIsCreateMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Fixed Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 flex items-center justify-around select-none shadow-[0_-2px_12px_rgba(0,0,0,0.03)]"
      >
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          onClick={(e) => handleNavClick(e, '/')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isHomeActive
              ? 'text-[#001D35] font-semibold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`w-10 h-6.5 rounded-full flex items-center justify-center transition-all ${
              isHomeActive ? 'bg-[#C2E7FF]' : 'bg-transparent'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px]">Home</span>
        </NavLink>

        {/* Tab 2: Recents */}
        <NavLink
          to="/recents"
          onClick={(e) => handleNavClick(e, '/recents')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isRecentsActive
              ? 'text-[#001D35] font-semibold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`w-10 h-6.5 rounded-full flex items-center justify-center transition-all ${
              isRecentsActive ? 'bg-[#C2E7FF]' : 'bg-transparent'
            }`}
          >
            <Clock className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px]">Recents</span>
        </NavLink>

        {/* Center Slot: Create Action Button physically morphs into the creation menu */}
        <div className="relative -top-3 flex items-end justify-center">
          {/* Ghost placeholder when expanded to preserve flex layout balance */}
          {isCreateMenuOpen && (
            <div className="w-12 h-12 invisible pointer-events-none" aria-hidden="true" />
          )}

          <motion.div
            layout
            transition={springTransition}
            style={{ transformOrigin: 'bottom center' }}
            className={`select-none overflow-hidden ${
              isCreateMenuOpen
                ? 'absolute bottom-0 w-56 bg-white border border-slate-200/90 rounded-2xl p-2 shadow-2xl z-50 flex flex-col text-[#1F1F1F]'
                : 'w-12 h-12 rounded-2xl bg-[#1F1F1F] text-white flex items-center justify-center shadow-lg hover:bg-black transition-colors cursor-pointer border border-slate-800'
            }`}
            onClick={!isCreateMenuOpen ? () => setIsCreateMenuOpen(true) : undefined}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!isCreateMenuOpen ? (
                /* State 1: Idle Floating Center Action Button */
                <motion.div
                  key="fab-idle"
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="w-full h-full flex items-center justify-center text-white cursor-pointer"
                  aria-label="Create note or folder"
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
              ) : (
                /* State 2: Morphed Expanded Menu (Identical to Desktop CreateButton) */
                <motion.div
                  key="morphed-create-menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full flex flex-col"
                >
                  {/* A. Top Header Row */}
                  <div className="flex justify-between items-center px-2 py-1.5 mb-1">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none">
                      CREATE NEW
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreateMenuOpen(false);
                      }}
                      className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="Close creation menu"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* B. Action Items Stack */}
                  <div className="flex flex-col gap-0.5">
                    {/* 1. New note */}
                    <button
                      type="button"
                      onClick={() => {
                        requestAction(() => {
                          setIsCreateMenuOpen(false);
                          openNoteModal('note');
                        });
                      }}
                      className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                    >
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>New note</span>
                    </button>

                    {/* 2. New checklist */}
                    <button
                      type="button"
                      onClick={() => {
                        requestAction(() => {
                          setIsCreateMenuOpen(false);
                          openNoteModal('checklist');
                        });
                      }}
                      className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>New checklist</span>
                    </button>

                    {/* 3. New idea */}
                    <button
                      type="button"
                      onClick={() => {
                        requestAction(() => {
                          setIsCreateMenuOpen(false);
                          openNoteModal('idea');
                        });
                      }}
                      className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                    >
                      <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>New idea</span>
                    </button>
                  </div>

                  {/* C. Divider */}
                  <div className="h-px bg-slate-100 my-1 mx-1" />

                  {/* D. Folder Action */}
                  <button
                    type="button"
                    onClick={() => {
                      requestAction(() => {
                        setIsCreateMenuOpen(false);
                        openFolderModal();
                      });
                    }}
                    className="hover:bg-slate-100 rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-sm font-medium text-[#1F1F1F] transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
                  >
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>New folder</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Tab 3: Favorites */}
        <NavLink
          to="/favorites"
          onClick={(e) => handleNavClick(e, '/favorites')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isFavoritesActive
              ? 'text-[#001D35] font-semibold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`w-10 h-6.5 rounded-full flex items-center justify-center transition-all ${
              isFavoritesActive ? 'bg-[#C2E7FF]' : 'bg-transparent'
            }`}
          >
            <Star className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px]">Favorites</span>
        </NavLink>

        {/* Tab 4: Trash */}
        <NavLink
          to="/trash"
          onClick={(e) => handleNavClick(e, '/trash')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            isTrashActive
              ? 'text-[#001D35] font-semibold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`w-10 h-6.5 rounded-full flex items-center justify-center transition-all ${
              isTrashActive ? 'bg-[#C2E7FF]' : 'bg-transparent'
            }`}
          >
            <Trash2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px]">Trash</span>
        </NavLink>
      </nav>
    </>
  );
};

export default MobileBottomNav;
