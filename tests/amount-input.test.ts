import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeAmountInput } from '../src/utils/amount-input.ts';

test('keeps plain digits', () => {
  assert.equal(sanitizeAmountInput('1250'), '1250');
  assert.equal(sanitizeAmountInput(''), '');
});

test('removes letters and symbols', () => {
  assert.equal(sanitizeAmountInput('৳12a50'), '1250');
  assert.equal(sanitizeAmountInput('$ 9.5'), '9.5');
});

test('treats a comma as the decimal point', () => {
  assert.equal(sanitizeAmountInput('12,5'), '12.5');
});

test('allows only one decimal point', () => {
  assert.equal(sanitizeAmountInput('1.2.3'), '1.23');
});

test('limits the fraction to two digits by default, or as asked', () => {
  assert.equal(sanitizeAmountInput('3.14159'), '3.14');
  assert.equal(sanitizeAmountInput('3.14159', 3), '3.141');
  assert.equal(sanitizeAmountInput('3.', 2), '3.');
});
