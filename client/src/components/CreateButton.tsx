import React, { useState, useRef, useEffect } from 'react';
import { useNoteStore } from '../store/useNoteStore';

interface CreateButtonProps {
  className?: string;
  onActionSelected?: () => void;
}

/**
 * CreateButton — Google Drive Material 3 Elevated "+ Create" Trigger
 * Pure white pill with 16px radius (rounded-2xl), Google Blue #0B57D0 plus icon,
 * dual-layer soft elevation shadow, and quick action popover.
 */
export const CreateButton: React.FC<CreateButtonProps> = ({
  className = '',
  onActionSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);

  // Close menu on click outside
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

  const handleAction = (type: 'note' | 'checklist' | 'folder') => {
    setIsOpen(false);
    onActionSelected?.();
    if (type === 'folder') {
      openFolderModal();
    } else {
      openNoteModal(type);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Elevated + Create Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-fit rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] px-6 py-3.5 flex items-center gap-3 font-semibold text-sm text-[#1F1F1F] transition-all cursor-pointer active:scale-95 select-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="material-symbols-outlined text-[#0B57D0] text-xl font-bold">
          add
        </span>
        <span className="tracking-wide">Create</span>
      </button>

      {/* Quick Action Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-14 mt-2 w-60 rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-2 z-50 animate-modal-pop">
          <button
            type="button"
            onClick={() => handleAction('note')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDF2FC] hover:text-[#0B57D0] transition-colors cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-lg text-[#0B57D0]">
              description
            </span>
            <div className="flex flex-col">
              <span>New Note</span>
              <span className="text-[10px] text-[#444746] font-normal">Rich note card</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction('checklist')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#1F1F1F] hover:bg-[#EDF2FC] hover:text-[#0B57D0] transition-colors cursor-pointer text-left mt-0.5"
          >
            <span className="material-symbols-outlined text-lg text-[#10B981]">
              check_box
            </span>
            <div className="flex flex-col">
              <span>New Checklist</span>
              <span className="text-[10px] text-[#444746] font-normal">Interactive task list</span>
            </div>
          </button>

          <div className="h-px bg-slate-100 my-1.5" />

          <button
            type="button"
            onClick={() => handleAction('folder')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#1F1F1F] hover:bg-[#FEF3C7] hover:text-amber-900 transition-colors cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-lg text-amber-500">
              create_new_folder
            </span>
            <div className="flex flex-col">
              <span>New Folder</span>
              <span className="text-[10px] text-[#444746] font-normal">Organize collections</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
