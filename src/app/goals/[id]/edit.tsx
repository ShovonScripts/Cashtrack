import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { GoalForm } from '@/components/goal-form';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useGoals } from '@/context/goal-context';
import { useTheme } from '@/hooks/use-theme';
import { toPotChoice } from '@/utils/goal-form';

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { goals, isLoading, updateGoal } = useGoals();
  const goal = goals.find((g) => g.id === id);

  if (!goal && isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} size="large" />
        <ThemedText type="small" themeColor="textSecondary">
          Loading pot…
        </ThemedText>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.centered}>
        <ThemedText type="subtitle">Pot not found</ThemedText>
        <Button label="Back to pots" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <GoalForm
      key={goal.id}
      excludeGoalId={goal.id}
      submitLabel="Save changes"
      initialValues={{
        title: goal.title,
        targetAmount: goal.targetAmount > 0 ? String(goal.targetAmount) : '',
        potType: toPotChoice(goal.potType),
        allocationType: goal.allocationType ?? 'percentage',
        allocationPercent: goal.allocationPercent ? String(goal.allocationPercent) : '10',
        frequency: goal.frequency ?? 'monthly',
        deadlineDate: goal.deadlineDate ? new Date(goal.deadlineDate) : sixMonthsFromNow(),
      }}
      onCancel={() => router.back()}
      onSubmit={async (result) => {
        await updateGoal({
          ...goal,
          ...result,
          // Clearing or raising the target reopens a finished pot.
          status: result.targetAmount <= 0 || result.targetAmount > goal.contributedAmount ? 'active' : goal.status,
        });
        router.back();
      }}
    />
  );
}

function sixMonthsFromNow(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
});
