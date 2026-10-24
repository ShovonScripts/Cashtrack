import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BackupParseError,
  listAttachmentUris,
  parseBackup,
  remapAttachmentUris,
  serializeBackup,
  type BackupData,
  type BackupFile,
} from '../src/utils/backup.ts';
import type { UserPreferences } from '../src/types/preferences.ts';

const preferences = {
  profile: { name: 'Sam', age: null, gender: '' },
  countryCode: 'BD',
  customCategories: [],
  categoryOrder: [],
  categoryLimits: {},
  categoryIcons: {},
  notifiedThresholds: {},
  notifiedDebts: {},
  hasCompletedOnboarding: true,
  themeMode: 'system',
  temperatureUnit: 'F',
  firstDayOfWeek: 'monday',
} as UserPreferences;

function buildData(overrides: Partial<BackupData> = {}): BackupData {
  return {
    expenses: [
      {
        id: 'e1',
        amount: 12.5,
        category: 'Food',
        date: '2026-10-01T10:00:00.000Z',
        note: 'Lunch',
        receiptUri: 'file:///docs/receipts/receipt-1.jpg',
      },
    ],
    preferences,
    notes: [
      { id: 'n1', title: 'Note', content: 'Body', color: 'blue', updatedAt: '2026-10-01T10:00:00.000Z' },
    ],
    debts: [
      {
        id: 'd1',
        personName: 'Alex',
        amount: 20,
        type: 'lent',
        date: '2026-10-01T10:00:00.000Z',
        status: 'active',
        note: '',
        payments: [{ id: 'p1', debtId: 'd1', amount: 5, date: '2026-10-02T10:00:00.000Z', note: '' }],
      },
    ],
    income: [
      {
        id: 'i1',
        amount: 1000,
        date: '2026-10-01T10:00:00.000Z',
        note: 'Salary',
        isRecurring: true,
        recurringFrequency: 'monthly',
      },
    ],
    goals: [
      {
        id: 'g1',
        title: 'Emergency',
        targetAmount: 500,
        startDate: '2026-10-01T10:00:00.000Z',
        deadlineDate: null,
        frequency: 'monthly',
        status: 'active',
        potType: 'emergency',
        allocationType: 'manual',
        allocationPercent: null,
        icon: 'piggy-bank',
      },
    ],
    contributions: [
      {
        id: 'c1',
        goalId: 'g1',
        amount: 50,
        date: '2026-10-02T10:00:00.000Z',
        note: '',
      },
    ],
    reminders: [
      {
        id: 'r1',
        title: 'Rent',
        amount: 400,
        isVariableAmount: false,
        category: 'Rent',
        dueDate: '2026-10-05T10:00:00.000Z',
        repeatType: 'monthly',
        status: 'upcoming',
        notes: '',
        isAlarm: false,
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-01T10:00:00.000Z',
      },
    ],
    payments: [
      {
        id: 'rp1',
        reminderId: 'r1',
        amount: 400,
        paidDate: '2026-10-05T10:00:00.000Z',
        createdAt: '2026-10-05T10:00:00.000Z',
      },
    ],
    recurringSkips: { expense: { e1: ['2026-10'] }, income: {} },
    attachments: {},
    ...overrides,
  };
}

function buildFile(data = buildData()): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: '2026-10-24T10:00:00.000Z',
    appVersion: '1.0.0',
    data,
  };
}

