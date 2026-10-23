import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CalculatorTool } from './tools/CalculatorTool';
import { NotesTool } from './tools/NotesTool';
import { StopwatchTool } from './tools/StopwatchTool';
import { CurrencyTool } from './tools/CurrencyTool';
import { CalendarTool } from './tools/CalendarTool';

type ToolType = 'calculator' | 'notes' | 'stopwatch' | 'currency' | 'calendar' | null;

type ToolsMenuModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ToolsMenuModal({ visible, onClose }: ToolsMenuModalProps) {
  const theme = useTheme();
  const [activeTool, setActiveTool] = useState<ToolType>(null);

  const handleClose = () => {
    setActiveTool(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close quick tools"
        />

        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.dragHandleBar} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {activeTool && (
                <Pressable
                  onPress={() => setActiveTool(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Back to tools"
                  hitSlop={6}
                  style={[styles.backButton, { backgroundColor: theme.cardMuted }]}>
                  <Ionicons name="arrow-back" size={18} color={theme.text} />
                </Pressable>
              )}
              <View>
                <ThemedText type="subtitle">
                  {activeTool === 'calculator'
                    ? 'Quick Calculator'
                    : activeTool === 'notes'
                      ? 'Keep Notes'
                      : activeTool === 'stopwatch'
                        ? 'Stopwatch'
                        : activeTool === 'currency'
                          ? 'Currency Converter'
                          : activeTool === 'calendar'
                            ? 'Quick Calendar'
                            : 'Quick Tools'}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {activeTool ? 'Active utility tool' : 'Select a tool to get started'}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close quick tools"
              hitSlop={6}
              style={[styles.closeButton, { backgroundColor: theme.cardMuted }]}>
              <Ionicons name="close" size={18} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {!activeTool ? (
              <View style={styles.grid}>
                <Pressable
                  onPress={() => setActiveTool('calculator')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressedCard,
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.accent}15` }]}>
                    <Ionicons name="calculator-outline" size={24} color={theme.accent} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText type="defaultBold">Calculator</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Compute math & bills</ThemedText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTool('currency')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressedCard,
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: '#05966915' }]}>
                    <Ionicons name="cash-outline" size={24} color="#059669" />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText type="defaultBold">Currency</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Exchange rates</ThemedText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTool('notes')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressedCard,
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.success}15` }]}>
                    <Ionicons name="document-text-outline" size={24} color={theme.success} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText type="defaultBold">Keep Notes</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Scratchpad & lists</ThemedText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTool('stopwatch')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressedCard,
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.warning}15` }]}>
                    <Ionicons name="stopwatch-outline" size={24} color={theme.warning} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText type="defaultBold">Stopwatch</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Track elapsed time</ThemedText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTool('calendar')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressedCard,
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: '#4F46E515' }]}>
                    <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText type="defaultBold">Calendar</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Bill & renewal grid</ThemedText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    handleClose();
                    router.push('/add-expense');
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressedCard,
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.info}15` }]}>
                    <Ionicons name="add-circle-outline" size={24} color={theme.info} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText type="defaultBold">Quick Expense</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Log transaction</ThemedText>
                  </View>
                </Pressable>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.toolScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {activeTool === 'calculator' ? (
                  <CalculatorTool />
                ) : activeTool === 'notes' ? (
                  <NotesTool />
                ) : activeTool === 'stopwatch' ? (
                  <StopwatchTool />
                ) : activeTool === 'currency' ? (
                  <CurrencyTool />
                ) : (
                  <CalendarTool onNavigate={handleClose} />
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: 72,
    maxHeight: '95%',
    minHeight: 560,
    gap: Spacing.three,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: Spacing.half,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
    paddingBottom: Spacing.four,
  },
  toolCard: {
    width: '47%',
    height: 110,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    gap: 2,
  },
  pressedCard: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  toolScrollContent: {
    paddingBottom: Spacing.four,
  },
});
