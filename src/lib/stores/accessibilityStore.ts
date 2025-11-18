import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type FontSize = 'small' | 'medium' | 'large' | 'x-large';

interface AccessibilityState {
	fontSize: FontSize;
}

const DEFAULT_STATE: AccessibilityState = {
	fontSize: 'medium'
};

function createAccessibilityStore() {
	// Load from localStorage if available
	const stored = browser ? localStorage.getItem('forge-accessibility') : null;
	const initial = stored ? JSON.parse(stored) : DEFAULT_STATE;

	const { subscribe, set, update } = writable<AccessibilityState>(initial);

	return {
		subscribe,
		setFontSize: (size: FontSize) => {
			update((state) => {
				const newState = { ...state, fontSize: size };
				if (browser) {
					localStorage.setItem('forge-accessibility', JSON.stringify(newState));
					// Apply to document root
					applyFontSize(size);
				}
				return newState;
			});
		},
		reset: () => {
			set(DEFAULT_STATE);
			if (browser) {
				localStorage.removeItem('forge-accessibility');
				applyFontSize(DEFAULT_STATE.fontSize);
			}
		}
	};
}

function applyFontSize(size: FontSize) {
	if (!browser) return;

	const root = document.documentElement;
	const sizeMap: Record<FontSize, string> = {
		small: '14px',
		medium: '16px',
		large: '18px',
		'x-large': '20px'
	};

	root.style.fontSize = sizeMap[size];
}

export const accessibility = createAccessibilityStore();

// Apply font size on initial load
if (browser) {
	const stored = localStorage.getItem('forge-accessibility');
	if (stored) {
		const state = JSON.parse(stored);
		applyFontSize(state.fontSize);
	}
}
