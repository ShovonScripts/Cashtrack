import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();

  return (
    <ThemedView
      type="card"
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      {/* Top Stylish Accent Pill */}
      <View style={styles.topAccentBar}>
        <View style={[styles.accentPill, { backgroundColor: theme.accent }]} />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.titleCopy}>
          <ThemedText type="defaultBold">Monthly cash flow</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Money In vs. Money Out</ThemedText>
        </View>
        <Pressable
          onPress={() => router.push('/income')}
          accessibilityRole="button"
          accessibilityLabel="Manage money in"
          style={({ pressed }) => [styles.incomeBtn, { backgroundColor: theme.accentMuted }, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Money In</ThemedText>
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <ThemedText type="caption" themeColor="textSecondary">MONEY IN</ThemedText>
          <ThemedText type="defaultBold" style={{ color: '#27AE60', fontSize: 18 }} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(moneyIn)}
          </ThemedText>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.metric}>
          <ThemedText type="caption" themeColor="textSecondary">MONEY OUT</ThemedText>
          <ThemedText type="defaultBold" style={{ color: theme.danger, fontSize: 18 }} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(moneyOut)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.netRow, { backgroundColor: theme.cardMuted }]}>
        <ThemedText type="small" themeColor="textSecondary">Remaining Balance:</ThemedText>
        <ThemedText type="defaultBold" style={{ color: net >= 0 ? '#27AE60' : theme.danger }}>
          {net >= 0 ? `+${formatAmount(net)}` : formatAmount(net)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { height: 215, justifyContent: 'space-between', padding: Spacing.four, borderRadius: Radius.xlarge, overflow: 'hidden' },
  topAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, alignItems: 'center' },
  accentPill: { width: 40, height: 4, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  titleCopy: { gap: 2 },
  incomeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Radius.pill },
  metricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  metric: { flex: 1, gap: 4 },
  divider: { width: StyleSheet.hairlineWidth, height: 32 },
  netRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.three, borderRadius: Radius.medium },
  pressed: { opacity: 0.75 },
});
