import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_PREFERENCE_KEY = '@minmo/theme_preference';

export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Save the user's theme preference to persistent storage
 * @param theme - 'light', 'dark', or 'system' (null)
 */
export async function saveThemePreference(theme: 'light' | 'dark' | null): Promise<void> {
  try {
    const value = theme || 'system';
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, value);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
}

/**
 * Load the user's saved theme preference from persistent storage
 * @returns 'light', 'dark', or null for system default
 */
export async function loadThemePreference(): Promise<'light' | 'dark' | null> {
  try {
    const saved = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
    if (!saved || saved === 'system') {
      return null; // System default
    }
    return saved as 'light' | 'dark';
  } catch (error) {
    console.error('Failed to load theme preference:', error);
    return null; // Default to system on error
  }
}



