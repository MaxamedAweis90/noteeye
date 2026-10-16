import React, { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';
import { CreateButton } from './CreateButton';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const requestNavigation = useUIStore((state) => state.requestNavigation);
  const isMobileSidebarOpen = useNoteStore((state) => state.isMobileSidebarOpen);
  const toggleMobileSidebar = useNoteStore((state) => state.toggleMobileSidebar);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);

  const handleNavClick = (e: React.MouseEvent, to: string, onProceed?: () => void) => {
    const allowed = requestNavigation(to, (targetPath) => {
      onProceed?.();
      navigate(targetPath);
    });
    if (!allowed) {
      e.preventDefault();
    } else {
      onProceed?.();
    }
  };

  const trashCount = useMemo(() => {
    const trashedFolders = folders.filter((f) => f.isDeleted).length;
    const trashedNotes = items.filter((i) => i.isDeleted).length;
    return trashedFolders + trashedNotes;
  }, [folders, items]);

  const isHomeActive = location.pathname === '/';
  const isRecentsActive = location.pathname === '/recents';
  const isFavoritesActive = location.pathname === '/favorites';
  const isTrashActive = location.pathname === '/trash';

  const sidebarNavContent = (
    <div className="flex flex-col h-full bg-[#F8FAFD] dark:bg-[#0B0F17] text-[#1F1F1F] dark:text-slate-100 select-none transition-colors duration-200">
      {/* 1. Google Drive-Style Elevated + Create Button (Reusable Component) */}
      <div className="mb-6">
        <CreateButton onActionSelected={() => toggleMobileSidebar(false)} />
      </div>

      {/* 2. Main Navigation Rail Links (Strictly matching Image Reference 1: Home, Recents, Favorites, Trash) */}
      <nav className="flex flex-col gap-1">
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          onClick={(e) => {
            handleNavClick(e, '/', () => {
              setCurrentFolder(null);
              toggleMobileSidebar(false);
            });
          }}
          className={`flex items-center gap-4 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isHomeActive
              ? 'bg-[#C2E7FF] dark:bg-sky-950/80 text-[#001D35] dark:text-sky-200 font-semibold dark:border dark:border-sky-800/50'
              : 'text-[#444746] dark:text-slate-400 hover:bg-[#E8EDF4] dark:hover:bg-slate-800/70 hover:text-[#1F1F1F] dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            home
          </span>
          <span className="text-sm">Home</span>
        </NavLink>

        {/* Tab 2: Recents */}
        <NavLink
          to="/recents"
          onClick={(e) => {
            handleNavClick(e, '/recents', () => {
              setCurrentFolder(null);
              toggleMobileSidebar(false);
            });
          }}
          className={`flex items-center gap-4 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isRecentsActive
              ? 'bg-[#C2E7FF] dark:bg-sky-950/80 text-[#001D35] dark:text-sky-200 font-semibold dark:border dark:border-sky-800/50'
              : 'text-[#444746] dark:text-slate-400 hover:bg-[#E8EDF4] dark:hover:bg-slate-800/70 hover:text-[#1F1F1F] dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            schedule
          </span>
          <span className="text-sm">Recents</span>
        </NavLink>

        {/* Tab 3: Favorites */}
        <NavLink
          to="/favorites"
          onClick={(e) => {
            handleNavClick(e, '/favorites', () => {
              setCurrentFolder(null);
              toggleMobileSidebar(false);
            });
          }}
          className={`flex items-center gap-4 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isFavoritesActive
              ? 'bg-[#C2E7FF] dark:bg-sky-950/80 text-[#001D35] dark:text-sky-200 font-semibold dark:border dark:border-sky-800/50'
              : 'text-[#444746] dark:text-slate-400 hover:bg-[#E8EDF4] dark:hover:bg-slate-800/70 hover:text-[#1F1F1F] dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            star
          </span>
          <span className="text-sm">Favorites</span>
        </NavLink>

        {/* Tab 4: Trash */}
        <NavLink
          to="/trash"
          onClick={(e) => {
            handleNavClick(e, '/trash', () => {
              toggleMobileSidebar(false);
            });
          }}
          className={`flex items-center gap-3.5 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer group ${
            isTrashActive
              ? 'bg-[#C2E7FF] dark:bg-sky-950/80 text-[#001D35] dark:text-sky-200 font-semibold dark:border dark:border-sky-800/50'
              : 'text-[#444746] dark:text-slate-400 hover:bg-[#E8EDF4] dark:hover:bg-slate-800/70 hover:text-[#1F1F1F] dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] shrink-0">
            delete
          </span>
          <span className="text-sm">Trash</span>
          <span
            className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center transition-all ${
              trashCount > 0
                ? isTrashActive
                  ? 'bg-[#001D35] dark:bg-sky-900 text-white shadow-2xs'
                  : 'bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                : isTrashActive
                ? 'bg-[#001D35]/10 dark:bg-sky-900/40 text-[#001D35] dark:text-sky-300'
                : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 group-hover:bg-slate-200/60 dark:group-hover:bg-slate-700/60'
            }`}
          >
            {trashCount}
          </span>
        </NavLink>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Rail (Fixed top-16, w-64, seamless bg-#F8FAFD) */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-[#F8FAFD] dark:bg-[#0B0F17] border-r border-transparent dark:border-slate-800/60 z-30 flex-col px-4 py-3 select-none transition-colors duration-200">
        {sidebarNavContent}
      </aside>

      {/* Mobile Drawer (Modal Backdrop + Sliding Rail) */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
            onClick={() => toggleMobileSidebar(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-[#F8FAFD] dark:bg-slate-900 border-r border-transparent dark:border-slate-800 shadow-2xl p-4 flex flex-col z-10 animate-fade-in transition-colors duration-200">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-base text-[#1F1F1F] dark:text-slate-100">Menu</span>
              <button
                type="button"
                onClick={() => toggleMobileSidebar(false)}
                className="p-1.5 text-[#444746] dark:text-slate-400 hover:text-[#1F1F1F] dark:hover:text-slate-100 rounded-full"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarNavContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
