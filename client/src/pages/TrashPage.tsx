import { Trash2, RotateCcw, AlertTriangle, Folder } from 'lucide-react';
import { useNoteStore } from '../store/useNoteStore';
import { NoteCard } from '../components/NoteCard';

export const TrashPage: React.FC = () => {
  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const restoreItem = useNoteStore((state) => state.restoreItem);
  const permanentlyDeleteItem = useNoteStore((state) => state.permanentlyDeleteItem);
  const restoreFolder = useNoteStore((state) => state.restoreFolder);
  const permanentlyDeleteFolder = useNoteStore((state) => state.permanentlyDeleteFolder);
  const emptyTrash = useNoteStore((state) => state.emptyTrash);

  const deletedFolders = folders.filter((f) => f.isDeleted);
  const deletedItems = items.filter((i) => i.isDeleted);
  const totalTrashCount = deletedFolders.length + deletedItems.length;

  const handleEmptyTrash = () => {
    if (window.confirm('Are you sure you want to permanently delete all items in Trash? This cannot be undone.')) {
      emptyTrash();
    }
  };

  return (
    <div className="w-full space-y-6 flex-1">
      {/* 30-day Policy Notice Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#FCE8E6] border border-rose-200/80 text-[#B3261E] text-xs">
        <span className="material-symbols-outlined text-base shrink-0">info</span>
        <span className="flex-1">
          Items in trash are automatically deleted after 30 days. You can restore notes or empty them permanently.
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#B3261E]">delete</span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] tracking-tight">
              Trash
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#B3261E]">
              {totalTrashCount} {totalTrashCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-[#444746]">
            Items in trash can be restored back to your workspace or permanently deleted.
          </p>
        </div>

        {totalTrashCount > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white hover:bg-[#FCE8E6] text-[#B3261E] text-xs font-semibold transition-colors self-start sm:self-auto border border-rose-200 shadow-2xs cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {totalTrashCount === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-12 sm:p-16 text-center flex flex-col items-center justify-center max-w-md mx-auto my-12 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Trash is empty</h3>
          <p className="text-xs text-slate-400">
            Deleted folders, notes, and checklists will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* DELETED FOLDERS */}
          {deletedFolders.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Deleted Folders ({deletedFolders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {deletedFolders.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Folder className="w-5 h-5 text-slate-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                        {f.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => restoreFolder(f.id)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Restore Folder"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => permanentlyDeleteFolder(f.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* DELETED NOTES & CHECKLISTS */}
          {deletedItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Deleted Notes & Checklists ({deletedItems.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {deletedItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <NoteCard item={item} readOnly />

                    {/* Overlay Action Bar for Trash Items */}
                    <div className="mt-2 flex items-center justify-end gap-2 bg-white/90 backdrop-blur-xs p-2 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => restoreItem(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => permanentlyDeleteItem(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
