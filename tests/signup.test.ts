import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInstallId,
  hasAnyInput,
  hasErrors,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  validateSignup,
} from '../src/utils/signup.ts';

const blank = { name: '', email: '', phone: '', consent: false };

test('name and email are required, phone is optional', () => {
  const errors = validateSignup(blank);
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.equal(errors.phone, undefined);

  assert.deepEqual(validateSignup({ ...blank, name: 'Ada', email: 'ada@example.com' }), {});
});

test('a typed phone must be valid', () => {
  const base = { ...blank, name: 'Ada', email: 'ada@example.com' };
  assert.ok(validateSignup({ ...base, phone: '123' }).phone);
  assert.equal(validateSignup({ ...base, phone: '+880 1712-345 678' }).phone, undefined);
});

test('email check accepts real addresses and rejects obvious mistakes', () => {
  for (const ok of ['a@b.co', 'First.Last+tag@mail.example.org', '  ADA@Example.COM ']) {
    assert.equal(isValidEmail(ok), true, ok);
  }
  for (const bad of ['', 'ada', 'ada@', '@example.com', 'ada@example', 'a da@example.com', 'ada@example.c']) {
    assert.equal(isValidEmail(bad), false, bad);
  }
});

test('phone accepts 7 to 15 digits with an optional plus', () => {
  assert.equal(isValidPhone('1234567'), true);
  assert.equal(isValidPhone('+123456789012345'), true);
  assert.equal(isValidPhone('123456'), false);
  assert.equal(isValidPhone('+1234567890123456'), false);
  assert.equal(isValidPhone('call me'), false);
});

test('normalizers clean what is stored and sent', () => {
  assert.equal(normalizeEmail('  ADA@Example.COM '), 'ada@example.com');
  assert.equal(normalizePhone(' +880 1712-345 678 '), '+8801712345678');
  assert.equal(normalizePhone('(017) 1234'), '0171234');
  assert.equal(normalizePhone('abc'), '');
  assert.equal(normalizeName('  Ada    Lovelace '), 'Ada Lovelace');
});

test('names over the limit are rejected', () => {
  assert.ok(validateSignup({ ...blank, name: 'x'.repeat(51), email: 'a@b.co' }).name);
});

test('hasAnyInput and hasErrors', () => {
  assert.equal(hasAnyInput(blank), false);
  assert.equal(hasAnyInput({ ...blank, phone: ' 1 ' }), true);
  assert.equal(hasAnyInput({ ...blank, name: '   ' }), false);
  assert.equal(hasErrors({}), false);
  assert.equal(hasErrors({ email: 'x' }), true);
});

test('install id has the uuid shape the sheet script accepts', () => {
  const id = createInstallId();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.match(id, /^[0-9a-f-]{8,64}$/i); // the script's own check
  assert.notEqual(createInstallId(), createInstallId());
  assert.equal(createInstallId(() => 0), '00000000-0000-0000-0000-000000000000');
});
