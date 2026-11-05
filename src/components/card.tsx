import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, type ViewStyle, type StyleProp } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';

type CardProps = ComponentProps<typeof ThemedView> & {
  children: ReactNode;
  /** `muted` recedes for grouped content and stays flat; `default` is raised off the page. */
  variant?: 'default' | 'muted';
  padded?: boolean;
  /**
   * Raised cards cast the shared `Elevation.low` shadow in light mode. Turn
   * off for a card nested inside another surface, so depth never stacks.
   */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The app's surface. Light mode: a white card on the off-white page with a
 * soft two-layer navy shadow and a faint edge. Dark mode: a lifted grey
 * surface with a hairline edge (shadows are invisible on black).
 */
export function Card({ children, variant = 'default', padded = true, elevated = true, style, ...rest }: CardProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const raised = elevated && variant === 'default' && !isDark;

  return (
    <ThemedView
      type={variant === 'muted' ? 'cardMuted' : 'card'}
      style={[
        styles.card,
        { borderColor: theme.cardBorder },
        raised && Elevation.low,
        padded && styles.padded,
        style,
      ]}
      {...rest}>
      {children}
    </ThemedView>
  );
}

export function CardDivider() {
  return <ThemedView type="backgroundElement" style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    // Clips children to the rounded corners. `boxShadow` is drawn outside the
    // clip on iOS and Android, so the shadow survives.
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.three,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
});
