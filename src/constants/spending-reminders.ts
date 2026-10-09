export interface SpendingReminderMessage {
  title: string;
  body: string;
}

export const SPENDING_REMINDER_MESSAGES: SpendingReminderMessage[] = [
  {
    title: 'Daily Spending Check 🛒',
    body: 'Did you spend anything today? Log it in CashTrack to keep your budget accurate!',
  },
  {
    title: 'Don\'t Forget Your Expenses 💳',
    body: 'Quick check-in! Record today\'s purchases before heading to sleep.',
  },
  {
    title: 'Evening Expense Check 🌙',
    body: 'Spent money today? Take 10 seconds to log your transactions.',
  },
  {
    title: 'Mindful Money Check 💡',
    body: 'Keep your budget on track — log today\'s expenses in CashTrack.',
  },
  {
    title: 'Got Any Receipts Today? 🧾',
    body: 'Add today\'s receipts now to keep your financial records clear and up to date.',
  },
  {
    title: 'Did You Spend Today? ☕',
    body: 'Coffee, groceries, or bills? Tap to log today\'s spending.',
  },
  {
    title: 'Stay in Control 💰',
    body: 'A quick daily record keeps your monthly financial goals within reach!',
  },
  {
    title: 'End-of-Day Check-in 📊',
    body: 'Record today\'s spending to see your live remaining budget.',
  },
  {
    title: 'Track Your Cash Flow 📝',
    body: 'Did you pay for anything today? Add it now so nothing gets forgotten.',
  },
  {
    title: 'Daily CashTrack Check 📱',
    body: 'Take a moment to record any cash or card expenses from today.',
  },
];

/**
 * Returns a deterministic spending reminder message for a given date,
 * ensuring users receive varied, fresh messages each evening.
 */
export function getSpendingReminderMessage(date: Date = new Date()): SpendingReminderMessage {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const utcDate = Date.UTC(year, month, day);
  const epoch2000 = Date.UTC(2000, 0, 1);
  const dayIndex = Math.floor((utcDate - epoch2000) / (1000 * 60 * 60 * 24));

  const positiveDayIndex = Math.max(0, dayIndex);
  return SPENDING_REMINDER_MESSAGES[positiveDayIndex % SPENDING_REMINDER_MESSAGES.length];
}
