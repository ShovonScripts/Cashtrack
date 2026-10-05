import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useIncome } from '@/context/income-context';
import { useGoals } from '@/context/goal-context';
import { useTheme } from '@/hooks/use-theme';
import { calculateCashFlowForecast } from '@/utils/cash-flow-calculator';

export default function CashFlowScreen() {
  const theme = useTheme();
  const { expenses, formatAmount } = useExpenses();
  const { incomeList } = useIncome();
  const { goals } = useGoals();

  const forecast = calculateCashFlowForecast({
    incomeList,
    expenses,
    goals,
    currentDate: new Date(),
  });

  const statusColor = forecast.status === 'SAFE' ? '#27AE60' : forecast.status === 'TIGHT' ? '#BD7119' : theme.danger;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Hero Card */}
        <View style={[styles.hero, { backgroundColor: Brand.deep }]}>
          <View style={styles.heroContent}>
            <ThemedText type="caption" style={styles.heroLabel}>MONTH-END FORECAST</ThemedText>
            <ThemedText type="hero" style={styles.heroVal} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(forecast.projectedBalance)}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{forecast.status}</ThemedText>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrb} />
        </View>

        {/* Explanation Card */}
        <Card style={styles.card}>
          <ThemedText type="defaultBold">Cash flow projection</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.explanation}>
            {forecast.explanation}
          </ThemedText>
        </Card>

        {/* Breakdown Card */}
        <Card style={styles.card}>
          <ThemedText type="defaultBold">Forecast breakdown</ThemedText>
          <BreakdownRow label="Current Net (So Far)" value={formatAmount(forecast.currentNet)} />
          <BreakdownRow label="Upcoming Recurring Bills" value={`-${formatAmount(forecast.upcomingRecurringExpenses)}`} valueColor={theme.danger} />
          <BreakdownRow label="Planned Goal Contributions" value={`-${formatAmount(forecast.plannedGoalContributions)}`} valueColor={theme.danger} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <BreakdownRow label="Projected Month-End Balance" value={formatAmount(forecast.projectedBalance)} bold valueColor={statusColor} />
        </Card>
      </View>
    </ScrollView>
  );
}

function BreakdownRow({ label, value, bold, valueColor }: { label: string; value: string; bold?: boolean; valueColor?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <ThemedText type={bold ? 'defaultBold' : 'small'} themeColor={bold ? 'text' : 'textSecondary'}>{label}</ThemedText>
      <ThemedText type={bold ? 'defaultBold' : 'smallBold'} style={{ color: valueColor ?? theme.text }}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  hero: { borderRadius: Radius.xlarge, padding: Spacing.four, overflow: 'hidden', justifyContent: 'center' },
  heroContent: { gap: Spacing.one, zIndex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroVal: { color: '#FFFFFF', fontSize: 36, lineHeight: 42, fontVariant: ['tabular-nums'] },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.three, paddingVertical: 4, borderRadius: Radius.pill, marginTop: Spacing.one },
  heroOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -70, top: -80, backgroundColor: 'rgba(139,123,255,0.2)' },
  card: { gap: Spacing.three },
  explanation: { lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.half },
});
