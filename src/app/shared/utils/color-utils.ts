/**
 * Color utility functions for theme generation
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert a hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  return '#' + 
    ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b)
      .toString(16)
      .slice(1);
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  // Convert RGB to percentages
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Initial HSL values
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  // Calculate saturation and hue if not grayscale
  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / (max - min) + 2;
        break;
      case b:
        h = (r - g) / (max - min) + 4;
        break;
    }
    
    h = h * 60;
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h;
  const s = hsl.s;
  const l = hsl.l;

  // No saturation means grayscale
  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  // Helper functions
  const hueToRgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = hueToRgb(p, q, (h / 360) + 1/3);
  const g = hueToRgb(p, q, h / 360);
  const b = hueToRgb(p, q, (h / 360) - 1/3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Generate a color palette from a base color
 * Returns an object with 10 colors, from 50 to 900
 */
export function generateColorPalette(baseColor: string): Record<string, string> {
  // Convert base color to HSL
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);

  // Create palette with different lightness values
  const palette: Record<string, string> = {};
  
  // Generate lighter shades (50-400)
  const lightShades = [
    { name: '50', lightness: 0.95 },
    { name: '100', lightness: 0.90 },
    { name: '200', lightness: 0.80 },
    { name: '300', lightness: 0.70 },
    { name: '400', lightness: 0.60 }
  ];

  // Generate darker shades (600-900)
  const darkShades = [
    { name: '600', lightness: 0.40 },
    { name: '700', lightness: 0.30 },
    { name: '800', lightness: 0.20 },
    { name: '900', lightness: 0.10 }
  ];

  // Set the original color as 500
  palette['500'] = baseColor;
  
  // Generate lighter shades
  lightShades.forEach(shade => {
    const lightHsl = { ...hsl, l: shade.lightness };
    const lightRgb = hslToRgb(lightHsl);
    palette[shade.name] = rgbToHex(lightRgb);
  });
  
  // Generate darker shades
  darkShades.forEach(shade => {
    const darkHsl = { ...hsl, l: shade.lightness };
    const darkRgb = hslToRgb(darkHsl);
    palette[shade.name] = rgbToHex(darkRgb);
  });

  return palette;
}

/**
 * Generate a dark mode variant of a color palette
 */
export function generateDarkVariant(baseColor: string): string {
  // Get the base HSL
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);
  
  // For dark mode, we typically reduce saturation and adjust lightness
  const darkHsl = { 
    h: hsl.h, 
    s: Math.max(hsl.s - 0.1, 0), // Reduce saturation slightly
    l: Math.min(hsl.l + 0.2, 0.8) // Increase lightness for visibility
  };
  
  const darkRgb = hslToRgb(darkHsl);
  return rgbToHex(darkRgb);
}

/**
 * Convert a color to CSS variable RGB format
 */
export function colorToRgbValues(color: string): string {
  const rgb = hexToRgb(color);
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * Generate CSS variables for a theme
 */
export function generateThemeCssVariables(
  primaryColor: string,
  accentColor: string,
  warnColor: string
): Record<string, string> {
  // Generate the palettes
  const primaryPalette = generateColorPalette(primaryColor);
  const accentPalette = generateColorPalette(accentColor);
  const warnPalette = generateColorPalette(warnColor);
  
  // Create CSS variables object
  const cssVars: Record<string, string> = {};
  
  // Add primary variables
  Object.entries(primaryPalette).forEach(([shade, color]) => {
    cssVars[`--primary-${shade}`] = colorToRgbValues(color);
  });
  
  // Add accent variables
  Object.entries(accentPalette).forEach(([shade, color]) => {
    cssVars[`--accent-${shade}`] = colorToRgbValues(color);
  });
  
  // Add warn variables
  Object.entries(warnPalette).forEach(([shade, color]) => {
    cssVars[`--warn-${shade}`] = colorToRgbValues(color);
  });
  
  return cssVars;
} 