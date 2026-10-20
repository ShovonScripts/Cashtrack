import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  onPressAddExpense: () => void;
};

export function CostSummaryCard({
  summary,
  width,
  formatAmount,
  onPressReport,
  onPressAddExpense,
}: CostSummaryCardProps) {
  return (
    <Pressable
      onPress={onPressReport}
      accessibilityRole="button"
      accessibilityLabel={`${summary.title}, ${formatAmount(summary.amount)}, ${summary.detail} Opens the report.`}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: CARD_BACKGROUND[summary.period] },
        pressed && styles.pressed,
      ]}>
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

        <ThemedText type="small" style={styles.detail} numberOfLines={2}>
          {summary.detail}
        </ThemedText>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onPressAddExpense();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add expense for ${summary.title.toLowerCase()}`}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
          <MaterialCommunityIcons name="plus" size={20} color={Brand.deep} />
          <ThemedText type="smallBold" style={styles.addButtonText}>
            Add expense
          </ThemedText>
        </Pressable>
      </View>

      <View pointerEvents="none" style={styles.orbLarge} />
      <View pointerEvents="none" style={styles.orbSmall} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 212,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    gap: Spacing.one,
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
    fontSize: 38,
    lineHeight: 46,
    fontVariant: ['tabular-nums'],
  },
  detail: {
    color: 'rgba(255,255,255,0.82)',
  },
  addButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.four,
  },
  addButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  addButtonText: {
    color: Brand.deep,
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
