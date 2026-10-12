import apiClient from './client';
import type { Folder } from '../types';

export interface GetFoldersParams {
  parentId?: string | null;
  isTrash?: boolean;
  isFavorite?: boolean;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export const foldersApi = {
  /**
   * Fetch all active folders with optional parentId filter
   */
  async getAll(params?: GetFoldersParams): Promise<Folder[]> {
    const response = await apiClient.get<{ folders: Folder[]; total: number }>('/folders', {
      params,
    });
    return response.data.folders;
  },

  /**
   * Fetch single folder by ID
   */
  async getById(id: string): Promise<Folder> {
    const response = await apiClient.get<{ folder: Folder }>(`/folders/${id}`);
    return response.data.folder;
  },

  /**
   * Create a new folder
   */
  async create(name: string, parentId?: string | null, id?: string): Promise<Folder> {
    const response = await apiClient.post<{ folder: Folder }>('/folders', {
      id,
      name,
      parentId,
    });
    return response.data.folder;
  },

  /**
   * Rename folder or update properties (parentId, isFavorite)
   */
  async update(id: string, updates: Partial<Folder>): Promise<Folder> {
    const response = await apiClient.patch<{ folder: Folder }>(`/folders/${id}`, updates);
    return response.data.folder;
  },

  /**
   * Convenience rename helper
   */
  async rename(id: string, name: string): Promise<Folder> {
    return this.update(id, { name });
  },

  /**
   * Convenience favorite toggle helper
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<Folder> {
    return this.update(id, { isFavorite });
  },

  /**
   * Move folder to trash (cascades to all children)
   */
  async softDelete(id: string): Promise<{ folderId: string; affectedFolderCount: number }> {
    const response = await apiClient.patch<{
      folderId: string;
      affectedFolderCount: number;
    }>(`/folders/${id}/trash`);
    return response.data;
  },

  /**
   * Restore folder from trash (cascades to all children)
   */
  async restore(id: string): Promise<{ folderId: string; affectedFolderCount: number }> {
    const response = await apiClient.patch<{
      folderId: string;
      affectedFolderCount: number;
    }>(`/folders/${id}/restore`);
    return response.data;
  },

  /**
   * Permanently delete folder and all children
   */
  async deleteForever(id: string): Promise<{ deletedFolderCount: number }> {
    const response = await apiClient.delete<{ deletedFolderCount: number }>(`/folders/${id}`);
    return response.data;
  },

  /**
   * Fetch recursive breadcrumbs path from root down to targeted folder
   */
  async getBreadcrumbs(id: string): Promise<BreadcrumbItem[]> {
    const response = await apiClient.get<{ breadcrumbs: BreadcrumbItem[] }>(
      `/folders/${id}/breadcrumbs`
    );
    return response.data.breadcrumbs;
  },

  /**
   * Duplicate a folder
   */
  async duplicate(id: string, targetParentId?: string | null): Promise<Folder> {
    const response = await apiClient.post<{ folder: Folder }>(`/folders/${id}/duplicate`, {
      targetParentId,
    });
    return response.data.folder;
  },
};

export default foldersApi;
