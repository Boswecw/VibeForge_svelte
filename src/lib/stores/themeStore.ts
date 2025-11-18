import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'vibeforge-theme';
const DEFAULT_THEME: Theme = 'dark';

/**
 * Creates the theme store with localStorage persistence
 */
function createThemeStore() {
	// Initialize from localStorage if available, otherwise use default
	const storedTheme = browser ? (localStorage.getItem(STORAGE_KEY) as Theme) : null;
	const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : DEFAULT_THEME;

	const { subscribe, set, update } = writable<Theme>(initialTheme);

	return {
		subscribe,
		/**
		 * Toggle between dark and light themes
		 */
		toggle: () => {
			update((current) => {
				const newTheme: Theme = current === 'dark' ? 'light' : 'dark';
				if (browser) {
					localStorage.setItem(STORAGE_KEY, newTheme);
					// Apply theme class to document root for global theming
					document.documentElement.setAttribute('data-theme', newTheme);
				}
				return newTheme;
			});
		},
		/**
		 * Set a specific theme
		 */
		setTheme: (theme: Theme) => {
			set(theme);
			if (browser) {
				localStorage.setItem(STORAGE_KEY, theme);
				document.documentElement.setAttribute('data-theme', theme);
			}
		}
	};
}

export const theme = createThemeStore();

// Apply theme to document root on initial load
if (browser) {
	const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme;
	const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : DEFAULT_THEME;
	document.documentElement.setAttribute('data-theme', initialTheme);
}
