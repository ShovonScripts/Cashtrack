import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/utils/color';
import type { GoalWithProgress } from '@/context/goal-context';

export function GoalCompletionModal({
  goal,
  visible,
  onClose,
  formatAmount,
}: {
  goal: GoalWithProgress | null;
  visible: boolean;
  onClose: () => void;
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();

  if (!visible || !goal) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.badge, { backgroundColor: withAlpha(theme.success, 0.15) }]}>
            <MaterialCommunityIcons name="trophy" size={36} color={theme.success} />
          </View>

          <View style={styles.textGroup}>
            <ThemedText type="subtitle" style={styles.title}>Goal Completed!</ThemedText>
            <ThemedText type="defaultBold" style={{ color: theme.accent }}>{goal.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              You planned it. You saved for it. You achieved it.
            </ThemedText>
          </View>

          <Card style={styles.statCard}>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Target Amount</ThemedText>
              <ThemedText type="defaultBold">{formatAmount(goal.targetAmount)}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Total Saved</ThemedText>
              <ThemedText type="defaultBold" style={{ color: theme.success }}>{formatAmount(goal.contributedAmount)}</ThemedText>
            </View>
          </Card>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: theme.onBrand }}>Awesome</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  container: { width: '100%', maxWidth: 420, borderRadius: Radius.large, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  badge: { width: 68, height: 68, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  textGroup: { alignItems: 'center', gap: Spacing.half, textAlign: 'center' },
  title: { fontSize: 24, lineHeight: 30, textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320, marginTop: Spacing.half },
  statCard: { width: '100%', gap: Spacing.two },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: { width: '100%', minHeight: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.78 },
});
