import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const numericFrom = parseFloat(fromAmount) || 0;
  const convertedAmount = convertCurrency(numericFrom, fromCode, toCode);

  const fromCurr = CURRENCIES.find((c) => c.code === fromCode) || CURRENCIES[0];
  const toCurr = CURRENCIES.find((c) => c.code === toCode) || CURRENCIES[1];

  const singleRate = convertCurrency(1, fromCode, toCode);
  const inverseRate = convertCurrency(1, toCode, fromCode);

  const handleSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromCode(toCode);
    setToCode(fromCode);
  };

  return (
    <View style={styles.container}>
      {/* Quick Select Popular Currencies Bar */}
      <View style={styles.popularRow}>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.popularLabel}>
          POPULAR:
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
                  style={{ color: active ? '#FFFFFF' : theme.text, fontWeight: '700' }}>
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
            <ThemedText type="defaultBold">{fromCurr.code} ({fromCurr.symbol})</ThemedText>
            <Ionicons name="chevron-down" size={16} color={theme.accent} />
          </Pressable>
        </View>

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
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {fromCurr.name}
        </ThemedText>
      </View>

      {/* From Currency Picker Dropdown */}
      {showFromPicker && (
        <ScrollView style={[styles.pickerDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => {
                setFromCode(c.code);
                setShowFromPicker(false);
              }}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}>
              <ThemedText type="defaultBold">{c.code}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">{c.name} ({c.symbol})</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Masterclass Swap Button */}
      <Pressable
        onPress={handleSwap}
        style={({ pressed }) => [
          styles.swapButton,
          { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.accent },
          pressed && { transform: [{ scale: 0.92 }], backgroundColor: theme.accentMuted },
        ]}>
        <Ionicons name="swap-vertical" size={22} color={theme.accent} />
      </Pressable>

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
            <ThemedText type="defaultBold">{toCurr.code} ({toCurr.symbol})</ThemedText>
            <Ionicons name="chevron-down" size={16} color={theme.accent} />
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <ThemedText type="subtitle" style={[styles.symbolText, { color: theme.success }]}>{toCurr.symbol}</ThemedText>
          <ThemedText type="hero" style={[styles.resultAmount, { color: theme.text }]} numberOfLines={1}>
            {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </ThemedText>
        </View>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {toCurr.name}
        </ThemedText>
      </View>

      {/* To Currency Picker Dropdown */}
      {showToPicker && (
        <ScrollView style={[styles.pickerDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => {
                setToCode(c.code);
                setShowToPicker(false);
              }}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}>
              <ThemedText type="defaultBold">{c.code}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">{c.name} ({c.symbol})</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Masterclass Exchange Rate & Live Badge Card */}
      <View style={[styles.rateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.rateHeaderRow}>
          <View style={styles.liveBadgeRow}>
            <View style={styles.greenDot} />
            <ThemedText type="smallBold" style={{ color: theme.success, fontSize: 11 }}>
              LIVE MID-MARKET RATES
            </ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            Updated just now
          </ThemedText>
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
    gap: Spacing.two,
    paddingBottom: Spacing.six,
    position: 'relative',
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.half,
  },
  popularLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  popularScroll: {
    gap: Spacing.one,
    paddingVertical: 2,
  },
  popularChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    letterSpacing: 0.6,
    fontWeight: '700',
    fontSize: 11,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginVertical: 4,
  },
  symbolText: {
    fontSize: 22,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: 0,
    fontVariant: ['tabular-nums'],
  },
  resultAmount: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: -14,
    zIndex: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pickerDropdown: {
    position: 'absolute',
    top: 110,
    right: 0,
    width: 240,
    maxHeight: 240,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    zIndex: 99,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  pickerItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  rateDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  rateRows: {
    gap: 4,
  },
  rateText: {
    fontSize: 13,
  },
});
