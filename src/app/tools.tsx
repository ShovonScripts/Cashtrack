import { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CalculatorTool } from '@/components/floating-tools/tools/CalculatorTool';
import { NotesTool } from '@/components/floating-tools/tools/NotesTool';
import { StopwatchTool } from '@/components/floating-tools/tools/StopwatchTool';

type ToolTab = 'calculator' | 'notes' | 'stopwatch';

export default function ToolsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ToolTab>('calculator');

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + Spacing.two, Spacing.four), paddingBottom: 110 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.wrapper}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title">Utility Tools</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Calculator, scratchpad notes, and stopwatch in one hub
            </ThemedText>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={[styles.tabBar, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            {(
              [
                { key: 'calculator', label: 'Calculator', icon: 'calculator-outline' },
                { key: 'notes', label: 'Keep Notes', icon: 'document-text-outline' },
                { key: 'stopwatch', label: 'Stopwatch', icon: 'stopwatch-outline' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.tabButton,
                    active && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
                  ]}>
                  <Ionicons name={tab.icon} size={16} color={active ? theme.accent : theme.textSecondary} />
                  <ThemedText
                    type="smallBold"
                    style={{ color: active ? theme.accent : theme.textSecondary }}>
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Tool Card Container */}
          <Card style={styles.toolCardContainer}>
            {activeTab === 'calculator' && <CalculatorTool />}
            {activeTab === 'notes' && <NotesTool />}
            {activeTab === 'stopwatch' && <StopwatchTool />}
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
  scrollContent: {
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: 2,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toolCardContainer: {
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
});
