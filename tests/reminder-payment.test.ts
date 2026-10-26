import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyReminderPayment,
  getReminderRemainingAmount,
  hasPartialPayment,
  isOverpayment,
} from '../src/utils/reminder-payment.ts';
import type { FinancialReminder } from '../src/types/reminder.ts';

const NOW = '2026-02-01T12:00:00.000Z';

function localIso(year: number, monthIndex: number, day: number): string {
  return new Date(year, monthIndex, day, 10, 0, 0, 0).toISOString();
}

function makeReminder(overrides: Partial<FinancialReminder> = {}): FinancialReminder {
  const dueDate = localIso(2026, 0, 15);
  return {
    id: 'rem-1',
    title: 'Rent',
    amount: 100,
    isVariableAmount: false,
    category: 'Rent',
    dueDate,
    originalDueDate: dueDate,
    repeatType: 'monthly',
    status: 'upcoming',
    notes: '',
    paidAmountCurrentCycle: 0,
    isAlarm: false,
    createdAt: dueDate,
    updatedAt: dueDate,
    ...overrides,
  };
}

test('remaining amount accounts for payments already applied this cycle', () => {
  assert.equal(getReminderRemainingAmount(makeReminder()), 100);
  assert.equal(getReminderRemainingAmount(makeReminder({ paidAmountCurrentCycle: 35 })), 65);
  assert.equal(getReminderRemainingAmount(makeReminder({ paidAmountCurrentCycle: 140 })), 0);
  assert.equal(getReminderRemainingAmount(makeReminder({ status: 'paid' })), 0);
  assert.equal(getReminderRemainingAmount(makeReminder({ isVariableAmount: true, amount: null })), null);
});

test('partial payment detection ignores stale negative credits', () => {
  assert.equal(hasPartialPayment(makeReminder()), false);
  assert.equal(hasPartialPayment(makeReminder({ paidAmountCurrentCycle: -5 })), false);
  assert.equal(hasPartialPayment(makeReminder({ paidAmountCurrentCycle: 0.01 })), true);
});

test('overpayment is blocked without rejecting the remaining balance or small rounding', () => {
  assert.equal(isOverpayment(makeReminder(), 100), false);
  assert.equal(isOverpayment(makeReminder(), 100.01), true);
  assert.equal(isOverpayment(makeReminder({ paidAmountCurrentCycle: 35 }), 65), false);
  assert.equal(isOverpayment(makeReminder({ paidAmountCurrentCycle: 35 }), 65.01), true);
  assert.equal(isOverpayment(makeReminder({ amount: 0.3, paidAmountCurrentCycle: 0.1 }), 0.2), false);
  assert.equal(isOverpayment(makeReminder({ isVariableAmount: true, amount: null }), 999), false);
  assert.equal(isOverpayment(makeReminder({ status: 'paid' }), 1), true);
});

test('a partial payment is accumulated without advancing the due date', () => {
  const reminder = makeReminder();
  const result = applyReminderPayment(reminder, 30, NOW);

  assert.equal(result.coversFullAmount, false);
  assert.equal(result.remainingAmount, 70);
  assert.equal(result.reminder.paidAmountCurrentCycle, 30);
  assert.equal(result.reminder.dueDate, reminder.dueDate);
  assert.equal(result.reminder.status, 'upcoming');
  assert.equal(reminder.paidAmountCurrentCycle, 0);
});

test('a later partial payment that clears the balance advances a recurring bill', () => {
  const first = applyReminderPayment(makeReminder(), 30, NOW);
  const second = applyReminderPayment(first.reminder, 70, NOW);
  const nextDue = new Date(second.reminder.dueDate);

  assert.equal(second.coversFullAmount, true);
  assert.equal(second.remainingAmount, 0);
  assert.equal(second.reminder.paidAmountCurrentCycle, 0);
  assert.equal(second.reminder.status, 'upcoming');
  assert.equal(nextDue.getMonth(), 1);
  assert.equal(nextDue.getDate(), 15);
});

test('a one-time bill closes only after the full balance is covered', () => {
  const reminder = makeReminder({ repeatType: 'one-time' });
  const first = applyReminderPayment(reminder, 40, NOW);
  const second = applyReminderPayment(first.reminder, 60, NOW);

  assert.equal(first.reminder.status, 'upcoming');
  assert.equal(first.reminder.paidAmountCurrentCycle, 40);
  assert.equal(second.reminder.status, 'paid');
  assert.equal(second.reminder.paidAmountCurrentCycle, 0);
});

test('a variable bill closes on the recorded payment amount', () => {
  const reminder = makeReminder({ isVariableAmount: true, amount: null, repeatType: 'one-time' });
  const result = applyReminderPayment(reminder, 63.25, NOW);

  assert.equal(result.coversFullAmount, true);
  assert.equal(result.remainingAmount, 0);
  assert.equal(result.reminder.status, 'paid');
});

test('EMI installments increase only when a cycle is fully paid', () => {
  const reminder = makeReminder({
    category: 'EMI',
    amount: 200,
    totalInstallments: 2,
    paidInstallments: 0,
  });

  const partial = applyReminderPayment(reminder, 80, NOW);
  assert.equal(partial.reminder.paidInstallments, 0);

  const firstCycle = applyReminderPayment(partial.reminder, 120, NOW);
  assert.equal(firstCycle.reminder.paidInstallments, 1);
  assert.equal(firstCycle.reminder.status, 'upcoming');

  const secondCycle = applyReminderPayment(firstCycle.reminder, 200, NOW);
  assert.equal(secondCycle.reminder.paidInstallments, 2);
  assert.equal(secondCycle.reminder.status, 'paid');
});

test('overpayment and floating point cents still close the cycle', () => {
  const overpaid = applyReminderPayment(makeReminder({ amount: 50 }), 75, NOW);
  assert.equal(overpaid.coversFullAmount, true);
  assert.equal(overpaid.remainingAmount, 0);

  const cents = applyReminderPayment(makeReminder({ amount: 0.3 }), 0.1, NOW);
  const closed = applyReminderPayment(cents.reminder, 0.2, NOW);
  assert.equal(closed.coversFullAmount, true);
  assert.equal(closed.reminder.paidAmountCurrentCycle, 0);
});
