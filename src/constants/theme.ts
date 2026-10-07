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
  /** Lifted for dark mode, where the base accent lacks contrast on black. 9.41:1. */
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
    accent: Brand.accent,
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
    accent: Brand.accentOnDark,
    accentMuted: Brand.accentMutedDark,
  },
} as const;

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
