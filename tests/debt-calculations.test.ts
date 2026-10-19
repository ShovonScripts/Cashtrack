import assert from 'node:assert/strict';
import test from 'node:test';

import type { DebtRecord, DebtPayment } from '../src/types/debt.ts';
import {
  buildDebtShareMessage,
  getRemainingBalance,
  getTotalPaid,
  isDebtSettled,
  summarizeDebts,
} from '../src/utils/debt.ts';
import { debtReducer } from '../src/utils/debt-reducer.ts';

const ISO = '2026-09-01T12:00:00.000Z';

function payment(overrides: Partial<DebtPayment> = {}): DebtPayment {
  return {
    id: 'p1',
    debtId: 'd1',
    amount: 100,
    date: ISO,
    note: '',
    ...overrides,
  };
}

function debt(overrides: Partial<DebtRecord> = {}): DebtRecord {
  return {
    id: 'd1',
    personName: 'Sam',
    amount: 1000,
    type: 'lent',
    date: ISO,
    dueDate: null,
    status: 'active',
    note: '',
    settledDate: null,
    payments: [],
    ...overrides,
  };
}

const label = (amount: number) => `T${amount}`;
const dueLabel = (iso: string) => `D(${iso.slice(0, 10)})`;

test('no payments: the full amount remains outstanding', () => {
  assert.equal(getTotalPaid(debt()), 0);
  assert.equal(getRemainingBalance(debt()), 1000);
});

test('partial payments: only the unpaid amount remains', () => {
  const d = debt({ payments: [payment({ amount: 400 }), payment({ id: 'p2', amount: 100 })] });
  assert.equal(getTotalPaid(d), 500);
  assert.equal(getRemainingBalance(d), 500);
});

test('fully paid debt: zero outstanding', () => {
  const d = debt({ payments: [payment({ amount: 1000 })] });
  assert.equal(getRemainingBalance(d), 0);
  assert.equal(isDebtSettled(d), true);
});

test('settled debt reports zero outstanding even without full payments', () => {
  const settledNoPayments = debt({ status: 'settled', settledDate: ISO });
  assert.equal(getRemainingBalance(settledNoPayments), 0);

  const settledPartial = debt({
    status: 'settled',
    settledDate: ISO,
    payments: [payment({ amount: 250 })],
  });
  assert.equal(getRemainingBalance(settledPartial), 0);
  assert.equal(isDebtSettled(settledPartial), true);
});

test('overpayment never yields a negative balance', () => {
  const d = debt({ payments: [payment({ amount: 1500 })] });
  assert.equal(getRemainingBalance(d), 0);
});

test('malformed payments are ignored when summing', () => {
  const d = debt({
    payments: [
      payment({ amount: 200 }),
      payment({ id: 'p2', amount: Number.NaN }),
      payment({ id: 'p3', amount: -50 }),
      payment({ id: 'p4', amount: Number.POSITIVE_INFINITY }),
    ],
  });
  assert.equal(getTotalPaid(d), 200);
  assert.equal(getRemainingBalance(d), 800);
});

test('summaries use remaining balances and exclude settled debts', () => {
  const debts = [
    debt({ id: 'a', type: 'lent', amount: 1000, payments: [payment({ amount: 400 })] }), // 600 owed to you
    debt({ id: 'b', type: 'borrowed', amount: 500 }), // 500 you owe
    debt({ id: 'c', type: 'lent', amount: 900, status: 'settled', settledDate: ISO }), // excluded
  ];

  assert.deepEqual(summarizeDebts(debts), { youAreOwed: 600, youOwe: 500, net: 100 });
  assert.deepEqual(summarizeDebts([]), { youAreOwed: 0, youOwe: 0, net: 0 });
});

test('share message reports the remaining balance, not the original', () => {
  const d = debt({ amount: 1000, payments: [payment({ amount: 700 })], dueDate: ISO });
  const message = buildDebtShareMessage(d, label, dueLabel);

  assert.match(message, /T300 still outstanding/);
  assert.match(message, /T1000/);
  assert.match(message, /D\(2026-09-01\)/);
});

test('share message states when a debt is settled', () => {
  const lentSettled = buildDebtShareMessage(debt({ status: 'settled', settledDate: ISO }), label, dueLabel);
  assert.match(lentSettled, /T1000 .*fully settled/);

  const borrowedPaidOff = buildDebtShareMessage(
    debt({ type: 'borrowed', amount: 500, payments: [payment({ amount: 500 })] }),
    label,
    dueLabel
  );
  assert.match(borrowedPaidOff, /borrowed from you is fully settled/);
});

test('reducer: a partial payment keeps the debt active', () => {
  const next = debtReducer([debt()], { type: 'ADD_PAYMENT', debtId: 'd1', payment: payment({ amount: 300 }) });
  assert.equal(next[0].status, 'active');
  assert.equal(next[0].payments?.length, 1);
  assert.equal(getRemainingBalance(next[0]), 700);
});

test('reducer: a full payment settles the debt exactly once', () => {
  const next = debtReducer([debt()], { type: 'ADD_PAYMENT', debtId: 'd1', payment: payment({ amount: 1000 }) });
  assert.equal(next[0].status, 'settled');
  assert.equal(next[0].payments?.length, 1);
  assert.equal(getRemainingBalance(next[0]), 0);
});

test('reducer: settling twice does not duplicate payments or change the settled date', () => {
  const start = debt({ amount: 1000, payments: [payment({ amount: 400 })] });
  const once = debtReducer([start], { type: 'SETTLE_DEBT', id: 'd1', settledDate: '2026-10-01T00:00:00.000Z' });
  const twice = debtReducer(once, { type: 'SETTLE_DEBT', id: 'd1', settledDate: '2026-11-11T00:00:00.000Z' });

  assert.equal(twice[0].status, 'settled');
  assert.equal(twice[0].payments?.length, 1);
  assert.equal(twice[0].settledDate, '2026-10-01T00:00:00.000Z');
  assert.equal(getRemainingBalance(twice[0]), 0);
});

test('reducer: settling creates no payment record', () => {
  const next = debtReducer([debt()], { type: 'SETTLE_DEBT', id: 'd1', settledDate: ISO });
  assert.deepEqual(next[0].payments, []);
});

test('reducer: deleting a payment reopens the balance', () => {
  const start = debt({ amount: 1000, payments: [payment({ amount: 1000 })], status: 'settled', settledDate: ISO });
  const next = debtReducer([start], { type: 'DELETE_PAYMENT', debtId: 'd1', paymentId: 'p1' });
  assert.equal(next[0].status, 'active');
  assert.equal(getRemainingBalance(next[0]), 1000);
});
