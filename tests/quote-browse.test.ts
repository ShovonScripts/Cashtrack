import assert from 'node:assert/strict';
import test from 'node:test';

import { FINANCIAL_QUOTES, QUOTE_TOPICS } from '../src/constants/quotes.ts';
import { filterQuotes, isTopicChosen, savedOnLabel, toggleTopicChoice } from '../src/utils/quote-browse.ts';

test('filterQuotes matches every word in the quote or author, ignoring case and accents', () => {
  const byAuthor = filterQuotes(FINANCIAL_QUOTES, 'buffett');
  assert.ok(byAuthor.length >= 3);
  assert.ok(byAuthor.every((quote) => quote.author === 'Warren Buffett'));

  assert.equal(filterQuotes(FINANCIAL_QUOTES, 'lappe')[0]?.author, 'Anna Lappé');
  assert.ok(filterQuotes(FINANCIAL_QUOTES, 'penny  FRANKLIN').some((q) => q.id === 'franklin-penny-saved'));
  assert.equal(filterQuotes(FINANCIAL_QUOTES, 'zzzz-nothing').length, 0);
  assert.equal(filterQuotes(FINANCIAL_QUOTES, '   ').length, FINANCIAL_QUOTES.length);
});

test('filterQuotes narrows by topic, and items without topics never match a topic', () => {
  const debt = filterQuotes(FINANCIAL_QUOTES, '', 'debt');
  assert.ok(debt.length > 0);
  assert.ok(debt.every((quote) => quote.topics.includes('debt')));
  assert.equal(filterQuotes([{ quote: 'Q', author: 'A' }], '', 'debt').length, 0);
});

test('toggleTopicChoice keeps at least one topic and stores all as empty', () => {
  const all = QUOTE_TOPICS.map((topic) => topic.key);

  // From "all", tapping one turns just that one off.
  const withoutSaving = toggleTopicChoice([], 'saving');
  assert.deepEqual(withoutSaving, all.filter((key) => key !== 'saving'));

  // Turning it back on returns to "all" (empty list).
  assert.deepEqual(toggleTopicChoice(withoutSaving ?? [], 'saving'), []);

  // Cannot turn the last topic off.
  assert.equal(toggleTopicChoice(['debt'], 'debt'), null);

  // Keeps the library order regardless of tap order.
  assert.deepEqual(toggleTopicChoice(['mindset'], 'saving'), ['saving', 'mindset']);
});

test('isTopicChosen treats an empty choice as every topic', () => {
  assert.equal(isTopicChosen([], 'giving'), true);
  assert.equal(isTopicChosen(['debt'], 'giving'), false);
  assert.equal(isTopicChosen(['debt'], 'debt'), true);
});

test('savedOnLabel shows the year only for other years', () => {
  const now = new Date(2026, 10, 16);
  assert.equal(savedOnLabel(new Date(2026, 10, 3, 9).toISOString(), now), 'Saved 3 Nov');
  assert.equal(savedOnLabel(new Date(2025, 0, 9, 9).toISOString(), now), 'Saved 9 Jan 2025');
  assert.equal(savedOnLabel('not a date', now), 'Saved');
});
