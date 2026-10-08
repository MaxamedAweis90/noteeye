import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Clock,
  ArrowUpDown,
  LayoutGrid,
  List,
  ChevronDown,
  Plus,
  CheckSquare,
  FileText,
  Star,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  differenceInCalendarDays,
  isThisMonth,
  isSameMonth,
  subMonths,
  isSameYear,
  format,
} from 'date-fns';
import { useNoteStore } from '../store/useNoteStore';
import { NoteCard } from '../components/NoteCard';
import { NoteCardSkeleton } from '../components/skeletons';
import type { Item } from '../types';
import { cn } from '../utils/cn';

export type TimeBucketKey =
  | 'today'
  | 'yesterday'
  | 'lastWeek'
  | 'earlierThisMonth'
  | 'lastMonth'
  | 'older';

export interface TimeBucketConfig {
  key: TimeBucketKey;
  label: string;
  dotColor: string;
}

export const TIME_BUCKET_CONFIGS: TimeBucketConfig[] = [
  { key: 'today', label: 'Today', dotColor: 'bg-[#0B57D0]' },
  { key: 'yesterday', label: 'Yesterday', dotColor: 'bg-slate-400' },
  { key: 'lastWeek', label: 'Last week', dotColor: 'bg-slate-400' },
  { key: 'earlierThisMonth', label: 'Earlier this month', dotColor: 'bg-slate-400' },
  { key: 'lastMonth', label: 'Last month', dotColor: 'bg-slate-400' },
  { key: 'older', label: 'Older', dotColor: 'bg-slate-400' },
];

/**
 * Chronological timeline bucketing based on calendar day difference and month boundaries
 */
export function getItemTimeBucket(date: Date, now: Date = new Date()): TimeBucketKey {
  const diffDays = differenceInCalendarDays(now, date);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'lastWeek';

  if (isThisMonth(date)) return 'earlierThisMonth';

  const lastMonth = subMonths(now, 1);
  if (isSameMonth(date, lastMonth) && isSameYear(date, lastMonth)) {
    return 'lastMonth';
  }

  return 'older';
}

/**
 * NoteListItem — Material 3 / Google Keep Horizontal List Item View
 */
