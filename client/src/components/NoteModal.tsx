import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  FileText,
  CheckSquare,
  Folder as FolderIcon,
  Palette,
} from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';
import { PASTEL_PALETTE, DEFAULT_PASTEL_COLOR } from '../types';
import type { ChecklistItem, Item, ItemType } from '../types';

interface NoteModalContentProps {
  editingItem: Item | null;
  defaultType: ItemType;
  defaultFolderId: string | null;
  onClose: () => void;
}

const NoteModalContent: React.FC<NoteModalContentProps> = ({
  editingItem,
  defaultType,
  defaultFolderId,
  onClose,
}) => {
  const folders = useNoteStore((state) => state.folders);
  const addItem = useNoteStore((state) => state.addItem);
  const updateItem = useNoteStore((state) => state.updateItem);
  const deleteItem = useNoteStore((state) => state.deleteItem);

  const [type, setType] = useState<ItemType>(
    editingItem ? editingItem.type : defaultType
  );
  const [title, setTitle] = useState(editingItem ? editingItem.title : '');
  const [content, setContent] = useState(editingItem?.content || '');
  const [color, setColor] = useState(editingItem?.color || DEFAULT_PASTEL_COLOR);
  const [folderId, setFolderId] = useState<string | null>(
    editingItem ? editingItem.folderId : defaultFolderId
  );
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() =>
    editingItem?.checklistItems
      ? [...editingItem.checklistItems]
      : [{ id: 'cl-init-1', text: '', isCompleted: false }]
  );
  const [newChecklistText, setNewChecklistText] = useState('');

  const activeFolders = folders.filter((f) => !f.isDeleted);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklistItems((prev) => [
      ...prev,
      {
        id: `cl-${Date.now()}`,
        text: newChecklistText.trim(),
        isCompleted: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const handleUpdateChecklistText = (id: string, text: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || 'Untitled';
    const validChecklist = checklistItems.filter((ci) => ci.text.trim().length > 0);

    if (editingItem) {
      updateItem(editingItem.id, {
        title: finalTitle,
        type,
        folderId: folderId || null,
        color,
        content: type === 'note' ? content : undefined,
        checklistItems: type === 'checklist' ? validChecklist : undefined,
      });
    } else {
      addItem({
        title: finalTitle,
        type,
        folderId: folderId || null,
        color,
        content: type === 'note' ? content : undefined,
        checklistItems: type === 'checklist' ? validChecklist : undefined,
      });
    }
  };

  const isEditing = !!editingItem;

  return (
    <div
      style={{ borderColor: color }}
      className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 p-6 sm:p-7 z-10 animate-modal-pop max-h-[90vh] flex flex-col"
    >
      {/* Header: Title / Type Switcher & Close */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* Note Type Pill Switch */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setType('note')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                type === 'note'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Regular Note</span>
            </button>
            <button
              type="button"
              onClick={() => setType('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                type === 'checklist'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Checklist</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Form Scrollable Area */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
        {/* Note Title */}
        <div>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title..."
            className="w-full text-xl sm:text-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-indigo-400 pb-1"
          />
        </div>

        {/* Preset Pastel Swatches Picker */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Palette className="w-3.5 h-3.5" />
            <span>Card Color Theme:</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {PASTEL_PALETTE.map((swatch) => {
              const isSelected = color.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.key}
                  type="button"
                  onClick={() => setColor(swatch.hex)}
                  style={{ backgroundColor: swatch.hex }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all transform ${
                    isSelected
                      ? 'border-slate-900 scale-110 shadow-sm ring-2 ring-indigo-400/40'
                      : 'border-black/10 hover:scale-105'
                  }`}
                  title={swatch.name}
                  aria-label={swatch.name}
                />
              );
            })}
          </div>
        </div>

        {/* Folder Destination Selector */}
        <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
          <FolderIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold">Folder:</span>
          <select
            value={folderId || ''}
            onChange={(e) => setFolderId(e.target.value ? e.target.value : null)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Home (Root)</option>
            {activeFolders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Body: Note text or Checklist dynamic list */}
        {type === 'note' ? (
          <div className="pt-2">
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here..."
              className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 leading-relaxed resize-none"
            />
          </div>
        ) : (
          <div className="pt-2 space-y-2.5">
            <label className="text-xs font-bold text-slate-700 block">
              Checklist Items:
            </label>

            {/* Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {checklistItems.map((ci) => (
                <div key={ci.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(ci.id)}
                    className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                  >
                    {ci.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={ci.text}
                    onChange={(e) => handleUpdateChecklistText(ci.id, e.target.value)}
                    placeholder="List item..."
                    className={`flex-1 text-xs sm:text-sm px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 ${
                      ci.isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(ci.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Checklist Row */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="+ Add new checklist item (press Enter)..."
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Add Item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {isEditing ? (
            <button
              type="button"
              onClick={() => deleteItem(editingItem.id)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Move to Trash</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-500/25 transition-all active:scale-95"
            >
              {isEditing ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export const NoteModal: React.FC = () => {
  const isNoteModalOpen = useNoteStore((state) => state.isNoteModalOpen);
  const editingItem = useNoteStore((state) => state.editingItem);
  const noteModalType = useNoteStore((state) => state.noteModalType);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const closeNoteModal = useNoteStore((state) => state.closeNoteModal);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNoteModalOpen) {
        closeNoteModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNoteModalOpen, closeNoteModal]);

  if (!isNoteModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeNoteModal}
        aria-hidden="true"
      />

      {/* Render inner content keyed to avoid setState in effect */}
      <NoteModalContent
        key={editingItem ? editingItem.id : `new-${noteModalType}`}
        editingItem={editingItem}
        defaultType={noteModalType}
        defaultFolderId={currentFolderId}
        onClose={closeNoteModal}
      />
    </div>
  );
};
