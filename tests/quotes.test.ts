import { describe, it } from 'node:test';
import assert from 'node:assert';

import { FINANCIAL_QUOTES, getQuoteOfTheDay } from '../src/constants/quotes.ts';

describe('Quotes logic', () => {
  it('returns a valid quote from FINANCIAL_QUOTES', () => {
    const quote = getQuoteOfTheDay(new Date());
    assert.ok(quote.quote.length > 0);
    assert.ok(quote.author.length > 0);
    assert.ok(FINANCIAL_QUOTES.some((q) => q.quote === quote.quote && q.author === quote.author));
  });

  it('returns the exact same quote for the same date', () => {
    const d1 = new Date(2025, 5, 15, 8, 0, 0);
    const d2 = new Date(2025, 5, 15, 22, 30, 0);

    const q1 = getQuoteOfTheDay(d1);
    const q2 = getQuoteOfTheDay(d2);

    assert.strictEqual(q1.quote, q2.quote);
    assert.strictEqual(q1.author, q2.author);
  });

  it('rotates to a different or next quote on consecutive days', () => {
    const day1 = new Date(2025, 5, 15);
    const day2 = new Date(2025, 5, 16);

    const q1 = getQuoteOfTheDay(day1);
    const q2 = getQuoteOfTheDay(day2);

    if (FINANCIAL_QUOTES.length > 1) {
      assert.notStrictEqual(q1.quote, q2.quote);
    }
  });

  it('handles quotes list with non-empty values', () => {
    assert.ok(FINANCIAL_QUOTES.length >= 20);
    for (const item of FINANCIAL_QUOTES) {
      assert.ok(typeof item.quote === 'string' && item.quote.length > 0);
      assert.ok(typeof item.author === 'string' && item.author.length > 0);
    }
  });
});
