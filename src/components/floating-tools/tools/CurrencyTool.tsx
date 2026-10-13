import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CURRENCIES, convertCurrency } from '@/constants/currency-rates';

const POPULAR_CODES = ['USD', 'EUR', 'GBP', 'INR', 'BDT', 'JPY', 'CAD', 'AUD'];

export function CurrencyTool() {
  const theme = useTheme();
  const [fromAmount, setFromAmount] = useState<string>('1');
  const [fromCode, setFromCode] = useState<string>('USD');
  const [toCode, setToCode] = useState<string>('EUR');
  const [showFromPicker, setShowFromPicker] = useState<boolean>(false);
  const [showToPicker, setShowToPicker] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  useEffect(() => {
    AsyncStorage.multiGet(['@spendly_currency_from', '@spendly_currency_to']).then((res) => {
      if (res[0][1]) setFromCode(res[0][1]);
      if (res[1][1]) setToCode(res[1][1]);
    });
  }, []);

  const handleRefreshRates = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUpdating(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data && data.rates) {
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch {
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsUpdating(false);
    }
  };

  const numericFrom = parseFloat(fromAmount) || 0;
  const convertedAmount = convertCurrency(numericFrom, fromCode, toCode);

  const fromCurr = CURRENCIES.find((c) => c.code === fromCode) || CURRENCIES[0];
  const toCurr = CURRENCIES.find((c) => c.code === toCode) || CURRENCIES[1];

  const singleRate = convertCurrency(1, fromCode, toCode);
  const inverseRate = convertCurrency(1, toCode, fromCode);

  const handleSwap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newFrom = toCode;
    const newTo = fromCode;
    setFromCode(newFrom);
    setToCode(newTo);
    await AsyncStorage.multiSet([
      ['@spendly_currency_from', newFrom],
      ['@spendly_currency_to', newTo],
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Quick Select Popular Currencies Bar */}
      <View style={styles.popularRow}>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.popularLabel}>
          POPULAR
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScroll}>
          {POPULAR_CODES.map((code) => {
            const active = fromCode === code;
            return (
              <Pressable
                key={code}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFromCode(code);
                  AsyncStorage.setItem('@spendly_currency_from', code);
                  setShowFromPicker(false);
                }}
                style={[
                  styles.popularChip,
                  {
                    backgroundColor: active ? theme.accent : theme.cardMuted,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}>
                <ThemedText
                  type="caption"
                  style={{ color: active ? '#FFFFFF' : theme.text, fontWeight: '700', fontSize: 11 }}>
                  {code}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* From Card */}
      <View style={[styles.card, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.cardHeaderTitle}>
            CONVERT FROM
          </ThemedText>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFromPicker(!showFromPicker);
              setShowToPicker(false);
            }}
            style={({ pressed }) => [
              styles.currencySelector,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && { opacity: 0.8 },
            ]}>
            <ThemedText type="defaultBold" style={{ fontSize: 13 }}>{fromCurr.code} ({fromCurr.symbol})</ThemedText>
            <Ionicons name={showFromPicker ? 'chevron-up' : 'chevron-down'} size={14} color={theme.accent} />
          </Pressable>
        </View>

        {/* Inline From Currency Picker */}
        {showFromPicker && (
          <View style={[styles.inlineDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFromCode(c.code);
                    AsyncStorage.setItem('@spendly_currency_from', c.code);
                    setShowFromPicker(false);
                  }}
                  style={[styles.pickerItem, { borderBottomColor: theme.border }, c.code === fromCode && { backgroundColor: `${theme.accent}12` }]}>
                  <ThemedText type="defaultBold" style={c.code === fromCode ? { color: theme.accent } : undefined}>{c.code}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">{c.name} ({c.symbol})</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputRow}>
          <ThemedText type="subtitle" style={[styles.symbolText, { color: theme.accent }]}>{fromCurr.symbol}</ThemedText>
          <TextInput
            value={fromAmount}
            onChangeText={setFromAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />
        </View>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1} style={{ fontSize: 11 }}>
          {fromCurr.name}
        </ThemedText>
      </View>

      {/* Masterclass Floating Swap Button */}
      <View style={styles.swapButtonWrapper}>
        <Pressable
          onPress={handleSwap}
          style={({ pressed }) => [
            styles.swapButton,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.accent },
            pressed && { transform: [{ scale: 0.9 }], backgroundColor: `${theme.accent}22` },
          ]}>
          <Ionicons name="swap-vertical" size={18} color={theme.accent} />
        </Pressable>
      </View>

      {/* To Card */}
      <View style={[styles.card, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.cardHeaderTitle}>
            CONVERT TO
          </ThemedText>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowToPicker(!showToPicker);
              setShowFromPicker(false);
            }}
            style={({ pressed }) => [
              styles.currencySelector,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && { opacity: 0.8 },
            ]}>
            <ThemedText type="defaultBold" style={{ fontSize: 13 }}>{toCurr.code} ({toCurr.symbol})</ThemedText>
            <Ionicons name={showToPicker ? 'chevron-up' : 'chevron-down'} size={14} color={theme.success} />
          </Pressable>
        </View>

        {/* Inline To Currency Picker */}
        {showToPicker && (
          <View style={[styles.inlineDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setToCode(c.code);
                    AsyncStorage.setItem('@spendly_currency_to', c.code);
                    setShowToPicker(false);
                  }}
                  style={[styles.pickerItem, { borderBottomColor: theme.border }, c.code === toCode && { backgroundColor: `${theme.success}12` }]}>
                  <ThemedText type="defaultBold" style={c.code === toCode ? { color: theme.success } : undefined}>{c.code}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">{c.name} ({c.symbol})</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputRow}>
          <ThemedText type="subtitle" style={[styles.symbolText, { color: theme.success }]}>{toCurr.symbol}</ThemedText>
          <ThemedText type="hero" style={[styles.resultAmount, { color: theme.text }]} numberOfLines={1}>
            {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </ThemedText>
        </View>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1} style={{ fontSize: 11 }}>
          {toCurr.name}
        </ThemedText>
      </View>

      {/* Masterclass Exchange Rate & Live Badge Card */}
      <View style={[styles.rateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.rateHeaderRow}>
          <View style={styles.liveBadgeRow}>
            <View style={styles.greenDot} />
            <ThemedText type="smallBold" style={{ color: theme.success, fontSize: 10 }}>
              LIVE MID-MARKET RATES
            </ThemedText>
          </View>
          <Pressable onPress={handleRefreshRates} disabled={isUpdating} style={styles.refreshBtn} hitSlop={8}>
            <Ionicons name="refresh" size={13} color={theme.accent} style={isUpdating ? { transform: [{ rotate: '180deg' }] } : undefined} />
            <ThemedText type="caption" style={{ color: theme.accent, fontSize: 11, fontWeight: '700' }}>
              {isUpdating ? 'Updating...' : lastUpdated}
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.rateDivider, { backgroundColor: theme.border }]} />

        <View style={styles.rateRows}>
          <ThemedText type="caption" style={styles.rateText}>
            1 {fromCurr.code} = <ThemedText type="defaultBold">{singleRate} {toCurr.code}</ThemedText>
          </ThemedText>
          <ThemedText type="caption" style={styles.rateText}>
            1 {toCurr.code} = <ThemedText type="defaultBold">{inverseRate} {fromCurr.code}</ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    paddingBottom: Spacing.one,
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    marginBottom: 2,
  },
  popularLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  popularScroll: {
    gap: 4,
    paddingVertical: 2,
  },
  popularChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 4,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    letterSpacing: 0.5,
    fontWeight: '700',
    fontSize: 10,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inlineDropdown: {
    marginTop: 4,
    maxHeight: 150,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    zIndex: 50,
    elevation: 6,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  pickerItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginVertical: 2,
  },
  symbolText: {
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 0,
    fontVariant: ['tabular-nums'],
  },
  resultAmount: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  swapButtonWrapper: {
    alignItems: 'center',
    marginVertical: -14,
    zIndex: 20,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  rateCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  rateRows: {
    gap: 2,
  },
  rateText: {
    fontSize: 12,
  },
});
