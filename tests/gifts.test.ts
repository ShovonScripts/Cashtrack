import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  BUILT_IN_GIFT_CATEGORIES,
  GIFT_HUES,
  OTHER_GIFT_CATEGORY_ID,
  giftCategoryHint,
  isGiftHue,
} from '../src/constants/gift-categories.ts';
import type { GiftCategory, ReceivedGift } from '../src/types/gift.ts';
import {
  addGiftCategory,
  allGiftCategories,
  createGiftId,
  groupGiftsByYear,
  moveGiftsToOther,
  normalizeGiver,
  recentGivers,
  renameGiftCategory,
  resolveGiftCategory,
  sortGifts,
  summarizeGifts,
  totalsByCategory,
  totalsByGiver,
  validateGiftForm,
} from '../src/utils/gifts.ts';

let seq = 0;
function gift(overrides: Partial<ReceivedGift> = {}): ReceivedGift {
  seq += 1;
  return {
    id: `g${seq}`,
    amount: 100,
    isEstimate: false,
    categoryId: 'gift',
    giver: '',
    date: '2026-03-10T12:00:00.000Z',
    endDate: null,
    note: '',
    thanked: false,
    gratitudeNote: '',
    createdAt: `2026-03-10T12:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-03-10T12:00:00.000Z',
    ...overrides,
  };
}

const custom: GiftCategory[] = [{ id: 'gift-cat-a', name: 'Eid Salami', icon: 'tag-heart-outline', hue: 'slate' }];

describe('gift categories', () => {
  it('built-ins have unique ids, valid hues, and include Other', () => {
    const ids = BUILT_IN_GIFT_CATEGORIES.map((category) => category.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.includes(OTHER_GIFT_CATEGORY_ID));
    for (const category of BUILT_IN_GIFT_CATEGORIES) assert.ok(isGiftHue(category.hue), category.id);
    assert.ok(GIFT_HUES.length > 0);
  });

  it('gives every category form wording, and a discount its own', () => {
    for (const category of BUILT_IN_GIFT_CATEGORIES) {
      const hint = giftCategoryHint(category.id);
      assert.ok(hint.valueLabel && hint.valueHelper && hint.notePlaceholder && hint.giverPlaceholder, category.id);
    }
    assert.equal(giftCategoryHint('discount').valueLabel, 'Discount amount');
    assert.equal(giftCategoryHint('gift-cat-a').valueLabel, 'Value');
    assert.notEqual(giftCategoryHint('discount').notePlaceholder, giftCategoryHint('education').notePlaceholder);
  });

  it('lists built-ins, then custom ones, with Other last', () => {
    const list = allGiftCategories(custom);
    assert.equal(list.at(-1)?.id, OTHER_GIFT_CATEGORY_ID);
    assert.equal(list.at(-2)?.id, 'gift-cat-a');
  });

  it('reads an unknown category as Other', () => {
    assert.equal(resolveGiftCategory('deleted-one', custom).id, OTHER_GIFT_CATEGORY_ID);
    assert.equal(resolveGiftCategory('gift-cat-a', custom).name, 'Eid Salami');
  });

  it('adds a custom category, refusing blanks and duplicate names in any case', () => {
    const added = addGiftCategory(custom, '  Wedding  ', 'gift-cat-b');
    assert.ok(added.ok);
    if (added.ok) {
      assert.equal(added.category.name, 'Wedding');
      assert.equal(added.categories.length, 2);
    }
    assert.equal(addGiftCategory(custom, '   ').ok, false);
    assert.equal(addGiftCategory(custom, 'eid salami').ok, false);
    assert.equal(addGiftCategory(custom, 'EDUCATION').ok, false);
    assert.equal(addGiftCategory(custom, 'x'.repeat(31)).ok, false);
  });

  it('renames only custom categories, and only to a free name', () => {
    const renamed = renameGiftCategory(custom, 'gift-cat-a', 'Eid gifts');
    assert.ok(renamed.ok && renamed.category.name === 'Eid gifts');
    assert.equal(renameGiftCategory(custom, 'education', 'School').ok, false);
    assert.equal(renameGiftCategory(custom, 'gift-cat-a', 'Gift').ok, false);
    // Renaming to its own name with a new case is fine.
    assert.ok(renameGiftCategory(custom, 'gift-cat-a', 'EID SALAMI').ok);
  });

  it('moves gifts of a deleted category to Other and leaves the rest alone', () => {
    const moved = moveGiftsToOther([gift({ categoryId: 'gift-cat-a' }), gift({ categoryId: 'food' })], 'gift-cat-a', 'now');
    assert.deepEqual(
      moved.map((item) => item.categoryId),
      [OTHER_GIFT_CATEGORY_ID, 'food'],
    );
    assert.equal(moved[0].updatedAt, 'now');
  });
});

describe('gift totals', () => {
  const now = new Date(2026, 5, 1);
  const gifts = [
    gift({ amount: 5000, giver: 'Abbu', categoryId: 'education', date: '2026-02-01T12:00:00.000Z', thanked: true }),
    gift({ amount: 1500, giver: '  abbu ', categoryId: 'food', date: '2025-07-01T12:00:00.000Z' }),
    gift({ amount: 300, giver: 'Daraz', categoryId: 'discount', date: '2026-04-01T12:00:00.000Z', isEstimate: true }),
    gift({ amount: 200, giver: '', categoryId: 'gift-cat-a', date: '2024-12-31T12:00:00.000Z' }),
  ];

  it('summarizes the lifetime total, this year, givers and thanks', () => {
    assert.deepEqual(summarizeGifts(gifts, now), {
      lifetime: 7000,
      thisYear: 5300,
      count: 4,
      givers: 2,
      notThanked: 3,
      hasEstimates: true,
    });
    assert.deepEqual(summarizeGifts([], now), {
      lifetime: 0,
      thisYear: 0,
      count: 0,
      givers: 0,
      notThanked: 0,
      hasEstimates: false,
    });
  });

  it('totals by category, largest first', () => {
    const totals = totalsByCategory(gifts, custom);
    assert.deepEqual(
      totals.map((row) => [row.category.id, row.total]),
      [['education', 5000], ['food', 1500], ['discount', 300], ['gift-cat-a', 200]],
    );
  });

  it('totals by giver, merging case and spacing, skipping unknown givers', () => {
    assert.deepEqual(totalsByGiver(gifts), [
      { giver: 'Abbu', total: 6500, count: 2 },
      { giver: 'Daraz', total: 300, count: 1 },
    ]);
  });

  it('groups by year, newest first, with a total per year', () => {
    assert.deepEqual(
      groupGiftsByYear(gifts).map((year) => [year.year, year.total, year.gifts.length]),
      [[2026, 5300, 2], [2025, 1500, 1], [2024, 200, 1]],
    );
  });

  it('sorts newest first and offers recent givers once each', () => {
    assert.equal(sortGifts(gifts)[0].giver, 'Daraz');
    assert.deepEqual(recentGivers(gifts), ['Daraz', 'Abbu']);
    assert.equal(normalizeGiver('  Big   Brother '), 'Big Brother');
  });
});

describe('gift form', () => {
  const base = { amountText: '250', date: new Date(2026, 0, 10), coversPeriod: false, endDate: new Date(2026, 0, 1) };

  it('accepts a positive value and ignores the end date unless a period is on', () => {
    assert.equal(validateGiftForm(base), null);
  });

  it('rejects an empty, zero or bad value', () => {
    for (const amountText of ['', '0', 'abc', '-5']) {
      assert.equal(validateGiftForm({ ...base, amountText })?.field, 'amount', amountText);
    }
  });

  it('rejects a period that ends before it starts, but allows the same day', () => {
    assert.equal(validateGiftForm({ ...base, coversPeriod: true })?.field, 'period');
    assert.equal(validateGiftForm({ ...base, coversPeriod: true, endDate: new Date(2026, 0, 10, 23) }), null);
  });

  it('makes distinct ids', () => {
    let n = 0;
    const random = () => (n += 0.1);
    assert.notEqual(createGiftId(1, random), createGiftId(1, random));
  });
});

describe('gifts stay out of the money', () => {
  // Gifts are never income, expenses or balance. These modules build totals,
  // reports, budgets and exports, so none of them may read gift data.
  const MONEY_MODULES = [
    'advisor.ts',
    'budget-status.ts',
    'csv.ts',
    'expense.ts',
    'income.ts',
    'money.ts',
    'month-comparison.ts',
    'monthly-report.ts',
    'monthly-spend.ts',
    'period-summary.ts',
    'savings-allocator.ts',
  ];

  it('no money module imports anything about gifts', () => {
    const utils = join(import.meta.dirname, '..', 'src', 'utils');
    const present = new Set(readdirSync(utils));
    for (const file of MONEY_MODULES) {
      assert.ok(present.has(file), `${file} was renamed; update this list`);
      const source = readFileSync(join(utils, file), 'utf8');
      assert.doesNotMatch(source, /from ['"][^'"]*gift/i, `${file} must not import gift data`);
    }
  });
});