interface NoteListItemProps {
  item: Item;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({ item, onOpen, onEdit, onDelete }) => {
  const isChecklist = item.type === 'checklist';
  const checklistItems = item.checklistItems || [];
  const completedCount = checklistItems.filter((c) => c.isCompleted).length;
  const totalCount = checklistItems.length;

  const formattedDate = format(new Date(item.updatedAt || item.createdAt), 'd MMM yyyy, h:mm a');

  return (
    <div
      onClick={onOpen}
      style={{ backgroundColor: item.color || '#FDE3C9' }}
      className="w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-black/[0.04] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group select-none"
    >
      {/* Left Icon + Title + Snippet */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
          {isChecklist ? (
            <CheckSquare className="w-4 h-4 text-slate-700" />
          ) : (
            <FileText className="w-4 h-4 text-slate-700" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-[#1F1F1F] truncate">
              {item.title}
            </h3>
            {item.isFavorite && (
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            )}
          </div>

          <p className="text-xs text-slate-700/75 truncate mt-0.5">
            {isChecklist
              ? `${completedCount}/${totalCount} completed • ${checklistItems.map((c) => c.text).join(', ') || 'No tasks'}`
              : item.content || <span className="italic text-slate-400">Empty note...</span>}
          </p>
        </div>
      </div>

      {/* Right Meta & Quick Action Buttons */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <span className="text-[11px] sm:text-xs text-slate-600/80 font-medium hidden md:inline">
          {formattedDate}
        </span>

        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit note"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete note"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export interface RecentsProps {
  isLoading?: boolean;
}

/**
 * Screen 02: Recents Screen View
 * Google Drive / Material 3 Chronological Activity Feed.
 *
 * Rules:
 * 1. Strictly NO FOLDERS (Notes & Checklists only).
 * 2. Grouped chronologically: "Today", "Yesterday", "Last week", "Earlier this month", "Last month", "Older".
 * 3. Only renders sections with active items.
 * 4. Dual view toggle: Grid & List modes.
 * 5. Sort toggle: Date modified descending / ascending.
 */
export const Recents: React.FC<RecentsProps> = ({ isLoading = false }) => {
  const navigate = useNavigate();
  const items = useNoteStore((state) => state.items);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);

  // View & Sort State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'note' | 'checklist' | 'favorites'>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 1. Strict filter: Notes and checklists only, excluding deleted items
  const activeNotes = useMemo(() => {
    let result = items.filter((item) => !item.isDeleted);

    if (filterType === 'note') {
      result = result.filter((item) => item.type === 'note');
    } else if (filterType === 'checklist') {
      result = result.filter((item) => item.type === 'checklist');
    } else if (filterType === 'favorites') {
      result = result.filter((item) => item.isFavorite);
    }

    return result;
  }, [items, filterType]);

  // 2. Sort items by latest timestamp
  const sortedNotes = useMemo(() => {
    return [...activeNotes].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [activeNotes, sortOrder]);

  // 3. Chronological timeline grouping
  const groupedBuckets = useMemo(() => {
    const now = new Date();
    const bucketMap: Record<TimeBucketKey, Item[]> = {
      today: [],
      yesterday: [],
      lastWeek: [],
      earlierThisMonth: [],
      lastMonth: [],
      older: [],
    };

    sortedNotes.forEach((item) => {
      const d = new Date(item.updatedAt || item.createdAt);
      const bucket = getItemTimeBucket(d, now);
      bucketMap[bucket].push(item);
    });

    // Only return sections that have at least 1 item
    return TIME_BUCKET_CONFIGS.filter((cfg) => bucketMap[cfg.key].length > 0).map((cfg) => ({
      ...cfg,
      items: bucketMap[cfg.key],
    }));
  }, [sortedNotes]);

  // Total count
  const totalNotesCount = activeNotes.length;

  // Loading Skeleton View
  if (isLoading) {
    return (
      <div className="w-full space-y-8 flex-1 animate-fade-in select-none">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b border-slate-100">
          <div className="space-y-2">
            <div className="h-8 w-44 bg-slate-200/80 rounded-xl shimmer-mask" />
            <div className="h-4 w-72 bg-slate-200/60 rounded-lg shimmer-mask" />
          </div>
          <div className="h-9 w-48 bg-slate-100 rounded-full shimmer-mask" />
        </div>

        {/* Section 1 Skeleton */}
        <section className="space-y-4">
          <div className="h-4 w-28 bg-slate-200/80 rounded-md shimmer-mask" />
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <NoteCardSkeleton key={`skel-1-${i}`} />
            ))}
          </div>
        </section>

        {/* Section 2 Skeleton */}
        <section className="space-y-4 pt-4">
          <div className="h-4 w-32 bg-slate-200/80 rounded-md shimmer-mask" />
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <NoteCardSkeleton key={`skel-2-${i}`} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6 flex-1 select-none"
    >
      {/* 1. Header & Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF2FC] text-[#0B57D0] flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] tracking-tight">
              Recents
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {totalNotesCount} {totalNotesCount === 1 ? 'Note' : 'Notes'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            All your active notes organized by activity timeline (excluding folders)
          </p>
        </div>

        {/* Right Controls: Filter, Sort & View Mode */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-50 border border-slate-200/70 p-0.5 rounded-full text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer',
                filterType === 'all'
                  ? 'bg-white text-[#0B57D0] shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('note')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer',
                filterType === 'note'
                  ? 'bg-white text-[#0B57D0] shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => setFilterType('checklist')}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer',
                filterType === 'checklist'
                  ? 'bg-white text-[#0B57D0] shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Checklists
            </button>
          </div>

          {/* Sort Chip */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDF2FC] hover:bg-[#DCE7F9] text-[#0B57D0] transition-colors text-xs font-semibold shadow-2xs cursor-pointer select-none"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Date opened ↓' : 'Date opened ↑'}</span>
          </button>

          {/* View Toggle: Grid / List */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-full">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white text-[#001D35] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-[#001D35] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Chronological Timeline Sections */}
      {totalNotesCount === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-[#F8FAFD]/50 p-12 sm:p-16 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-12 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF2FC] text-[#0B57D0] flex items-center justify-center shadow-2xs">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1F1F1F]">
              {filterType === 'all'
                ? 'No recent notes yet'
                : `No recent ${filterType}s found`}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Notes and interactive checklists you create or update will automatically appear here in chronological timeline groups.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/notes/new?type=note')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer mt-2"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Note</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col space-y-8">
          {groupedBuckets.map((bucket) => {
            const isCollapsed = !!collapsedSections[bucket.key];

            return (
              <section key={bucket.key} className="flex flex-col">
                {/* Timeline Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(bucket.key)}
                  className="w-full flex items-center justify-between mb-3.5 group select-none text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200',
                        isCollapsed && '-rotate-90'
                      )}
                    />
                    <span className={cn('w-2 h-2 rounded-full', bucket.dotColor)} />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-800 transition-colors">
                      {bucket.label}
                    </h2>
                    {/* Subtle horizontal line extending next to the label */}
                    <div className="h-px bg-slate-100 flex-1 ml-2" />
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    {bucket.items.length} {bucket.items.length === 1 ? 'item' : 'items'}
                  </span>
                </button>

                {/* Section Content */}
                {!isCollapsed && (
                  <div>
                    {viewMode === 'grid' ? (
                      /* Strict 2-to-5 responsive card grid matching system standard */
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
                        {bucket.items.map((item) => (
                          <NoteCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      /* List Mode */
                      <div className="flex flex-col gap-2.5 max-w-4xl">
                        {bucket.items.map((item) => (
                          <NoteListItem
                            key={item.id}
                            item={item}
                            onOpen={() => navigate(`/notes/${item.id}`)}
                            onEdit={() => navigate(`/notes/${item.id}`)}
                            onDelete={() => openDeleteDialog(item.id, item.title, item.type)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Recents;
