import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import type { CostSummary, SummaryPeriod } from '@/utils/period-summary';

const CARD_BACKGROUND: Record<SummaryPeriod, string> = {
  yesterday: Brand.deep,
  daily: Brand.primary,
  weekly: '#0B192C',
  monthly: Brand.deep,
  yearly: '#0B192C',
};

type CostSummaryCardProps = {
  summary: CostSummary;
  width: number;
  formatAmount: (amount: number) => string;
  onPressReport: () => void;
  onAddExpense?: () => void;
};

export function CostSummaryCard({
  summary,
  width,
  formatAmount,
  onPressReport,
  onAddExpense,
}: CostSummaryCardProps) {
  return (
    <View
      style={[
        styles.card,
        { width, backgroundColor: CARD_BACKGROUND[summary.period] },
      ]}>
      <Pressable
        onPress={onPressReport}
        accessibilityRole="button"
        accessibilityLabel={`${summary.title}, ${formatAmount(summary.amount)}, ${summary.detail} Opens the report.`}
        style={({ pressed }) => [styles.reportPress, pressed && styles.pressed]}>
        <View style={styles.content}>
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
            adjustsFontSizeToFit>
            {formatAmount(summary.amount)}
          </ThemedText>

          <ThemedText
            type="small"
            style={[styles.detail, onAddExpense && styles.detailWithAction]}
            numberOfLines={2}>
            {summary.detail}
          </ThemedText>
        </View>
      </Pressable>

      {onAddExpense && (
        <Pressable
          onPress={onAddExpense}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Add expense for ${summary.title.toLowerCase()}`}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
          <Ionicons name="add" size={14} color="#FFFFFF" />
          <ThemedText type="smallBold" style={styles.addButtonText}>
            Add expense
          </ThemedText>
        </Pressable>
      )}

      <View pointerEvents="none" style={styles.orbLarge} />
      <View pointerEvents="none" style={styles.orbSmall} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
  },
  reportPress: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    gap: Spacing.two,
    zIndex: 1,
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1,
    fontWeight: '700',
  },
  rangePill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  rangePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
  detail: {
    color: 'rgba(255,255,255,0.82)',
  },
  detailWithAction: {
    paddingRight: 116,
    fontSize: 12.5,
    lineHeight: 17,
  },
  addButton: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.three,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  addButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
  },
  orbLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -90,
    top: -100,
    backgroundColor: 'rgba(139,123,255,0.2)',
  },
  orbSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: 14,
    bottom: -90,
    backgroundColor: 'rgba(20,231,253,0.18)',
  },
});
