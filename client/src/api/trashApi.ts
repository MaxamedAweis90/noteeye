import apiClient from './client';
import type { Note, Folder } from '../types';

export interface TrashResponse {
  folders: Folder[];
  notes: Note[];
  totalCount: number;
}

export const trashApi = {
  /**
   * Get all trashed folders and notes
   */
  async getTrash(): Promise<TrashResponse> {
    const response = await apiClient.get<TrashResponse>('/trash');
    return response.data;
  },

  /**
   * Permanently empty all trash
   */
  async emptyTrash(): Promise<{ deletedNotesCount: number; deletedFoldersCount: number }> {
    const response = await apiClient.delete<{
      deletedNotesCount: number;
      deletedFoldersCount: number;
    }>('/trash/empty');
    return response.data;
  },

  /**
   * Restore item by ID
   */
  async restoreItem(id: string): Promise<{ message: string; type: 'note' | 'folder' }> {
    const response = await apiClient.patch<{ message: string; type: 'note' | 'folder' }>(
      `/trash/${id}/restore`
    );
    return response.data;
  },
};

export default trashApi;
