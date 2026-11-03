/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * CashTrack brand palette, re-sampled pixel by pixel from the current app icon
 * (assets/images/icon.png), the blue wallet mark.
 *
 * Every accent in the app resolves through here so screens never hardcode a
 * brand colour and the identity stays consistent if the logo is ever revised.
 *
 * Contrast against white text was measured for each fill; all pass WCAG AA
 * (4.5:1). The icon's lighter top-left blue (#006DFD) was deliberately NOT used
 * for `primary`: it only reaches 4.56:1 against white, too close to the limit
 * for body-size text on the tinted buttons and chips that use `accent`.
 */
export const Brand = {
  /** Icon field at mid-left: the saturated blue that carries the identity. 5.95:1 on white. */
  primary: '#0152F5',
  /** Bright cyan from the icon's top-right disc, used for gradients only. */
  bright: '#14E7FD',
  /** Deep blue from the icon's lower-left field, used behind white hero text. 13.45:1. */
  deep: '#00109D',
  /** Alias of `primary`, safe for filled buttons and tinted surfaces. 5.95:1 on white. */
  accent: '#0152F5',
  /**
   * Lifted for dark mode, where the base accent lacks contrast on black. 9.41:1.
   * Use only for accent-coloured text and icons, never as a fill behind white
   * text (that combination only reaches 2.1:1).
   */
  accentOnDark: '#5AB4FF',
  /** 13% wash of the accent, for selected chips and tinted surfaces. */
  accentMuted: 'rgba(1, 82, 245, 0.13)',
  accentMutedDark: 'rgba(90, 180, 255, 0.18)',
  /** The accent wash flattened onto white, for surfaces that need a solid hex. */
  accentWash: '#E6EEFE',
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    card: '#FFFFFF',
    cardMuted: '#F7F7F9',
    border: '#E6E6EA',
    danger: '#C8252C',
    success: '#0B7252',
    warning: '#96520B',
    dangerFill: '#C8252C',
    successFill: '#0B7252',
    warningFill: '#96520B',
    info: '#026AA7',
    overlay: 'rgba(0, 0, 0, 0.45)',
    onBrand: '#FFFFFF',
    successOnBrand: '#34D399',
    warningOnBrand: '#FBBF24',
    dangerOnBrand: '#F87171',
    infoOnBrand: '#38BDF8',
    accentOnBrand: '#14E7FD',
    accent: Brand.accent,
    accentFill: Brand.primary,
    accentMuted: Brand.accentMuted,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    card: '#1C1D20',
    cardMuted: '#17181A',
    border: '#2A2C31',
    danger: '#FF6B6B',
    success: '#34D399',
    warning: '#F59E0B',
    dangerFill: '#B4232B',
    successFill: '#0B7252',
    warningFill: '#96520B',
    info: '#38BDF8',
    overlay: 'rgba(0, 0, 0, 0.65)',
    onBrand: '#FFFFFF',
    successOnBrand: '#34D399',
    warningOnBrand: '#FBBF24',
    dangerOnBrand: '#F87171',
    infoOnBrand: '#38BDF8',
    accentOnBrand: '#14E7FD',
    accent: Brand.accentOnDark,
    accentFill: Brand.primary,
    accentMuted: Brand.accentMutedDark,
  },
} as const;

export { withAlpha } from '@/utils/color';

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  pill: 999,
} as const;

/**
 * Fixed colours that do not change with light or dark mode. Use these for
 * content drawn over photos, gradients and brand fills, and for the feature
 * hues used by icon badges. Anything that must adapt to the theme belongs in
 * `Colors` instead.
 */
export const Palette = {
  white: '#FFFFFF',
  black: '#000000',
} as const;

/** Feature hues for icon badges and category accents. */
export const FeatureColors = {
  sky: '#0284C7',
  blue: '#3B82F6',
  azure: '#2D9CDB',
  cyan: '#0EA5E9',
  indigo: '#4F46E5',
  violet: '#7667F2',
  orchid: '#BB6BD9',
  coral: '#FF6B6B',
  red: '#EB5757',
  amber: '#F59E0B',
  gold: '#F2C94C',
  bronze: '#C17A24',
  emerald: '#059669',
  green: '#10B981',
  leaf: '#27AE60',
  teal: '#159A8C',
  slate: '#5077C8',
  gray: '#828282',
  skyLight: '#38BDF8',
  mint: '#34D399',
  lime: '#4ADE80',
  orange: '#F2994A',
  crimson: '#E11D48',
} as const;

/** Type scale. `ThemedText` types map onto these sizes. */
export const Typography = {
  micro: { fontSize: 10, lineHeight: 14 },
  caption: { fontSize: 12, lineHeight: 16 },
  small: { fontSize: 14, lineHeight: 20 },
  body: { fontSize: 16, lineHeight: 24 },
  subtitle: { fontSize: 18, lineHeight: 24 },
  title: { fontSize: 22, lineHeight: 28 },
  hero: { fontSize: 32, lineHeight: 38 },
} as const;

/** Shadow presets. Android uses `elevation`; iOS and web use the shadow props. */
export const Elevation = {
  none: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  low: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  high: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
} as const;

/** Minimum touch target in dp (WCAG 2.5.8 and platform guidelines). */
export const MinTouchTarget = 44;
