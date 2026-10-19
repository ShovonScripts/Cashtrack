import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createContext, createElement, useContext, useState } from 'react';
import TestRenderer from 'react-test-renderer';

import { ThemeModeContext } from '../src/context/theme-context.ts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Stand-in for the frequently-changing ExpenseContext. Its value identity
// changes on every update, exactly like the real provider's memoised value.
const ExpenseContext = createContext<{ count: number }>({ count: 0 });

let themeRenders = 0;
let expenseRenders = 0;

function ThemeConsumer() {
  useContext(ThemeModeContext);
  themeRenders += 1;
  return null;
}

function ExpenseConsumer() {
  useContext(ExpenseContext);
  expenseRenders += 1;
  return null;
}

// Created once and reused so the provider subtrees keep a stable `children`
// reference, mirroring `<RootLayout>` passing `children` into the providers.
const themeConsumerElement = createElement(ThemeConsumer);
const expenseConsumerElement = createElement(ExpenseConsumer);

let setCount: ((update: (value: number) => number) => void) | null = null;
let setThemeMode: ((mode: 'light' | 'dark' | 'system') => void) | null = null;

function Harness({ count, themeMode }: { count: number; themeMode: 'light' | 'dark' | 'system' }) {
  const [currentCount, updateCount] = useState(count);
  const [currentTheme, updateTheme] = useState(themeMode);
  setCount = updateCount;
  setThemeMode = updateTheme;

  return createElement(
    ExpenseContext.Provider,
    { value: { count: currentCount } },
    createElement(
      ThemeModeContext.Provider,
      { value: currentTheme },
      createElement('group', null, themeConsumerElement, expenseConsumerElement)
    )
  );
}

test('expense updates re-render expense consumers but not theme consumers', async () => {
  themeRenders = 0;
  expenseRenders = 0;

  await act(async () => {
    TestRenderer.create(createElement(Harness, { count: 0, themeMode: 'system' }));
  });

  assert.equal(themeRenders, 1, 'theme consumer renders once on mount');
  assert.equal(expenseRenders, 1, 'expense consumer renders once on mount');

  await act(async () => {
    setCount?.((value) => value + 1);
  });

  assert.equal(expenseRenders, 2, 'expense consumer re-renders when expenses change');
  assert.equal(themeRenders, 1, 'theme consumer is NOT notified by an expense change');

  await act(async () => {
    setCount?.((value) => value + 1);
  });

  assert.equal(expenseRenders, 3, 'expense consumer re-renders on further expense changes');
  assert.equal(themeRenders, 1, 'theme consumer still untouched by expense changes');
});

test('changing the theme preference still updates theme consumers immediately', async () => {
  themeRenders = 0;
  expenseRenders = 0;

  await act(async () => {
    TestRenderer.create(createElement(Harness, { count: 0, themeMode: 'system' }));
  });

  assert.equal(themeRenders, 1);

  await act(async () => {
    setThemeMode?.('dark');
  });

  assert.equal(themeRenders, 2, 'theme consumer re-renders when the preference changes');

  await act(async () => {
    setThemeMode?.('light');
  });

  assert.equal(themeRenders, 3, 'theme consumer re-renders on every preference change');
});
