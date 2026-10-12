import apiClient from './client';
import type { Note, Folder } from '../types';

export interface SearchMatchItem {
  type: 'note' | 'folder';
  id: string;
  name?: string;
  title?: string;
  body?: string;
  noteType?: 'note' | 'checklist';
  color?: string;
  folderId?: string | null;
  parentId?: string | null;
  isFavorite?: boolean;
  updatedAt: string;
}

export interface SearchResponse {
  folders: Folder[];
  notes: Note[];
  results: SearchMatchItem[];
  total: number;
}

export const searchApi = {
  /**
   * Search across notes and folders
   */
  async query(q: string, limit?: number): Promise<SearchResponse> {
    const response = await apiClient.get<SearchResponse>('/search', {
      params: { q, limit },
    });
    return response.data;
  },
};

export default searchApi;
