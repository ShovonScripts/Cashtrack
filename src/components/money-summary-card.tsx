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
        {/* Topline: Label & Action Button */}
        <View style={styles.heroTopline}>
          <ThemedText type="caption" style={styles.heroLabel}>
            MONTHLY CASH FLOW
          </ThemedText>
          <Pressable
            onPress={() => router.push('/income')}
            accessibilityRole="button"
            accessibilityLabel="Manage money in"
            style={({ pressed }) => [styles.whitePillBtn, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="plus" size={16} color={Brand.deep} />
            <ThemedText type="smallBold" style={styles.whitePillBtnText}>
              Money In
            </ThemedText>
          </Pressable>
        </View>

        {/* Main Hero Net Value */}
        <ThemedText type="hero" style={[styles.heroValue, { color: net >= 0 ? '#4ADE80' : '#F87171' }]} numberOfLines={1} adjustsFontSizeToFit>
          {net >= 0 ? `+${formatAmount(net)}` : formatAmount(net)}
        </ThemedText>

        {/* Footer Metrics Row */}
        <View style={styles.footerRow}>
          <View style={styles.metricsPillsRow}>
            <View style={styles.moneyInBadge}>
              <View style={styles.greenDot} />
              <ThemedText style={styles.moneyInBadgeText}>
                +{formatAmount(moneyIn)}
              </ThemedText>
            </View>
            <View style={styles.moneyOutBadge}>
              <View style={styles.redDot} />
              <ThemedText style={styles.moneyOutBadgeText}>
                {moneyOut > 0 ? `-${formatAmount(moneyOut)}` : formatAmount(0)}
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/income')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.whiteLinkButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
              Manage →
            </ThemedText>
          </Pressable>
        </View>
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
  whitePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  whitePillBtnText: {
    color: Brand.deep,
    fontWeight: '700',
  },
  heroValue: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
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
  moneyInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  moneyOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
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
  moneyInBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  moneyOutBadgeText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  whiteLinkButton: {
    paddingVertical: Spacing.half,
  },
  pressed: {
    opacity: 0.75,
  },
});
