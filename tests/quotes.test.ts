import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FINANCIAL_QUOTES,
  QUOTE_TOPICS,
  getDailyQuote,
  getQuoteById,
  getQuotePool,
  type FinancialQuote,
} from '../src/constants/quotes.ts';

function day(offset: number): Date {
  return new Date(2026, 0, 1 + offset, 12, 0, 0);
}

describe('quote library', () => {
  it('has at least 20 complete quotes with unique ids and known topics', () => {
    assert.ok(FINANCIAL_QUOTES.length >= 20);
    const ids = new Set<string>();
    const topicKeys = new Set(QUOTE_TOPICS.map((topic) => topic.key));
    for (const item of FINANCIAL_QUOTES) {
      assert.ok(item.id.length > 0 && /^[a-z0-9-]+$/.test(item.id), item.id);
      assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
      ids.add(item.id);
      assert.ok(item.quote.trim().length > 0);
      assert.ok(item.author.trim().length > 0);
      assert.ok(item.topics.length > 0, `${item.id} has no topic`);
      for (const topic of item.topics) assert.ok(topicKeys.has(topic), `${item.id}: ${topic}`);
    }
  });

  it('every topic has at least one quote', () => {
    for (const topic of QUOTE_TOPICS) {
      assert.ok(FINANCIAL_QUOTES.some((quote) => quote.topics.includes(topic.key)), topic.key);
    }
  });

  it('finds a quote by id', () => {
    const first = FINANCIAL_QUOTES[0];
    assert.equal(getQuoteById(first.id), first);
    assert.equal(getQuoteById('missing'), undefined);
  });
});

describe('getDailyQuote', () => {
  it('gives the same quote all day long', () => {
    const morning = new Date(2025, 5, 15, 0, 5);
    const night = new Date(2025, 5, 15, 23, 55);
    assert.equal(getDailyQuote(morning).id, getDailyQuote(night).id);
  });

  it('never repeats a quote within a round, and never twice in a row', () => {
    const count = FINANCIAL_QUOTES.length;
    // Day index of 2026-01-01 is not a multiple of count, so scan whole rounds by index.
    let previous: string | null = null;
    const seenByRound = new Map<number, Set<string>>();
    for (let offset = 0; offset < count * 6; offset += 1) {
      const date = day(offset);
      const id = getDailyQuote(date).id;
      const dayIndex = Math.floor((Date.UTC(2026, 0, 1 + offset) - Date.UTC(2000, 0, 1)) / 86_400_000);
      const round = Math.floor(dayIndex / count);
      const seen = seenByRound.get(round) ?? new Set<string>();
      assert.ok(!seen.has(id), `repeat ${id} in round ${round}`);
      seen.add(id);
      seenByRound.set(round, seen);
      assert.notEqual(id, previous, `same quote two days running at offset ${offset}`);
      previous = id;
    }
  });

  it('shows every quote once per full round', () => {
    const count = FINANCIAL_QUOTES.length;
    const firstDayIndex = Math.floor((Date.UTC(2026, 0, 1) - Date.UTC(2000, 0, 1)) / 86_400_000);
    const roundStartOffset = (count - (firstDayIndex % count)) % count;
    const ids = new Set<string>();
    for (let i = 0; i < count; i += 1) ids.add(getDailyQuote(day(roundStartOffset + i)).id);
    assert.equal(ids.size, count);
  });

  it('picks only from the chosen topics', () => {
    for (let offset = 0; offset < 60; offset += 1) {
      const quote = getDailyQuote(day(offset), ['debt']);
      assert.ok(quote.topics.includes('debt'), quote.id);
    }
  });

  it('treats no topics, or only unknown topics, as every quote', () => {
    assert.equal(getQuotePool([]).length, FINANCIAL_QUOTES.length);
    assert.equal(getQuotePool(null).length, FINANCIAL_QUOTES.length);
    // @ts-expect-error unknown topic from old or corrupt data
    assert.equal(getQuotePool(['nope']).length, FINANCIAL_QUOTES.length);
  });

  it('works with a one-quote pool and is stable across calls', () => {
    const single: FinancialQuote[] = [{ id: 'only', quote: 'Q', author: 'A', topics: ['giving'] }];
    assert.equal(getDailyQuote(day(5), null, single).id, 'only');
    assert.equal(getDailyQuote(day(9)).id, getDailyQuote(day(9)).id);
  });
});
