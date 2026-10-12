import React, { useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import type { Folder } from '../types';
import { useNoteStore } from '../store/useNoteStore';
import { useUIStore } from '../store/uiStore';

interface BreadcrumbsProps {
  currentFolderId: string | null;
  folders: Folder[];
  onNavigate: (folderId: string | null) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentFolderId,
  folders,
  onNavigate,
}) => {
  const executeTransfer = useNoteStore((state) => state.executeTransfer);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Build breadcrumb trail upwards from currentFolderId
  const trail: Folder[] = [];
  let currId = currentFolderId;

  while (currId) {
    const found = folders.find((f) => f.id === currId);
    if (!found) break;
    trail.unshift(found);
    currId = found.parentId;
  }

  const handleDropOnBreadcrumb = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.type === 'batch' && Array.isArray(data.items)) {
        executeTransfer(
          data.items.map((item: any) => ({
            type: item.type,
            id: item.id,
            name: item.name || item.title,
            action: 'cut',
          })),
          targetFolderId
        );
      } else if (data.id) {
        executeTransfer(
          [
            {
              type: data.type === 'folder' ? 'folder' : 'note',
              id: data.id,
              name: data.name || data.title,
              action: 'cut',
            },
          ],
          targetFolderId
        );
      }
    } catch (err) {
      console.error('Drop error on breadcrumb:', err);
    } finally {
      useUIStore.getState().clearMultiSelection();
      useUIStore.getState().setIsDraggingMulti(false);
    }
  };

  return (
    <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 overflow-x-auto py-1 scrollbar-none">
      {/* Root / Home Button */}
      <button
        type="button"
        onClick={() => onNavigate(null)}
        onDragOver={(e) => {
          if (currentFolderId === null) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDragEnter={(e) => {
          if (currentFolderId === null) return;
          e.preventDefault();
          setDragOverTarget('root');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverTarget(null);
          }
        }}
        onDrop={(e) => handleDropOnBreadcrumb(e, null)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
          dragOverTarget === 'root'
            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 font-bold'
            : currentFolderId === null
            ? 'text-slate-900 font-bold bg-slate-100'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Home</span>
      </button>

      {trail.map((folder, idx) => {
        const isLast = idx === trail.length - 1;
        return (
          <React.Fragment key={folder.id}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => onNavigate(folder.id)}
              onDragOver={(e) => {
                if (isLast) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={(e) => {
                if (isLast) return;
                e.preventDefault();
                setDragOverTarget(folder.id);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverTarget(null);
                }
              }}
              onDrop={(e) => {
                if (isLast) return;
                handleDropOnBreadcrumb(e, folder.id);
              }}
              className={`px-2 py-1 rounded-lg truncate max-w-[160px] sm:max-w-[240px] transition-colors ${
                dragOverTarget === folder.id
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 font-bold'
                  : isLast
                  ? 'text-slate-900 font-bold bg-slate-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={folder.name}
            >
              {folder.name}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
