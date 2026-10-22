import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDebts } from '@/context/debt-context';
import { useExpenses } from '@/context/expense-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { withAlpha } from '@/utils/color';
import { getRemainingBalance, getTotalPaid } from '@/utils/debt';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import { shareDebtReminder } from '@/utils/debt-share';
import { confirmAction, confirmDelete, notify } from '@/utils/confirm';

type RowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  wrap?: boolean;
};

function DetailRow({ icon, label, value, wrap = false }: RowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, wrap && styles.rowWrapped]}>
      <View style={styles.labelGroup}>
        <MaterialCommunityIcons name={icon} size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      </View>
      <ThemedText type="defaultBold" style={wrap ? styles.valueWrapped : styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

export default function DebtDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDebt, settleDebt, deleteDebt, addDebtPayment, deleteDebtPayment } = useDebts();
  const { formatAmount } = useExpenses();
  const theme = useTheme();
  const debt = getDebt(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  if (!debt) {
    return (
      <ThemedView style={styles.notFound}>
        <ThemedText type="subtitle">Not found</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.notFoundText}>
          This debt record no longer exists.
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.primaryButton}>
          <ThemedText type="defaultBold">Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const isLent = debt.type === 'lent';
  const isSettled = debt.status === 'settled';
  const payments = debt.payments ?? [];
  const totalPaid = getTotalPaid(debt);
  const remainingBalance = getRemainingBalance(debt);

  const handleSettle = () => {
    if (isSubmitting) return;
    confirmAction(
      'Mark as settled?',
      `Confirm that ${debt.personName}'s debt of ${formatAmount(debt.amount)} has been settled.`,
      async () => {
        setIsSubmitting(true);
        try {
          await settleDebt(debt.id);
        } finally {
          setIsSubmitting(false);
        }
      },
      'Mark as Settled',
    );
  };

  const handleAddPayment = () => {
    const parsed = Number(paymentAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      notify('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    addDebtPayment(debt.id, parsed, paymentNote);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handleDelete = () => {
    confirmDelete('Delete debt record?', 'This cannot be undone.', () => {
      deleteDebt(debt.id);
      router.back();
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
        {/* Next-Level Hero Card */}
        <ThemedView
          type="card"
          style={[
            styles.hero,
            {
              backgroundColor: isLent ? withAlpha(theme.success, 0.08) : withAlpha(theme.danger, 0.08),
              borderColor: isLent ? theme.success : theme.danger,
              borderWidth: 1,
            },
          ]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIconBadge, { backgroundColor: isLent ? theme.successFill : theme.dangerFill }]}>
              <MaterialCommunityIcons name={isLent ? 'arrow-up-right' : 'arrow-down-left'} size={20} color={theme.onBrand} />
            </View>
            <View style={styles.heroTopCopy}>
              <ThemedText type="caption" themeColor="textSecondary">
                {isLent ? 'MONEY LENT TO' : 'MONEY BORROWED FROM'}
              </ThemedText>
              <ThemedText type="subtitle">{debt.personName}</ThemedText>
            </View>
          </View>

          <ThemedText type="hero" style={[styles.heroValue, { color: isLent ? theme.success : theme.danger }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(remainingBalance)}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Original Total: {formatAmount(debt.amount)} {totalPaid > 0 ? `· Paid: ${formatAmount(totalPaid)}` : ''}
          </ThemedText>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isLent ? withAlpha(theme.success, 0.15) : withAlpha(theme.danger, 0.15) }]}>
              <ThemedText type="caption" style={{ color: isLent ? theme.success : theme.danger, fontWeight: '700' }}>
                {isLent ? 'Lent Transaction' : 'Borrowed Transaction'}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: isSettled ? theme.cardMuted : theme.accentMuted }]}>
              <ThemedText type="caption" style={{ color: isSettled ? theme.textSecondary : theme.accent, fontWeight: '700' }}>
                {isSettled ? '✓ Settled' : remainingBalance === 0 ? '✓ Paid Off' : '● Active'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Details Card */}
        <Card padded={false} style={styles.detailsCard}>
          <View style={styles.padded}>
            <DetailRow icon="account-outline" label="Person Name" value={debt.personName} />
          </View>
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow icon="calendar-start" label="Date Recorded" value={formatDate(debt.date)} />
          </View>
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow icon="calendar-clock" label="Due Date" value={debt.dueDate ? formatDate(debt.dueDate) : 'No due date set'} />
          </View>
          {isSettled && debt.settledDate && (
            <>
              <CardDivider />
              <View style={styles.padded}>
                <DetailRow icon="check-circle-outline" label="Settled Date" value={formatDate(debt.settledDate)} />
              </View>
            </>
          )}
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow icon="text-box-outline" label="Note / Memo" value={debt.note || 'No note added'} wrap />
          </View>
        </Card>

        {/* Payment Tracking & Settlement History */}
        <Card style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultBold">Settlement History & Payments</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">{payments.length} payments</ThemedText>
          </View>

          {payments.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
              No partial payments recorded yet. Record a payment below or mark the full debt as settled.
            </ThemedText>
          ) : (
            <View style={{ gap: Spacing.two }}>
              {payments.map((p, index) => (
                <View key={p.id}>
                  {index > 0 && <CardDivider />}
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentInfo}>
                      <ThemedText type="smallBold">{formatAmount(p.amount)}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {formatDate(p.date)} {p.note ? `· ${p.note}` : ''}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => deleteDebtPayment(debt.id, p.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete payment"
                      hitSlop={8}>
                      <MaterialCommunityIcons name="close-circle-outline" size={18} color={theme.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!isSettled && (
            <View style={styles.addPaymentSection}>
              <ThemedText type="smallBold">Record Partial Payment</ThemedText>
              <View style={styles.paymentInputRow}>
                <TextInput
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="Amount"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
                />
                <TextInput
                  value={paymentNote}
                  onChangeText={setPaymentNote}
                  placeholder="Note (opt.)"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { flex: 2, borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
                />
                <Pressable
                  onPress={handleAddPayment}
                  accessibilityRole="button"
                  accessibilityLabel="Add payment"
                  style={[styles.addPayBtn, { backgroundColor: theme.accentFill }]}>
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isSettled && (
            <Pressable
              onPress={() => router.push({ pathname: '/debts/[id]/edit', params: { id: debt.id } })}
              accessibilityRole="button"
              accessibilityLabel="Edit debt details"
              style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.text} />
              <ThemedText type="defaultBold">Edit</ThemedText>
            </Pressable>
          )}
          {!isSettled && (
            <Pressable
              onPress={handleSettle}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Settle debt"
              accessibilityState={{ disabled: isSubmitting }}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.successFill }, pressed && styles.pressed, isSubmitting && { opacity: 0.5 }]}>
              <MaterialCommunityIcons name="check" size={18} color={theme.onBrand} />
              <ThemedText type="defaultBold" style={[styles.onAccent, { color: theme.onBrand }]}>{isSubmitting ? 'Settling…' : 'Settle Full'}</ThemedText>
            </Pressable>
          )}
          <Pressable
            onPress={() => void shareDebtReminder(debt, formatAmount)}
            accessibilityRole="button"
            accessibilityLabel="Share debt reminder"
            style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="share-variant-outline" size={18} color={theme.accent} />
            <ThemedText type="defaultBold" style={{ color: theme.accent }}>Reminder</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete debt record"
            style={({ pressed }) => [styles.dangerButton, { borderColor: theme.danger }, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.danger} />
            <ThemedText type="defaultBold" themeColor="danger">Delete</ThemedText>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  hero: { borderRadius: Radius.xlarge, padding: Spacing.four, gap: Spacing.two },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  heroIconBadge: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  heroTopCopy: { flex: 1, gap: 2 },
  heroValue: { fontVariant: ['tabular-nums'], fontSize: 36, lineHeight: 42 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  badge: { paddingHorizontal: Spacing.three, paddingVertical: 4, borderRadius: Radius.small },
  detailsCard: { borderRadius: Radius.large },
  padded: { padding: Spacing.three },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  rowWrapped: { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.one },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  valueWrapped: { alignSelf: 'stretch' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  paymentInfo: { gap: 2, flex: 1 },
  addPaymentSection: { marginTop: Spacing.three, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e4e4ed', paddingTop: Spacing.three },
  paymentInputRow: { flexDirection: 'row', gap: Spacing.two },
  input: { minHeight: 42, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 13 },
  addPayBtn: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  primaryButton: { flex: 1, minWidth: 130, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderRadius: Radius.medium },
  secondaryButton: { flex: 1, minWidth: 130, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth },
  onAccent: { color: '#FFFFFF' },
  dangerButton: { flex: 1, minWidth: 130, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.7 },
  notFound: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.two, justifyContent: 'center' },
  notFoundText: { textAlign: 'center' },
});
