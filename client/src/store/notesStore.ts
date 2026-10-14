import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Note, ChecklistItem } from '../types';
import { STARTER_NOTES, generateMongoId } from '../types';
import { useUIStore } from './uiStore';
import { notesApi } from '../api/notesApi';

export interface NotesStoreState {
  notes: Note[];
  isLoading: boolean;

  // Primary Actions
  createNote: (payload: Partial<Note>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  toggleNoteFavorite: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
  softDeleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  deleteNoteForever: (id: string) => void;
  emptyTrashNotes: () => void;
  duplicateNote: (id: string, destinationFolderId?: string | null) => Note;

  // Checklist Actions
  toggleChecklistItem: (noteId: string, checklistItemId: string) => void;

  // Cascading helpers for folder operations
  softDeleteNotesInFolders: (folderIds: Set<string>) => void;
  restoreNotesInFolders: (folderIds: Set<string>) => void;
  deleteNotesInFoldersForever: (folderIds: Set<string>) => void;

  // Server Network Sync & Hydration
  fetchNotes: () => Promise<void>;

  // Bulk / Utility Actions
  setNotes: (notes: Note[]) => void;
  resetNotesToDefault: () => void;
}

export const useNotesStore = create<NotesStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        notes: STARTER_NOTES,
        isLoading: false,

        createNote: (payload) => {
          const now = new Date().toISOString();
          const title = payload.title?.trim() || 'Untitled Note';
          const type = payload.type || 'note';
          const body = payload.body || payload.content || '';
          const color = payload.color || 'peach';
          const folderId = payload.folderId !== undefined ? payload.folderId : null;
          const tempId = payload.id && /^[0-9a-fA-F]{24}$/.test(payload.id) ? payload.id : generateMongoId();

          const newNote: Note = {
            id: tempId,
            userId: payload.userId || 'user-demo',
            title,
            body,
            content: body, // Backward compatibility
            type,
            checklistItems: payload.checklistItems || [],
            ideaItems: payload.ideaItems || [],
            color,
            folderId,
            isFavorite: payload.isFavorite || false,
            isTrash: false,
            isDeleted: false,
            deletedAt: null,
            createdAt: payload.createdAt || now,
            updatedAt: now,
          };

          // Optimistic local update
          set((state) => ({
            notes: [newNote, ...state.notes],
          }));

          useUIStore.getState().showToast(`Created "${newNote.title}"`);

          // Background network sync
          notesApi
            .create({
              id: tempId,
              title,
              body,
              type,
              checklistItems: newNote.checklistItems,
              ideaItems: newNote.ideaItems,
              color,
              folderId,
              isFavorite: newNote.isFavorite,
            })
            .then((serverNote) => {
              if (serverNote && serverNote.id) {
                // Update local note with server's MongoDB ObjectId
                set((state) => ({
                  notes: state.notes.map((n) => (n.id === tempId ? { ...n, ...serverNote } : n)),
                }));
              }
            })
            .catch((err) => {
              console.warn('[notesStore] Background create sync error (offline/cached):', err.message);
            });

          return newNote;
        },

        updateNote: (id, updates) => {
          const now = new Date().toISOString();
          set((state) => ({
            notes: state.notes.map((note) => {
              if (note.id !== id) return note;

              const body =
                updates.body !== undefined
                  ? updates.body
                  : updates.content !== undefined
                  ? updates.content
                  : note.body;
              return {
                ...note,
                ...updates,
                body,
                content: body,
                updatedAt: now,
              };
            }),
          }));

          // Background network sync
          notesApi.update(id, updates).catch((err) => {
            console.warn('[notesStore] Background update sync error:', err.message);
          });
        },

