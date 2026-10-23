import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CalculatorTool } from '@/components/floating-tools/tools/CalculatorTool';

export default function CalculatorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      {/* Fixed Header */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top + Spacing.one, Spacing.two), backgroundColor: theme.background },
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="arrow-back" size={18} color={theme.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <ThemedText type="title">Quick Calculator</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                Math & bills
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 140 + insets.bottom, paddingHorizontal: Spacing.three },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.wrapper}>
          <Card style={styles.cardContainer}>
            <CalculatorTool />
          </Card>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  cardContainer: {
    padding: Spacing.three,
  },
});
