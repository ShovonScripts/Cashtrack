import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HISTORY_KEY = '@spendly_calc_history';

type CalcHistoryItem = {
  expression: string;
  result: string;
  timestamp: string;
};

export function CalculatorTool() {
  const theme = useTheme();
  const [expression, setExpression] = useState<string>('0');
  const [result, setResult] = useState<string>('0');
  const [history, setHistory] = useState<CalcHistoryItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((val) => {
      if (val) {
        try {
          setHistory(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  const saveHistory = async (newHistory: CalcHistoryItem[]) => {
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handlePress = async (val: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        const sanitized = expression
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/%/g, '/100');
        const evalResult = Function(`'use strict'; return (${sanitized})`)();
        const resStr = String(evalResult);
        setResult(resStr);

        const newItem: CalcHistoryItem = {
          expression,
          result: resStr,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const updatedHistory = [newItem, ...history].slice(0, 10);
        await saveHistory(updatedHistory);
      } catch {
        setResult('Error');
      }
      return;
    }

    setExpression((curr) => (curr === '0' && val !== '.' ? val : curr + val));
  };

  const handleClearHistory = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await saveHistory([]);
  };

  const rows = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <View style={styles.container}>
      {/* Display Card */}
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

      {/* Keypad */}
      <View style={styles.keypad}>
        {rows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.row}>
            {row.map((btn, bIdx) => {
              const isEquals = btn === '=';
              const isOperator = ['÷', '×', '-', '+', '%'].includes(btn);
              const isAction = ['C', '⌫'].includes(btn);
              const isZero = btn === '0';

              let bg: string = theme.card;
              let textColor: string = theme.text;

              if (isEquals) {
                bg = theme.accentFill;
                textColor = '#FFFFFF';
              } else if (isOperator) {
                bg = `${theme.accent}18`;
                textColor = theme.accent;
              } else if (isAction) {
                bg = `${theme.danger}15`;
                textColor = theme.danger;
              }

              return (
                <Pressable
                  key={btn}
                  onPress={() => handlePress(btn)}
                  style={({ pressed }) => [
                    styles.button,
                    isZero && styles.buttonWide,
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

      {/* Recent Calculations History Section at Bottom */}
      <View style={[styles.historySection, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleRow}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="smallBold" style={{ fontSize: 11, letterSpacing: 0.5 }}>
              RECENT CALCULATIONS
            </ThemedText>
          </View>
          {history.length > 0 && (
            <Pressable onPress={handleClearHistory} hitSlop={8}>
              <ThemedText type="caption" style={{ color: theme.danger, fontSize: 11 }}>Clear</ThemedText>
            </Pressable>
          )}
        </View>

        <ScrollView style={styles.historyScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {history.length === 0 ? (
            <ThemedText type="caption" themeColor="textSecondary" style={styles.emptyHistoryText}>
              Past calculations will show here
            </ThemedText>
          ) : (
            history.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpression(item.expression);
                  setResult(item.result);
                }}
                style={[styles.historyItem, { borderBottomColor: theme.border }, idx === history.length - 1 && { borderBottomWidth: 0 }]}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 13 }}>{item.expression} =</ThemedText>
                <ThemedText type="defaultBold" style={{ fontSize: 14 }}>{item.result}</ThemedText>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  displayCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    alignItems: 'flex-end',
    gap: 2,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  expressionText: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  resultText: {
    fontSize: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  keypad: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    flex: 1,
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWide: {
    flex: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  historySection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.two,
    marginTop: Spacing.one,
    gap: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyScroll: {
    maxHeight: 110,
  },
  emptyHistoryText: {
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
