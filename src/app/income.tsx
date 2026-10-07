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
        {/* Hero Card */}
        <View style={[styles.hero, { backgroundColor: Brand.deep }]}>
          <View style={styles.heroContent}>
            <ThemedText type="caption" style={styles.heroLabel}>TOTAL MONEY IN (ALL TIME)</ThemedText>
            <ThemedText type="hero" style={styles.heroVal} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(totalAllTime)}
            </ThemedText>
            <ThemedText type="small" style={styles.heroSub}>
              {incomeList.length} {incomeList.length === 1 ? 'record' : 'records'} logged
            </ThemedText>
          </View>
          <View pointerEvents="none" style={styles.heroOrb} />
        </View>

        {/* Add / Edit Income Form Card */}
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <ThemedText type="defaultBold">{editingId ? 'Edit Money In' : 'Record Money In'}</ThemedText>
            {editingId && (
              <Pressable onPress={handleCancelEdit} accessibilityRole="button">
                <ThemedText type="smallBold" style={{ color: theme.accent }}>Cancel edit</ThemedText>
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
                      <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>{f.label}</ThemedText>
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
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>
              {editingId ? 'Update Money In' : 'Add Money In'}
            </ThemedText>
          </Pressable>
        </Card>

        {/* Income History */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Income history</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Most recent first</ThemedText>
        </View>

        {incomeList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No income recorded"
              message="Record your salary, freelance earnings, or extra income above."
              tone={theme.accent}
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
        <View style={[styles.itemIcon, { backgroundColor: 'rgba(39, 174, 96, 0.15)' }]}>
          <MaterialCommunityIcons name="arrow-down-left" size={20} color="#27AE60" />
        </View>
        <View style={styles.itemInfo}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.note || 'Income'} {item.isRecurring ? `(${item.recurringFrequency})` : ''}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{formatDate(item.date)}</ThemedText>
        </View>
        <ThemedText type="defaultBold" style={{ color: '#27AE60' }}>+{formatAmount(item.amount)}</ThemedText>
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
  hero: { borderRadius: Radius.xlarge, padding: Spacing.four, overflow: 'hidden', justifyContent: 'center' },
  heroContent: { gap: Spacing.half, zIndex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroVal: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontVariant: ['tabular-nums'] },
  heroSub: { color: 'rgba(255,255,255,0.8)' },
  heroOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -70, top: -80, backgroundColor: 'rgba(139,123,255,0.2)' },
  formCard: { gap: Spacing.three },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  field: { gap: Spacing.one },
  input: { minHeight: 48, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchCopy: { flex: 1, gap: 2 },
  freqGrid: { flexDirection: 'row', gap: Spacing.two },
  freqChip: { flex: 1, minHeight: 40, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  addButton: { minHeight: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  list: { gap: Spacing.two },
  itemCard: { padding: Spacing.three },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  itemIcon: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  actionBtn: { padding: 4 },
  pressed: { opacity: 0.75 },
});
