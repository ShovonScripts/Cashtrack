import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { GoalCompletionModal } from '@/components/goal-completion-modal';
import { AddMoneySheet } from '@/components/pots/add-money-sheet';
import { PotSavingsChart } from '@/components/pots/pot-savings-chart';
import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Icon, IconButton, ProgressMeter, Screen, Section, SkeletonList } from '@/components/ui';
import type { GlyphName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useGoals, type GoalWithProgress } from '@/context/goal-context';
import { useNow } from '@/hooks/use-now';
import { usePotDelete } from '@/hooks/use-pot-delete';
import { useTheme } from '@/hooks/use-theme';
import type { GoalContribution } from '@/types/goal';
import { formatDate } from '@/utils/expense';
import { calculateGoalProgress } from '@/utils/goal-calculator';
import {
  FREQUENCY_UNIT,
  isAutoSaveContribution,
  isOpenEndedPot,
  nextMilestone,
  overdueDays,
  potGlyph,
  potStatus,
  potTypeLabel,
  ruleLabel,
} from '@/utils/pot-display';

/** Long histories show the newest entries first and fold the rest away. */
const HISTORY_PREVIEW = 10;

export default function PotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const { goals, isLoading, addContribution } = useGoals();
  const { formatAmount } = usePreferences();
  const { deletePot, deletePotContribution } = usePotDelete();
  const now = useNow(60_000);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const goal = goals.find((g) => g.id === id);

  if (!goal && isLoading) {
    return (
      <Screen topInset={false}>
        <SkeletonList rows={3} label="Loading pot" />
      </Screen>
    );
  }

  if (!goal) {
    return (
      <Screen topInset={false}>
        <EmptyState
          title="Pot not found"
          message="This pot no longer exists."
          icon="piggy-bank-outline"
          actionLabel="Back to pots"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const calc = calculateGoalProgress({
    targetAmount: goal.targetAmount,
    startDate: goal.startDate,
    deadlineDate: goal.deadlineDate,
    currentAmount: goal.contributedAmount,
    frequency: goal.frequency,
    today: now,
  });
  const status = potStatus(goal, now);
  const hasTarget = goal.targetAmount > 0;
  const openEnded = isOpenEndedPot(goal);
  const late = overdueDays(goal, now);
  const milestone = nextMilestone(goal.contributedAmount, goal.targetAmount);
  const goEdit = () => router.push({ pathname: '/goals/[id]/edit', params: { id: goal.id } });

  const saveMoney = async (amount: number, note: string) => {
    await addContribution({ goalId: goal.id, amount, note, date: new Date().toISOString() });
    if (hasTarget && !goal.isCompleted && goal.contributedAmount + amount >= goal.targetAmount) {
      setShowCompletion(true);
    }
  };

  const history = showAllHistory ? goal.contributions : goal.contributions.slice(0, HISTORY_PREVIEW);
  const hasAutoSave = goal.contributions.some(isAutoSaveContribution);

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <IconButton icon="edit" label="Edit pot" onPress={goEdit} /> }}
      />
      <Screen topInset={false}>
        <PotSummary goal={goal} status={status} formatAmount={formatAmount} />

        {hasTarget ? (
          <Card style={styles.gap}>
            <ProgressMeter
              fill={goal.progressPercent / 100}
              color={goal.isCompleted ? colors.success : colors.accent}
              marker={!openEnded && !goal.isCompleted && calc.expectedProgress > 0 ? calc.expectedProgress / goal.targetAmount : undefined}
              label={`${goal.title} progress, ${status.label}`}
              valueText={`${Math.round(goal.progressPercent)} percent saved, ${formatAmount(calc.remainingAmount)} to go`}>
              <View style={styles.meterRow}>
                <ThemedText type="smallBold">{Math.round(goal.progressPercent)}% saved</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {goal.isCompleted ? 'Target reached' : `${formatAmount(calc.remainingAmount)} to go`}
                </ThemedText>
              </View>
            </ProgressMeter>
            <PaceLine goal={goal} aheadBehind={calc.aheadBehindAmount} openEnded={openEnded} late={late} formatAmount={formatAmount} />
            {milestone && !goal.isCompleted ? (
              <ThemedText type="caption" themeColor="textSecondary">
                Next milestone: {milestone.percent}% at {formatAmount(milestone.amount)}
              </ThemedText>
            ) : null}
          </Card>
        ) : null}

        <Button label="Add money" onPress={() => setSheetOpen(true)} />

        {!openEnded && !goal.isCompleted && calc.remainingAmount > 0 ? (
          <Section
            title="Your plan"
            subtitle={late > 0 ? 'The deadline has passed, so the rest is due now.' : 'To reach the target by the deadline.'}>
            <Card padded={false}>
              <DetailRow label={`Per ${FREQUENCY_UNIT[goal.frequency]}`} value={formatAmount(calc.frequencyRequired)} strong />
              {goal.frequency !== 'monthly' && late === 0 ? (
                <>
                  <CardDivider />
                  <DetailRow label="Per month" value={formatAmount(calc.monthlyRequired)} />
                </>
              ) : null}
              <CardDivider />
              <DetailRow label="Deadline" value={formatDate(goal.deadlineDate!)} />
              <CardDivider />
              <DetailRow
                label={late > 0 ? 'Late by' : 'Time left'}
                value={late > 0 ? plural(late, 'day') : plural(calc.remainingDays, 'day')}
                tone={late > 0 ? 'danger' : undefined}
              />
            </Card>
          </Section>
        ) : null}

        {goal.contributions.length >= 2 ? (
          <Section title="Savings over time">
            <Card>
              <PotSavingsChart contributions={goal.contributions} targetAmount={goal.targetAmount} formatAmount={formatAmount} />
            </Card>
          </Section>
        ) : null}

        <Section
          title="History"
          subtitle={hasAutoSave ? 'Auto-save entries follow their income. Edit or delete the income to change them.' : undefined}
          action={
            goal.contributions.length > 0 ? (
              <ThemedText type="caption" themeColor="textSecondary">
                {plural(goal.contributions.length, 'entry', 'entries')}
              </ThemedText>
            ) : undefined
          }>
          {goal.contributions.length === 0 ? (
            <Card>
              <EmptyState
                title="Nothing saved yet"
                message="Tap Add money to put your first amount in this pot."
                icon="cash-plus"
              />
            </Card>
          ) : (
            <Card padded={false}>
              {history.map((c, index) => (
                <View key={c.id}>
                  {index > 0 ? <CardDivider /> : null}
                  <ContributionRow contribution={c} formatAmount={formatAmount} onDelete={() => deletePotContribution(c)} />
                </View>
              ))}
            </Card>
          )}
          {goal.contributions.length > HISTORY_PREVIEW ? (
            <Button
              label={showAllHistory ? 'Show fewer' : `Show all ${goal.contributions.length}`}
              variant="ghost"
              onPress={() => setShowAllHistory((v) => !v)}
            />
          ) : null}
        </Section>

        <Button label="Delete pot" variant="danger" onPress={() => deletePot(goal, () => router.back())} />
      </Screen>

      <AddMoneySheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        potTitle={goal.title}
        remainingAmount={hasTarget ? calc.remainingAmount : 0}
        onSave={saveMoney}
      />
      <GoalCompletionModal
        goal={goal}
        visible={showCompletion}
        onClose={() => setShowCompletion(false)}
        formatAmount={formatAmount}
      />
    </>
  );
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function PotSummary({
  goal,
  status,
  formatAmount,
}: {
  goal: GoalWithProgress;
  status: ReturnType<typeof potStatus>;
  formatAmount: (amount: number) => string;
}) {
  const colors = useTheme();
  const hasTarget = goal.targetAmount > 0;
  return (
    <Card style={styles.gap}>
      <View style={styles.titleRow}>
        <View style={[styles.iconTile, { backgroundColor: colors.accentMuted }]}>
          <Icon name={potGlyph(goal.potType) as GlyphName} size="lg" color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <ThemedText type="subtitle" numberOfLines={2}>
            {goal.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {potTypeLabel(goal.potType)} pot
          </ThemedText>
        </View>
      </View>
      <View>
        <ThemedText type="micro" themeColor="textSecondary" style={styles.eyebrow}>
          SAVED
        </ThemedText>
        <ThemedText type="hero" numberOfLines={1} adjustsFontSizeToFit style={styles.tabular}>
          {formatAmount(goal.contributedAmount)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hasTarget ? `of ${formatAmount(goal.targetAmount)} target` : 'No target: save as much as you like'}
        </ThemedText>
      </View>
      <View style={styles.badges}>
        <Badge label={status.label} tone={status.tone} />
        <Badge label={ruleLabel(goal)} icon={goal.allocationType === 'percentage' ? 'lightning-bolt' : undefined} />
      </View>
    </Card>
  );
}

function PaceLine({
  goal,
  aheadBehind,
  openEnded,
  late,
  formatAmount,
}: {
  goal: GoalWithProgress;
  aheadBehind: number;
  openEnded: boolean;
  late: number;
  formatAmount: (amount: number) => string;
}) {
  if (goal.isCompleted) {
    return (
      <ThemedText type="caption" themeColor="success">
        Well done: this pot reached its target.
      </ThemedText>
    );
  }
  if (openEnded) return null;
  if (late > 0) {
    return (
      <ThemedText type="caption" themeColor="danger">
        The deadline was {formatDate(goal.deadlineDate!)}. Move it in Edit, or add the rest now.
      </ThemedText>
    );
  }
  return aheadBehind >= 0 ? (
    <ThemedText type="caption" themeColor="success">
      {aheadBehind > 0 ? `${formatAmount(aheadBehind)} ahead of plan.` : 'Right on plan.'} The tick shows where you should be today.
    </ThemedText>
  ) : (
    <ThemedText type="caption" themeColor="warning">
      {formatAmount(Math.abs(aheadBehind))} behind plan. The tick shows where you should be today.
    </ThemedText>
  );
}

function DetailRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'danger';
}) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type={strong ? 'defaultBold' : 'smallBold'} themeColor={tone} style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function ContributionRow({
  contribution,
  formatAmount,
  onDelete,
}: {
  contribution: GoalContribution;
  formatAmount: (amount: number) => string;
  onDelete: () => void;
}) {
  const auto = isAutoSaveContribution(contribution);
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <View style={styles.amountLine}>
          <ThemedText type="defaultBold" style={styles.tabular}>
            {formatAmount(contribution.amount)}
          </ThemedText>
          {auto ? <Badge label="Auto-save" tone="success" icon="lightning-bolt" /> : null}
        </View>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
          {formatDate(contribution.date)}
          {!auto && contribution.note ? ` · ${contribution.note}` : ''}
        </ThemedText>
      </View>
      {auto ? null : (
        <IconButton icon="delete" label={`Delete ${formatAmount(contribution.amount)} entry`} onPress={onDelete} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconTile: { width: 48, height: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { letterSpacing: 1.2 },
  tabular: { fontVariant: ['tabular-nums'] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
    paddingVertical: Spacing.two,
  },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  amountLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
});
