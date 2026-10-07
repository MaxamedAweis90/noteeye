import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';

export const CreateFolderModal: React.FC = () => {
  const isFolderModalOpen = useNoteStore((state) => state.isFolderModalOpen);
  const closeFolderModal = useNoteStore((state) => state.closeFolderModal);
  const addFolder = useNoteStore((state) => state.addFolder);
  const currentFolderId = useNoteStore((state) => state.currentFolderId);
  const folders = useNoteStore((state) => state.folders);

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(currentFolderId);

  const activeFolders = folders.filter((f) => !f.isDeleted);

  if (!isFolderModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      addFolder(name.trim(), parentId);
      setName('');
      closeFolderModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeFolderModal}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-10 animate-modal-pop">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">New Folder</h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Create a folder to organize notes & checklists
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeFolderModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Folder Name:
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Travel Plans, Work Notes"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Location:
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Home (Root)</option>
              {activeFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeFolderModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-500/25 transition-all active:scale-95"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
