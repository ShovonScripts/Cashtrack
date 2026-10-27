import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import type { CategoryTotal, CostSummary, SummaryPeriod } from '@/utils/period-summary';

const CARD_BACKGROUND: Record<SummaryPeriod, string> = {
  daily: '#00109D',
  yesterday: '#0E23B8',
  weekly: '#0142D6',
  monthly: Brand.primary,
  yearly: '#0066FF',
};

type CostSummaryCardProps = {
  summary: CostSummary;
  width: number;
  formatAmount: (amount: number) => string;
  onPressReport: () => void;
  onAddExpense?: () => void;
  topCategory?: CategoryTotal;
};

export function CostSummaryCard({
  summary,
  width,
  formatAmount,
  onPressReport,
  onAddExpense,
  topCategory,
}: CostSummaryCardProps) {
  return (
    <View
      style={[
        styles.card,
        { width, backgroundColor: CARD_BACKGROUND[summary.period] },
      ]}>
      <View pointerEvents="none" style={styles.orbLarge} />
      <View pointerEvents="none" style={styles.orbSmall} />

      <View style={styles.cardContent}>
        <Pressable
          onPress={onPressReport}
          accessibilityRole="button"
          accessibilityLabel={`${summary.title}, ${formatAmount(summary.amount)}, ${summary.detail} Opens the report.`}
          style={({ pressed }) => [styles.reportPress, pressed && styles.pressed]}>
          <View style={styles.topline}>
            <ThemedText type="caption" style={styles.label}>
              {summary.title}
            </ThemedText>
            <View style={styles.rangePill}>
              <ThemedText type="caption" style={styles.rangePillText}>
                {summary.rangeLabel}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            type="hero"
            style={styles.value}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}>
            {formatAmount(summary.amount)}
          </ThemedText>

          <ThemedText
            type="small"
            style={styles.detail}
            numberOfLines={2}>
            {summary.detail}
          </ThemedText>
        </Pressable>

        {onAddExpense ? (
          <Pressable
            onPress={onAddExpense}
            accessibilityRole="button"
            accessibilityLabel={`Add expense for ${summary.title.toLowerCase()}`}
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
            <Ionicons name="add" size={16} color={Brand.deep} />
            <ThemedText type="defaultBold" style={styles.addButtonText}>
              Add expense
            </ThemedText>
          </Pressable>
        ) : topCategory && summary.amount > 0 ? (
          <View style={styles.topCategoryFooter}>
            <Ionicons name="flash-outline" size={13} color="#FFFFFF" />
            <ThemedText type="caption" style={styles.topCategoryText} numberOfLines={1}>
              Top: {topCategory.category} · {formatAmount(topCategory.amount)} ({Math.round(topCategory.percent)}%)
            </ThemedText>
          </View>
        ) : (
          <View style={styles.addButtonPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 195,
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'space-between',
  },
  cardContent: {
    padding: Spacing.three,
    zIndex: 2,
    gap: Spacing.two,
    justifyContent: 'space-between',
    flex: 1,
  },
  reportPress: {
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.9,
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.8,
    fontWeight: '800',
    fontSize: 10.5,
  },
  rangePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  rangePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10.5,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  detail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 17,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    height: 36,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.three,
    marginTop: 2,
  },
  topCategoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  topCategoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    flexShrink: 1,
    flex: 1,
  },
  addButtonPlaceholder: {
    height: 36,
    marginTop: 2,
  },
  addButtonPressed: {
    opacity: 0.75,
  },
  addButtonText: {
    color: Brand.deep,
    fontSize: 13.5,
    fontWeight: '700',
  },
  orbLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(139,123,255,0.22)',
  },
  orbSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    left: -40,
    bottom: -50,
    backgroundColor: 'rgba(20,231,253,0.18)',
  },
});
