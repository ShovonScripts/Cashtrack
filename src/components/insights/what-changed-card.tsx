import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MonthComparison } from '@/utils/month-comparison';

type WhatChangedCardProps = {
  comparison: MonthComparison;
  /** Short name of the month being compared against, such as "Sep". */
  previousLabel: string;
  formatAmount: (amount: number) => string;
  categoryIcons: Record<string, string>;
};

function headline(comparison: MonthComparison, previousLabel: string, formatAmount: (n: number) => string): string {
  const amount = formatAmount(Math.abs(comparison.delta));
  switch (comparison.direction) {
    case 'down':
      return `You spent ${amount} less than ${previousLabel}${comparison.percent !== null ? ` (−${comparison.percent}%)` : ''}`;
    case 'up':
      return `You spent ${amount} more than ${previousLabel}${comparison.percent !== null ? ` (+${comparison.percent}%)` : ''}`;
    case 'flat':
      return `Same spending as ${previousLabel}`;
    default:
      return `No spending recorded in ${previousLabel} to compare with`;
  }
}

/** Plain-language month-over-month summary with the categories that moved the most. */
export function WhatChangedCard({ comparison, previousLabel, formatAmount, categoryIcons }: WhatChangedCardProps) {
  const theme = useTheme();

  // Nothing to say without any spending in either month.
  if (comparison.current === 0 && comparison.previous === 0) return null;

  const tone =
    comparison.direction === 'down' ? theme.success : comparison.direction === 'up' ? theme.warning : theme.textSecondary;
  const icon =
    comparison.direction === 'down' ? 'trending-down' : comparison.direction === 'up' ? 'trending-up' : 'trending-neutral';
  const scope =
    comparison.throughDay !== null ? `Same days: 1–${comparison.throughDay} of each month` : 'Full month compared';

  return (
    <Card style={styles.card}>
      <View style={styles.headRow}>
        <View style={[styles.iconBadge, { backgroundColor: withAlpha(tone, 0.14) }]}>
          <MaterialCommunityIcons name={icon} size={22} color={tone} />
        </View>
        <View style={styles.headCopy}>
          <ThemedText type="caption" themeColor="textSecondary" accessibilityRole="header">
            WHAT CHANGED
          </ThemedText>
          <ThemedText type="defaultBold">{headline(comparison, previousLabel, formatAmount)}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {scope}
          </ThemedText>
        </View>
      </View>

      {comparison.movers.length > 0 && (
        <View style={styles.movers}>
          {comparison.movers.map((change) => {
            const increased = change.delta > 0;
            const color = increased ? theme.warning : theme.success;
            return (
              <View
                key={change.category}
                accessible
                accessibilityLabel={`${change.category}: ${increased ? 'up' : 'down'} ${formatAmount(Math.abs(change.delta))} compared with ${previousLabel}`}
                style={styles.moverRow}>
                <CategoryIcon
                  category={change.category}
                  customIcons={categoryIcons}
                  color={getCategoryColor(change.category)}
                  size={14}
                  containerSize={28}
                />
                <ThemedText type="small" numberOfLines={1} style={styles.moverName}>
                  {change.category}
                </ThemedText>
                <MaterialCommunityIcons name={increased ? 'arrow-up' : 'arrow-down'} size={14} color={color} />
                <ThemedText type="smallBold" style={{ color }}>
                  {formatAmount(Math.abs(change.delta))}
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headCopy: { flex: 1, gap: 2 },
  movers: { gap: Spacing.two },
  moverRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 32 },
  moverName: { flex: 1 },
});
