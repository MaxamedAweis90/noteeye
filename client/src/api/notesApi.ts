import apiClient from './client';
import type { Note } from '../types';
import { colorKeyToHex, hexToColorKey, PASTEL_PALETTE } from '../types';

/** Server stores palette keys ('mint'); the UI renders hex values. */
const fromServer = (n: Note): Note => (n && n.color ? { ...n, color: colorKeyToHex(n.color) } : n);
const toServerColor = (c: string): string =>
  PASTEL_PALETTE.some((p) => p.key === c) ? c : hexToColorKey(c);
const toServer = <T extends Partial<Note>>(p: T): T =>
  p && typeof p.color === 'string' ? { ...p, color: toServerColor(p.color) } : p;

export interface GetNotesParams {
  folderId?: string | null;
  isFavorite?: boolean;
  isTrash?: boolean;
  type?: 'note' | 'checklist';
  color?: string;
  q?: string;
}

export const notesApi = {
  /**
   * Fetch all notes with optional filters
   */
  async getAll(params?: GetNotesParams): Promise<Note[]> {
    const response = await apiClient.get<{ notes: Note[]; total: number }>('/notes', {
      params,
    });
    return response.data.notes.map(fromServer);
  },

  /**
   * Fetch single note by ID
   */
  async getById(id: string): Promise<Note> {
    const response = await apiClient.get<{ note: Note }>(`/notes/${id}`);
    return fromServer(response.data.note);
  },

  /**
   * Create a new note or checklist
   */
  async create(payload: Partial<Note>): Promise<Note> {
    const response = await apiClient.post<{ note: Note }>('/notes', toServer(payload));
    return fromServer(response.data.note);
  },

  /**
   * Partially update a note
   */
  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const response = await apiClient.patch<{ note: Note }>(`/notes/${id}`, toServer(updates));
    return fromServer(response.data.note);
  },

  /**
   * Move note to trash
   */
  async softDelete(id: string): Promise<Note> {
    const response = await apiClient.patch<{ note: Note }>(`/notes/${id}/trash`);
    return fromServer(response.data.note);
  },

  /**
   * Restore note from trash
   */
  async restore(id: string): Promise<Note> {
    const response = await apiClient.patch<{ note: Note }>(`/notes/${id}/restore`);
    return fromServer(response.data.note);
  },

  /**
   * Permanently delete note from database
   */
  async deleteForever(id: string): Promise<{ deletedId: string }> {
    const response = await apiClient.delete<{ deletedId: string }>(`/notes/${id}`);
    return response.data;
  },

  /**
   * Permanently empty all trashed notes
   */
  async emptyTrash(): Promise<{ deletedCount: number }> {
    const response = await apiClient.delete<{ deletedCount: number }>('/notes/trash/empty');
    return response.data;
  },

  /**
   * Duplicate a note
   */
  async duplicate(id: string, destinationFolderId?: string | null): Promise<Note> {
    const response = await apiClient.post<{ note: Note }>(`/notes/${id}/duplicate`, {
      destinationFolderId,
    });
    return fromServer(response.data.note);
  },
};

export default notesApi;
