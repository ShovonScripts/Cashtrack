import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { GoalCompletionModal } from '@/components/goal-completion-modal';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useGoals } from '@/context/goal-context';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { calculateGoalProgress } from '@/utils/goal-calculator';
import { formatDate } from '@/utils/expense';
import { confirmDelete } from '@/utils/confirm';
import type { GoalContribution } from '@/types/goal';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { goals, addContribution, deleteContribution, deleteGoal } = useGoals();
  const { formatAmount } = useExpenses();

  const goal = goals.find((g) => g.id === id);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  if (!goal) {
    return (
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: Spacing.four }]}>
        <ThemedText type="subtitle">Goal not found</ThemedText>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>← Back to Pots</ThemedText>
        </Pressable>
      </View>
    );
  }

  const calc = calculateGoalProgress({
    targetAmount: goal.targetAmount,
    startDate: goal.startDate,
    deadlineDate: goal.deadlineDate,
    currentAmount: goal.contributedAmount,
    frequency: goal.frequency,
    today: new Date(),
  });

  const handleAddContribution = async () => {
    const parsed = Number(contribAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('Please enter a valid contribution amount.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await addContribution({
        goalId: goal.id,
        amount: parsed,
        note: contribNote,
        date: new Date().toISOString(),
      });
      setContribAmount('');
      setContribNote('');
      setMessage('Contribution recorded.');

      const nextTotal = goal.contributedAmount + parsed;
      if (nextTotal >= goal.targetAmount && !goal.isCompleted) {
        setShowCompletionModal(true);
      }
    } catch {
      setMessage('Could not save contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = () => {
    confirmDelete(
      'Delete financial pot?',
      'This will permanently delete this pot and its contribution history.',
      async () => {
        await deleteGoal(goal.id);
        router.back();
      }
    );
  };

  const isAhead = calc.aheadBehindAmount >= 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Hero Card */}
        <View style={[styles.hero, { backgroundColor: Brand.deep }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>FINANCIAL POT · {goal.frequency.toUpperCase()}</ThemedText>
              <View style={[styles.statusPill, { backgroundColor: goal.isCompleted ? 'rgba(39, 174, 96, 0.25)' : 'rgba(255,255,255,0.15)' }]}>
                <ThemedText type="caption" style={{ color: goal.isCompleted ? '#2ecc71' : '#FFFFFF', fontWeight: '700' }}>
                  {goal.isCompleted ? 'Completed 🏆' : 'Active'}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="subtitle" style={styles.heroTitle}>{goal.title}</ThemedText>
            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>SAVED</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(goal.contributedAmount)}
                </ThemedText>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>TARGET</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(goal.targetAmount)}
                </ThemedText>
              </View>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
        </View>

        {/* Progress & Targets Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultBold">Progress breakdown</ThemedText>
            <ThemedText type="subtitle" style={{ color: theme.accent }}>{Math.round(goal.progressPercent)}%</ThemedText>
          </View>

          <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.fill, { width: `${Math.min(100, goal.progressPercent)}%`, backgroundColor: goal.isCompleted ? '#27AE60' : theme.accent }]} />
          </View>

          <View style={styles.metricsGrid}>
            <MetricItem label="Remaining" value={formatAmount(calc.remainingAmount)} />
            <MetricItem label="Time Left" value={`${calc.remainingDays} days`} />
            <MetricItem label="Expected" value={formatAmount(calc.expectedProgress)} />
            <MetricItem
              label="Status"
              value={goal.isCompleted ? 'Completed' : isAhead ? 'Ahead' : 'Behind'}
              valueColor={goal.isCompleted ? '#27AE60' : isAhead ? theme.accent : theme.danger}
            />
          </View>
        </Card>

        {/* Dynamic Recovery / Required Contributions */}
        {!goal.isCompleted && calc.remainingDays > 0 && (
          <Card style={styles.card}>
            <ThemedText type="defaultBold">Required contributions</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Dynamically calculated based on your remaining target and timeline.
            </ThemedText>
            <View style={styles.requiredRow}>
              <RequiredBadge label="Per Period" amount={formatAmount(calc.frequencyRequired)} />
              <RequiredBadge label="Weekly" amount={formatAmount(calc.weeklyRequired)} />
              <RequiredBadge label="Monthly" amount={formatAmount(calc.monthlyRequired)} />
            </View>
          </Card>
        )}

        {/* Add Contribution Form */}
        <Card style={styles.card}>
          <ThemedText type="defaultBold">Add contribution</ThemedText>
          <View style={styles.quickChipsRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <Pressable
                key={amt}
                onPress={() => setContribAmount(String(amt))}
                style={({ pressed }) => [styles.quickChip, { backgroundColor: theme.cardMuted, borderColor: theme.border }, pressed && styles.pressed]}>
                <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>+{amt}</ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.field}>
            <ThemedText type="smallBold">Amount</ThemedText>
            <TextInput
              value={contribAmount}
              onChangeText={(val) => { setContribAmount(val.replace(/[^0-9.]/g, '')); setMessage(''); }}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>
          <View style={styles.field}>
            <ThemedText type="smallBold">Note <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
            <TextInput
              value={contribNote}
              onChangeText={setContribNote}
              placeholder="e.g. Monthly savings transfer"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>
          {message ? <ThemedText type="caption" themeColor={message.includes('recorded') ? 'accent' : 'danger'}>{message}</ThemedText> : null}
          <Pressable
            onPress={handleAddContribution}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>Contribute</ThemedText>
          </Pressable>
        </Card>

        {/* Contributions History */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Contribution history</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{goal.contributions.length} entries</ThemedText>
        </View>

        {goal.contributions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState title="No contributions yet" message="Log your first savings contribution above." tone={theme.accent} />
          </Card>
        ) : (
          <View style={styles.list}>
            {goal.contributions.map((c) => (
              <ContributionItem
                key={c.id}
                contribution={c}
                formatAmount={formatAmount}
                onDelete={() => {
                  confirmDelete('Delete contribution?', 'Are you sure you want to remove this contribution?', () => {
                    deleteContribution(c.id);
                  });
                }}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={handleDeleteGoal}
          style={({ pressed }) => [styles.deleteGoalBtn, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.danger }}>Delete Pot / Goal</ThemedText>
        </Pressable>
      </View>

      <GoalCompletionModal
        goal={goal}
        visible={showCompletionModal || goal.isCompleted}
        onClose={() => setShowCompletionModal(false)}
        formatAmount={formatAmount}
      />
    </ScrollView>
  );
}

function MetricItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.metricItem, { backgroundColor: theme.cardMuted }]}>
      <ThemedText type="caption" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="defaultBold" style={[styles.metricVal, valueColor ? { color: valueColor } : undefined]} numberOfLines={1} adjustsFontSizeToFit>{value}</ThemedText>
    </View>
  );
}