        toggleNoteFavorite: (id) => {
          let updatedTitle = '';
          let nextFav = false;

          set((state) => ({
            notes: state.notes.map((note) => {
              if (note.id === id) {
                nextFav = !note.isFavorite;
                updatedTitle = note.title;
                return {
                  ...note,
                  isFavorite: nextFav,
                  updatedAt: new Date().toISOString(),
                };
              }
              return note;
            }),
          }));

          if (updatedTitle) {
            useUIStore
              .getState()
              .showToast(
                nextFav
                  ? `Added "${updatedTitle}" to favorites`
                  : `Removed "${updatedTitle}" from favorites`
              );
          }

          // Background network sync
          notesApi.update(id, { isFavorite: nextFav }).catch((err) => {
            console.warn('[notesStore] Background toggleFavorite sync error:', err.message);
          });
        },

        moveNoteToFolder: (noteId, folderId) => {
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === noteId
                ? {
                    ...note,
                    folderId,
                    updatedAt: new Date().toISOString(),
                  }
                : note
            ),
          }));

          // Background network sync
          notesApi.update(noteId, { folderId }).catch((err) => {
            console.warn('[notesStore] Background moveNote sync error:', err.message);
          });
        },

        softDeleteNote: (id) => {
          const now = new Date().toISOString();
          let deletedTitle = '';

          set((state) => ({
            notes: state.notes.map((note) => {
              if (note.id === id) {
                deletedTitle = note.title;
                return {
                  ...note,
                  isTrash: true,
                  isDeleted: true,
                  deletedAt: now,
                  updatedAt: now,
                };
              }
              return note;
            }),
          }));

          if (deletedTitle) {
            useUIStore.getState().showToast(`Moved "${deletedTitle}" to Trash`);
          }

          // Background network sync
          notesApi.softDelete(id).catch((err) => {
            console.warn('[notesStore] Background softDelete sync error:', err.message);
          });
        },

        restoreNote: (id) => {
          const now = new Date().toISOString();
          let restoredTitle = '';

          set((state) => ({
            notes: state.notes.map((note) => {
              if (note.id === id) {
                restoredTitle = note.title;
                return {
                  ...note,
                  isTrash: false,
                  isDeleted: false,
                  deletedAt: null,
                  updatedAt: now,
                };
              }
              return note;
            }),
          }));

          if (restoredTitle) {
            useUIStore.getState().showToast(`Restored "${restoredTitle}"`);
          }

          // Background network sync
          notesApi.restore(id).catch((err) => {
            console.warn('[notesStore] Background restore sync error:', err.message);
          });
        },

        deleteNoteForever: (id) => {
          let removedTitle = '';
          set((state) => {
            const target = state.notes.find((n) => n.id === id);
            if (target) removedTitle = target.title;
            return {
              notes: state.notes.filter((note) => note.id !== id),
            };
          });

          if (removedTitle) {
            useUIStore.getState().showToast(`Deleted "${removedTitle}" forever`);
          }

          // Background network sync
          notesApi.deleteForever(id).catch((err) => {
            console.warn('[notesStore] Background deleteForever sync error:', err.message);
          });
        },

        emptyTrashNotes: () => {
          set((state) => ({
            notes: state.notes.filter((note) => !note.isTrash && !note.isDeleted),
          }));

          // Background network sync
          notesApi.emptyTrash().catch((err) => {
            console.warn('[notesStore] Background emptyTrash sync error:', err.message);
          });
        },

        duplicateNote: (id, destinationFolderId = null) => {
          const state = get();
          const target = state.notes.find((n) => n.id === id);
          if (!target) {
            throw new Error(`Note with id ${id} not found.`);
          }

          const now = new Date().toISOString();
          const targetFolder =
            destinationFolderId !== undefined ? destinationFolderId : target.folderId;
          const duplicateName = `${target.title} (Copy)`;
          const tempId = generateMongoId();

          const newNote: Note = {
            ...target,
            id: tempId,
            title: duplicateName,
            folderId: targetFolder,
            isTrash: false,
            isDeleted: false,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
            checklistItems: target.checklistItems?.map((ci) => ({
              ...ci,
              id: generateMongoId(),
            })),
            ideaItems: target.ideaItems?.map((ii) => ({
              ...ii,
              id: generateMongoId(),
            })),
          };

          set((s) => ({
            notes: [newNote, ...s.notes],
          }));

          useUIStore.getState().showToast(`Duplicated "${target.title}"`);

          // Background network sync
          notesApi
            .duplicate(id, targetFolder)
            .then((serverNote) => {
              if (serverNote && serverNote.id) {
                set((s) => ({
                  notes: s.notes.map((n) => (n.id === tempId ? { ...n, ...serverNote } : n)),
                }));
              }
            })
            .catch((err) => {
              console.warn('[notesStore] Background duplicate sync error:', err.message);
            });

          return newNote;
        },

        toggleChecklistItem: (noteId, checklistItemId) => {
          let updatedChecklist: ChecklistItem[] = [];

          set((state) => ({
            notes: state.notes.map((note) => {
              if (note.id !== noteId || !note.checklistItems) return note;

              updatedChecklist = note.checklistItems.map((item) => {
                if (item.id === checklistItemId) {
                  const nextCompleted = !item.completed;
                  return {
                    ...item,
                    completed: nextCompleted,
                    isCompleted: nextCompleted,
                  };
                }
                return item;
              });

              return {
                ...note,
                checklistItems: updatedChecklist,
                updatedAt: new Date().toISOString(),
              };
            }),
          }));

          // Background network sync
          if (updatedChecklist.length > 0) {
            notesApi.update(noteId, { checklistItems: updatedChecklist }).catch((err) => {
              console.warn('[notesStore] Background checklist sync error:', err.message);
            });
          }
        },

        softDeleteNotesInFolders: (folderIds) => {
          if (!folderIds || folderIds.size === 0) return;
          const now = new Date().toISOString();
          set((state) => ({
            notes: state.notes.map((note) => {
              if (note.folderId && folderIds.has(note.folderId) && !note.isTrash) {
                return {
                  ...note,
                  isTrash: true,
                  isDeleted: true,
                  deletedAt: now,
                  updatedAt: now,
                };
              }
              return note;
            }),
          }));
        },

        restoreNotesInFolders: (folderIds) => {
          if (!folderIds || folderIds.size === 0) return;
          const now = new Date().toISOString();
          set((state) => ({
            notes: state.notes.map((note) => {
              if (
                note.folderId &&
                folderIds.has(note.folderId) &&
                (note.isTrash || note.isDeleted)
              ) {
                return {
                  ...note,
                  isTrash: false,
                  isDeleted: false,
                  deletedAt: null,
                  updatedAt: now,
                };
              }
              return note;
            }),
          }));
        },

        deleteNotesInFoldersForever: (folderIds) => {
          if (!folderIds || folderIds.size === 0) return;
          set((state) => ({
            notes: state.notes.filter((note) => !note.folderId || !folderIds.has(note.folderId)),
          }));
        },

        fetchNotes: async () => {
          set({ isLoading: true });
          try {
            const serverNotes = await notesApi.getAll();
            if (Array.isArray(serverNotes)) {
              set({ notes: serverNotes });
            }
          } catch (err: any) {
            console.warn('[notesStore] Fetch notes error (relying on persisted cache):', err.message);
          } finally {
            set({ isLoading: false });
          }
        },

        setNotes: (notes) => set({ notes }),

        resetNotesToDefault: () => set({ notes: STARTER_NOTES }),
      }),
      {
        name: 'noteeye_notes_store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ notes: state.notes }),
      }
    ),
    { name: 'NotesStore' }
  )
);

// Reset notes to default starter content on logout or fetch on login
if (typeof window !== 'undefined') {
  window.addEventListener('noteeye:logout', () => {
    useNotesStore.getState().resetNotesToDefault();
  });
  window.addEventListener('noteeye:login', () => {
    useNotesStore.getState().fetchNotes();
  });
}
