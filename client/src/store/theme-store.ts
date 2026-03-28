import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'freelanceflow-theme';

function applyTheme(theme: Theme) {
  document.documentElement.classList.add('transition-colors', 'duration-300');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'light';
    const parsed = JSON.parse(raw) as { state?: { theme?: Theme } };
    const theme = parsed?.state?.theme;
    return theme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getStoredTheme(),
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          applyTheme(next);
          return { theme: next };
        }),
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Apply saved theme on load so no flash (persist rehydrates async)
const saved = getStoredTheme();
applyTheme(saved);
