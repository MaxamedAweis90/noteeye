import apiClient from './client';
import type { Note } from '../types';

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
    return response.data.notes;
  },

  /**
   * Fetch single note by ID
   */
  async getById(id: string): Promise<Note> {
    const response = await apiClient.get<{ note: Note }>(`/notes/${id}`);
    return response.data.note;
  },

  /**
   * Create a new note or checklist
   */
  async create(payload: Partial<Note>): Promise<Note> {
    const response = await apiClient.post<{ note: Note }>('/notes', payload);
    return response.data.note;
  },

  /**
   * Partially update a note
   */
  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const response = await apiClient.patch<{ note: Note }>(`/notes/${id}`, updates);
    return response.data.note;
  },

  /**
   * Move note to trash
   */
  async softDelete(id: string): Promise<Note> {
    const response = await apiClient.patch<{ note: Note }>(`/notes/${id}/trash`);
    return response.data.note;
  },

  /**
   * Restore note from trash
   */
  async restore(id: string): Promise<Note> {
    const response = await apiClient.patch<{ note: Note }>(`/notes/${id}/restore`);
    return response.data.note;
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
    return response.data.note;
  },
};

export default notesApi;