describe('backup round trip', () => {
  it('serializes and parses every collection without loss', () => {
    const file = buildFile();
    const parsed = parseBackup(serializeBackup(file));

    assert.equal(parsed.format, BACKUP_FORMAT);
    assert.equal(parsed.version, BACKUP_VERSION);
    assert.equal(parsed.appVersion, '1.0.0');
    assert.equal(parsed.data.expenses.length, 1);
    assert.equal(parsed.data.expenses[0].receiptUri, 'file:///docs/receipts/receipt-1.jpg');
    assert.equal(parsed.data.notes[0].color, 'blue');
    assert.equal(parsed.data.debts[0].payments?.[0].amount, 5);
    assert.equal(parsed.data.income[0].recurringFrequency, 'monthly');
    assert.equal(parsed.data.goals[0].potType, 'emergency');
    assert.equal(parsed.data.contributions[0].goalId, 'g1');
    assert.equal(parsed.data.reminders[0].category, 'Rent');
    assert.equal(parsed.data.payments[0].reminderId, 'r1');
    assert.deepEqual(parsed.data.recurringSkips, { expense: { e1: ['2026-10'] }, income: {} });
  });

  it('defaults optional collections and fields', () => {
    const parsed = parseBackup(
      JSON.stringify({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-10-24T10:00:00.000Z',
        data: {
          expenses: [{ id: 'e1', amount: 1, category: 'Food', date: '2026-10-01' }],
          preferences,
          notes: [],
          debts: [],
          income: [],
          goals: [],
          contributions: [],
          reminders: [],
          payments: [],
        },
      }),
    );

    assert.equal(parsed.data.expenses[0].note, '');
    assert.deepEqual(parsed.data.recurringSkips, { expense: {}, income: {} });
    assert.deepEqual(parsed.data.attachments, {});
  });
});

describe('backup validation', () => {
  it('rejects files that are not CashTrack backups', () => {
    assert.throws(() => parseBackup('not json'), BackupParseError);
    assert.throws(() => parseBackup('[]'), /not an object/i);
    assert.throws(() => parseBackup('{"format":"other"}'), /not a CashTrack backup/i);
  });

  it('rejects newer or invalid versions', () => {
    const file = buildFile();
    assert.throws(
      () => parseBackup(JSON.stringify({ ...file, version: BACKUP_VERSION + 1 })),
      /newer version/i,
    );
    assert.throws(() => parseBackup(JSON.stringify({ ...file, version: 0 })), /invalid version/i);
    assert.throws(() => parseBackup(JSON.stringify({ ...file, version: '1' })), /must be a number/i);
  });

  it('rejects missing collections and malformed records', () => {
    const file = buildFile();
    assert.throws(
      () => parseBackup(JSON.stringify({ ...file, data: { ...file.data, expenses: undefined } })),
      /Expenses is missing/i,
    );

    const badExpense = buildFile({
      ...buildData(),
      expenses: [{ id: 'e1' } as never],
    });
    assert.throws(() => parseBackup(JSON.stringify(badExpense)), /amount must be a number/i);

    const badDebt = buildFile({
      ...buildData(),
      debts: [{ ...buildData().debts[0], type: 'gift' } as never],
    });
    assert.throws(() => parseBackup(JSON.stringify(badDebt)), /unsupported value/i);

    const badPreferences = buildFile({
      ...buildData(),
      preferences: {} as UserPreferences,
    });
    assert.throws(() => parseBackup(JSON.stringify(badPreferences)), /profile is missing/i);
  });

  it('rejects non-string attachment data', () => {
    const file = buildFile({
      ...buildData(),
      attachments: { 'file:///x.jpg': { mimeType: 'image/jpeg', data: 42 as never } },
    });
    assert.throws(() => parseBackup(JSON.stringify(file)), /data must be text/i);
  });

  it('rejects rows the storage layer would drop', () => {
    const zeroAmount = buildFile({
      ...buildData(),
      expenses: [{ ...buildData().expenses[0], amount: 0 }],
    });
    assert.throws(() => parseBackup(JSON.stringify(zeroAmount)), /greater than zero/i);

    const badDate = buildFile({
      ...buildData(),
      income: [{ ...buildData().income[0], date: 'not-a-date' }],
    });
    assert.throws(() => parseBackup(JSON.stringify(badDate)), /not a valid date/i);

    const blankId = buildFile({
      ...buildData(),
      notes: [{ ...buildData().notes[0], id: '  ' }],
    });
    assert.throws(() => parseBackup(JSON.stringify(blankId)), /cannot be empty/i);

    const negativeGoal = buildFile({
      ...buildData(),
      goals: [{ ...buildData().goals[0], targetAmount: -5 }],
    });
    assert.throws(() => parseBackup(JSON.stringify(negativeGoal)), /cannot be negative/i);

    const badPercent = buildFile({
      ...buildData(),
      goals: [{ ...buildData().goals[0], allocationPercent: 140 }],
    });
    assert.throws(() => parseBackup(JSON.stringify(badPercent)), /between 0 and 100/i);

    const zeroReminder = buildFile({
      ...buildData(),
      reminders: [{ ...buildData().reminders[0], amount: 0 }],
    });
    assert.throws(() => parseBackup(JSON.stringify(zeroReminder)), /greater than zero/i);
  });

  it('ignores prototype-polluting map keys', () => {
    const file = buildFile({
      ...buildData(),
      recurringSkips: {
        expense: JSON.parse('{"__proto__":["2026-10"]}') as Record<string, string[]>,
        income: {},
      },
      attachments: JSON.parse('{"__proto__":{"mimeType":"image/jpeg","data":"AA=="}}') as Record<
        string,
        { mimeType: string; data: string }
      >,
    });

    const parsed = parseBackup(JSON.stringify(file));
    assert.equal(
      Object.prototype.hasOwnProperty.call(parsed.data.recurringSkips.expense, '__proto__'),
      false,
    );
    assert.equal(Object.prototype.hasOwnProperty.call(parsed.data.attachments, '__proto__'), false);
  });

  it('rejects duplicate ids before anything is restored', () => {
    const duplicateExpenses = buildFile({
      ...buildData(),
      expenses: [buildData().expenses[0], { ...buildData().expenses[0] }],
    });
    assert.throws(() => parseBackup(JSON.stringify(duplicateExpenses)), /duplicate id/i);

    const duplicatePayments = buildFile({
      ...buildData(),
      payments: [buildData().payments[0], { ...buildData().payments[0] }],
    });
    assert.throws(() => parseBackup(JSON.stringify(duplicatePayments)), /duplicate id/i);
  });
});

