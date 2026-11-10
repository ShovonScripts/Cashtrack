import { Modal, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
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
        <View
          accessibilityViewIsModal
          style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.badge, { backgroundColor: withAlpha(theme.success, 0.15) }]}>
            <MaterialCommunityIcons name="trophy" size={36} color={theme.success} />
          </View>

          <View style={styles.textGroup}>
            <ThemedText type="subtitle" style={styles.title} accessibilityLiveRegion="polite">Pot complete!</ThemedText>
            <ThemedText type="defaultBold" style={{ color: theme.accent }}>{goal.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              You planned it, you saved for it, and you reached it.
            </ThemedText>
          </View>

          <Card style={styles.statCard}>
            {goal.targetAmount > 0 ? (
              <View style={styles.statRow}>
                <ThemedText type="small" themeColor="textSecondary">Target</ThemedText>
                <ThemedText type="defaultBold">{formatAmount(goal.targetAmount)}</ThemedText>
              </View>
            ) : null}
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Saved</ThemedText>
              <ThemedText type="defaultBold" style={{ color: theme.success }}>{formatAmount(goal.contributedAmount)}</ThemedText>
            </View>
          </Card>

          <Button label="Great" onPress={onClose} accessibilityLabel="Close the pot complete message" style={styles.button} />
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
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320, marginTop: Spacing.half },
  statCard: { width: '100%', gap: Spacing.two },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: { alignSelf: 'stretch' },
});
