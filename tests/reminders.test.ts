import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateNextDueDate } from '../src/utils/reminder-recurrence.ts';

function local(year: number, monthIndex: number, day: number, hours = 12, minutes = 0): Date {
  return new Date(year, monthIndex, day, hours, minutes, 0, 0);
}

test('reminder recurrence on 31st clamps to February and returns to 31st', () => {
  const anchor = local(2026, 0, 31); // Jan 31, 2026
  const iso1 = anchor.toISOString();

  const next1Iso = calculateNextDueDate(iso1, 'monthly', iso1);
  const next1 = new Date(next1Iso);
  assert.equal(next1.getMonth(), 1); // February
  assert.equal(next1.getDate(), 28);

  const next2Iso = calculateNextDueDate(next1Iso, 'monthly', iso1);
  const next2 = new Date(next2Iso);
  assert.equal(next2.getMonth(), 2); // March
  assert.equal(next2.getDate(), 31);
});

test('reminder recurrence in leap year on Jan 31 clamps to Feb 29', () => {
  const anchor = local(2028, 0, 31); // Jan 31, 2028 (leap year)
  const iso1 = anchor.toISOString();

  const next1Iso = calculateNextDueDate(iso1, 'monthly', iso1);
  const next1 = new Date(next1Iso);
  assert.equal(next1.getMonth(), 1); // February
  assert.equal(next1.getDate(), 29);
});

test('weekly reminder recurrence advances by exactly 7 days', () => {
  const anchor = local(2026, 0, 15);
  const iso1 = anchor.toISOString();

  const nextIso = calculateNextDueDate(iso1, 'weekly', iso1);
  const next = new Date(nextIso);
  assert.equal(next.getDate(), 22);
});
