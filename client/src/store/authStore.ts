import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '../types';
import { authApi, type UserStats, type AuthResponse } from '../api';
import { useUIStore } from './uiStore';
import { handleSessionEndRedirect } from '../utils/sessionNavigation';

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  stats: UserStats | null;

  // Actions
  login: (token: string, user: UserProfile) => void;
  register: (token: string, user: UserProfile) => void;
  loginWithGoogle: (credential: string) => Promise<AuthResponse>;
  logout: (callServer?: boolean) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  checkAuth: () => Promise<boolean>;
  setStats: (stats: UserStats) => void;
}

const hasInitialToken =
  typeof window !== 'undefined' && Boolean(localStorage.getItem('noteeye_auth_token'));

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: typeof window !== 'undefined' ? localStorage.getItem('noteeye_auth_token') : null,
        isAuthenticated: hasInitialToken,
        isLoading: false,
        isCheckingAuth: hasInitialToken,
        stats: null,

        login: (token: string, user: UserProfile) => {
          localStorage.setItem('noteeye_auth_token', token);
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
            isCheckingAuth: false,
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
            isCheckingAuth: false,
          });
          try {
            window.dispatchEvent(new CustomEvent('noteeye:login'));
          } catch {}
        },

        loginWithGoogle: async (credential: string) => {
          set({ isLoading: true });
          try {
            const data = await authApi.loginWithGoogle(credential);
            localStorage.setItem('noteeye_auth_token', data.token);
            set({
              token: data.token,
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              isCheckingAuth: false,
            });
            try {
              window.dispatchEvent(new CustomEvent('noteeye:login'));
            } catch {}
            return data;
          } catch (err) {
            set({ isLoading: false });
            throw err;
          }
        },

        logout: (callServer = true) => {
          if (callServer) {
            authApi.logout().catch(() => {});
          }
          localStorage.removeItem('noteeye_auth_token');
          try {
            localStorage.removeItem('noteeye-drive-storage');
          } catch {}

          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isCheckingAuth: false,
            stats: null,
          });
          try {
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
            localStorage.removeItem('noteeye-drive-storage');
            set({ isAuthenticated: false, user: null, isCheckingAuth: false });
            return false;
          }

          try {
            set({ isLoading: true, isCheckingAuth: true });
            const data = await authApi.getMe();
            if (data?.user) {
              set({
                user: data.user,
                stats: data.stats || null,
                isAuthenticated: true,
                isLoading: false,
                isCheckingAuth: false,
              });
              return true;
            }
            throw new Error('No user data returned');
          } catch (err) {
            console.warn('[AuthStore] checkAuth failed:', err);
            localStorage.removeItem('noteeye_auth_token');
            try {
              localStorage.removeItem('noteeye-drive-storage');
            } catch {}

            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              isCheckingAuth: false,
            });
            try {
              window.dispatchEvent(new CustomEvent('noteeye:logout'));
            } catch {}
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
    useAuthStore.getState().logout(false);
    try {
      localStorage.removeItem('noteeye-drive-storage');
    } catch {}

    const isRevoked = Boolean(event?.detail?.isRevoked);
    const reason = isRevoked ? 'revoked' : 'unauthorized';

    if (isRevoked) {
      useUIStore.getState().showToast('This session was signed out from another device.');
    } else {
      useUIStore.getState().showToast('Session expired or access unauthorized. Please sign in.');
    }

    // Force redirection: in PWA -> /login, in web app -> https://noteeye.vercel.app
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      handleSessionEndRedirect(reason);
    }
  });
}
