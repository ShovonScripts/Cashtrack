import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { Chip, IconButton, Screen, StatStrip } from '@/components/ui';
import { GoalProgressCard } from '@/components/goal-progress-card';
import { LoadErrorState } from '@/components/load-error-state';
import { Spacing } from '@/constants/theme';
import { useGoals } from '@/context/goal-context';
import { usePreferences } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';

type FilterTab = 'active' | 'completed' | 'all';

export default function GoalsOverviewScreen() {
  const theme = useTheme();
  const { goals, isLoading, goalLoadError, reloadGoals } = useGoals();
  const { formatAmount } = usePreferences();
  const [tab, setTab] = useState<FilterTab>('active');

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const filtered = goals.filter((g) => {
    if (tab === 'active') return !g.isCompleted;
    if (tab === 'completed') return g.isCompleted;
    return true;
  });

  const totalPlanned = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.contributedAmount, 0);
  const emptyTitle = goals.length === 0 ? 'No financial pots yet' : tab === 'completed' ? 'No completed pots yet' : 'No active pots';
  const emptyMessage =
    goals.length === 0
      ? 'Plan ahead for travel, investments, or major purchases by creating your first pot.'
      : tab === 'completed'
        ? 'Pots you fully fund will appear here.'
        : 'Every pot is fully funded. Create another or check the completed tab.';

  return (
    <Screen topInset={false}>
        <Stack.Screen
          options={{
            headerRight: () => <IconButton icon="add" label="Create a new pot" onPress={() => router.push('/goals/add')} />,
          }}
        />
        <StatStrip
          items={[
            { label: 'Active saved', value: formatAmount(totalSaved), tone: 'success' },
            { label: 'Active targets', value: formatAmount(totalPlanned) },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['active', 'completed', 'all'] as FilterTab[]).map((t) => (
            <Chip
              key={t}
              label={`${t.charAt(0).toUpperCase()}${t.slice(1)} (${t === 'active' ? activeGoals.length : t === 'completed' ? completedGoals.length : goals.length})`}
              selected={tab === t}
              onPress={() => setTab(t)}
            />
          ))}
        </ScrollView>

        {/* Goals List */}
        <View style={styles.listSection}>
          {isLoading && goals.length === 0 ? (
            <SkeletonList rows={3} label="Loading your pots" />
          ) : goalLoadError ? (
            <Card style={styles.emptyCard}>
              <LoadErrorState
                title="Couldn't load your pots"
                message="Your savings data couldn't be read just now. Nothing has been deleted."
                onRetry={reloadGoals}
                isRetrying={isLoading}
              />
            </Card>
          ) : filtered.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title={emptyTitle}
                message={emptyMessage}
                tone={theme.accent}
                icon="piggy-bank-outline"
                actionLabel={goals.length === 0 ? 'Create a pot' : undefined}
                onAction={goals.length === 0 ? () => router.push('/goals/add') : undefined}
              />
            </Card>
          ) : (
            filtered.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                formatAmount={formatAmount}
                onPress={() => router.push({ pathname: '/goals/[id]', params: { id: goal.id } })}
              />
            ))
          )}
        </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterScroll: { gap: Spacing.two, paddingVertical: 2 },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center', gap: Spacing.one },
});
