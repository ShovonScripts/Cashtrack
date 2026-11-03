import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Stat = {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

type StatStripProps = {
  items: readonly Stat[];
};

/**
 * Flat row of two to four figures. It replaces the per-screen glass banners on
 * list and settings pages: same information, one calm look.
 */
export function StatStrip({ items }: StatStripProps) {
  const theme = useTheme();

  return (
    <Card padded={false} style={styles.card}>
      {items.map((item, index) => {
        const color =
          item.tone === 'success'
            ? theme.success
            : item.tone === 'warning'
              ? theme.warning
              : item.tone === 'danger'
                ? theme.danger
                : theme.text;
        return (
          <View
            key={item.label}
            accessible
            accessibilityLabel={`${item.label}: ${item.value}`}
            style={[styles.cell, index > 0 && { borderStartWidth: StyleSheet.hairlineWidth, borderStartColor: theme.border }]}>
            <ThemedText type="micro" themeColor="textSecondary" numberOfLines={1} style={styles.label}>
              {item.label.toUpperCase()}
            </ThemedText>
            <ThemedText type="defaultBold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color }}>
              {item.value}
            </ThemedText>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row' },
  cell: {
    flex: 1,
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  label: { letterSpacing: 1 },
});
