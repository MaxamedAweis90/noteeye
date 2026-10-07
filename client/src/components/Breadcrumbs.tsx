import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import type { Folder } from '../types';

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
  // Build breadcrumb trail upwards from currentFolderId
  const trail: Folder[] = [];
  let currId = currentFolderId;

  while (currId) {
    const found = folders.find((f) => f.id === currId);
    if (!found) break;
    trail.unshift(found);
    currId = found.parentId;
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 overflow-x-auto py-1">
      {/* Root / Home Button */}
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
          currentFolderId === null
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
              className={`px-2 py-1 rounded-lg truncate max-w-[160px] sm:max-w-[240px] transition-colors ${
                isLast
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
