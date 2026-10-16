import React from 'react';
import { AlertCircle, Home } from '@/components/ui/icons';

interface NoteEditorNotFoundProps {
  onReturnHome: () => void;
}

/**
 * NoteEditorNotFound — Fallback state when a note does not exist or has been deleted.
 */
export const NoteEditorNotFound: React.FC<NoteEditorNotFoundProps> = ({ onReturnHome }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-24 text-center select-none animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 shadow-xs">
        <AlertCircle className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      </div>
      <h2 className="text-xl font-bold text-[#1F1F1F] dark:text-slate-100">Note not found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
        This note may have been deleted, moved to trash, or does not exist.
      </p>
      <button
        type="button"
        onClick={onReturnHome}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
      >
        <Home className="w-4 h-4" />
        <span>Return to Workspace</span>
      </button>
    </div>
  );
};

export default NoteEditorNotFound;
