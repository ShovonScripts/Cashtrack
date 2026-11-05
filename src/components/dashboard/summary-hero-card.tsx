import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, FeatureColors, glow, Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

type SummaryChipTone = 'positive' | 'negative' | 'info';

const CHIP_DOT_COLORS: Record<SummaryChipTone, string> = {
  positive: FeatureColors.mint,
  negative: '#F87171',
  info: FeatureColors.skyLight,
};

type SummaryChipProps = {
  label: string;
  tone: SummaryChipTone;
};

export function SummaryChip({ label, tone }: SummaryChipProps) {
  return (
    <View style={styles.whiteChip}>
      <View style={[styles.chipDot, { backgroundColor: CHIP_DOT_COLORS[tone] }]} />
      <ThemedText
        type="small"
        style={styles.chipText}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {label}
      </ThemedText>
    </View>
  );
}

type SummaryHeroCardProps = {
  title: string;
  pill: string;
  amount: number;
  formatAmount: (amount: number) => string;
  signed?: boolean;
  chips: readonly SummaryChipProps[];
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  actionLabel: string;
  onActionPress: () => void;
};

function formatHeroValue(
  amount: number,
  signed: boolean,
  formatAmount: (amount: number) => string
) {
  if (!signed) return formatAmount(amount);
  const rounded = Math.round(amount * 100) / 100;
  if (rounded > 0) return `+${formatAmount(rounded)}`;
  if (rounded < 0) return `-${formatAmount(Math.abs(rounded))}`;
  return formatAmount(0);
}

export function SummaryHeroCard({
  title,
  pill,
  amount,
  formatAmount,
  signed = false,
  chips,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  actionLabel,
  onActionPress,
}: SummaryHeroCardProps) {
  const theme = useTheme();
  const rounded = Math.round(amount * 100) / 100;
  const valueColor = signed && rounded < 0 ? theme.dangerOnBrand : Palette.white;

  const handlePress = () => {
    triggerHaptic();
    onPress();
  };

  const handleActionPress = () => {
    triggerHaptic();
    onActionPress();
  };

  return (
    <View style={styles.heroCard}>
      <View pointerEvents="none" style={styles.heroOrbLarge} />
      <View pointerEvents="none" style={styles.heroOrbSmall} />

      <View style={styles.cardContent}>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={({ pressed }) => [styles.cardPressArea, pressed && styles.cardPressed]}>
          <View style={styles.heroTopline}>
            <ThemedText type="caption" style={styles.heroLabel} numberOfLines={1}>
              {title}
            </ThemedText>
            <View style={styles.monthPill}>
              <ThemedText type="caption" style={styles.monthPillText} numberOfLines={1}>
                {pill}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            type="hero"
            style={[styles.heroValue, { color: valueColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}>
            {formatHeroValue(amount, signed, formatAmount)}
          </ThemedText>

          <View style={styles.metricsPillsRow}>
            {chips.map((chip) => (
              <SummaryChip key={chip.label} label={chip.label} tone={chip.tone} />
            ))}
          </View>
        </Pressable>

        <Pressable
          onPress={handleActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.actionTouchArea, pressed && styles.actionPressed]}>
          <View style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={16} color={Brand.deep} />
            <ThemedText type="defaultBold" style={styles.addButtonText}>
              {actionLabel}
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    minHeight: 195,
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'space-between',
    // The home hero lights the page under it: the one glowing surface on Home.
    boxShadow: glow(Brand.deep, 'strong'),
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(139, 123, 255, 0.22)',
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    left: -40,
    bottom: -50,
    backgroundColor: 'rgba(20, 231, 253, 0.18)',
  },
  cardContent: {
    padding: Spacing.three,
    zIndex: 2,
    gap: Spacing.two,
    justifyContent: 'space-between',
    flex: 1,
  },
  cardPressArea: {
    gap: Spacing.one,
  },
  cardPressed: {
    opacity: 0.9,
  },
  heroTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.8,
    fontWeight: '800',
    fontSize: 11,
    flexShrink: 1,
  },
  monthPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    flexShrink: 0,
  },
  monthPillText: {
    color: Palette.white,
    fontWeight: '700',
    fontSize: 11,
  },
  heroValue: {
    color: Palette.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whiteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.small,
    flexShrink: 1,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  chipText: {
    color: Palette.white,
    fontWeight: '700',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  actionTouchArea: {
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    minHeight: 36,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.three,
    marginTop: 2,
  },
  actionPressed: {
    opacity: 0.75,
  },
  addButtonText: {
    color: Brand.deep,
    fontSize: 14,
    fontWeight: '700',
  },
});
