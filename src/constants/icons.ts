import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type GlyphName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * One glyph per concept, used on every screen. Add to this list when a new
 * shared concept appears, and reach for it before typing a raw glyph name.
 * Outline glyphs are the default; filled glyphs only mark a selected state.
 */
export const Icons = {
  // actions
  add: 'plus',
  addCircle: 'plus-circle-outline',
  edit: 'pencil-outline',
  delete: 'trash-can-outline',
  share: 'share-variant-outline',
  search: 'magnify',
  filter: 'filter-variant',
  close: 'close',
  check: 'check',
  settings: 'cog-outline',
  export: 'file-export-outline',
  // navigation
  next: 'chevron-right',
  expand: 'chevron-down',
  collapse: 'chevron-up',
  // money features
  expense: 'receipt-text-outline',
  income: 'wallet-plus-outline',
  bill: 'calendar-clock',
  calendar: 'calendar-month-outline',
  debt: 'account-cash-outline',
  pot: 'piggy-bank-outline',
  budget: 'scale-balance',
  report: 'chart-box-outline',
  trendUp: 'trending-up',
  trendDown: 'trending-down',
  // status
  success: 'check-circle-outline',
  warning: 'alert-outline',
  error: 'alert-circle-outline',
  info: 'information-outline',
} as const satisfies Record<string, GlyphName>;

export type IconConcept = keyof typeof Icons;
