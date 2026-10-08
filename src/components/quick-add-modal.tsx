import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'expense',
    title: 'Add Expense',
    subtitle: 'Outflows, shopping & receipts',
    icon: 'cash-minus',
    color: '#EB5757',
    route: '/add-expense',
  },
  {
    id: 'income',
    title: 'Add Income',
    subtitle: 'Salary, freelance & side cash',
    icon: 'cash-plus',
    color: '#27AE60',
    route: '/income',
  },
  {
    id: 'bill',
    title: 'Add Bill / Reminder',
    subtitle: 'Rent, subscriptions & EMIs',
    icon: 'calendar-clock',
    color: '#F2994A',
    route: '/bills/add',
  },
  {
    id: 'debt',
    title: 'Add Debt / Loan',
    subtitle: 'Money lent or borrowed',
    icon: 'account-cash-outline',
    color: '#2D9CDB',
    route: '/debts/add',
  },
];

export function QuickAddModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleAction = (route: string) => {
    triggerHaptic();
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            triggerHaptic();
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close quick add menu"
        />

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(180)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, Spacing.four),
            },
          ]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: theme.textSecondary }]} />

          {/* Sheet Header */}
          <View style={styles.header}>
            <View>
              <ThemedText type="defaultBold" style={styles.title}>
                Quick Record
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                What would you like to log?
              </ThemedText>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              style={[styles.closeButton, { backgroundColor: theme.cardMuted }]}>
              <MaterialCommunityIcons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Action Grid */}
          <View style={styles.actionGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handleAction(action.route)}
                accessibilityRole="button"
                accessibilityLabel={action.title}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: theme.cardMuted, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.iconBadge, { backgroundColor: `${action.color}1E` }]}>
                  <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
                </View>
                <View style={styles.actionText}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {action.title}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                    {action.subtitle}
                  </ThemedText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    opacity: 0.3,
    marginBottom: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGrid: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
