import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 * Uses ThemeContext which supports both system and manual theme overrides.
 */
export function useColors() {
  const { colorScheme } = useTheme();
  const palette = colorScheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius, isDark: colorScheme === "dark" };
}
