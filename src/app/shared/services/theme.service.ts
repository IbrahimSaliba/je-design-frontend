import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { ThemeConfig, ThemeMode, generateThemeConfig, THEME_IDS } from '../config/theme-colors';
import { config } from 'config';

/**
 * Service responsible for managing application themes
 * Uses theme configurations from ../config/theme-colors.ts
 * All color values are defined in CSS in src/assets/styles/scss/_color-tokens.scss
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private documentElement: HTMLElement;
  private bodyElement: HTMLElement;

  // Initialize themes from the central configuration
  private themeConfig = generateThemeConfig();
  
  // Available themes can be expanded by the app
  private availableThemes: ThemeConfig[] = Object.values(this.themeConfig);
  
  // Theme state
  private activeThemeSubject = new BehaviorSubject<ThemeConfig>(this.themeConfig[THEME_IDS.NAVY_LIGHT]);
  
  constructor(
    @Inject(DOCUMENT) private document: Document,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.documentElement = document.documentElement;
    this.bodyElement = document.body;
  }
  
  /**
   * Get all available themes
   */
  getAvailableThemes(): ThemeConfig[] {
    return [...this.availableThemes];
  }
  
  /**
   * Get current active theme
   */
  getActiveTheme(): ThemeConfig {
    return this.activeThemeSubject.value;
  }
  
  /**
   * Get active theme as observable
   */
  activeTheme$(): Observable<ThemeConfig> {
    return this.activeThemeSubject.asObservable();
  }
  
  /**
   * Add a new theme to available themes
   */
  addTheme(theme: ThemeConfig): void {
    // Replace existing theme with same ID or add new one
    const existingIndex = this.availableThemes.findIndex(t => t.id === theme.id);
    if (existingIndex >= 0) {
      this.availableThemes[existingIndex] = theme;
    } else {
      this.availableThemes.push(theme);
    }
  }
  
  /**
   * Set active theme by ID
   */
  setActiveThemeById(themeId: string): boolean {
    const theme = this.availableThemes.find(t => t.id === themeId);
    if (theme) {
      this.setActiveTheme(theme);
      return true;
    }
    return false;
  }
  
  /**
   * Set active theme and apply it
   */
  private setActiveTheme(theme: ThemeConfig): void {
    // Remove all existing theme classes
    this.availableThemes.forEach(t => {
      this.renderer.removeClass(this.documentElement, t.id);
    });
    
    // Add active theme class
    this.renderer.addClass(this.documentElement, theme.id);
    
    // Add/remove dark theme class
    if (theme.mode === 'dark') {
      this.renderer.addClass(this.documentElement, 'egret-navy-dark');
      this.renderer.addClass(this.bodyElement, 'egret-navy-dark');
    } else {
      this.renderer.removeClass(this.documentElement, 'egret-navy-dark');
      this.renderer.removeClass(this.bodyElement, 'egret-navy-dark');
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(config.themeLocalStorageKey, theme.id);
    } catch (e) {
      console.warn('Error saving theme to localStorage:', e);
    }
    
    // Update the subject
    this.activeThemeSubject.next(theme);
  }
  
  /**
   * Create a custom theme
   */
  addCustomTheme(name: string, mode: ThemeMode = 'light'): ThemeConfig {
    // Generate a unique ID
    const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${mode}`;
    
    // Create the theme object
    const customTheme: ThemeConfig = {
      id,
      name,
      mode
    };
    
    // Add to available themes
    this.addTheme(customTheme);
    
    // Return the new theme
    return customTheme;
  }
  
  /**
   * Create a dark variant of a theme
   */
  createDarkVariant(theme: ThemeConfig): ThemeConfig {
    if (theme.mode === 'dark') {
      return theme; // Already a dark theme
    }
    
    // Create dark variant
    const darkVariant: ThemeConfig = {
      id: `${theme.id}-dark`,
      name: `${theme.name} Dark`,
      mode: 'dark'
    };
    
    // Add to available themes
    this.addTheme(darkVariant);
    
    return darkVariant;
  }
  
  /**
   * Set dark mode directly
   */
  setDarkMode(isDark: boolean): void {
    if (isDark) {
      this.renderer.addClass(this.documentElement, 'egret-navy-dark');  
      this.renderer.addClass(this.bodyElement, 'egret-navy-dark');
    } else {
      this.renderer.removeClass(this.documentElement, 'egret-navy-dark');
      this.renderer.removeClass(this.bodyElement, 'egret-navy-dark');
    }
  }
}