function RequiredBadge({ label, amount }: { label: string; amount: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.requiredBadge, { backgroundColor: theme.cardMuted }]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="defaultBold" style={{ color: theme.accent }} numberOfLines={1} adjustsFontSizeToFit>{amount}</ThemedText>
    </View>
  );
}

function ContributionItem({ contribution, formatAmount, onDelete }: { contribution: GoalContribution; formatAmount: (amount: number) => string; onDelete: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.contribRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.contribCopy}>
        <ThemedText type="defaultBold">{formatAmount(contribution.amount)}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {formatDate(contribution.date)}{contribution.note ? ` · ${contribution.note}` : ''}
        </ThemedText>
      </View>
      <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete contribution" hitSlop={10} style={styles.deleteBtn}>
        <MaterialCommunityIcons name="delete-outline" size={18} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  hero: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
  },
  heroContent: { gap: Spacing.two, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  statusPill: { paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: Radius.pill },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 30 },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.half },
  heroStat: { flex: 1, gap: Spacing.half },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  heroStatVal: { color: '#FFFFFF', fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroOrbLarge: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -80, top: -90, backgroundColor: 'rgba(139,123,255,0.2)' },
  card: { padding: Spacing.four, gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metricItem: { width: '48%', flexGrow: 1, padding: Spacing.three, borderRadius: Radius.medium, gap: Spacing.half, alignItems: 'flex-start' },
  metricVal: { fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
  requiredRow: { gap: Spacing.two },
  requiredBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.medium },
  quickChipsRow: { flexDirection: 'row', gap: Spacing.two },
  quickChip: { flex: 1, height: 32, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  field: { gap: Spacing.one },
  input: { minHeight: 46, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16 },
  submitBtn: { minHeight: 46, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  list: { gap: Spacing.two },
  contribRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.three, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth },
  contribCopy: { flex: 1, gap: 2 },
  deleteBtn: { padding: 4 },
  deleteGoalBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.one },
  pressed: { opacity: 0.75 },
});
