import { ref, computed, watch, onMounted } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'app-theme';

export function useTheme() {
  const theme = ref<Theme>('auto');
  const systemPrefersDark = ref(false);

  // Computed property for the actual theme being used
  const currentTheme = computed(() => {
    if (theme.value === 'auto') {
      return systemPrefersDark.value ? 'dark' : 'light';
    }
    return theme.value;
  });

  // Check system preference
  const checkSystemPreference = () => {
    if (typeof window !== 'undefined') {
      systemPrefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  };

  // Apply theme to document
  const applyTheme = (themeValue: Theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeValue);
    }
  };

  // Set theme
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  // Toggle between light and dark (skips auto)
  const toggleTheme = () => {
    if (theme.value === 'light') {
      setTheme('dark');
    } else if (theme.value === 'dark') {
      setTheme('light');
    } else {
      // If auto, switch to opposite of current system preference
      setTheme(systemPrefersDark.value ? 'light' : 'dark');
    }
  };

  // Initialize theme
  const initializeTheme = () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme;
    }

    // Check system preference
    checkSystemPreference();

    // Apply initial theme
    applyTheme(theme.value);

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        systemPrefersDark.value = e.matches;
      });
    }
  };

  // Watch for theme changes
  watch(
    [theme, systemPrefersDark],
    () => {
      applyTheme(theme.value);
    },
    { immediate: true }
  );

  // Initialize on mount
  onMounted(() => {
    initializeTheme();
  });

  return {
    theme: computed(() => theme.value),
    currentTheme,
    systemPrefersDark: computed(() => systemPrefersDark.value),
    setTheme,
    toggleTheme,
    initializeTheme,
  };
}