import { router } from 'expo-router';

import { SummaryHeroCard } from '@/components/dashboard/summary-hero-card';

export function MoneySummaryCard({
  moneyIn,
  moneyOut,
  net,
  formatAmount,
  monthLabel,
}: {
  moneyIn: number;
  moneyOut: number;
  net: number;
  formatAmount: (amount: number) => string;
  monthLabel: string;
}) {
  const roundedNet = Math.round(net * 100) / 100;
  const netDescription =
    roundedNet > 0
      ? `Net positive ${formatAmount(roundedNet)}`
      : roundedNet < 0
        ? `Net negative ${formatAmount(Math.abs(roundedNet))}`
        : `Net ${formatAmount(0)}`;

  return (
    <SummaryHeroCard
      title="MONTHLY CASH FLOW"
      pill={monthLabel}
      amount={net}
      formatAmount={formatAmount}
      signed
      chips={[
        { label: `In: ${formatAmount(moneyIn)}`, tone: 'positive' },
        { label: `Out: ${formatAmount(moneyOut)}`, tone: 'negative' },
      ]}
      onPress={() => router.push('/income')}
      accessibilityLabel={`Monthly cash flow for ${monthLabel}. ${netDescription}. Money in ${formatAmount(moneyIn)}. Money out ${formatAmount(moneyOut)}.`}
      accessibilityHint="Opens the income page"
      actionLabel="Add income"
      onActionPress={() => router.push('/income')}
    />
  );
}
