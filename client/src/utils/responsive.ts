/**
 * Responsive Utility System
 * Ensures consistent UI across all Android & iOS devices
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro as reference - most common size)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// ============= Device Size Detection =============

export enum DeviceSize {
  SMALL = 'small',    // < 360px (Budget phones)
  MEDIUM = 'medium',  // 360-414px (Most phones)
  LARGE = 'large',    // 414-480px (Flagship phones)
  XLARGE = 'xlarge',  // 480-600px (Phablets)
  TABLET = 'tablet',  // 600px+ (Tablets)
}

export const getDeviceSize = (): DeviceSize => {
  if (SCREEN_WIDTH < 360) return DeviceSize.SMALL;
  if (SCREEN_WIDTH < 414) return DeviceSize.MEDIUM;
  if (SCREEN_WIDTH < 480) return DeviceSize.LARGE;
  if (SCREEN_WIDTH < 600) return DeviceSize.XLARGE;
  return DeviceSize.TABLET;
};

export const isSmallDevice = (): boolean => getDeviceSize() === DeviceSize.SMALL;
export const isTablet = (): boolean => getDeviceSize() === DeviceSize.TABLET;

// ============= Percentage-based Dimensions =============

/**
 * Width percentage
 * @param percentage - percentage of screen width (0-100)
 * @returns Scaled width
 * @example wp(50) returns 50% of screen width
 */
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH / 100) * percentage;
};

/**
 * Height percentage
 * @param percentage - percentage of screen height (0-100)
 * @returns Scaled height
 * @example hp(20) returns 20% of screen height
 */
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT / 100) * percentage;
};

// ============= Scale-based Dimensions =============

/**
 * Horizontal scale based on screen width
 * @param size - base size in pixels
 * @returns Scaled size proportional to screen width
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Vertical scale based on screen height
 * @param size - base size in pixels
 * @returns Scaled size proportional to screen height
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Moderate scale - balances between scale and fixed size
 * @param size - base size
 * @param factor - scaling factor (0-1), default 0.5
 * @returns Moderately scaled size (prevents extreme scaling)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// ============= Font Scaling =============

/**
 * Responsive font size with pixel ratio consideration
 * @param size - base font size
 * @returns Scaled font size that's crisp on all densities
 */
export const fs = (size: number): number => {
  const newSize = moderateScale(size, 0.25); // Less aggressive scaling for fonts
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// ============= Spacing System =============

/**
 * Responsive spacing (margin, padding)
 * @param size - base spacing value
 * @returns Scaled spacing that maintains visual balance
 */
export const spacing = (size: number): number => {
  return moderateScale(size, 0.3);
};

// ============= Responsive Values =============

/**
 * Return different values based on device size
 * @param values - object with device-specific values
 * @returns Value for current device size
 * @example 
 * responsiveValue({
 *   small: 12,
 *   medium: 14,
 *   large: 16,
 *   tablet: 20,
 *   default: 14
 * })
 */
export const responsiveValue = <T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
  tablet?: T;
  default: T;
}): T => {
  const size = getDeviceSize();
  return values[size] ?? values.default;
};

// ============= Touch Targets =============

/**
 * Minimum touch target size (iOS: 44px, Android: 48px)
 */
export const MIN_TOUCH_SIZE = Platform.select({
  ios: 44,
  android: 48,
}) as number;

/**
 * Ensures minimum touch target size
 * @param size - desired size
 * @returns Size that meets minimum touch target guidelines
 */
export const touchableSize = (size: number): number => {
  return Math.max(size, MIN_TOUCH_SIZE);
};

// ============= Screen Info =============

export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
};

// ============= Typography System =============

export const typography = {
  h1: {
    fontSize: responsiveValue({
      small: fs(24),
      medium: fs(28),
      large: fs(32),
      tablet: fs(40),
      default: fs(28),
    }),
    lineHeight: responsiveValue({
      small: fs(32),
      medium: fs(36),
      large: fs(40),
      tablet: fs(52),
      default: fs(36),
    }),
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: responsiveValue({
      small: fs(20),
      medium: fs(22),
      large: fs(24),
      tablet: fs(32),
      default: fs(22),
    }),
    lineHeight: responsiveValue({
      small: fs(26),
      medium: fs(28),
      large: fs(32),
      tablet: fs(42),
      default: fs(28),
    }),
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: responsiveValue({
      small: fs(18),
      medium: fs(20),
      large: fs(22),
      tablet: fs(28),
      default: fs(20),
    }),
    lineHeight: responsiveValue({
      small: fs(24),
      medium: fs(26),
      large: fs(28),
      tablet: fs(36),
      default: fs(26),
    }),
    fontWeight: '600' as const,
  },
  body: {
    fontSize: responsiveValue({
      small: fs(14),
      medium: fs(15),
      large: fs(16),
      tablet: fs(18),
      default: fs(15),
    }),
    lineHeight: responsiveValue({
      small: fs(20),
      medium: fs(22),
      large: fs(24),
      tablet: fs(28),
      default: fs(22),
    }),
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: responsiveValue({
      small: fs(12),
      medium: fs(13),
      large: fs(14),
      tablet: fs(16),
      default: fs(13),
    }),
    lineHeight: responsiveValue({
      small: fs(16),
      medium: fs(18),
      large: fs(20),
      tablet: fs(24),
      default: fs(18),
    }),
    fontWeight: '400' as const,
  },
};

// ============= Debug Helper =============

/**
 * Get detailed device information for debugging
 * @returns Object with device dimensions and capabilities
 */
export const getDeviceInfo = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    deviceSize: getDeviceSize(),
    scale: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale(),
    platform: Platform.OS,
    isSmall: isSmallDevice(),
    isTablet: isTablet(),
  };
};
