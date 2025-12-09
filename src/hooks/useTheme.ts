import { useColorScheme } from 'nativewind';
import { getColors, getGradients, getShadows } from '../../themeconfig';

/**
 * Custom hook for theme access throughout the app
 * Provides consistent access to color scheme and theme-aware colors/gradients
 * 
 * This hook ensures all components use NativeWind's useColorScheme, which respects
 * manual theme overrides set by the user in Settings.
 * 
 * @returns Theme utilities including colors, gradients, and color scheme controls
 * 
 * @example
 * ```tsx
 * const { colors, isDark, setColorScheme } = useTheme();
 * 
 * // Use colors in StyleSheet
 * backgroundColor: colors.surface
 * 
 * // Use gradients
 * const { gradients } = useTheme();
 * ```
 */
export function useTheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const gradients = getGradients(isDark);
  const shadows = getShadows(isDark);

  return {
    colorScheme,
    isDark,
    colors,
    gradients,
    shadows,
    setColorScheme,
    toggleColorScheme,
  };
}

