// Theme management supporting Light, Dark, and System Default
export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'braincache_theme_mode';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

export function applyTheme(mode: ThemeMode): boolean {
  if (typeof window === 'undefined') return false;

  const root = document.documentElement;
  let isDark = false;

  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'light') {
    isDark = false;
  } else {
    // System default
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (e) {
    console.error('Failed to save theme in localStorage', e);
  }

  return isDark;
}
