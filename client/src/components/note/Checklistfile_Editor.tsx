import React from 'react';
import { ChecklistEditorSection } from './ChecklistEditorSection';
import type { ChecklistItem } from '../../types';

export interface Checklistfile_EditorProps {
  checklistItems: ChecklistItem[];
  checklistTotalCount: number;
  checklistCompletedCount: number;
  checklistProgressPercent: number;
  newChecklistText: string;
  newChecklistInputRef: React.RefObject<HTMLInputElement | null>;
  onNewChecklistTextChange: (val: string) => void;
  onAddChecklistItem: (e?: React.FormEvent) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onUpdateChecklistItemText: (itemId: string, text: string) => void;
  onDeleteChecklistItem: (itemId: string) => void;
  onChecklistKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
}

/**
 * Checklistfile_Editor — Dedicated Checklist File Editor Component.
 * Integrates progress overview, dynamic tasks stack, keyboard enter/backspace navigation, and item creation.
 */
export const Checklistfile_Editor: React.FC<Checklistfile_EditorProps> = ({
  checklistItems,
  checklistTotalCount,
  checklistCompletedCount,
  checklistProgressPercent,
  newChecklistText,
  newChecklistInputRef,
  onNewChecklistTextChange,
  onAddChecklistItem,
  onToggleChecklistItem,
  onUpdateChecklistItemText,
  onDeleteChecklistItem,
  onChecklistKeyDown,
}) => {
  return (
    <ChecklistEditorSection
      checklistItems={checklistItems}
      checklistTotalCount={checklistTotalCount}
      checklistCompletedCount={checklistCompletedCount}
      checklistProgressPercent={checklistProgressPercent}
      newChecklistText={newChecklistText}
      newChecklistInputRef={newChecklistInputRef}
      onNewChecklistTextChange={onNewChecklistTextChange}
      onAddChecklistItem={onAddChecklistItem}
      onToggleChecklistItem={onToggleChecklistItem}
      onUpdateChecklistItemText={onUpdateChecklistItemText}
      onDeleteChecklistItem={onDeleteChecklistItem}
      onChecklistKeyDown={onChecklistKeyDown}
    />
  );
};

export default Checklistfile_Editor;
