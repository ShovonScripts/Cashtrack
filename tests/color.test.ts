import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { withAlpha } from '../src/utils/color.ts';

describe('withAlpha color utility', () => {
  test('handles #RGB hex inputs', () => {
    assert.equal(withAlpha('#0B7', 0.5), '#00BB7780');
    assert.equal(withAlpha('#FFF', 1), '#FFFFFFFF');
    assert.equal(withAlpha('#000', 0), '#00000000');
  });

  test('handles #RRGGBB hex inputs', () => {
    assert.equal(withAlpha('#10B981', 0.25), '#10B98140');
    assert.equal(withAlpha('#C8252C', 0.5), '#C8252C80');
    assert.equal(withAlpha('#000000', 0.1), '#0000001A');
  });

  test('handles #RRGGBBAA hex inputs by stripping previous alpha', () => {
    assert.equal(withAlpha('#10B981FF', 0.25), '#10B98140');
    assert.equal(withAlpha('#C8252C80', 0.5), '#C8252C80');
  });

  test('handles rgb() inputs', () => {
    assert.equal(withAlpha('rgb(16, 185, 129)', 0.25), 'rgba(16, 185, 129, 0.25)');
    assert.equal(withAlpha('rgb(255, 0, 0)', 0.8), 'rgba(255, 0, 0, 0.8)');
  });

  test('handles rgba() inputs by updating alpha', () => {
    assert.equal(withAlpha('rgba(16, 185, 129, 0.8)', 0.15), 'rgba(16, 185, 129, 0.15)');
    assert.equal(withAlpha('rgba(0, 0, 0, 1)', 0.5), 'rgba(0, 0, 0, 0.5)');
  });

  test('clamps alpha values strictly between 0 and 1', () => {
    assert.equal(withAlpha('#10B981', -0.5), '#10B98100');
    assert.equal(withAlpha('#10B981', 1.5), '#10B981FF');
    assert.equal(withAlpha('rgb(0, 0, 0)', -0.1), 'rgba(0, 0, 0, 0)');
    assert.equal(withAlpha('rgb(0, 0, 0)', 2), 'rgba(0, 0, 0, 1)');
  });

  test('returns invalid color input unchanged', () => {
    assert.equal(withAlpha('transparent', 0.5), 'transparent');
    assert.equal(withAlpha('currentColor', 0.5), 'currentColor');
    assert.equal(withAlpha('', 0.5), '');
    // @ts-expect-error testing invalid type input
    assert.equal(withAlpha(null, 0.5), null);
  });
});
