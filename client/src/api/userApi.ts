import { apiClient } from './client';
import type { UserProfile, UserSettings } from '../types';

/**
 * User Profile and Settings API Client
 */
export const userApi = {
  /**
   * Fetch user profile and current settings
   */
  getProfile: async (): Promise<{ user: UserProfile; remainingRecoveryDays?: number }> => {
    const res = await apiClient.get<{ user: UserProfile; remainingRecoveryDays?: number }>('/user/profile');
    return res.data;
  },

  /**
   * Update name, email, phone number, or avatar URL
   */
  updateProfile: async (
    updates: Partial<Pick<UserProfile, 'name' | 'email' | 'phoneNumber' | 'avatarUrl'>>
  ): Promise<{ message: string; user: UserProfile }> => {
    const res = await apiClient.put<{ message: string; user: UserProfile }>('/user/profile', updates);
    return res.data;
  },

  /**
   * Request email verification 6-digit code
   */
  sendVerificationCode: async (): Promise<{ message: string; code: string; email: string }> => {
    const res = await apiClient.post<{ message: string; code: string; email: string }>('/user/send-verification');
    return res.data;
  },

  /**
   * Submit email verification code
   */
  verifyEmail: async (code: string): Promise<{ message: string; isEmailVerified: boolean; user: UserProfile }> => {
    const res = await apiClient.post<{ message: string; isEmailVerified: boolean; user: UserProfile }>('/user/verify-email', {
      code,
    });
    return res.data;
  },

  /**
   * Upload user avatar using Vercel Blob (or fallback)
   */
  uploadAvatar: async (
    imageData: string,
    filename: string = 'avatar.png'
  ): Promise<{ message: string; avatarUrl: string; user: UserProfile }> => {
    const res = await apiClient.post<{ message: string; avatarUrl: string; user: UserProfile }>('/user/avatar', {
      imageData,
      filename,
    });
    return res.data;
  },

  /**
   * Update shortcut configurations and PWA notification preferences
   */
  updateSettings: async (
    settings: Partial<UserSettings>
  ): Promise<{ message: string; settings: UserSettings; user: UserProfile }> => {
    const res = await apiClient.put<{ message: string; settings: UserSettings; user: UserProfile }>(
      '/user/settings',
      settings
    );
    return res.data;
  },

  /**
   * Delete account directly without confirmation (sets 30-day recovery grace period)
   */
  deleteAccount: async (): Promise<{
    message: string;
    isScheduledForDeletion: boolean;
    deletionScheduledAt: string;
    recoveryPeriodDays: number;
    remainingRecoveryDays: number;
    user: UserProfile;
  }> => {
    const res = await apiClient.post<{
      message: string;
      isScheduledForDeletion: boolean;
      deletionScheduledAt: string;
      recoveryPeriodDays: number;
      remainingRecoveryDays: number;
      user: UserProfile;
    }>('/user/delete-account');
    return res.data;
  },

  /**
   * Cancel deletion and recover account
   */
  recoverAccount: async (): Promise<{ message: string; isScheduledForDeletion: boolean; user: UserProfile }> => {
    const res = await apiClient.post<{ message: string; isScheduledForDeletion: boolean; user: UserProfile }>(
      '/user/recover-account'
    );
    return res.data;
  },
};

export default userApi;
