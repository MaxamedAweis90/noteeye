import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Folder as FolderIcon,
  FolderPlus,
  Plus,
  Pencil,
  Trash2,
  Star,
  FileText,
  CheckSquare,
  MoreHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
  Home,
  AlertCircle,
  Edit3,
  Lightbulb,
} from "@/components/ui/icons";
import { format } from "date-fns";
import type { ItemType } from "../types";
import { useNoteStore } from "../store/useNoteStore";
import { useUIStore } from "../store/uiStore";
import { NoteCard } from "../components/NoteCard";
import { FolderCard } from "../components/FolderCard";
import { GridSkeleton } from "../components/skeletons";
import { DetailsToggleButton } from "../components/DetailsToggleButton";
import type { Folder, Item } from "../types";
import { cn } from "../utils/cn";
import {
  cardDropVariants,
  listRowDropVariants,
  cardLayoutTransition,
} from "../utils/animations";

/**
 * FolderListItem — Material 3 Horizontal List Row for Subfolders inside FolderDetail
 */
interface FolderListItemProps {
  folder: Folder;
  itemCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const FolderListItem: React.FC<FolderListItemProps> = ({
  folder,
  itemCount,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const selectedItemId = useUIStore((state) => state.selectedItemId);
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);
  const isSelected = selectedItemId === folder.id;

  const formattedDate = format(
    new Date(folder.updatedAt || folder.createdAt),
    "d MMM yyyy, h:mm a",
  );

  return (
    <div
      data-card
      data-card-id={folder.id}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedItem(folder.id, "folder");
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className={cn(
        "w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-all cursor-pointer group select-none border",
        isSelected
          ? "bg-[#EDE7FE] border-[#7B61FF] ring-2 ring-[#7B61FF]/40 shadow-sm"
          : "bg-[#F6F4FE] hover:bg-[#EFEAFF] border-[#7B61FF]/15 shadow-2xs hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      {/* Left Icon + Title + Snippet */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-[#7B61FF]/15 text-[#6D4DE0] flex items-center justify-center shrink-0">
          <FolderIcon className="w-4 h-4 fill-[#6D4DE0]" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm sm:text-base text-[#1F1F1F] dark:text-slate-100 truncate">
            {folder.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {itemCount === 0
              ? "Empty folder"
              : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          </p>
        </div>
      </div>

      {/* Right Meta & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
          {formattedDate}
        </span>

        {/* Dedicated Star Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={
            folder.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95",
            folder.isFavorite
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none sm:group-hover:opacity-100 sm:pointer-events-auto",
          )}
        >
          <Star
            className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125",
              folder.isFavorite
                ? "fill-amber-400 text-amber-400"
                : "text-slate-400 hover:text-amber-500",
            )}
          />
        </button>

        {/* Quick Edit & Delete Buttons */}
        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Rename folder"
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
            aria-label="Delete folder"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * NoteListItem — Google Keep / Material 3 Horizontal List Row for Folder Notes
 */
interface NoteListItemProps {
  item: Item;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({
  item,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const isChecklist = item.type === "checklist";
  const checklistItems = item.checklistItems || [];
  const completedCount = checklistItems.filter((c) => c.isCompleted).length;
  const totalCount = checklistItems.length;

  const selectedItemId = useUIStore((state) => state.selectedItemId);
  const setSelectedItem = useUIStore((state) => state.setSelectedItem);
  const isSelected = selectedItemId === item.id;

  const formattedDate = format(
    new Date(item.updatedAt || item.createdAt),
    "d MMM yyyy, h:mm a",
  );

  return (
    <div
      data-card
      data-card-id={item.id}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedItem(
          item.id,
          item.type === "checklist" ? "checklist" : "note",
        );
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      style={{ backgroundColor: item.color || "#FDE3C9" }}
      className={cn(
        "w-full rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-all cursor-pointer group select-none",
        isSelected
          ? "ring-2 ring-[#0B57D0] shadow-md scale-[1.005]"
          : "border border-black/[0.04] shadow-xs hover:shadow-md hover:-translate-y-0.5",
      )}
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
            <h3 className="font-bold text-sm sm:text-base text-[#1F1F1F] dark:text-slate-100 truncate">
              {item.title}
            </h3>
          </div>

          <p className="text-xs text-slate-700/75 dark:text-slate-400 truncate mt-0.5">
            {isChecklist
              ? `${completedCount}/${totalCount} completed • ${checklistItems.map((c) => c.text).join(", ") || "No tasks"}`
              : item.content || (
                  <span className="italic text-slate-400 dark:text-slate-500">Empty note...</span>
                )}
          </p>
        </div>
      </div>

      {/* Right Meta & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <span className="text-[11px] sm:text-xs text-slate-600/80 dark:text-slate-400 font-medium hidden md:inline">
          {formattedDate}
        </span>

        {/* Dedicated Star Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={
            item.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95",
            item.isFavorite
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none sm:group-hover:opacity-100 sm:pointer-events-auto",
          )}
        >
          <Star
            className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125",
              item.isFavorite
                ? "fill-amber-400 text-amber-400"
                : "text-slate-400 hover:text-amber-500",
            )}
          />
        </button>

        {/* Quick Edit & Delete Buttons */}
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

export interface FolderDetailProps {
  isLoading?: boolean;
}

/**
 * Screen 05: Folder Detail View
 * Google Drive / Material 3 Floating Workspace Island.
 *
 * Features:
 * 1. Breadcrumb Trail: Multi-level ancestor hierarchy ("Collections" > Parent > Child).
 * 2. Header Flex Row: Folder badge, title, count pill, star toggle, rename, and delete options.
 * 3. Subfolders & Notes Support: Seamless nested folder structure with "+ New folder" and "+ New note".
 * 4. Responsive Grid & List Views: Renders subfolders first, notes following directly.
 * 5. Empty State: Illustrated empty state with CTAs for creating both folders and notes.
 * 6. Error / 404 State: Clean fallback with return link when folder does not exist.
 */
export const FolderDetail: React.FC<FolderDetailProps> = ({
  isLoading = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const folders = useNoteStore((state) => state.folders);
  const items = useNoteStore((state) => state.items);
  const setCurrentFolder = useNoteStore((state) => state.setCurrentFolder);
  const openFolderModal = useNoteStore((state) => state.openFolderModal);
  const openDeleteDialog = useNoteStore((state) => state.openDeleteDialog);
  const toggleFavoriteFolder = useNoteStore(
    (state) => state.toggleFavoriteFolder,
  );
  const toggleFavoriteItem = useNoteStore((state) => state.toggleFavoriteItem);
  const openNoteModal = useNoteStore((state) => state.openNoteModal);
  const openQuickEditModal = useNoteStore((state) => state.openQuickEditModal);
  const executeTransfer = useNoteStore((state) => state.executeTransfer);
  const closeDetailsPanel = useUIStore((state) => state.closeDetailsPanel);

  const [dragOverBreadcrumbId, setDragOverBreadcrumbId] = useState<
    string | null
  >(null);

  // Synchronize active folder context and initially close details panel upon folder entry
  useEffect(() => {
    closeDetailsPanel();
    if (id) {
      setCurrentFolder(id);
    }
    return () => {
      setCurrentFolder(null);
    };
  }, [id, setCurrentFolder, closeDetailsPanel]);

  // Lookup active (non-deleted) folder
  const folder = useMemo(() => {
    return folders.find((f) => f.id === id && !f.isDeleted) || null;
  }, [folders, id]);

  // View Mode, Menu, and Sort states
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"recent" | "name">("recent");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById("workspace-content-island");
    if (!scrollContainer) return;
    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 8);
    };
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // Subfolders strictly assigned to this folder
  const subfolders = useMemo(() => {
    if (!id) return [];
    const filtered = folders.filter((f) => f.parentId === id && !f.isDeleted);
    if (sortOrder === "name") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [folders, id, sortOrder]);

  // Notes strictly assigned to this folder
  const folderNotes = useMemo(() => {
    if (!id) return [];
    const filtered = items.filter((i) => i.folderId === id && !i.isDeleted);
    if (sortOrder === "name") {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [items, id, sortOrder]);

  // Total items inside this folder
  const totalItemsCount = subfolders.length + folderNotes.length;

  // Build hierarchical breadcrumb trail upwards to Root
  const breadcrumbTrail = useMemo(() => {
    if (!folder) return [];
    const trail: Folder[] = [];
    let curr: Folder | undefined = folder;
    while (curr) {
      trail.unshift(curr);
      if (!curr.parentId) break;
      curr = folders.find((f) => f.id === curr!.parentId && !f.isDeleted);
    }
    return trail;
  }, [folder, folders]);

  const handleCreateNote = (type: ItemType = "note") => {
    if (folder) {
      setCurrentFolder(folder.id);
      openNoteModal(type);
    }
  };

  const handleOpenNote = (item: Item) => {
    navigate(`/notes/${item.id}`);
  };

  const formattedFolderDate = folder
    ? format(new Date(folder.updatedAt || folder.createdAt), "d MMM yyyy")
    : "";

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="w-full space-y-8 flex-1 animate-fade-in select-none">
        <div className="h-6 w-48 bg-slate-100 rounded-md shimmer-mask" />
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl shimmer-mask" />
            <div className="space-y-2">
              <div className="h-8 w-56 bg-slate-200/80 rounded-xl shimmer-mask" />
              <div className="h-4 w-32 bg-slate-100 rounded-full shimmer-mask" />
            </div>
          </div>
          <div className="h-9 w-36 bg-slate-100 rounded-xl shimmer-mask" />
        </div>
        <GridSkeleton showFolders={false} noteCount={6} />
      </div>
    );
  }

  // Missing or Deleted Folder (404 state)
  if (!folder) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 text-center select-none animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-4 shadow-xs">
          <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-[#1F1F1F] dark:text-slate-100">Folder not found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
          This collection may have been deleted, moved to trash, or does not
          exist.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B57D0] text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => setHasEntered(true)}
      style={{ transform: hasEntered ? "none" : undefined }}
      className="w-full space-y-6 sm:space-y-8 flex-1 select-none relative"
    >
      {/* Sticky Header Container (Flush at Top of Workspace Island) */}
      <div
        className={cn(
          "sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3.5 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md rounded-t-2xl md:rounded-t-[24px] transition-all duration-200 space-y-3",
          isScrolled
            ? "border-b border-slate-100 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            : "border-b border-slate-100/60 dark:border-slate-800/60 shadow-none",
        )}
      >
        {/* 1. Hierarchical Breadcrumb Trail with Drop Targets */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none overflow-x-auto py-1 scrollbar-none"
        >
          <Link
            to="/"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOverBreadcrumbId("root");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverBreadcrumbId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverBreadcrumbId(null);
              try {
                const raw = e.dataTransfer.getData("application/json");
                if (!raw) return;
                const data = JSON.parse(raw);
                if (data.type === "batch" && Array.isArray(data.items)) {
                  executeTransfer(
                    data.items.map((item: any) => ({
                      type: item.type,
                      id: item.id,
                      name: item.name || item.title,
                      action: "cut",
                    })),
                    null,
                  );
                } else if (data.id) {
                  executeTransfer(
                    [
                      {
                        type: data.type === "folder" ? "folder" : "note",
                        id: data.id,
                        name: data.name || data.title,
                        action: "cut",
                      },
                    ],
                    null,
                  );
                }
              } catch (err) {
                console.error("Drop error on root breadcrumb:", err);
              } finally {
                useUIStore.getState().clearMultiSelection();
                useUIStore.getState().setIsDraggingMulti(false);
              }
            }}
            className={cn(
              "flex items-center gap-1 transition-colors shrink-0 px-1.5 py-0.5 rounded-lg",
              dragOverBreadcrumbId === "root"
                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400 font-bold"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          {breadcrumbTrail.map((f, idx) => {
            const isCurrent = idx === breadcrumbTrail.length - 1;
            return (
              <React.Fragment key={f.id}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                {isCurrent ? (
                  <span className="text-[#1F1F1F] dark:text-slate-100 font-bold truncate max-w-[200px] sm:max-w-xs px-1.5 py-0.5">
                    {f.name}
                  </span>
                ) : (
                  <Link
                    to={`/folders/${f.id}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOverBreadcrumbId(f.id);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverBreadcrumbId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverBreadcrumbId(null);
                      try {
                        const raw = e.dataTransfer.getData("application/json");
                        if (!raw) return;
                        const data = JSON.parse(raw);
                        if (
                          data.type === "batch" &&
                          Array.isArray(data.items)
                        ) {
                          executeTransfer(
                            data.items.map((item: any) => ({
                              type: item.type,
                              id: item.id,
                              name: item.name || item.title,
                              action: "cut",
                            })),
                            f.id,
                          );
                        } else if (data.id) {
                          executeTransfer(
                            [
                              {
                                type:
                                  data.type === "folder" ? "folder" : "note",
                                id: data.id,
                                name: data.name || data.title,
                                action: "cut",
                              },
                            ],
                            f.id,
                          );
                        }
                      } catch (err) {
                        console.error("Drop error on breadcrumb:", err);
                      } finally {
                        useUIStore.getState().clearMultiSelection();
                        useUIStore.getState().setIsDraggingMulti(false);
                      }
                    }}
                    className={cn(
                      "transition-colors truncate max-w-[160px] px-1.5 py-0.5 rounded-lg",
                      dragOverBreadcrumbId === f.id
                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400 font-bold"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
                    )}
                  >
                    {f.name}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* 2. Folder Header & Meta Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Badge, Title & Context Menu */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8F7BF0] to-[#5939C7] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FolderIcon className="w-6 h-6 fill-white text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1F1F1F] dark:text-slate-100 tracking-tight truncate">
                  {folder.name}
                </h1>

                {/* Action Buttons: Rename, Star, More Menu */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Rename */}
                  <button
                    type="button"
                    onClick={() => openFolderModal(folder)}
                    title="Rename folder"
                    aria-label="Rename folder"
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Star Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleFavoriteFolder(folder.id)}
                    title={
                      folder.isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                    aria-label="Toggle favorite"
                    className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Star
                      className={cn(
                        "w-4 h-4 transition-transform active:scale-125",
                        folder.isFavorite
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-400 hover:text-amber-500",
                      )}
                    />
                  </button>

                  {/* 3-Dots Action Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen((prev) => !prev)}
                      title="Folder options"
                      aria-label="Folder options"
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute left-0 top-8 z-40 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 animate-fade-in text-xs select-none">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              openFolderModal(folder);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-left cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            <span>Rename folder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              toggleFavoriteFolder(folder.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-left cursor-pointer"
                          >
                            <Star
                              className={cn(
                                "w-3.5 h-3.5",
                                folder.isFavorite
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-400",
                              )}
                            />
                            <span>
                              {folder.isFavorite
                                ? "Remove from Favorites"
                                : "Add to Favorites"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              openDeleteDialog(
                                folder.id,
                                folder.name,
                                "folder",
                              );
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 font-medium text-left cursor-pointer border-t border-slate-100 dark:border-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Delete folder</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Header Meta Pill */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {subfolders.length > 0 && folderNotes.length > 0
                    ? `${subfolders.length} ${subfolders.length === 1 ? "folder" : "folders"}, ${folderNotes.length} ${folderNotes.length === 1 ? "note" : "notes"} inside`
                    : subfolders.length > 0
                      ? `${subfolders.length} ${subfolders.length === 1 ? "folder" : "folders"} inside`
                      : folderNotes.length > 0
                        ? `${folderNotes.length} ${folderNotes.length === 1 ? "note" : "notes"} inside`
                        : "Empty folder"}
                </span>
                <span className="text-slate-300 dark:text-slate-600 text-xs">•</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Updated {formattedFolderDate}
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions: New Folder, New Note, View Mode, Details & Sort */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* New Folder CTA Button */}
            <button
              type="button"
              onClick={() => openFolderModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-95"
            >
              <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>New folder</span>
            </button>

            {/* New Note CTA Button */}
            <button
              type="button"
              onClick={() => handleCreateNote("note")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B57D0] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New note</span>
            </button>

            {/* New Idea CTA Button */}
            <button
              type="button"
              onClick={() => handleCreateNote("idea")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>New idea</span>
            </button>

            {/* View Mode Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex items-center gap-0.5 border border-black/[0.04] dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-[#0B57D0] dark:text-sky-400 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-[#0B57D0] dark:text-sky-400 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Details Toggle Button */}
            <DetailsToggleButton />

            {/* Sort Order */}
            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === "recent" ? "name" : "recent"))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-black/[0.04] dark:border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>
                {sortOrder === "recent"
                  ? "Date modified"
                  : "Alphabetical (A-Z)"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Folder Contents: Grid / List View */}
      {totalItemsCount === 0 ? (
        /* Empty Folder State */
        <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 shadow-xs">
            <FolderIcon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-[#1F1F1F] dark:text-slate-100">
            This folder is empty
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Add notes, checklists, or create nested subfolders inside this
            collection.
          </p>
          <div className="flex items-center gap-2.5 mt-5">
            <button
              type="button"
              onClick={() => openFolderModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-95"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>New Folder</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateNote("note")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0041A2] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Note</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateNote("idea")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-95"
            >
              <Lightbulb className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>New Idea</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Continuous Responsive Grid: Subfolders first, notes follow directly */
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 max-w-[1540px]">
            {/* 1. Subfolder Cards First */}
            <AnimatePresence>
              {subfolders.map((sub) => (
                <motion.div
                  key={sub.id}
                  layout
                  variants={cardDropVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ layout: cardLayoutTransition }}
                  className="w-full flex justify-center"
                >
                  <FolderCard
                    folder={sub}
                    onOpen={() => {
                      setCurrentFolder(sub.id);
                      navigate(`/folders/${sub.id}`);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 2. Note Cards Follow Directly */}
            <AnimatePresence>
              {folderNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  variants={cardDropVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ layout: cardLayoutTransition }}
                  className="w-full flex justify-center"
                >
                  <NoteCard
                    item={note}
                    onOpen={() => handleOpenNote(note)}
                    onEdit={() => openQuickEditModal(note)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* List View: Subfolders first, notes follow directly */
        <div className="w-full space-y-2.5 max-w-4xl">
          {/* 1. Subfolders in List Mode */}
          <AnimatePresence>
            {subfolders.map((sub) => {
              const subCount =
                items.filter((i) => i.folderId === sub.id && !i.isDeleted)
                  .length +
                folders.filter((f) => f.parentId === sub.id && !f.isDeleted)
                  .length;
              return (
                <motion.div
                  key={sub.id}
                  layout
                  variants={listRowDropVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ layout: cardLayoutTransition }}
                >
                  <FolderListItem
                    folder={sub}
                    itemCount={subCount}
                    onOpen={() => {
                      setCurrentFolder(sub.id);
                      navigate(`/folders/${sub.id}`);
                    }}
                    onEdit={() => openFolderModal(sub)}
                    onDelete={() =>
                      openDeleteDialog(sub.id, sub.name, "folder")
                    }
                    onToggleFavorite={() => toggleFavoriteFolder(sub.id)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* 2. Notes in List Mode */}
          <AnimatePresence>
            {folderNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                variants={listRowDropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ layout: cardLayoutTransition }}
              >
                <NoteListItem
                  item={note}
                  onOpen={() => handleOpenNote(note)}
                  onEdit={() => openQuickEditModal(note)}
                  onDelete={() =>
                    openDeleteDialog(
                      note.id,
                      note.title,
                      note.type === "checklist" ? "checklist" : "note",
                    )
                  }
                  onToggleFavorite={() => toggleFavoriteItem(note.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default FolderDetail;
