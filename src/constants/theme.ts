/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { withAlpha } from '@/utils/color';

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
    /**
     * Cool off-white canvas (a whisper of the brand blue). White cards lift off
     * it on their own; on a pure white page no shadow can separate them.
     */
    background: '#F4F6FA',
    backgroundElement: '#ECEEF3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    card: '#FFFFFF',
    cardMuted: '#F9FAFC',
    border: '#E4E7EE',
    /** Faint navy edge that keeps a card crisp where its shadow is lightest. */
    cardBorder: 'rgba(16, 24, 64, 0.07)',
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
    /** Shadows vanish on black, so dark cards separate by a top-lit hairline. */
    cardBorder: 'rgba(255, 255, 255, 0.08)',
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

/**
 * Launch quote screen. Always dark (a calm "night sky" in the brand blues),
 * whatever the theme, so the quote reads the same every morning. Measured at
 * the lightest spot (the `edge` stop under the violet glow): `text` 7.0:1,
 * `author` 5.3:1, `muted` 4.9:1, so every role passes WCAG AA anywhere on screen.
 */
export const LaunchQuoteColors = {
  base: '#030A2B',
  mid: '#06177A',
  edge: '#0B3FC6',
  /** Soft cyan for the author line and greeting icon, drawn from `Brand.bright`. */
  author: '#8FEFFF',
  glowCyan: 'rgba(20, 231, 253, 0.22)',
  glowBlue: 'rgba(1, 82, 245, 0.35)',
  glowViolet: 'rgba(118, 103, 242, 0.22)',
  mark: 'rgba(20, 231, 253, 0.55)',
  text: '#FFFFFF',
  muted: 'rgba(222, 232, 255, 0.9)',
  hairline: 'rgba(255, 255, 255, 0.14)',
  chip: 'rgba(255, 255, 255, 0.08)',
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

/**
 * Text and controls drawn over photos (World Clocks cards). The scrim darkens
 * any photo from top to bottom so white text passes contrast on bright skies.
 */
export const OnPhotoColors = {
  text: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.84)',
  glass: 'rgba(255, 255, 255, 0.16)',
  glassEdge: 'rgba(255, 255, 255, 0.30)',
  scrim: ['rgba(8, 12, 24, 0.25)', 'rgba(8, 12, 24, 0.55)', 'rgba(8, 12, 24, 0.85)'],
  /** Under a photo while it loads, or when the photo fails. */
  fallback: '#1B2230',
} as const;

/**
 * Sky gradients for the "Your time" card when there is no photo, by part of
 * the day. Every stop is dark enough for white text (checked in contrast-check.cjs).
 */
export const SkyColors = {
  dawn: ['#3B2667', '#B4456A'],
  day: ['#0152F5', '#00109D'],
  dusk: ['#7A2E0E', '#3B0764'],
  night: ['#030A2B', '#0B2A80'],
} as const;

/**
 * Note paper tints, one per `NoteColor` except `default`, which has no tint
 * and uses the theme's own card (list) and background (editor). `edge` is the
 * card outline. Text on every tint is checked by scripts/contrast-check.cjs:
 * update its copy when you change these.
 */
export const NoteColors = {
  red: { light: '#FEE2E2', dark: '#3F1515', edge: 'rgba(239, 68, 68, 0.35)' },
  blue: { light: '#E0F2FE', dark: '#102A43', edge: 'rgba(59, 130, 246, 0.35)' },
  green: { light: '#DCFCE7', dark: '#064E3B', edge: 'rgba(16, 185, 129, 0.35)' },
  yellow: { light: '#FEF9C3', dark: '#422006', edge: 'rgba(245, 158, 11, 0.35)' },
  purple: { light: '#F3E8FF', dark: '#2E1065', edge: 'rgba(139, 92, 246, 0.35)' },
} as const;

