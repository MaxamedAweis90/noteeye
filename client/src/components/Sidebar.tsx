import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useNoteStore } from '../store/useNoteStore';
import { CreateButton } from './CreateButton';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const isMobileSidebarOpen = useNoteStore((state) => state.isMobileSidebarOpen);
  const toggleMobileSidebar = useNoteStore((state) => state.toggleMobileSidebar);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);

  const isHomeActive = location.pathname === '/';
  const isRecentsActive = location.pathname === '/recents';
  const isFavoritesActive = location.pathname === '/favorites';
  const isTrashActive = location.pathname === '/trash';

  const sidebarNavContent = (
    <div className="flex flex-col h-full bg-[#F8FAFD] text-[#1F1F1F] select-none">
      {/* 1. Google Drive-Style Elevated + Create Button (Reusable Component) */}
      <div className="mb-6">
        <CreateButton onActionSelected={() => toggleMobileSidebar(false)} />
      </div>

      {/* 2. Main Navigation Rail Links (Strictly matching Image Reference 1: Home, Recents, Favorites, Trash) */}
      <nav className="flex flex-col gap-1">
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          onClick={() => {
            setCurrentFolder(null);
            toggleMobileSidebar(false);
          }}
          className={`flex items-center gap-4 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isHomeActive
              ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
              : 'text-[#444746] hover:bg-[#E8EDF4] hover:text-[#1F1F1F]'
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
          onClick={() => {
            setCurrentFolder(null);
            toggleMobileSidebar(false);
          }}
          className={`flex items-center gap-4 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isRecentsActive
              ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
              : 'text-[#444746] hover:bg-[#E8EDF4] hover:text-[#1F1F1F]'
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
          onClick={() => {
            setCurrentFolder(null);
            toggleMobileSidebar(false);
          }}
          className={`flex items-center gap-4 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isFavoritesActive
              ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
              : 'text-[#444746] hover:bg-[#E8EDF4] hover:text-[#1F1F1F]'
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
          onClick={() => {
            toggleMobileSidebar(false);
          }}
          className={`flex items-center gap-4 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isTrashActive
              ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
              : 'text-[#444746] hover:bg-[#E8EDF4] hover:text-[#1F1F1F]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            delete
          </span>
          <span className="text-sm">Trash</span>
        </NavLink>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Rail (Fixed top-16, w-64, seamless bg-#F8FAFD) */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-[#F8FAFD] z-30 flex-col px-4 py-3 select-none">
        {sidebarNavContent}
      </aside>

      {/* Mobile Drawer (Modal Backdrop + Sliding Rail) */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
            onClick={() => toggleMobileSidebar(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-[#F8FAFD] shadow-2xl p-4 flex flex-col z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60">
              <span className="font-bold text-base text-[#1F1F1F]">Menu</span>
              <button
                type="button"
                onClick={() => toggleMobileSidebar(false)}
                className="p-1.5 text-[#444746] hover:text-[#1F1F1F] rounded-full"
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
