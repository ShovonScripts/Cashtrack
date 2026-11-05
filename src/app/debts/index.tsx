import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Chip, Screen, StatStrip } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useDebts } from '@/context/debt-context';
import { usePreferences } from '@/context/expense-context';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/utils/color';
import { getRemainingBalance, summarizeDebts } from '@/utils/debt';
import { formatDate } from '@/utils/expense';
import type { DebtRecord } from '@/types/debt';

type FilterType = 'Active' | 'All' | 'Settled' | 'Lent' | 'Borrowed';

export default function DebtsScreen() {
  const theme = useTheme();
  const { debts } = useDebts();
  const { formatAmount } = usePreferences();
  const [filter, setFilter] = useState<FilterType>('Active');

  // Summary calculations (open debts, by remaining balance)
  const { youAreOwed, youOwe, net } = summarizeDebts(debts);

  const filteredDebts = debts.filter((debt) => {
    if (filter === 'Active') return debt.status === 'active';
    if (filter === 'Settled') return debt.status === 'settled';
    if (filter === 'Lent') return debt.type === 'lent';
    if (filter === 'Borrowed') return debt.type === 'borrowed';
    return true; // 'All'
  });

  const getCount = (f: FilterType) => {
    if (f === 'Active') return debts.filter((d) => d.status === 'active').length;
    if (f === 'Settled') return debts.filter((d) => d.status === 'settled').length;
    if (f === 'Lent') return debts.filter((d) => d.type === 'lent').length;
    if (f === 'Borrowed') return debts.filter((d) => d.type === 'borrowed').length;
    return debts.length;
  };

  const filters: FilterType[] = ['Active', 'All', 'Settled', 'Lent', 'Borrowed'];

  return (
    <Screen topInset={false}>
        <StatStrip
          items={[
            { label: 'You are owed', value: formatAmount(youAreOwed), tone: 'success' },
            { label: 'You owe', value: formatAmount(youOwe), tone: youOwe > 0 ? 'danger' : 'default' },
            { label: 'Net position', value: `${net >= 0 ? '+' : ''}${formatAmount(net)}`, tone: net >= 0 ? 'success' : 'danger' },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => (
            <Chip key={f} label={`${f} (${getCount(f)})`} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>

        {/* Debt List */}
        <View style={styles.listSection}>
          {filteredDebts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No debt records"
                message="Track money you lent or borrowed."
                tone={theme.accent}
                icon="account-cash-outline"
                actionLabel="Add debt"
                onAction={() => router.push('/debts/add')}
              />
            </Card>
          ) : (
            filteredDebts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} formatAmount={formatAmount} />
            ))
          )}
        </View>
    </Screen>
  );
}

function DebtCard({ debt, formatAmount }: { debt: DebtRecord; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const isLent = debt.type === 'lent';
  const isSettled = debt.status === 'settled';
  const remaining = getRemainingBalance(debt);

  const initials = debt.personName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/debts/[id]', params: { id: debt.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Debt with ${debt.personName}, ${formatAmount(remaining)} outstanding`}
      style={({ pressed }) => [
        styles.debtCard,
        {
          backgroundColor: theme.card,
          borderColor: isLent ? withAlpha(theme.success, 0.3) : withAlpha(theme.danger, 0.3),
          borderLeftWidth: 4,
          borderLeftColor: isLent ? theme.success : theme.danger,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: isLent ? withAlpha(theme.success, 0.15) : withAlpha(theme.danger, 0.15) }]}>
          <ThemedText type="smallBold" style={{ color: isLent ? theme.success : theme.danger }}>
            {initials || '👤'}
          </ThemedText>
        </View>
        <View style={styles.personInfo}>
          <ThemedText type="defaultBold" numberOfLines={1}>{debt.personName}</ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: isLent ? withAlpha(theme.success, 0.15) : withAlpha(theme.danger, 0.15) }]}>
              <MaterialCommunityIcons
                name={isLent ? 'arrow-up-right' : 'arrow-down-left'}
                size={12}
                color={isLent ? theme.success : theme.danger}
              />
              <ThemedText type="caption" style={{ color: isLent ? theme.success : theme.danger, fontWeight: '700' }}>
                {isLent ? 'Lent' : 'Borrowed'}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: isSettled ? theme.cardMuted : theme.accentMuted }]}>
              <ThemedText type="caption" style={{ color: isSettled ? theme.textSecondary : theme.accent, fontWeight: '700' }}>
                {isSettled ? 'Settled' : 'Active'}
              </ThemedText>
            </View>
          </View>
        </View>
        <ThemedText type="subtitle" style={[styles.amount, { color: isLent ? theme.success : theme.danger }]}>
          {formatAmount(remaining)}
        </ThemedText>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color={theme.textSecondary} />
          <ThemedText type="caption" themeColor="textSecondary">
            {isSettled && debt.settledDate ? `Settled: ${formatDate(debt.settledDate)}` : debt.dueDate ? `Due: ${formatDate(debt.dueDate)}` : `Date: ${formatDate(debt.date)}`}
          </ThemedText>
        </View>
        {debt.note ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1} style={styles.note}>
            {debt.note}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterScroll: { gap: Spacing.two, paddingVertical: Spacing.one },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  debtCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.two, ...Elevation.low },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  avatar: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  personInfo: { flex: 1, gap: Spacing.half },
  badges: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.small },
  amount: { fontSize: 20, lineHeight: 26, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.04)', paddingTop: Spacing.two },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  note: { flex: 1, textAlign: 'right' },
  pressed: { opacity: 0.75 },
});
