import { MaterialCommunityIcons } from '@expo/vector-icons';

import { IconSize } from '@/constants/theme';
import { Icons, type GlyphName, type IconConcept } from '@/constants/icons';
import { useTheme } from '@/hooks/use-theme';

type IconProps = {
  /** A shared concept from the icon registry, or a raw glyph for one-off artwork. */
  name: IconConcept | GlyphName;
  size?: keyof typeof IconSize;
  /** Defaults to the theme accent. Use status colours only for status. */
  color?: string;
};

function resolve(name: IconConcept | GlyphName): GlyphName {
  return name in Icons ? Icons[name as IconConcept] : (name as GlyphName);
}

/** The single way to draw an icon: one family, four sizes, themed colour. */
export function Icon({ name, size = 'md', color }: IconProps) {
  const theme = useTheme();
  return <MaterialCommunityIcons name={resolve(name)} size={IconSize[size]} color={color ?? theme.accent} />;
}
