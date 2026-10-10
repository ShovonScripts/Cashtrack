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
    <View style={styles.heroCard}>
      {/* Spendly Brand Ambient Background Orbs */}
      <View pointerEvents="none" style={styles.heroOrbLarge} />
      <View pointerEvents="none" style={styles.heroOrbSmall} />

      <View style={styles.heroContent}>
        {/* Topline: Label & Pill */}
        <View style={styles.heroTopline}>
          <ThemedText type="caption" style={styles.heroLabel}>
            MONTHLY CASH FLOW
          </ThemedText>
          <View style={styles.monthPill}>
            <ThemedText type="caption" style={styles.monthPillText}>Net Balance</ThemedText>
          </View>
        </View>

        {/* Main Hero Net Value - Pure White like Daily Cost card */}
        <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
          {net >= 0 ? `+${formatAmount(net)}` : formatAmount(net)}
        </ThemedText>

        {/* Footer Metrics Row with Clean White Style */}
        <View style={styles.footerRow}>
          <View style={styles.metricsPillsRow}>
            <View style={styles.whiteChip}>
              <View style={styles.greenDot} />
              <ThemedText type="small" style={styles.chipText}>
                In: {formatAmount(moneyIn)}
              </ThemedText>
            </View>
            <View style={styles.whiteChip}>
              <View style={styles.redDot} />
              <ThemedText type="small" style={styles.chipText}>
                Out: {formatAmount(moneyOut)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Solid White Action Button like Daily Cost card */}
        <Pressable
          onPress={() => {
            router.push('/income');
          }}
          accessibilityRole="button"
          accessibilityLabel="Manage money in and cash flow"
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="plus" size={18} color={Brand.deep} />
            <ThemedText type="defaultBold" style={styles.addButtonText}>Manage money in</ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 215,
    backgroundColor: Brand.deep, // Signature Spendly Deep Navy Blue (#00109D)
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -90,
    top: -100,
    backgroundColor: 'rgba(139, 123, 255, 0.25)',
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    left: -50,
    bottom: -60,
    backgroundColor: 'rgba(20, 231, 253, 0.2)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
    fontWeight: '800',
    fontSize: 11,
  },
  monthPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  monthPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  whiteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.small,
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F87171',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
  },
  addButtonText: {
    color: Brand.deep,
  },
  pressed: {
    opacity: 0.75,
  },
});
