import React from 'react';
import { format } from 'date-fns';
import { Clock, CheckSquare, Lightbulb, FileText } from 'lucide-react';
import type { ItemType } from '../../types';

export interface NoteEditorMetaBarProps {
  title: string;
  type: ItemType;
  onTitleChange: (val: string) => void;
  onBlur: () => void;
  updatedAt?: string;
  createdAt?: string;
  wordCount: number;
}

/**
 * NoteEditorMetaBar — Document Title input and top metadata bar (Timestamp, Word Count, and Mode Badge).
 */
export const NoteEditorMetaBar: React.FC<NoteEditorMetaBarProps> = ({
  title,
  type,
  onTitleChange,
  onBlur,
  updatedAt,
  createdAt,
  wordCount,
}) => {
  return (
    <>
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onBlur}
        placeholder={
          type === "checklist"
            ? "Untitled Checklist"
            : type === "idea"
            ? "Untitled Idea"
            : "Untitled Note"
        }
        className="w-full bg-transparent border-0 outline-none text-2xl sm:text-4xl font-extrabold text-[#1F1F1F] placeholder-slate-400/80 mb-3 tracking-tight focus:ring-0 leading-tight"
      />

      {/* Meta Bar: Timestamp, Word Count, Autosaved Badge & Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600/80 pb-3 mb-6 border-b border-black/[0.04]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {updatedAt || createdAt
                ? `Updated ${format(new Date(updatedAt || createdAt!), "d MMM yyyy, h:mm a")}`
                : "Draft"}
            </span>
          </span>
          <span>•</span>
          <span className="font-medium">{wordCount} words</span>
        </div>

        {/* Mode Badge Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-xs self-start sm:self-auto border border-slate-200/60">
          {type === "checklist" ? (
            <>
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Checklist</span>
            </>
          ) : type === "idea" ? (
            <>
              <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
              <span>Idea Board</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Note</span>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NoteEditorMetaBar;
