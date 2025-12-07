export function getIndexBy(array: Array<{}>, { name, value }): number {
  for (let i = 0; i < array.length; i++) {
    if (array[i][name] === value) {
      return i;
    }
  }
  return -1;
}

function currentYPosition() {
  if (!window) {
    return;
  }
  // Firefox, Chrome, Opera, Safari
  if (window.pageYOffset) return window.pageYOffset;
  // Internet Explorer 6 - standards mode
  if (document.documentElement && document.documentElement.scrollTop)
    return document.documentElement.scrollTop;
  // Internet Explorer 6, 7 and 8
  if (document.body.scrollTop) return document.body.scrollTop;
  return 0;
}

function elmYPosition(elm) {
  var y = elm.offsetTop;
  var node = elm;
  while (node.offsetParent && node.offsetParent !== document.body) {
    node = node.offsetParent;
    y += node.offsetTop;
  }
  return y;
}

export function scrollTo(selector) {
  var elm = document.querySelector(selector);
  if (!selector || !elm) {
    return;
  }
  var startY = currentYPosition();
  var stopY = elmYPosition(elm);
  var distance = stopY > startY ? stopY - startY : startY - stopY;
  if (distance < 100) {
    window.scrollTo(0, stopY);
    return;
  }
  var speed = Math.round(distance / 50);
  if (speed >= 20) speed = 20;
  var step = Math.round(distance / 25);
  var leapY = stopY > startY ? startY + step : startY - step;
  var timer = 0;
  if (stopY > startY) {
    for (var i = startY; i < stopY; i += step) {
      setTimeout(
        (function(leapY) {
          return () => {
            window.scrollTo(0, leapY);
          };
        })(leapY),
        timer * speed
      );
      leapY += step;
      if (leapY > stopY) leapY = stopY;
      timer++;
    }
    return;
  }
  for (let i = startY; i > stopY; i -= step) {
    setTimeout(
      (function(leapY) {
        return () => {
          window.scrollTo(0, leapY);
        };
      })(leapY),
      timer * speed
    );
    leapY -= step;
    if (leapY < stopY) leapY = stopY;
    timer++;
  }
  return false;
}

/**
 * Gets a CSS variable value from the :root element
 * 
 * @param variableName The CSS variable name (without the -- prefix)
 * @param defaultValue Optional default value to return if the variable is not found
 * @param element Optional element to get the variable from (defaults to :root)
 * @returns The CSS variable value as a string
 * 
 * @example
 * // Get primary color RGB values
 * const primaryRgb = getCssVariable('primary-500');
 * // Returns "0, 129, 255"
 * 
 * // Use as RGB
 * element.style.backgroundColor = `rgba(${getCssVariable('primary-500')}, 0.5)`;
 * 
 * // Get with default
 * const accent = getCssVariable('accent-300', '255, 136, 72');
 */
export function getCssVariable(
  variableName: string, 
  defaultValue: string = '', 
  element: HTMLElement | null = null
): string {
  // If the window object doesn't exist (e.g., during SSR), return the default
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  // Get the element to read the CSS variable from
  const targetElement = element || document.documentElement;
  
  // Ensure variableName starts with --
  const cssVarName = variableName.startsWith('--') ? variableName : `--${variableName}`;
  
  // Get the CSS variable value using getComputedStyle
  let value = getComputedStyle(targetElement).getPropertyValue(cssVarName).trim();
  value = value || getComputedStyle(document.body).getPropertyValue(cssVarName).trim();
  // console.log(variableName, value);
  // Return the value or default if empty
  return value || defaultValue;
}

/**
 * Creates an RGB color string from CSS variable
 * 
 * @param variableName The CSS variable name (without the -- prefix)
 * @param opacity Optional opacity value (0-1)
 * @returns A CSS color value (rgb or rgba)
 * 
 * @example
 * // Get rgb color
 * const primaryColor = getRgbColorFromCssVariable('primary-500');
 * // Returns "rgb(0, 129, 255)"
 * 
 * // Get rgba color with opacity
 * const primaryWithOpacity = getRgbColorFromCssVariable('primary-500', 0.5);
 * // Returns "rgba(0, 129, 255, 0.5)"
 */
export function getRgbColorFromCssVariable(
  variableName: string,
  opacity?: number
): string {
  const rgbValues = getCssVariable(variableName);
  
  if (!rgbValues) {
    console.warn(`CSS variable --${variableName} not found or empty`);
    return '';
  }
  
  return typeof opacity === 'number' 
    ? `rgba(${rgbValues}, ${opacity})` 
    : `rgb(${rgbValues})`;
}

/**
 * Get an object with all CSS variables matching a prefix
 * 
 * @param prefix The prefix to match CSS variables (without the -- prefix)
 * @returns An object with all matching CSS variables
 * 
 * @example
 * // Get all primary color variants
 * const primaryColors = getCssVariablesByPrefix('primary');
 * // Returns { "primary-50": "236, 245, 255", "primary-100": "217, 236, 255", ... }
 */
export function getCssVariablesByPrefix(prefix: string): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const result: Record<string, string> = {};
  const styles = getComputedStyle(document.documentElement);
  const cssVars = Array.from(styles).filter(prop => 
    prop.startsWith('--') && prop.includes(prefix)
  );
  
  cssVars.forEach(prop => {
    // Remove the -- prefix for the property name
    const name = prop.substring(2);
    result[name] = styles.getPropertyValue(prop).trim();
  });
  
  return result;
}



