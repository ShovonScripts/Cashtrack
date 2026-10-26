import test from 'node:test';
import assert from 'node:assert';
import { evaluateExpression } from '../src/utils/expression.ts';

test('evaluates leading decimal operands', () => {
  assert.strictEqual(evaluateExpression('12 + .5'), 12.5);
  assert.strictEqual(evaluateExpression('12 - .5'), 11.5);
  assert.strictEqual(evaluateExpression('.5'), 0.5);
  assert.strictEqual(evaluateExpression('.5 + .5'), 1);
});

test('keeps standard decimal arithmetic working', () => {
  assert.strictEqual(evaluateExpression('0.1 + 0.2'), 0.3);
  assert.strictEqual(evaluateExpression('10.25 + 2.75'), 13);
  assert.strictEqual(evaluateExpression('0.5'), 0.5);
});

test('ignores incomplete trailing operators and decimals', () => {
  assert.strictEqual(evaluateExpression('12 +'), 12);
  assert.strictEqual(evaluateExpression('12 + .'), 12);
  assert.strictEqual(evaluateExpression('12.'), 12);
  assert.strictEqual(evaluateExpression(''), 0);
});

test('returns zero for invalid input', () => {
  assert.strictEqual(evaluateExpression('abc'), 0);
  assert.strictEqual(evaluateExpression('12 + abc'), 12);
});
