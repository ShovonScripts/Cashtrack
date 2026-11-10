import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { GoalForm } from '@/components/goal-form';
import { Screen, SkeletonList } from '@/components/ui';
import { useGoals } from '@/context/goal-context';
import { toPotChoice } from '@/utils/goal-form';

export default function EditPotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, isLoading, updateGoal } = useGoals();
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

  return (
    <GoalForm
      key={goal.id}
      excludeGoalId={goal.id}
      savedDeadline={goal.deadlineDate ? new Date(goal.deadlineDate) : null}
      startDate={goal.startDate}
      savedAmount={goal.contributedAmount}
      submitLabel="Save changes"
      initialValues={{
        title: goal.title,
        targetAmount: goal.targetAmount > 0 ? String(goal.targetAmount) : '',
        potType: toPotChoice(goal.potType),
        allocationType: goal.allocationType ?? 'manual',
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