/** Type scale. `ThemedText` types map onto these sizes. */
export const Typography = {
  micro: { fontSize: 11, lineHeight: 14 },
  caption: { fontSize: 12, lineHeight: 16 },
  small: { fontSize: 14, lineHeight: 20 },
  body: { fontSize: 16, lineHeight: 24 },
  subtitle: { fontSize: 18, lineHeight: 24 },
  title: { fontSize: 22, lineHeight: 28 },
  hero: { fontSize: 32, lineHeight: 38 },
} as const;

/**
 * Shadow ink: a deep navy taken from the brand, not pure black. Tinted shadows
 * read as soft depth; black ones read as grey smudges.
 */
const INK = '16, 24, 64';

/**
 * Depth scale. Each level is two stacked shadows, the way physical light
 * works: a tight "contact" shadow that gives the edge its crispness, and a wide
 * "ambient" one that gives the lift. Uses `boxShadow` (new architecture, iOS,
 * Android and web), which draws outside the view, so it works together with
 * `overflow: 'hidden'` and rounded corners.
 *
 *   none    flat: list rows, anything inside a card
 *   low     raised: every resting card (what `Card` uses)
 *   medium  lifted: pressed-up controls, selected tiles, small floating chips
 *   high    floating: sheets, toasts, the tools button, pop-overs
 *   top     the tab bar, which casts its shadow upward
 *   onMedia anything floating over a photo or a dark slide (avatars, glass
 *           panels): neutral black and stronger, because navy ink at card
 *           strength disappears against an image
 *
 * In dark mode shadows vanish against black, so surfaces separate by
 * lightness and a hairline edge (`cardBorder`) instead. Hand-written shadows
 * outside this file are counted by scripts/token-budget.cjs.
 */
export const Elevation = {
  none: { boxShadow: [] },
  low: { boxShadow: `0 1px 2px rgba(${INK}, 0.05), 0 4px 14px rgba(${INK}, 0.06)` },
  medium: { boxShadow: `0 2px 4px rgba(${INK}, 0.06), 0 10px 24px rgba(${INK}, 0.10)` },
  high: { boxShadow: `0 4px 10px rgba(${INK}, 0.08), 0 18px 40px rgba(${INK}, 0.16)` },
  top: { boxShadow: `0 -1px 0 rgba(${INK}, 0.04), 0 -8px 24px rgba(${INK}, 0.06)` },
  onMedia: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.26), 0 10px 24px rgba(0, 0, 0, 0.22)' },
} as const;

/**
 * Coloured glow for brand-filled surfaces (hero cards, primary buttons, the
 * selected chip): the surface seems to light the page under it. Pass a 6-digit
 * hex colour token. Use at most one glowing element per screen.
 */
export function glow(color: string, strength: 'soft' | 'strong' = 'soft'): string {
  const [near, far] = strength === 'strong' ? [0.3, 0.26] : [0.2, 0.16];
  return `0 3px 8px ${withAlpha(color, near)}, 0 12px 28px ${withAlpha(color, far)}`;
}

/**
 * Soft shadow tinted with an accent, for lists where every card carries its
 * own colour (Transactions: the category colour). Lighter than `glow`, so a
 * whole screen of them stays calm. On dark mode the tint shows as a faint
 * halo, which is what separates the cards there. Pass a 6-digit hex colour.
 */
export function tintedShadow(color: string, isDark = false): string {
  const [near, far] = isDark ? [0.22, 0.2] : [0.14, 0.2];
  return `0 1px 3px ${withAlpha(color, near)}, 0 6px 16px ${withAlpha(color, far)}`;
}

/** Press feedback shared by tappable cards and tiles: a slight sink, never a flash. */
export const PressFeedback = {
  opacity: 0.94,
  transform: [{ scale: 0.98 }],
} as const;

/** Icon sizes in dp: inline text, rows and buttons, navigation, empty states. */
export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Square badge behind an icon: compact row, standard row, large tile. */
export const BadgeSize = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

/** Minimum touch target in dp (WCAG 2.5.8 and platform guidelines). */
export const MinTouchTarget = 44;
