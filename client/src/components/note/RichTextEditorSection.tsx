import React, { forwardRef } from 'react';

export interface RichTextEditorSectionProps {
  onContextMenu: (e: React.MouseEvent) => void;
  onInput: () => void;
  onBlur: () => void;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onKeyUp: (e: React.KeyboardEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

/**
 * RichTextEditorSection — Visual Rich Text WYSIWYG Editor canvas for standard notes.
 */
export const RichTextEditorSection = forwardRef<HTMLDivElement, RichTextEditorSectionProps>(
  (
    {
      onContextMenu,
      onInput,
      onBlur,
      onClick,
      onKeyDown,
      onKeyUp,
      onMouseUp,
    },
    ref,
  ) => {
    return (
      <div className="flex-1 flex flex-col">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          data-editor-canvas
          onContextMenu={onContextMenu}
          onInput={onInput}
          onBlur={onBlur}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onMouseUp={onMouseUp}
          data-placeholder="Start typing your note here..."
          className="rich-editor w-full flex-1 min-h-[420px] bg-transparent border-0 outline-none text-base leading-relaxed text-[#1F1F1F] dark:text-slate-100 font-normal focus:ring-0 select-text cursor-text"
        />
      </div>
    );
  },
);

RichTextEditorSection.displayName = 'RichTextEditorSection';

export default RichTextEditorSection;
