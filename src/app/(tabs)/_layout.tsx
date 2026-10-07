import { useState } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickAddModal } from '@/components/quick-add-modal';
import { useTheme } from '@/hooks/use-theme';
import { Radius } from '@/constants/theme';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const bottomPadding = Math.max(insets.bottom, 10);
  const tabHeight = 62 + bottomPadding;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: tabHeight,
            paddingBottom: bottomPadding,
            paddingTop: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                size={24}
                color={color}
              />
            ),
          }}
          listeners={{
            tabPress: () => triggerHaptic(),
          }}
        />

        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Expenses',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={24}
                color={color}
              />
            ),
          }}
          listeners={{
            tabPress: () => triggerHaptic(),
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            tabBarButton: () => (
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setShowQuickAdd(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Quick add transaction or entry"
                style={styles.addButtonWrapper}>
                <View style={[styles.addButton, { backgroundColor: theme.accent }]}>
                  <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
                </View>
              </Pressable>
            ),
          }}
        />

        <Tabs.Screen
          name="reports"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'chart-box' : 'chart-donut-variant'}
                size={24}
                color={color}
              />
            ),
          }}
          listeners={{
            tabPress: () => triggerHaptic(),
          }}
        />

        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'grid' : 'grid-large'}
                size={24}
                color={color}
              />
            ),
          }}
          listeners={{
            tabPress: () => triggerHaptic(),
          }}
        />
      </Tabs>

      <QuickAddModal
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  addButtonWrapper: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0152F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
