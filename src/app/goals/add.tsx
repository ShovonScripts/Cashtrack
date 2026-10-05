import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useGoals } from '@/context/goal-context';
import { useTheme } from '@/hooks/use-theme';
import type { GoalFrequency } from '@/types/goal';

const FREQUENCIES: { label: string; value: GoalFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Half-Yearly', value: 'half-yearly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function AddGoalScreen() {
  const theme = useTheme();
  const { addGoal } = useGoals();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [frequency, setFrequency] = useState<GoalFrequency>('monthly');
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    if (isSubmitting) return;
    const trimmedTitle = title.trim();
    const parsedTarget = Number(targetAmount);

    if (!trimmedTitle) {
      setMessage('Please enter a goal or pot title.');
      return;
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setMessage('Please enter a valid target amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const startDate = new Date().toISOString();

      await addGoal({
        title: trimmedTitle,
        targetAmount: parsedTarget,
        startDate,
        deadlineDate: deadlineDate.toISOString(),
        frequency,
      });

      router.back();
    } catch {
      setMessage('Could not create goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Create a financial pot</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Plan ahead for travel, investments, or major future purchases with a target deadline.
          </ThemedText>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.field}>
            <ThemedText type="smallBold">Pot Title</ThemedText>
            <TextInput
              value={title}
              onChangeText={(val) => { setTitle(val); setMessage(''); }}
              placeholder="e.g. Japan Trip, New Phone, Emergency Fund"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              accessibilityLabel="Pot title"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Target Amount</ThemedText>
            <TextInput
              value={targetAmount}
              onChangeText={(val) => { setTargetAmount(val.replace(/[^0-9.]/g, '')); setMessage(''); }}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              accessibilityLabel="Target amount"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Target Deadline Date</ThemedText>
            <DatePicker value={deadlineDate} onChange={setDeadlineDate} />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Contribution Frequency</ThemedText>
            <View style={styles.freqGrid}>
              {FREQUENCIES.map((f) => {
                const selected = frequency === f.value;
                return (
                  <Pressable
                    key={f.value}
                    onPress={() => setFrequency(f.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
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

          {message ? <ThemedText type="caption" themeColor="danger">{message}</ThemedText> : null}

          <Pressable
            onPress={handleCreate}
            disabled={isSubmitting}
            accessibilityRole="button"
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>Create Pot</ThemedText>
          </Pressable>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  title: { fontSize: 26, lineHeight: 32 },
  formCard: { gap: Spacing.three },
  field: { gap: Spacing.one },
  input: { minHeight: 48, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  freqChip: { minHeight: 40, paddingHorizontal: Spacing.three, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  submitBtn: { minHeight: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.one },
  pressed: { opacity: 0.75 },
});
