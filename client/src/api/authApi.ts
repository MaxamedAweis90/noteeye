import { apiClient } from './client';
import type { UserProfile } from '../types';

export interface AuthResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface UserStats {
  totalNotes: number;
  totalFolders: number;
  memberSince: string;
}

export interface MeResponse {
  user: UserProfile;
  stats?: UserStats;
}

export const authApi = {
  /**
   * Log into Noteeye
   */
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  /**
   * Register a new Noteeye account
   */
  register: async (data: { name?: string; email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  /**
   * Retrieve current authenticated user profile and stats
   */
  getMe: async (): Promise<MeResponse> => {
    const res = await apiClient.get<MeResponse>('/auth/me');
    return res.data;
  },

  /**
   * Update display name or avatar
   */
  updateProfile: async (data: { name?: string; avatar?: string; avatarUrl?: string }): Promise<{ message: string; user: UserProfile }> => {
    const res = await apiClient.patch<{ message: string; user: UserProfile }>('/auth/update-profile', data);
    return res.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const res = await apiClient.patch<{ message: string }>('/auth/change-password', data);
    return res.data;
  },
  /**
   * Log out of current device session
   */
  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/logout');
    return res.data;
  },
};

export default authApi;
