import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Folder as FolderIcon,
  ChevronDown,
  Loader2,
  AlertCircle,
  Check,
  Table as TableIcon,
  Star,
  Trash2,
} from 'lucide-react';
import type { Folder } from '../../types';
import { cn } from '../../utils/cn';

export interface NoteEditorHeaderProps {
  onBack: () => void;
  currentFolder?: Folder;
  activeFolders: Folder[];
  folderId: string | null;
  isFolderDropdownOpen: boolean;
  onToggleFolderDropdown: () => void;
  onCloseFolderDropdown: () => void;
  onSelectFolder: (id: string | null) => void;
  isSaving: boolean;
  isSyncError: boolean;
  isOffline: boolean;
  syncError: string | null;
  lastSavedTime: string;
  onSaveNow: () => void;
  activeTableInfo: { table: HTMLTableElement; cell: HTMLTableCellElement } | null;
  selectedCellsCount: number;
  onOpenTableCustomizer: () => void;
  isFavorite: boolean;
  onToggleStar: () => void;
  onDelete: () => void;
}

/**
 * NoteEditorHeader — Full Top Navigation & Action Header.
 * Houses Back navigation, Folder assignment dropdown, Database Auto-Save status, Table customizer trigger, Favorite, and Trash.
 */
export const NoteEditorHeader: React.FC<NoteEditorHeaderProps> = ({
  onBack,
  currentFolder,
  activeFolders,
  folderId,
  isFolderDropdownOpen,
  onToggleFolderDropdown,
  onCloseFolderDropdown,
  onSelectFolder,
  isSaving,
  isSyncError,
  isOffline,
  syncError,
  lastSavedTime,
  onSaveNow,
  activeTableInfo,
  selectedCellsCount,
  onOpenTableCustomizer,
  isFavorite,
  onToggleStar,
  onDelete,
}) => {
  return (
    <header className="h-14 mt-2 flex items-center justify-between gap-3 pb-4 mb-2 border-b border-slate-100 select-none">
      {/* Left: Back Pill + Folder Assignment + Auto-Save Status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-700 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Folder Assignment Pill (Only rendered if assigned to a folder) */}
        {currentFolder && (
          <div className="relative">
            <button
              type="button"
              onClick={onToggleFolderDropdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100/70 text-purple-800 text-xs font-medium border border-purple-200/60 transition-colors shadow-2xs cursor-pointer truncate max-w-[140px] sm:max-w-[200px]"
            >
              <FolderIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{currentFolder.name}</span>
              <ChevronDown className="w-3 h-3 text-purple-400 shrink-0" />
            </button>

            {isFolderDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={onCloseFolderDropdown}
                />
                <div className="absolute left-0 top-9 z-40 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 animate-fade-in text-xs max-h-56 overflow-y-auto">
                  {activeFolders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFolder(f.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3.5 py-2 text-left cursor-pointer transition-colors truncate",
                        folderId === f.id
                          ? "bg-purple-50 text-purple-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <FolderIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Database-Connected Auto-Save Status Pill */}
        <button
          type="button"
          onClick={onSaveNow}
          title={
            isSaving
              ? "Saving changes to database..."
              : isSyncError
              ? `Save failed: ${syncError || "Error"}. Click to retry.`
              : isOffline
              ? "Offline mode. Changes saved locally."
              : "All changes confirmed in database. Click to save again."
          }
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 shadow-2xs transition-all text-xs cursor-pointer active:scale-95"
        >
          {isSaving ? (
            <div className="flex items-center gap-1.5 text-blue-700 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B57D0]" />
              <span className="hidden sm:inline font-semibold">
                Saving to database...
              </span>
              <span className="sm:hidden font-semibold">Saving...</span>
            </div>
          ) : isSyncError ? (
            <div className="flex items-center gap-1.5 text-rose-700 font-medium animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="font-semibold">Not saved · Click to retry</span>
            </div>
          ) : isOffline ? (
            <div className="flex items-center gap-1.5 text-amber-700 font-medium animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="font-semibold">Offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium animate-fade-in">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span className="hidden md:inline font-semibold">
                Saved to database
              </span>
              <span className="hidden sm:inline md:hidden font-semibold">
                Saved
              </span>
              <span className="sm:hidden font-semibold">Saved</span>
              <span className="text-slate-400 text-[10px] hidden lg:inline">
                • {lastSavedTime}
              </span>
            </div>
          )}
        </button>

        {/* Table Customization Pill in Top Navigation (Word / Canva Style) */}
        <AnimatePresence>
          {activeTableInfo && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={onOpenTableCustomizer}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#0B57D0] border border-blue-200/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            >
              <TableIcon className="w-3.5 h-3.5 text-[#0B57D0]" />
              <span className="hidden sm:inline">
                {selectedCellsCount > 1
                  ? `Table Customization (${selectedCellsCount} cells)`
                  : "Table Customization"}
              </span>
              <span className="sm:hidden">
                {selectedCellsCount > 1
                  ? `Table (${selectedCellsCount})`
                  : "Table"}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Star Favorite + Move to Trash */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Star Favorite Button */}
        <button
          type="button"
          onClick={onToggleStar}
          aria-label={
            isFavorite ? "Remove from favorites" : "Add to favorites"
          }
          title="Toggle favorite"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          <Star
            className={cn(
              "w-4 h-4 transition-transform active:scale-125",
              isFavorite
                ? "fill-amber-400 text-amber-400"
                : "text-slate-400 hover:text-amber-500",
            )}
          />
        </button>

        {/* Move to Trash Button */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Move to trash"
          title="Move to trash"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default NoteEditorHeader;
