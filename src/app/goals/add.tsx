import { router } from 'expo-router';

import { GoalForm } from '@/components/goal-form';
import { useGoals } from '@/context/goal-context';

export default function AddGoalScreen() {
  const { addGoal } = useGoals();

  return (
    <GoalForm
      suggestOnTypeChange
      submitLabel="Create pot"
      onCancel={() => router.back()}
      onSubmit={async (result) => {
        await addGoal({ ...result, startDate: new Date().toISOString() });
        router.back();
      }}
    />
  );
}
