import React from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const toggleMobileSidebar = useNoteStore((state) => state.toggleMobileSidebar);
  const searchQuery = useNoteStore((state) => state.searchQuery);
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);

  const handleBrandClick = () => {
    setCurrentFolder(null);
    setSearchQuery('');
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#F8FAFD] select-none">
      <div className="h-16 w-full px-4 flex items-center justify-between gap-4">
        {/* Left: Brand & Mobile Trigger (Aligned with 256px sidebar rail boundary) */}
        <div className="flex items-center gap-3 w-auto md:w-56 shrink-0">
          <button
            type="button"
            onClick={() => toggleMobileSidebar(true)}
            className="md:hidden p-2 text-[#444746] hover:text-[#1F1F1F] hover:bg-[#E8EDF4] rounded-full transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <div
            onClick={handleBrandClick}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Noteeye M3 Logo Mark */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0B57D0] to-[#0041A2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                sticky_note_2
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1F1F1F]">
              Noteeye
            </span>
          </div>
        </div>

        {/* Center-Left: Pill Search Bar (Positioned directly between the two red lines in Image Reference 2) */}
        <div className="flex-1 flex items-center justify-start min-w-0">
          <div className="w-full max-w-[560px] lg:max-w-[620px] h-12 bg-[#EDF2FC] rounded-full px-4 text-[#444746] flex items-center focus-within:bg-white focus-within:shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] transition-all">
            <span className="material-symbols-outlined mr-3 text-[#737785] text-xl select-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in Noteeye"
              className="w-full bg-transparent border-0 outline-none text-sm text-[#1F1F1F] placeholder-[#737785]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-[#737785] hover:text-[#1F1F1F] rounded-full cursor-pointer transition-colors"
                aria-label="Clear search query"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: User Profile Avatar Pill */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <div className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-[#E8EDF4] hover:text-[#1F1F1F] cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3F6377] to-[#0B57D0] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              AM
            </div>
            <span className="text-sm font-medium text-[#1F1F1F] hidden sm:inline">
              Alex Morgan
            </span>
            <span className="material-symbols-outlined text-[#737785] text-lg">
              expand_more
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
