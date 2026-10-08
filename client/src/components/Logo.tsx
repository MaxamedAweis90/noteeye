import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/useNoteStore';

interface LogoProps {
  className?: string;
  showMobileTrigger?: boolean;
}

/**
 * Noteeye Brand Logo Component
 * Renders the authentic Noteeye logo mark and brand text with smooth hover physics
 * and home reset navigation.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  showMobileTrigger = true,
}) => {
  const navigate = useNavigate();
  const toggleMobileSidebar = useNoteStore((state) => state.toggleMobileSidebar);
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);

  const handleBrandClick = () => {
    setCurrentFolder(null);
    setSearchQuery('');
    navigate('/');
  };

  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      {showMobileTrigger && (
        <button
          type="button"
          onClick={() => toggleMobileSidebar(true)}
          className="md:hidden p-2 text-[#444746] hover:text-[#1F1F1F] hover:bg-[#E8EDF4] rounded-full transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      )}

      <div
        onClick={handleBrandClick}
        className="flex items-center gap-3 cursor-pointer group select-none"
      >
        <img
          src="/noteeye_logo.png"
          alt="Noteeye Logo"
          className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
        />
        <span className="text-[22px] font-bold tracking-tight text-[#1F1F1F]">
          Noteeye
        </span>
      </div>
    </div>
  );
};