describe('attachment helpers', () => {
  it('lists expense receipts and profile images once each', () => {
    const data = buildData();
    data.preferences = {
      ...preferences,
      profile: {
        ...preferences.profile,
        coverPhotoUri: 'file:///docs/cover.jpg',
        profilePhotoUri: 'file:///docs/receipts/receipt-1.jpg',
      },
    };

    assert.deepEqual(listAttachmentUris(data).sort(), [
      'file:///docs/cover.jpg',
      'file:///docs/receipts/receipt-1.jpg',
    ]);
  });

  it('ignores remote preset banners and non-file URIs', () => {
    const data = buildData();
    data.preferences = {
      ...preferences,
      profile: {
        ...preferences.profile,
        coverPhotoUri: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071',
        profilePhotoUri: 'default-cover',
      },
    };
    data.expenses[0].receiptUri = 'https://example.com/receipt.jpg';

    assert.deepEqual(listAttachmentUris(data), []);
  });

  it('remaps recreated attachment files', () => {
    const data = buildData();
    data.preferences = {
      ...preferences,
      profile: {
        ...preferences.profile,
        coverPhotoUri: 'file:///docs/cover.jpg',
        profilePhotoUri: 'file:///docs/avatar.jpg',
      },
    };

    const remapped = remapAttachmentUris(data, {
      'file:///docs/receipts/receipt-1.jpg': 'file:///docs/receipts/restored-1.jpg',
      'file:///docs/cover.jpg': 'file:///docs/restored-cover.jpg',
    });

    assert.equal(remapped.expenses[0].receiptUri, 'file:///docs/receipts/restored-1.jpg');
    assert.equal(remapped.preferences.profile.coverPhotoUri, 'file:///docs/restored-cover.jpg');
    assert.equal(remapped.preferences.profile.profilePhotoUri, 'file:///docs/avatar.jpg');
  });
});
