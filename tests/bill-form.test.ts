import test from 'node:test';
import assert from 'node:assert';
import { validateBillForm, type BillFormValues } from '../src/utils/bill-form.ts';

const base: BillFormValues = {
  title: 'Internet',
  isVariableAmount: false,
  amount: '1200',
  category: 'Bills',
  isAlarm: false,
  alarmTime: '09:00',
  totalAmount: '',
  totalInstallments: '',
};

test('bill form - valid fixed bill', () => {
  const { errors, parsed } = validateBillForm(base);
  assert.deepStrictEqual(errors, {});
  assert.deepStrictEqual(parsed, { title: 'Internet', amount: 1200, alarmTime: null, totalAmount: null, totalInstallments: null });
});

test('bill form - name required, amount required unless it varies', () => {
  assert.ok(validateBillForm({ ...base, title: ' ' }).errors.title);
  assert.ok(validateBillForm({ ...base, amount: '' }).errors.amount);
  assert.ok(validateBillForm({ ...base, amount: '0' }).errors.amount);
  const variable = validateBillForm({ ...base, isVariableAmount: true, amount: '' });
  assert.strictEqual(variable.parsed?.amount, null);
});

test('bill form - amount must exceed what is already paid this cycle', () => {
  assert.ok(validateBillForm({ ...base, amount: '500' }, 500).errors.amount);
  assert.strictEqual(validateBillForm({ ...base, amount: '501' }, 500).parsed?.amount, 501);
});

test('bill form - alarm time must be 24-hour HH:MM', () => {
  assert.ok(validateBillForm({ ...base, isAlarm: true, alarmTime: '9:00' }).errors.alarmTime);
  assert.ok(validateBillForm({ ...base, isAlarm: true, alarmTime: '24:00' }).errors.alarmTime);
  assert.strictEqual(validateBillForm({ ...base, isAlarm: true, alarmTime: ' 18:30 ' }).parsed?.alarmTime, '18:30');
  // Ignored when the alarm is off.
  assert.strictEqual(validateBillForm({ ...base, alarmTime: 'bad' }).parsed?.alarmTime, null);
});

test('bill form - EMI loan details are optional but must be valid', () => {
  const emi = { ...base, category: 'EMI' as const };
  assert.deepStrictEqual(validateBillForm(emi).errors, {});
  assert.ok(validateBillForm({ ...emi, totalInstallments: '0' }).errors.totalInstallments);
  const parsed = validateBillForm({ ...emi, totalAmount: '120000', totalInstallments: '12' }).parsed;
  assert.strictEqual(parsed?.totalAmount, 120000);
  assert.strictEqual(parsed?.totalInstallments, 12);
  // Loan fields are dropped for other categories.
  assert.strictEqual(validateBillForm({ ...base, totalAmount: '5' }).parsed?.totalAmount, null);
});
