import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'noteeye-theme';

// Helper to determine if system prefers dark
const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Apply or remove .dark class on <html> element
const applyThemeToDOM = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
};

// Initial read
const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
};

const initialTheme = getInitialTheme();
const initialIsDark = initialTheme === 'system' ? getSystemPrefersDark() : initialTheme === 'dark';
applyThemeToDOM(initialIsDark);

export const useThemeStore = create<ThemeState>((set, get) => {
  // Listen for system changes if mode is 'system'
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (get().theme === 'system') {
        const dark = e.matches;
        applyThemeToDOM(dark);
        set({ isDark: dark });
      }
    });
  }

  return {
    theme: initialTheme,
    isDark: initialIsDark,
    setTheme: (newTheme: ThemeMode) => {
      localStorage.setItem(STORAGE_KEY, newTheme);
      const isDark = newTheme === 'system' ? getSystemPrefersDark() : newTheme === 'dark';
      applyThemeToDOM(isDark);
      set({ theme: newTheme, isDark });
    },
    toggleTheme: () => {
      const current = get().isDark;
      const next: ThemeMode = current ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});
