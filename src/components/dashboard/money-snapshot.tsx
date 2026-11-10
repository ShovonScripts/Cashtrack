import { router } from 'expo-router';
import { SummaryHeroCard } from '@/components/dashboard/summary-hero-card';
import { useDebts } from '@/context/debt-context';
import { useGoals } from '@/context/goal-context';
import { getRemainingBalance, summarizeDebts } from '@/utils/debt';

export function MoneyPlanSummaryCard({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { goals } = useGoals();
  const activeGoals = goals.filter((g) => !g.isCompleted);
  // Same totals as the pots page: active pots only.
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.contributedAmount, 0);
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  // Progress counts only money in pots that have a target, so open-ended pots cannot inflate it.
  const savedTowardTargets = activeGoals.reduce(
    (sum, g) => sum + (g.targetAmount > 0 ? Math.min(g.contributedAmount, g.targetAmount) : 0),
    0,
  );
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((savedTowardTargets / totalTarget) * 100)) : 0;
  const potCountLabel = `${activeGoals.length} active ${activeGoals.length === 1 ? 'pot' : 'pots'}`;

  return (
    <SummaryHeroCard
      title="MONEY PLAN & POTS"
      pill={`${overallProgress}% saved`}
      amount={totalSaved}
      formatAmount={formatAmount}
      chips={[
        { label: potCountLabel, tone: 'info' },
        { label: `of ${formatAmount(totalTarget)}`, tone: 'info' },
      ]}
      onPress={() => router.push('/goals')}
      accessibilityLabel={`Money plan and pots. ${formatAmount(totalSaved)} saved of ${formatAmount(totalTarget)}. ${potCountLabel}. ${overallProgress}% saved.`}
      accessibilityHint="Opens the savings goals and pots page"
      actionLabel="Add pot"
      onActionPress={() => router.push('/goals/add')}
    />
  );
}


export function MoneyOverview({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { debts } = useDebts();
  const { youAreOwed, youOwe, net } = summarizeDebts(debts);
  const openDebtCount = debts.filter((debt) => getRemainingBalance(debt) > 0).length;
  const netDescription =
    net > 0
      ? `Net owed to you ${formatAmount(net)}`
      : net < 0
        ? `Net you owe ${formatAmount(Math.abs(net))}`
        : `Net ${formatAmount(0)}`;

  return (
    <SummaryHeroCard
      title="LEND & BORROW"
      pill={`${openDebtCount} open`}
      amount={net}
      formatAmount={formatAmount}
      signed
      chips={[
        { label: `Owed: ${formatAmount(youAreOwed)}`, tone: 'positive' },
        { label: `Owe: ${formatAmount(youOwe)}`, tone: 'negative' },
      ]}
      onPress={() => router.push('/debts')}
      accessibilityLabel={`Lend and borrow. ${netDescription}. Owed to you ${formatAmount(youAreOwed)}. You owe ${formatAmount(youOwe)}. ${openDebtCount} open.`}
      accessibilityHint="Opens the debts and IOUs page"
      actionLabel="Add debt"
      onActionPress={() => router.push('/debts/add')}
    />
  );
}


