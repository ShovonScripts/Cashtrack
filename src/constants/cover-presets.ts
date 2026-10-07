import { Image, ImageSourcePropType } from 'react-native';

export interface CoverPreset {
  id: string;
  name: string;
  uri: string;
  description: string;
}

export const DEFAULT_COVER_SOURCE: ImageSourcePropType = require('@/assets/images/cover/default-cover.jpg');
export const DEFAULT_COVER_KEY = 'default-cover';

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: DEFAULT_COVER_KEY,
    name: 'Default Banner',
    uri: DEFAULT_COVER_KEY,
    description: 'CashTrack default brand cover banner',
  },
  {
    id: 'emerald-wealth',
    name: 'Emerald Wealth',
    uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    description: 'Sleek abstract emerald fluid artwork',
  },
  {
    id: 'cosmic-dark',
    name: 'Cosmic Dark',
    uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    description: 'Deep dark neon geometric mesh',
  },
  {
    id: 'golden-luxury',
    name: 'Golden Luxury',
    uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
    description: 'Warm metallic silk gradient',
  },
  {
    id: 'cyber-dusk',
    name: 'Cyber Dusk',
    uri: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    description: 'Vibrant dusk purple & magenta horizon',
  },
  {
    id: 'ocean-serenity',
    name: 'Ocean Serenity',
    uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    description: 'Calming turquoise waters & tropical shore',
  },
];

/**
 * Returns a React Native Image source object or module required for <Image source={...} />
 * Works safely on iOS, Android, Web, and Expo Router Node.js SSR without errors.
 */
export function getCoverSource(uri?: string): ImageSourcePropType {
  if (!uri || uri.trim().length === 0 || uri === DEFAULT_COVER_KEY) {
    return DEFAULT_COVER_SOURCE;
  }
  return { uri };
}

/** Legacy helper returning URI string safely if needed */
export function getCoverUri(uri?: string): string {
  if (uri && uri.trim().length > 0 && uri !== DEFAULT_COVER_KEY) {
    return uri;
  }
  try {
    const resolve = Image.resolveAssetSource || (Image as any).default?.resolveAssetSource;
    if (typeof resolve === 'function') {
      const resolved = resolve(DEFAULT_COVER_SOURCE);
      if (resolved?.uri) return resolved.uri;
    }
  } catch {
    // SSR fallback
  }
  return DEFAULT_COVER_KEY;
}
