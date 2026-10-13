import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '../types';
import { authApi, type UserStats } from '../api';
import { useUIStore } from './uiStore';

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  stats: UserStats | null;

  // Actions
  login: (token: string, user: UserProfile) => void;
  register: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  checkAuth: () => Promise<boolean>;
  setStats: (stats: UserStats) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: typeof window !== 'undefined' ? localStorage.getItem('noteeye_auth_token') : null,
        isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('noteeye_auth_token')),
        isLoading: false,
        stats: null,

        login: (token: string, user: UserProfile) => {
          localStorage.setItem('noteeye_auth_token', token);
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          try {
            window.dispatchEvent(new CustomEvent('noteeye:login'));
          } catch {}
        },

        register: (token: string, user: UserProfile) => {
          localStorage.setItem('noteeye_auth_token', token);
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          try {
            window.dispatchEvent(new CustomEvent('noteeye:login'));
          } catch {}
        },

        logout: () => {
          localStorage.removeItem('noteeye_auth_token');
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            stats: null,
          });
          try {
            // Reset user profile to Guest
            window.dispatchEvent(new CustomEvent('noteeye:logout'));
          } catch {
            // Ignore
          }
        },

        updateUser: (updates: Partial<UserProfile>) => {
          const current = get().user;
          if (current) {
            set({ user: { ...current, ...updates } });
          }
        },

        setStats: (stats: UserStats) => {
          set({ stats });
        },

        checkAuth: async () => {
          const token = localStorage.getItem('noteeye_auth_token');
          if (!token) {
            set({ isAuthenticated: false, user: null });
            return false;
          }

          try {
            set({ isLoading: true });
            const data = await authApi.getMe();
            if (data?.user) {
              set({
                user: data.user,
                stats: data.stats || null,
                isAuthenticated: true,
                isLoading: false,
              });
              return true;
            }
            return false;
          } catch (err) {
            console.warn('[AuthStore] checkAuth failed:', err);
            localStorage.removeItem('noteeye_auth_token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }
        },
      }),
      {
        name: 'noteeye_auth_store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Listen to global 401 unauthorized event
if (typeof window !== 'undefined') {
  window.addEventListener('noteeye:unauthorized', (event: any) => {
    useAuthStore.getState().logout();
    if (event?.detail?.isRevoked) {
      useUIStore.getState().showToast('This session was signed out from another device.');
    }
  });
}
