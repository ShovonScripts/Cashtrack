import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { IconButton, Screen, StatStrip } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { usePreferences } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { getReminderRemainingAmount } from '@/utils/reminder-payment';
import { triggerHaptic } from '@/utils/motion';

import { roundMoney, sumMoney } from '@/utils/money';

function toMonthlyAmount(amount: number | null, repeatType: string): number {
  if (amount === null) return 0;
  let monthly = 0;
  switch (repeatType) {
    case 'weekly':
      monthly = (amount * 52) / 12;
      break;
    case 'yearly':
      monthly = amount / 12;
      break;
    case 'monthly':
      monthly = amount;
      break;
    default:
      monthly = 0;
  }
  return roundMoney(monthly);
}

function getCategoryIcon(category: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (category) {
    case 'Subscription':
      return 'repeat';
    case 'Utilities':
    case 'Bills':
      return 'flash';
    case 'Rent':
      return 'home';
    case 'EMI':
    case 'Loan':
      return 'bank';
    case 'Insurance':
      return 'shield-check';
    default:
      return 'calendar-clock';
  }
}

export default function SubscriptionsHubScreen() {
  const theme = useTheme();
  const { reminders } = useFinancialReminders();
  const { formatAmount } = usePreferences();

  // Filter for recurring bills or subscriptions
  const recurringReminders = reminders.filter(
    (r) => r.repeatType !== 'one-time' || r.category === 'Subscription'
  );

  const activeRecurring = recurringReminders.filter(
    (r) => r.derivedStatus !== 'paid' && r.derivedStatus !== 'skipped'
  );

  const totalMonthlyOutflow = sumMoney(
    activeRecurring.map((r) => toMonthlyAmount(r.amount, r.repeatType))
  );

  return (
    <Screen topInset={false}>
        <Stack.Screen
          options={{
            headerRight: () => (
              <IconButton
                icon="add"
                label="Add recurring bill"
                onPress={() => {
                  triggerHaptic();
                  router.push('/bills/add');
                }}
              />
            ),
          }}
        />
        <StatStrip
          items={[
            { label: 'Monthly outflow', value: formatAmount(totalMonthlyOutflow) },
            { label: 'Active renewals', value: String(activeRecurring.length) },
          ]}
        />

        {/* Subscriptions & Recurring List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultBold">Active renewals & subscriptions</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">{activeRecurring.length} items</ThemedText>
          </View>

          {activeRecurring.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No recurring subscriptions"
                message="Track Netflix, Spotify, gym memberships, and rent reminders in one place."
                tone={theme.accent}
                icon="autorenew"
              />
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/bills/add');
                }}
                accessibilityRole="button"
                accessibilityLabel="Add subscription"
                style={[styles.emptyActionBtn, { backgroundColor: theme.accentFill }]}>
                <ThemedText type="defaultBold" style={{ color: Palette.white }}>Add subscription</ThemedText>
              </Pressable>
            </Card>
          ) : (
            <Card padded={false}>
              {activeRecurring.map((rem, index) => {
                const isOverdue = rem.derivedStatus === 'overdue';
                const isDueToday = rem.derivedStatus === 'due_today';
                const color = isOverdue ? theme.danger : isDueToday ? '#BD7119' : theme.accent;
                const statusText = isOverdue
                  ? `${Math.abs(rem.daysUntilDue)}d overdue`
                  : isDueToday
                    ? 'Due today'
                    : `Renews in ${rem.daysUntilDue}d`;
                const iconName = getCategoryIcon(rem.category);
                const remainingAmount = getReminderRemainingAmount(rem);
                const isPartiallyPaid =
                  Math.max(0, rem.paidAmountCurrentCycle ?? 0) > 0 && (remainingAmount ?? 0) > 0;

                return (
                  <View key={rem.id}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        router.push({ pathname: '/bills/pay/[id]', params: { id: rem.id } });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Manage ${rem.title}`}
                      style={({ pressed }) => [styles.rowItem, pressed && styles.pressed]}>
                      <View style={[styles.iconBadge, { backgroundColor: `${color}1E` }]}>
                        <MaterialCommunityIcons name={iconName} size={20} color={color} />
                      </View>
                      <View style={styles.rowCopy}>
                        <ThemedText type="smallBold" numberOfLines={1}>{rem.title}</ThemedText>
                        <ThemedText type="caption" style={{ color }}>
                          {statusText} · {rem.category} ({rem.repeatType}){isPartiallyPaid ? ' · Part paid' : ''}
                        </ThemedText>
                      </View>
                      <View style={styles.rowRight}>
                        <ThemedText type="smallBold" style={{ color }}>
                          {remainingAmount !== null ? formatAmount(remainingAmount) : 'Variable'}
                        </ThemedText>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listSection: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCard: { padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  emptyActionBtn: { minHeight: 44, paddingHorizontal: Spacing.four, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  iconBadge: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { height: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.75 },
});
