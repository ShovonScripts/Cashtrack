import { describe, it } from 'node:test';
import assert from 'node:assert';

import { SPENDING_REMINDER_MESSAGES, getSpendingReminderMessage } from '../src/constants/spending-reminders.ts';

describe('Spending reminders logic', () => {
  it('returns a valid spending reminder message', () => {
    const msg = getSpendingReminderMessage(new Date());
    assert.ok(msg.title.length > 0);
    assert.ok(msg.body.length > 0);
    assert.ok(SPENDING_REMINDER_MESSAGES.some((m) => m.title === msg.title && m.body === msg.body));
  });

  it('returns the exact same message for the same date', () => {
    const d1 = new Date(2025, 8, 20, 10, 0, 0);
    const d2 = new Date(2025, 8, 20, 20, 0, 0);

    const m1 = getSpendingReminderMessage(d1);
    const m2 = getSpendingReminderMessage(d2);

    assert.strictEqual(m1.title, m2.title);
    assert.strictEqual(m1.body, m2.body);
  });

  it('rotates message on consecutive days', () => {
    const day1 = new Date(2025, 8, 20);
    const day2 = new Date(2025, 8, 21);

    const m1 = getSpendingReminderMessage(day1);
    const m2 = getSpendingReminderMessage(day2);

    if (SPENDING_REMINDER_MESSAGES.length > 1) {
      assert.notStrictEqual(m1.title, m2.title);
    }
  });

  it('contains diverse check-in prompts', () => {
    assert.ok(SPENDING_REMINDER_MESSAGES.length >= 10);
    for (const item of SPENDING_REMINDER_MESSAGES) {
      assert.ok(typeof item.title === 'string' && item.title.length > 0);
      assert.ok(typeof item.body === 'string' && item.body.length > 0);
    }
  });
});
