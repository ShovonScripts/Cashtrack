import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';

export function MoneySummaryCard({
  moneyIn,
  moneyOut,
  net,
  formatAmount,
}: {
  moneyIn: number;
  moneyOut: number;
  net: number;
  formatAmount: (amount: number) => string;
}) {
  return (
    <View style={styles.cardContainer}>
      {/* Spendly Brand Ambient Background Orbs */}
      <View pointerEvents="none" style={styles.primaryBlueOrb} />
      <View pointerEvents="none" style={styles.brightCyanOrb} />

      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleCopy}>
          <ThemedText type="defaultBold" style={styles.whiteTitle}>
            Monthly cash flow
          </ThemedText>
          <ThemedText type="caption" style={styles.subtext}>
            Money In vs. Money Out
          </ThemedText>
        </View>

        <Pressable
          onPress={() => router.push('/income')}
          accessibilityRole="button"
          accessibilityLabel="Manage money in"
          style={({ pressed }) => [styles.glassIncomeBtn, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="plus" size={14} color="#FFFFFF" />
          <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
            Money In
          </ThemedText>
        </Pressable>
      </View>

      {/* Metrics Row: Money In & Money Out Glass Cards */}
      <View style={styles.metricsRow}>
        {/* Money In Glass Pill (Spendly Cyan/Blue Accent) */}
        <View style={styles.moneyInPill}>
          <View style={styles.pillHeader}>
            <View style={styles.cyanDot} />
            <ThemedText type="caption" style={styles.moneyInLabel}>
              MONEY IN
            </ThemedText>
          </View>
          <ThemedText type="defaultBold" style={styles.moneyInValue} numberOfLines={1} adjustsFontSizeToFit>
            +{formatAmount(moneyIn)}
          </ThemedText>
        </View>

        {/* Money Out Glass Pill (Coral Red Accent) */}
        <View style={styles.moneyOutPill}>
          <View style={styles.pillHeader}>
            <View style={styles.redDot} />
            <ThemedText type="caption" style={styles.moneyOutLabel}>
              MONEY OUT
            </ThemedText>
          </View>
          <ThemedText type="defaultBold" style={styles.moneyOutValue} numberOfLines={1} adjustsFontSizeToFit>
            {moneyOut > 0 ? `-${formatAmount(moneyOut)}` : formatAmount(0)}
          </ThemedText>
        </View>
      </View>

      {/* Remaining Net Balance Glass Bar */}
      <View style={styles.netGlassRow}>
        <ThemedText type="small" style={styles.netLabel}>
          Remaining Net Balance:
        </ThemedText>
        <ThemedText type="defaultBold" style={[styles.netValue, { color: net >= 0 ? Brand.bright : '#F87171' }]}>
          {net >= 0 ? `+${formatAmount(net)}` : formatAmount(net)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    height: 215,
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
    backgroundColor: Brand.deep, // Signature Spendly Deep Navy Blue (#00109D)
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)', // Brand.bright Cyan border
    position: 'relative',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  /* Ambient Spendly Multi-Tone Gradient Orbs */
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(1, 82, 245, 0.45)', // Brand.primary (#0152F5)
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(20, 231, 253, 0.3)', // Brand.bright (#14E7FD)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  titleCopy: { gap: 2 },
  whiteTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  subtext: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 },
  glassIncomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    zIndex: 2,
  },
  moneyInPill: {
    flex: 1,
    padding: Spacing.two + 2,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(20, 231, 253, 0.15)', // Brand.bright Cyan Glass Wash
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)',
    gap: 4,
  },
  moneyOutPill: {
    flex: 1,
    padding: Spacing.two + 2,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    gap: 4,
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.bright, // #14E7FD
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F87171',
  },
  moneyInLabel: {
    color: Brand.bright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moneyOutLabel: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moneyInValue: {
    color: Brand.bright,
    fontSize: 19,
    fontWeight: '800',
  },
  moneyOutValue: {
    color: '#F87171',
    fontSize: 19,
    fontWeight: '800',
  },
  netGlassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 2,
  },
  netLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
  netValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
