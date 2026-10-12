import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function CalculatorTool() {
  const theme = useTheme();
  const [expression, setExpression] = useState<string>('0');
  const [result, setResult] = useState<string>('0');

  const handlePress = (val: string) => {
    if (val === 'C') {
      setExpression('0');
      setResult('0');
      return;
    }
    if (val === '⌫') {
      setExpression((curr) => (curr.length > 1 ? curr.slice(0, -1) : '0'));
      return;
    }
    if (val === '=') {
      try {
        const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
        const evalResult = Function(`'use strict'; return (${sanitized})`)();
        setResult(String(evalResult));
      } catch {
        setResult('Error');
      }
      return;
    }

    setExpression((curr) => (curr === '0' && val !== '.' ? val : curr + val));
  };

  const rows = [
    ['C', '⌫', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', ''],
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.displayCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.label}>
          EXPRESSION
        </ThemedText>
        <ThemedText type="defaultBold" style={[styles.expressionText, { color: theme.textSecondary }]} numberOfLines={1}>
          {expression}
        </ThemedText>
        <ThemedText type="hero" style={[styles.resultText, { color: theme.text }]} numberOfLines={1}>
          {result}
        </ThemedText>
      </View>

      <View style={styles.keypad}>
        {rows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.row}>
            {row.map((btn, bIdx) => {
              if (!btn) return <View key={`empty-${bIdx}`} style={styles.buttonEmpty} />;
              const isEquals = btn === '=';
              const isOperator = ['÷', '×', '-', '+'].includes(btn);
              const isAction = ['C', '⌫'].includes(btn);

              let bg: string = theme.card;
              let textColor: string = theme.text;

              if (isEquals) {
                bg = theme.accent;
                textColor = '#FFFFFF';
              } else if (isOperator) {
                bg = `${theme.accent}15`;
                textColor = theme.accent;
              } else if (isAction) {
                bg = theme.cardMuted;
                textColor = theme.danger;
              }

              return (
                <Pressable
                  key={btn}
                  onPress={() => handlePress(btn)}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: bg, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="defaultBold" style={[styles.buttonText, { color: textColor }]}>
                    {btn}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  displayCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.three,
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  expressionText: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  resultText: {
    fontSize: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  keypad: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  button: {
    flex: 1,
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEmpty: {
    flex: 1,
  },
  buttonText: {
    fontSize: 18,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
