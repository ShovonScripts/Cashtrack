import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { DatePicker } from '@/components/date-picker';
import { useIncome } from '@/context/income-context';
import { useExpenses } from '@/context/expense-context';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import type { IncomeRecord } from '@/types/income';
import type { RecurringFrequency } from '@/types/expense';

const FREQUENCIES: { label: string; value: RecurringFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function IncomeScreen() {
  const theme = useTheme();
  const { incomeList, addIncome, updateIncome, deleteIncome } = useIncome();
  const { formatAmount } = useExpenses();

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

  const totalAllTime = incomeList.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* Multi-Tone Spendly Brand Glass Hero Card */}
        <View style={styles.heroGlassCard}>
          <View pointerEvents="none" style={styles.primaryBlueOrb} />
          <View pointerEvents="none" style={styles.brightCyanOrb} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>
                TOTAL MONEY IN (ALL TIME)
              </ThemedText>
              <View style={styles.recordBadgePill}>
                <MaterialCommunityIcons name="arrow-down-bold-circle" size={12} color="#10B981" />
                <ThemedText type="caption" style={styles.recordBadgeText}>
                  {incomeList.length} {incomeList.length === 1 ? 'record' : 'records'}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="hero" style={styles.heroVal} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(totalAllTime)}
            </ThemedText>
          </View>
        </View>

        {/* Add / Edit Income Form Card */}
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBadge, { backgroundColor: '#10B9811A' }]}>
                <MaterialCommunityIcons name="cash-plus" size={20} color="#10B981" />
              </View>

              <ThemedText type="defaultBold" style={{ fontSize: 16 }}>
                {editingId ? 'Edit Income Record' : 'Record Money In'}
              </ThemedText>
            </View>

            {editingId && (
              <Pressable onPress={handleCancelEdit} accessibilityRole="button">
                <ThemedText type="smallBold" style={{ color: theme.accent }}>Cancel</ThemedText>
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Amount</ThemedText>
            <TextInput
              value={amount}
              onChangeText={(val) => { setAmount(val.replace(/[^0-9.]/g, '')); setMessage(''); }}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              accessibilityLabel="Income amount"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Source / Note <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Salary, Freelance, Gift"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Income source or note"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Date Picker */}
          <View style={styles.field}>
            <ThemedText type="smallBold">Date</ThemedText>
            <DatePicker value={date} onChange={setDate} />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <ThemedText type="smallBold">Recurring Income</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">Repeat automatically each period</ThemedText>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isRecurring && (
            <View style={styles.field}>
              <ThemedText type="smallBold">Frequency</ThemedText>
              <View style={styles.freqGrid}>
                {FREQUENCIES.map((f) => {
                  const selected = recurringFrequency === f.value;
                  return (
                    <Pressable
                      key={f.value}
                      onPress={() => setRecurringFrequency(f.value)}
                      accessibilityRole="button"
                      style={[
                        styles.freqChip,
                        {
                          borderColor: selected ? theme.accent : theme.border,
                          backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                        },
                      ]}>
                      <ThemedText type="smallBold" themeColor={selected ? 'accent' : 'textSecondary'}>{f.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {message ? (
            <ThemedText type="caption" themeColor={message.includes('successfully') ? 'accent' : 'danger'}>
              {message}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={isSubmitting}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={editingId ? "content-save-check" : "plus-circle"} size={18} color="#FFFFFF" />
            <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
              {editingId ? 'Update Money In' : 'Add Money In'}
            </ThemedText>
          </Pressable>
        </Card>

        {/* Income History */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Income History</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Most recent first</ThemedText>
        </View>

        {incomeList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No income recorded yet"
              message="Record your salary, freelance earnings, or extra income above."
              tone="#10B981"
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
                onDelete={() => deleteIncome(item.id)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
        <View style={[styles.itemIcon, { backgroundColor: '#10B9811C' }]}>
          <MaterialCommunityIcons name="arrow-down-left" size={20} color="#10B981" />
        </View>
        <View style={styles.itemInfo}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.note || 'Income Entry'} {item.isRecurring ? `(${item.recurringFrequency})` : ''}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{formatDate(item.date)}</ThemedText>
        </View>
        <ThemedText type="defaultBold" style={{ color: '#10B981' }}>+{formatAmount(item.amount)}</ThemedText>
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
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  heroGlassCard: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Brand.primary,
    opacity: 0.5,
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Brand.bright,
    opacity: 0.25,
  },
  heroContent: { gap: Spacing.one, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, fontSize: 11, fontWeight: '700' },
  recordBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  recordBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  heroVal: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontVariant: ['tabular-nums'], fontWeight: '800' },
  formCard: { gap: Spacing.three },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBadge: { width: 32, height: 32, borderRadius: Radius.small, justifyContent: 'center', alignItems: 'center' },
  field: { gap: Spacing.one },
  input: { minHeight: 48, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchCopy: { flex: 1, gap: 2 },
  freqGrid: { flexDirection: 'row', gap: Spacing.two },
  freqChip: { flex: 1, minHeight: 40, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  addButton: {
    minHeight: 48,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  list: { gap: Spacing.two },
  itemCard: { padding: Spacing.three },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  itemIcon: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  actionBtn: { padding: 4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
