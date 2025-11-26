/**
 * User Preferences Types
 *
 * Defines user preference settings for the workbench
 */

export interface UserPreferences {
  /**
   * Skip the full wizard and go directly to Quick Create when pressing Cmd+N
   * Default: false
   */
  skipWizard: boolean;

  /**
   * Theme preference
   */
  theme?: 'light' | 'dark' | 'system';

  /**
   * Show keyboard shortcut hints
   */
  showKeyboardHints?: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  skipWizard: false,
  theme: 'system',
  showKeyboardHints: true,
};
