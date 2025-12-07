
// Theme mode (light or dark)
export type ThemeMode = 'light' | 'dark';

// Theme configuration interface
export interface ThemeConfig {
  id: string;      // Theme ID used for CSS classes 
  name: string;    // Display name
  mode: ThemeMode; // Light or dark mode
}

// Theme IDs used for referencing themes
export const THEME_IDS = {
  NAVY_LIGHT: 'egret-navy',
  NAVY_DARK: 'egret-navy-dark',
  // GREEN_LIGHT: 'egret-green',
  // GREEN_DARK: 'egret-green-dark',
  // INDIGO_PINK_LIGHT: 'indigo-pink',
  // INDIGO_PINK_DARK: 'indigo-pink-dark'
} as const;

/**
 * Generate the theme configuration
 * No color values are defined here - all colors are defined in SCSS
 */
export function generateThemeConfig(): Record<string, ThemeConfig> {
  return {
    [THEME_IDS.NAVY_LIGHT]: {
      id: THEME_IDS.NAVY_LIGHT,
      name: 'Default Light',
      mode: 'light'
    },
    [THEME_IDS.NAVY_DARK]: {
      id: THEME_IDS.NAVY_DARK,
      name: 'Default Dark',
      mode: 'dark'
    },
    // [THEME_IDS.GREEN_LIGHT]: {
    //   id: THEME_IDS.GREEN_LIGHT,
    //   name: 'Green Light',
    //   mode: 'light'
    // },
    // [THEME_IDS.GREEN_DARK]: {
    //   id: THEME_IDS.GREEN_DARK,
    //   name: 'Green Dark',
    //   mode: 'dark'
    // },
    // [THEME_IDS.INDIGO_PINK_LIGHT]: {
    //   id: THEME_IDS.INDIGO_PINK_LIGHT,
    //   name: 'Indigo Pink',
    //   mode: 'light'
    // },
    // [THEME_IDS.INDIGO_PINK_DARK]: {
    //   id: THEME_IDS.INDIGO_PINK_DARK,
    //   name: 'Indigo Pink Dark',
    //   mode: 'dark'
    // }
  };
} 