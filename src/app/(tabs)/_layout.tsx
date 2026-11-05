import { useState } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickAddModal } from '@/components/quick-add-modal';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { Brand, Elevation, glow, Radius } from '@/constants/theme';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function TabLayout() {
  const theme = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const bottomPadding = Math.max(insets.bottom, 10);
  const tabHeight = 62 + bottomPadding;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          // The tab bar has a fixed height, so its labels keep a constant size while the rest of the app scales.
          tabBarAllowFontScaling: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: tabHeight,
            paddingBottom: bottomPadding,
            paddingTop: 8,
            ...(isDark ? Elevation.none : Elevation.top),
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
                color={color as any}
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
            title: 'Transactions',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={24}
                color={color as any}
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
                <View style={[styles.addButton, { backgroundColor: theme.accentFill, borderColor: theme.card }]}>
                  <MaterialCommunityIcons name="plus" size={34} color={theme.onBrand} />
                </View>
              </Pressable>
            ),
          }}
        />

        <Tabs.Screen
          name="reports"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'chart-box' : 'chart-donut-variant'}
                size={24}
                color={color as any}
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
            title: 'More',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'grid' : 'grid-large'}
                size={24}
                color={color as any}
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
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: glow(Brand.primary, 'strong'),
  },
});
