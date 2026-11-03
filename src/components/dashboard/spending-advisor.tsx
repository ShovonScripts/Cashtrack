import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Expense } from '@/types/expense';
import { getBudgetInsights, type BudgetInsight } from '@/utils/advisor';

export function SpendingAdvisor({
  expenses,
  limits,
  formatAmount,
  now,
}: {
  expenses: Expense[];
  limits: Record<string, number>;
  formatAmount: (amount: number) => string;
  now: Date;
}) {
  const theme = useTheme();
  const allInsights = getBudgetInsights(expenses, limits, now, now);
  const insights = allInsights.slice(0, 2);
  const hasLimits = Object.keys(limits).length > 0;

  return (
    <Card style={styles.advisorCard}>
      <View style={styles.advisorHeading}>
        <View style={styles.advisorIcon}><MaterialCommunityIcons name="creation" size={18} color={theme.accent} /></View>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">Spending advisor</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">A helpful check-in for this month</ThemedText>
        </View>
        {allInsights.length > 0 && (
          <View style={[styles.noticeCount, { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>{allInsights.length}</ThemedText>
          </View>
        )}
      </View>

      {!hasLimits ? (
        <ThemedText type="small" themeColor="textSecondary">
          Set a category limit to get early heads-ups before you go over.
        </ThemedText>
      ) : insights.length === 0 ? (
        <View style={styles.advisorStatus}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#21835B" />
            <ThemedText type="smallBold" style={{ color: '#21835B' }}>You’re on track</ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">All category limits are currently below the heads-up point.</ThemedText>
        </View>
      ) : (
        <View style={styles.insightList}>
          {insights.map((insight) => <InsightLine key={insight.category} insight={insight} formatAmount={formatAmount} />)}
          {allInsights.length > insights.length && (
            <ThemedText type="caption" themeColor="textSecondary">
              + {allInsights.length - insights.length} more {allInsights.length - insights.length === 1 ? 'notice' : 'notices'} in your advisor.
            </ThemedText>
          )}
        </View>
      )}

      <View style={[styles.advisorActions, { borderTopColor: theme.border }]}>
        <Pressable onPress={() => router.push('/advisor')} accessibilityRole="button" style={({ pressed }) => [styles.advisorAction, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Open advisor →</ThemedText>
        </Pressable>
        <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />
        <Pressable onPress={() => router.push('/(tabs)/reports')} accessibilityRole="button" style={({ pressed }) => [styles.advisorAction, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Monthly report ↗</ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

function InsightLine({ insight, formatAmount }: { insight: BudgetInsight; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const isOver = insight.level === 'over';
  const color = isOver ? theme.danger : insight.level === 'near' ? '#BD7119' : theme.accent;
  const title = insight.level === 'over'
    ? `${insight.category} is over its limit`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? `${insight.category} limit reached` : `${insight.category} is close to its limit`
      : `${insight.category} is trending over budget`;
  const detail = insight.level === 'over'
    ? `${formatAmount(Math.abs(insight.remaining))} over this month’s limit.`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? 'No budget left in this category this month.' : `${formatAmount(insight.remaining)} left · ${Math.round(insight.percentUsed * 100)}% used.`
      : `At this pace, spending may reach ${formatAmount(insight.projectedSpend)} this month.`;

  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightMarker, { backgroundColor: color }]} />
      <View style={styles.insightCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  advisorCard: {
    gap: Spacing.three,
  },
  advisorHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  advisorIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(139,123,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleCopy: {
    gap: 2,
  },
  noticeCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  advisorStatus: {
    gap: 2,
  },
  insightList: {
    gap: Spacing.two,
  },
  advisorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  advisorAction: {
    flex: 1,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  insightMarker: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  insightCopy: {
    flex: 1,
    gap: 2,
  },
});
