import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryTotal, SummaryPeriod } from '@/utils/period-summary';

const MAX_ROWS = 5;

const PERIOD_LABEL: Record<SummaryPeriod, string> = {
  yesterday: 'Yesterday',
  daily: 'Today',
  weekly: 'This week',
  monthly: 'This month',
  yearly: 'This year',
};

type CostCategoryChartProps = {
  period: SummaryPeriod;
  totals: CategoryTotal[];
  width: number;
  formatAmount: (amount: number) => string;
  categoryIcons?: Record<string, string>;
};

export function CostCategoryChart({
  period,
  totals,
  width,
  formatAmount,
  categoryIcons,
}: CostCategoryChartProps) {
  const theme = useTheme();

  const visibleTotals: CategoryTotal[] = totals.length > MAX_ROWS
    ? [
        ...totals.slice(0, MAX_ROWS - 1),
        {
          category: 'Other categories',
          amount: totals.slice(MAX_ROWS - 1).reduce((sum, item) => sum + item.amount, 0),
          percent: totals.slice(MAX_ROWS - 1).reduce((sum, item) => sum + item.percent, 0),
        },
      ]
    : totals;

  return (
    <Card style={[styles.card, { width }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
            CATEGORY BREAKDOWN
          </ThemedText>
          <ThemedText type="defaultBold">Where your money went</ThemedText>
        </View>
        <View style={[styles.periodPill, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.periodPillText}>
            {PERIOD_LABEL[period]}
          </ThemedText>
        </View>
      </View>

      {visibleTotals.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="small" themeColor="textSecondary">
            No expenses in this period yet.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.rows}>
          {visibleTotals.map((item) => {
            const color = item.category === 'Other categories'
              ? theme.textSecondary
              : getCategoryColor(item.category);
            return (
              <View
                key={item.category}
                style={styles.row}
                accessibilityLabel={`${item.category}: ${formatAmount(item.amount)}, ${Math.round(item.percent)} percent`}>
                <CategoryIcon
                  category={item.category}
                  customIcons={categoryIcons}
                  color={color}
                  size={15}
                  containerSize={30}
                />
                <View style={styles.rowCopy}>
                  <View style={styles.rowTop}>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.rowName}>
                      {item.category}
                    </ThemedText>
                    <View style={styles.valueGroup}>
                      <ThemedText type="smallBold" style={styles.amount}>
                        {formatAmount(item.amount)}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {Math.round(item.percent)}%
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${Math.max(Math.min(item.percent, 100), 2)}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    letterSpacing: 1,
    fontWeight: '800',
    fontSize: 10,
  },
  periodPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  periodPillText: {
    fontWeight: '600',
  },
  rows: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowName: {
    flex: 1,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: Radius.pill,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
