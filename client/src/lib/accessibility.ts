/**
 * Accessibility utilities for the Scrapiz app
 * Includes color contrast calculation and validation
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 * WCAG 2.1 requirements:
 * - Normal text: 4.5:1 minimum (AA), 7:1 enhanced (AAA)
 * - Large text (18pt+): 3:1 minimum (AA), 4.5:1 enhanced (AAA)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format for contrast calculation');
    return 0;
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio - Contrast ratio to check
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 */
export function meetsWCAG_AA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 * @param ratio - Contrast ratio to check
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 */
export function meetsWCAG_AAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Validate color contrast for tutorial overlay
 * Returns validation results for all text elements
 */
export interface ContrastValidation {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  isLargeText: boolean;
}

export function validateTutorialContrast(
  cardBackground: string,
  textColor: string,
  textSecondary: string,
  primaryColor: string,
  buttonTextColor: string = '#ffffff'
): ContrastValidation[] {
  return [
    {
      element: 'Title text',
      foreground: textColor,
      background: cardBackground,
      ratio: getContrastRatio(textColor, cardBackground),
      meetsAA: meetsWCAG_AA(getContrastRatio(textColor, cardBackground), true),
      meetsAAA: meetsWCAG_AAA(getContrastRatio(textColor, cardBackground), true),
      isLargeText: true, // 20px is considered large text
    },
    {
      element: 'Description text',
      foreground: textSecondary,
      background: cardBackground,
      ratio: getContrastRatio(textSecondary, cardBackground),
      meetsAA: meetsWCAG_AA(getContrastRatio(textSecondary, cardBackground), false),
      meetsAAA: meetsWCAG_AAA(getContrastRatio(textSecondary, cardBackground), false),
      isLargeText: false, // 15px is normal text
    },
    {
      element: 'Step indicator',
      foreground: primaryColor,
      background: cardBackground,
      ratio: getContrastRatio(primaryColor, cardBackground),
      meetsAA: meetsWCAG_AA(getContrastRatio(primaryColor, cardBackground), false),
      meetsAAA: meetsWCAG_AAA(getContrastRatio(primaryColor, cardBackground), false),
      isLargeText: false, // 14px is normal text
    },
    {
      element: 'Skip button text',
      foreground: textSecondary,
      background: cardBackground,
      ratio: getContrastRatio(textSecondary, cardBackground),
      meetsAA: meetsWCAG_AA(getContrastRatio(textSecondary, cardBackground), false),
      meetsAAA: meetsWCAG_AAA(getContrastRatio(textSecondary, cardBackground), false),
      isLargeText: false, // 15px is normal text
    },
    {
      element: 'Next button text',
      foreground: buttonTextColor,
      background: primaryColor,
      ratio: getContrastRatio(buttonTextColor, primaryColor),
      meetsAA: meetsWCAG_AA(getContrastRatio(buttonTextColor, primaryColor), false),
      meetsAAA: meetsWCAG_AAA(getContrastRatio(buttonTextColor, primaryColor), false),
      isLargeText: false, // 15px is normal text
    },
  ];
}

/**
 * Log contrast validation results to console
 */
export function logContrastValidation(validations: ContrastValidation[]): void {
  console.log('=== Tutorial Overlay Contrast Validation ===');
  validations.forEach(v => {
    const status = v.meetsAA ? '✓' : '✗';
    console.log(
      `${status} ${v.element}: ${v.ratio.toFixed(2)}:1 (AA: ${v.meetsAA ? 'Pass' : 'Fail'}, AAA: ${v.meetsAAA ? 'Pass' : 'Fail'})`
    );
  });
  console.log('==========================================');
}

/**
 * Minimum touch target size for accessibility (in points)
 * Based on WCAG 2.1 Success Criterion 2.5.5 (AAA)
 * and iOS/Android guidelines
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Validate that a component meets minimum touch target size
 */
export function validateTouchTargetSize(
  width: number,
  height: number,
  componentName: string = 'Component'
): boolean {
  const meetsRequirement = width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
  
  if (!meetsRequirement) {
    console.warn(
      `${componentName} does not meet minimum touch target size. ` +
      `Current: ${width}x${height}, Required: ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}`
    );
  }
  
  return meetsRequirement;
}
