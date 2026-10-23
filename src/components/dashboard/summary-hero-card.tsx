import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

type SummaryChipTone = 'positive' | 'negative' | 'info';

const CHIP_DOT_COLORS: Record<SummaryChipTone, string> = {
  positive: '#34D399',
  negative: '#F87171',
  info: '#38BDF8',
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
  const valueColor = signed && rounded < 0 ? theme.dangerOnBrand : '#FFFFFF';

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

      <View style={styles.heroContent}>
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
            minimumFontScale={0.6}>
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
          style={({ pressed }) => [styles.addButton, pressed && styles.actionPressed]}>
          <MaterialCommunityIcons name="plus" size={18} color={Brand.deep} />
          <ThemedText type="defaultBold" style={styles.addButtonText}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    minHeight: 215,
    backgroundColor: Brand.deep,
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
    zIndex: 2,
  },
  cardPressArea: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: Spacing.three,
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
    letterSpacing: 1,
    fontWeight: '800',
    fontSize: 11,
    flexShrink: 1,
  },
  monthPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    flexShrink: 0,
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
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whiteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.small,
    flexShrink: 1,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    minHeight: 44,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
  },
  actionPressed: {
    opacity: 0.75,
  },
  addButtonText: {
    color: Brand.deep,
  },
});
