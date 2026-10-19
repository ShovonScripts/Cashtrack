import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { resolveThemeMode, nextThemeMode } from '../src/utils/theme-mode.ts';
import { DEFAULT_PREFERENCES } from '../src/types/preferences.ts';

test('theme preference defaults to system', () => {
  assert.equal(DEFAULT_PREFERENCES.themeMode, 'system');
});

test('useTheme is decoupled from the expense context', () => {
  const source = readFileSync(new URL('../src/hooks/use-theme.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /ExpenseContext|useExpenses/, 'useTheme must not subscribe to ExpenseContext');
  assert.match(source, /ThemeModeContext/, 'useTheme must read the dedicated theme-mode context');
});

test('an explicit dark preference wins regardless of the OS scheme', () => {
  assert.equal(resolveThemeMode('light', 'dark'), 'dark');
  assert.equal(resolveThemeMode('dark', 'dark'), 'dark');
  assert.equal(resolveThemeMode(null, 'dark'), 'dark');
  assert.equal(resolveThemeMode(undefined, 'dark'), 'dark');
});

test('an explicit light preference wins regardless of the OS scheme', () => {
  assert.equal(resolveThemeMode('dark', 'light'), 'light');
  assert.equal(resolveThemeMode('light', 'light'), 'light');
  assert.equal(resolveThemeMode(null, 'light'), 'light');
});

test('system mode follows the OS scheme and falls back to light', () => {
  assert.equal(resolveThemeMode('dark', 'system'), 'dark');
  assert.equal(resolveThemeMode('light', 'system'), 'light');
  assert.equal(resolveThemeMode(null, 'system'), 'light');
  assert.equal(resolveThemeMode(undefined, 'system'), 'light');
});

test('toggling flips light/dark and resolves system to dark', () => {
  assert.equal(nextThemeMode('dark'), 'light');
  assert.equal(nextThemeMode('light'), 'dark');
  assert.equal(nextThemeMode('system'), 'dark');
});

test('toggling is a round trip for explicit modes', () => {
  assert.equal(nextThemeMode(nextThemeMode('light')), 'light');
  assert.equal(nextThemeMode(nextThemeMode('dark')), 'dark');
});
