import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
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
  const { incomeList, addIncome, deleteIncome } = useIncome();
  const { formatAmount } = useExpenses();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    if (isSubmitting) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('Please enter a valid amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      await addIncome({
        amount: parsed,
        note: note.trim(),
        date: new Date().toISOString(),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
      setAmount('');
      setNote('');
      setIsRecurring(false);
      setMessage('Income added successfully.');
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

        {/* Add Income Form Card */}
        <Card style={styles.formCard}>
          <ThemedText type="defaultBold">Record Money In</ThemedText>
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
            onPress={handleAdd}
            disabled={isSubmitting}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>Add Money In</ThemedText>
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
              <IncomeItem key={item.id} item={item} formatAmount={formatAmount} onDelete={() => deleteIncome(item.id)} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function IncomeItem({ item, formatAmount, onDelete }: { item: IncomeRecord; formatAmount: (amount: number) => string; onDelete: () => void }) {
  const theme = useTheme();
  return (
    <Card style={styles.itemCard}>
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
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete income" hitSlop={8} style={styles.deleteBtn}>
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
  deleteBtn: { padding: 4 },
  pressed: { opacity: 0.75 },
});
