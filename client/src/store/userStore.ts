import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, UserSettings } from '../types';
import { userApi } from '../api';
import { useAuthStore } from './authStore';

export const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'Guest',
  email: '',
  phoneNumber: '',
  avatarUrl: '',
  isEmailVerified: false,
  settings: {
    shortcutsEnabled: true,
    modifierKey: 'ctrl',
    customShortcuts: {
      quickSearch: 'ctrl+k',
      newNote: 'ctrl+n',
      newFolder: 'ctrl+shift+f',
      toggleInspector: 'ctrl+i',
      undo: 'ctrl+z',
      redo: 'ctrl+shift+z',
      delete: 'delete',
    },
    notificationsEnabled: false,
    dailyReminderEnabled: false,
    dailyReminderTime: '09:00',
    soundEffectsEnabled: true,
  },
  isScheduledForDeletion: false,
  deletionScheduledAt: null,
  recoveryPeriodDays: 30,
  remainingRecoveryDays: 30,
};

export interface UserStoreState {
  user: UserProfile;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  resetUser: () => void;
  updateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'email' | 'phoneNumber' | 'avatarUrl'>>) => Promise<boolean>;
  uploadAvatar: (imageData: string, filename?: string) => Promise<boolean>;
  sendVerificationCode: () => Promise<string | null>;
  verifyEmail: (code: string) => Promise<boolean>;
  updateSettings: (settingsUpdates: Partial<UserSettings>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  recoverAccount: () => Promise<boolean>;
}

export const useUserStore = create<UserStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        user: GUEST_USER,
        isLoading: false,
        error: null,


        resetUser: () => {
          set({ user: GUEST_USER, isLoading: false, error: null });
        },

        fetchProfile: async () => {
          try {
            set({ isLoading: true, error: null });
            const data = await userApi.getProfile();
            if (data?.user) {
              set({
                user: {
                  ...get().user,
                  ...data.user,
                  remainingRecoveryDays: data.remainingRecoveryDays ?? 30,
                },
                isLoading: false,
              });
            }
          } catch (err: any) {
            console.warn('[UserStore] fetchProfile warning:', err.message);
            set({ isLoading: false });
          }
        },

        updateProfile: async (updates) => {
          try {
            set({ isLoading: true, error: null });
            // Optimistic update
            set((state) => ({
              user: {
                ...state.user,
                ...updates,
                ...(updates.email && updates.email !== state.user.email ? { isEmailVerified: false } : {}),
              },
            }));

            const res = await userApi.updateProfile(updates);
            if (res?.user) {
              set((state) => ({
                user: {
                  ...state.user,
                  ...res.user,
                },
                isLoading: false,
              }));
              try {
                useAuthStore.getState().updateUser(res.user);
              } catch {}
            }
            return true;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
          }
        },

        uploadAvatar: async (imageData, filename = 'avatar.png') => {
          try {
            set({ isLoading: true, error: null });
            // Optimistic display
            set((state) => ({
              user: {
                ...state.user,
                avatarUrl: imageData,
              },
            }));

            const res = await userApi.uploadAvatar(imageData, filename);
            if (res?.avatarUrl) {
              set((state) => ({
                user: {
                  ...state.user,
                  avatarUrl: res.avatarUrl,
                },
                isLoading: false,
              }));
              try {
                useAuthStore.getState().updateUser({ avatarUrl: res.avatarUrl });
              } catch {}
            }
            return true;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
          }
        },

        sendVerificationCode: async () => {
          try {
            set({ isLoading: true, error: null });
            const res = await userApi.sendVerificationCode();
            set({ isLoading: false });
            return res.code || 'Sent';
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
          }
        },

        verifyEmail: async (code: string) => {
          try {
            set({ isLoading: true, error: null });
            const res = await userApi.verifyEmail(code);
            if (res?.isEmailVerified) {
              set((state) => ({
                user: {
                  ...state.user,
                  isEmailVerified: true,
                },
                isLoading: false,
              }));
              return true;
            }
            set({ isLoading: false });
            return false;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
          }
        },

        updateSettings: async (settingsUpdates) => {
          try {
            set({ isLoading: true, error: null });
            // Optimistic update
            set((state) => ({
              user: {
                ...state.user,
                settings: {
                  ...state.user.settings,
                  ...settingsUpdates,
                },
              },
            }));

            const res = await userApi.updateSettings(settingsUpdates);
            if (res?.settings) {
              set((state) => ({
                user: {
                  ...state.user,
                  settings: {
                    ...state.user.settings,
                    ...res.settings,
                  },
                },
                isLoading: false,
              }));
            }
            return true;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
          }
        },

        deleteAccount: async () => {
          try {
            set({ isLoading: true, error: null });
            // Immediate deletion schedule without confirmation
            set((state) => ({
              user: {
                ...state.user,
                isScheduledForDeletion: true,
                deletionScheduledAt: new Date().toISOString(),
                remainingRecoveryDays: 30,
              },
            }));

            const res = await userApi.deleteAccount();
            if (res) {
              set((state) => ({
                user: {
                  ...state.user,
                  isScheduledForDeletion: true,
                  deletionScheduledAt: res.deletionScheduledAt,
                  remainingRecoveryDays: res.remainingRecoveryDays ?? 30,
                },
                isLoading: false,
              }));
            }
            return true;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
          }
        },

        recoverAccount: async () => {
          try {
            set({ isLoading: true, error: null });
            // Instant optimistic recovery
            set((state) => ({
              user: {
                ...state.user,
                isScheduledForDeletion: false,
                deletionScheduledAt: null,
              },
            }));

            const res = await userApi.recoverAccount();
            if (res) {
              set((state) => ({
                user: {
                  ...state.user,
                  isScheduledForDeletion: false,
                  deletionScheduledAt: null,
                },
                isLoading: false,
              }));
            }
            return true;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
          }
        },
      }),
      {
        name: 'noteeye_user_store',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'UserStore' }
  )
);

// Reset user profile to Guest on logout or when no auth token is active
if (typeof window !== 'undefined') {
  window.addEventListener('noteeye:logout', () => {
    useUserStore.getState().resetUser();
  });

  // If page loads without an active auth token, guarantee Guest state
  if (!localStorage.getItem('noteeye_auth_token')) {
    useUserStore.getState().resetUser();
  }
}

