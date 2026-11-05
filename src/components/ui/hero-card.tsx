import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, glow, Palette, Radius, Spacing } from '@/constants/theme';

type HeroCardProps = {
  /** Small uppercase label above the figure, such as "TOTAL SPENT". */
  eyebrow: string;
  /** The one number the page is about. */
  value: string;
  /** Optional line under the figure. */
  caption?: string;
  /** Optional pills or stats along the bottom. */
  footer?: ReactNode;
};

/**
 * The single brand-gradient banner. Use it once at the top of Home and the
 * report pages. List and settings pages use StatStrip instead.
 */
export function HeroCard({ eyebrow, value, caption, footer }: HeroCardProps) {
  return (
    <LinearGradient
      colors={[Brand.deep, Brand.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <ThemedText type="micro" style={styles.eyebrow}>
        {eyebrow.toUpperCase()}
      </ThemedText>
      <ThemedText type="hero" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.value}>
        {value}
      </ThemedText>
      {caption ? (
        <ThemedText type="small" style={styles.caption}>
          {caption}
        </ThemedText>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    gap: Spacing.one,
    overflow: 'hidden',
    // The one brand surface on the page glows; nothing else does.
    boxShadow: glow(Brand.primary),
  },
  eyebrow: { color: Palette.white, opacity: 0.85, letterSpacing: 1.2 },
  value: { color: Palette.white },
  caption: { color: Palette.white, opacity: 0.9 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
});
