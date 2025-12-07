/**
 * Represents a theme in the application
 */
export interface AppTheme {
  /**
   * Unique identifier for the theme
   */
  id: string;
  
  /**
   * Display name of the theme
   */
  name: string;
  
  /**
   * Theme mode - 'light' or 'dark'
   */
  mode: 'light' | 'dark';
  
  /**
   * Primary color in hex format
   */
  primaryColor: string;
  
  /**
   * Accent color in hex format
   */
  accentColor: string;
  
  /**
   * Warning color in hex format
   */
  warnColor: string;
} 