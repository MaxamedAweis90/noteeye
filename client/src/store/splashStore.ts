import { create } from 'zustand';

export type SplashMode = 'login' | 'logout' | 'initial';

export interface SplashState {
  isActive: boolean;
  mode: SplashMode | null;
  title: string;
  stepMessage: string;
  progress: number; // 0 to 100
  isInitialBootDone: boolean;

  // Actions
  triggerLoginSplash: (userName: string, onComplete?: () => void) => void;
  triggerLogoutSplash: (onComplete?: () => void) => void;
  setSplashProgress: (progress: number, stepMessage?: string) => void;
  markInitialBootDone: () => void;
  closeSplash: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  isActive: false,
  mode: null,
  title: '',
  stepMessage: '',
  progress: 0,
  isInitialBootDone: false,

  triggerLoginSplash: (userName: string, onComplete?: () => void) => {
    const formattedName = (userName || 'User').trim();
    set({
      isActive: true,
      mode: 'login',
      title: `Welcome back, ${formattedName}`,
      stepMessage: 'Verifying session token & authentication...',
      progress: 20,
    });

    const t1 = setTimeout(() => {
      set({
        stepMessage: `Loading account settings & profile for ${formattedName}...`,
        progress: 50,
      });
    }, 380);

    const t2 = setTimeout(() => {
      set({
        stepMessage: 'Synchronizing cloud notes, checklists & folders...',
        progress: 80,
      });
    }, 760);

    const t3 = setTimeout(() => {
      set({
        stepMessage: 'Workspace ready. Entering Noteeye...',
        progress: 100,
      });
    }, 1120);

    const t4 = setTimeout(() => {
      set({ isActive: false, mode: null, progress: 0 });
      if (onComplete) onComplete();
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  },

  triggerLogoutSplash: (onComplete?: () => void) => {
    set({
      isActive: true,
      mode: 'logout',
      title: 'Signing out of Noteeye',
      stepMessage: 'Securing active session & clearing credentials...',
      progress: 25,
    });

    const t1 = setTimeout(() => {
      set({
        stepMessage: 'Purging cloud cache & restoring local workspace...',
        progress: 65,
      });
    }, 360);

    const t2 = setTimeout(() => {
      set({
        stepMessage: 'Session ended safely. Returning to guest view...',
        progress: 100,
      });
    }, 740);

    const t3 = setTimeout(() => {
      set({ isActive: false, mode: null, progress: 0 });
      if (onComplete) onComplete();
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  },

  setSplashProgress: (progress: number, stepMessage?: string) => {
    set({
      progress,
      ...(stepMessage !== undefined ? { stepMessage } : {}),
    });
  },

  markInitialBootDone: () => {
    set({ isInitialBootDone: true });
  },

  closeSplash: () => {
    set({ isActive: false, mode: null, progress: 0 });
  },
}));
