import { initDatabase } from '@/storage/db';
import {
  getAllPayments,
  getAllReminders,
  insertPaymentWithDb,
  insertReminderWithDb,
} from '@/storage/financial-reminders-repository';
import {
  getAllContributions,
  getAllGoals,
  insertContributionWithDb,
  insertGoalWithDb,
} from '@/storage/goal-repository';
import { getAllIncome, insertIncomeWithDb } from '@/storage/income-repository';
import type { GoalContribution, MoneyGoal } from '@/types/goal';
import type { IncomeRecord } from '@/types/income';
import type { FinancialReminder, ReminderPaymentRecord } from '@/types/reminder';

export type RelationalSnapshot = {
  income: IncomeRecord[];
  goals: MoneyGoal[];
  contributions: GoalContribution[];
  reminders: FinancialReminder[];
  payments: ReminderPaymentRecord[];
};

export async function captureRelationalSnapshot(): Promise<RelationalSnapshot> {
  const [income, goals, contributions, reminders, payments] = await Promise.all([
    getAllIncome(),
    getAllGoals(),
    getAllContributions(),
    getAllReminders(),
    getAllPayments(),
  ]);

  return { income, goals, contributions, reminders, payments };
}

export async function replaceRelationalData(snapshot: RelationalSnapshot): Promise<void> {
  const db = await initDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM reminder_payments');
    await txn.runAsync('DELETE FROM financial_reminders');
    await txn.runAsync('DELETE FROM goal_contributions');
    await txn.runAsync('DELETE FROM money_goals');
    await txn.runAsync('DELETE FROM income_transactions');

    for (const goal of snapshot.goals) {
      await insertGoalWithDb(txn, goal);
    }
    for (const contribution of snapshot.contributions) {
      await insertContributionWithDb(txn, contribution);
    }
    for (const reminder of snapshot.reminders) {
      await insertReminderWithDb(txn, reminder);
    }
    for (const payment of snapshot.payments) {
      await insertPaymentWithDb(txn, payment);
    }
    for (const incomeRecord of snapshot.income) {
      await insertIncomeWithDb(txn, incomeRecord);
    }
  });
}
