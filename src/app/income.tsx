import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { AmountField, Button, FormField, Screen, SegmentedControl, StatStrip, SwitchRow } from '@/components/ui';
import { LoadErrorState } from '@/components/load-error-state';
import { ThemedText } from '@/components/themed-text';
import { DatePicker } from '@/components/date-picker';
import { useIncome } from '@/context/income-context';
import { usePreferences } from '@/context/expense-context';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/utils/color';
import { confirmAction } from '@/utils/confirm';
import { formatDate } from '@/utils/expense';
import { sumMoney } from '@/utils/money';
import type { IncomeRecord } from '@/types/income';
import type { RecurringFrequency } from '@/types/expense';

const FREQUENCIES: { label: string; value: RecurringFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function IncomeScreen() {
  const theme = useTheme();
  const { incomeList, isLoading, incomeLoadError, reloadIncome, addIncome, updateIncome, deleteIncome } = useIncome();
  const { formatAmount, country } = usePreferences();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<Date>(() => new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleStartEdit = (item: IncomeRecord) => {
    setEditingId(item.id);
    setAmount(String(item.amount));
    setNote(item.note || '');
    setDate(new Date(item.date));
    setIsRecurring(Boolean(item.isRecurring));
    setRecurringFrequency(item.recurringFrequency || 'monthly');
    setMessage('');
    Haptics.selectionAsync().catch(() => {});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setNote('');
    setDate(new Date());
    setIsRecurring(false);
    setMessage('');
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('Please enter a valid amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      if (editingId) {
        await updateIncome(editingId, {
          amount: parsed,
          note: note.trim(),
          date: date.toISOString(),
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        });
        setMessage('Income updated successfully.');
        setEditingId(null);
      } else {
        await addIncome({
          amount: parsed,
          note: note.trim(),
          date: date.toISOString(),
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        });
        setMessage('Income added successfully.');
      }
      setAmount('');
      setNote('');
      setDate(new Date());
      setIsRecurring(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      setMessage('Could not save income. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: IncomeRecord) => {
    confirmAction(
      'Delete income record?',
      `This will permanently remove "${item.note?.trim() || 'this income record'}".`,
      async () => {
        try {
          await deleteIncome(item.id);
          if (editingId === item.id) {
            handleCancelEdit();
          }
          setMessage('Income deleted.');
        } catch {
          setMessage('Could not delete this income record. Please try again.');
        }
      },
    );
  };

  const totalAllTime = sumMoney(incomeList.map((item) => item.amount));
  const editingItem = editingId ? incomeList.find((item) => item.id === editingId) : undefined;
  const isEditingGenerated = Boolean(editingItem?.recurringParentId);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Screen topInset={false}>
        <StatStrip
          items={[
            { label: 'Total money in', value: formatAmount(totalAllTime), tone: 'success' },
            { label: 'Records', value: String(incomeList.length) },
          ]}
        />

        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <ThemedText type="defaultBold" accessibilityRole="header">
              {editingId ? 'Edit income record' : 'Record money in'}
            </ThemedText>
            {editingId ? <Button label="Cancel" variant="ghost" onPress={handleCancelEdit} /> : null}
          </View>

          <AmountField
            label="Amount"
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              setMessage('');
            }}
            symbol={country.symbol.trim()}
          />

          <FormField
            label="Source or note"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Salary, Freelance, Gift"
            helper="Optional"
          />

          <View style={styles.field}>
            <ThemedText type="smallBold">Date</ThemedText>
            {isEditingGenerated ? (
              <View style={[styles.readOnlyDate, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
                <View style={styles.readOnlyDateCopy}>
                  <ThemedText type="smallBold">{formatDate(date.toISOString())}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">Date follows the recurring schedule</ThemedText>
                </View>
                <MaterialCommunityIcons name="lock-outline" size={16} color={theme.textSecondary} />
              </View>
            ) : (
              <DatePicker value={date} onChange={setDate} label="Income date" />
            )}
          </View>

          {!isEditingGenerated ? (
            <View style={styles.bleed}>
              <SwitchRow
                label="Recurring income"
                description="Repeat automatically each period"
                value={isRecurring}
                onValueChange={setIsRecurring}
              />
            </View>
          ) : null}

          {!isEditingGenerated && isRecurring ? (
            <SegmentedControl label="Frequency" value={recurringFrequency} onChange={setRecurringFrequency} options={FREQUENCIES} />
          ) : null}

          {message ? (
            <ThemedText
              type="caption"
              themeColor={message.includes('successfully') ? 'accent' : 'danger'}
              accessibilityLiveRegion="polite">
              {message}
            </ThemedText>
          ) : null}

          <Button
            label={editingId ? 'Update money in' : 'Add money in'}
            onPress={handleSave}
            loading={isSubmitting}
          />
        </Card>

        {/* Income History */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Income History</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Most recent first</ThemedText>
        </View>

        {incomeLoadError ? (
          <Card style={styles.emptyCard}>
            <LoadErrorState
              title="Couldn't load income history"
              message="Your income records are safe, but they couldn't be read just now."
              onRetry={reloadIncome}
              isRetrying={isLoading}
            />
          </Card>
        ) : incomeList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No income recorded yet"
              message="Record your salary, freelance earnings, or extra income above."
              tone={theme.success}
              icon="wallet-plus-outline"
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {incomeList.map((item) => (
              <IncomeItem
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                formatAmount={formatAmount}
                onEdit={() => handleStartEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function IncomeItem({
  item,
  isEditing,
  formatAmount,
  onEdit,
  onDelete,
}: {
  item: IncomeRecord;
  isEditing: boolean;
  formatAmount: (amount: number) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  return (
    <Card style={[styles.itemCard, isEditing && { borderColor: theme.accent, borderWidth: 2 }]}>
      <View style={styles.itemRow}>
        <View style={[styles.itemIcon, { backgroundColor: withAlpha(theme.success, 0.15) }]}>
          <MaterialCommunityIcons name="arrow-down-left" size={20} color={theme.success} />
        </View>
        <View style={styles.itemInfo}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.note || 'Income Entry'} {item.isRecurring ? `(${item.recurringFrequency})` : ''}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{formatDate(item.date)}</ThemedText>
        </View>
        <ThemedText type="defaultBold" style={{ color: theme.success }}>+{formatAmount(item.amount)}</ThemedText>
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit income" hitSlop={8} style={styles.actionBtn}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.accent} />
        </Pressable>
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete income" hitSlop={8} style={styles.actionBtn}>
          <MaterialCommunityIcons name="delete-outline" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -Spacing.three },
  flex: { flex: 1 },
  formCard: { gap: Spacing.three },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  field: { gap: Spacing.one },
  readOnlyDate: { minHeight: 48, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  readOnlyDateCopy: { flex: 1, gap: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  list: { gap: Spacing.two },
  itemCard: { padding: Spacing.three },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  itemIcon: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  actionBtn: { padding: 4 },
});
