import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { Icon, IconButton } from '@/components/ui';
import type { GlyphName } from '@/constants/icons';
import { FeatureColors, MinTouchTarget, PressFeedback, Radius, Spacing, tintedShadow, withAlpha } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/haptics';
import { CalculatorTool } from './tools/CalculatorTool';
import { CalendarTool } from './tools/CalendarTool';
import { CurrencyTool } from './tools/CurrencyTool';
import { NotesTool } from './tools/NotesTool';
import { StopwatchTool } from './tools/StopwatchTool';
import { TodoTool } from './tools/TodoTool';

type ToolKey = 'calculator' | 'stopwatch' | 'todo' | 'currency' | 'notes' | 'calendar';

type ToolInfo = {
  key: ToolKey;
  /** On the tile: one word. */
  label: string;
  /** In the header once open: the same words as the tool's own page. */
  title: string;
  /** Short enough for one line on a tile, at two tiles across. */
  subtitle: string;
  icon: GlyphName;
  /** 6-digit hex token. */
  hue: string;
};

/**
 * Laid out two across, in this order, so no two tiles that touch (across or
 * down) share a colour family. Hues match the Home quick actions where the
 * tool appears there, glyphs and titles match the More menu, and every hue
 * keeps 3:1 against its tinted badge in light and dark.
 */
const TOOLS: readonly ToolInfo[] = [
  {
    key: 'calculator',
    label: 'Calculator',
    title: 'Calculator',
    subtitle: 'Sums and bill splits',
    icon: 'calculator-variant-outline',
    hue: FeatureColors.sky,
  },
  {
    key: 'stopwatch',
    label: 'Stopwatch',
    title: 'Stopwatch & Timer',
    subtitle: 'Laps and timers',
    icon: 'timer-outline',
    hue: FeatureColors.violet,
  },
  {
    key: 'todo',
    label: 'To-Do',
    title: 'To-Do List',
    subtitle: 'Your checklist',
    icon: 'checkbox-marked-circle-outline',
    hue: FeatureColors.red,
  },
  {
    key: 'currency',
    label: 'Currency',
    title: 'Currency Converter',
    subtitle: 'Convert money',
    icon: 'swap-horizontal-circle-outline',
    hue: FeatureColors.emerald,
  },
  {
    key: 'notes',
    label: 'Notes',
    title: 'Notes',
    subtitle: 'Quick notes',
    icon: 'note-text-outline',
    hue: FeatureColors.teal,
  },
  {
    key: 'calendar',
    label: 'Calendar',
    title: 'Bills Calendar',
    subtitle: 'Bills by date',
    icon: 'calendar-month-outline',
    hue: FeatureColors.slate,
  },
];

type ToolsMenuModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * One tool tile. Each carries its own colour as a soft tinted glow
 * (`tintedShadow`, the token for screens where every card has a colour),
 * rather than `glow`, which is for the one brand surface on a screen: six
 * full glows side by side would shout.
 */
function ToolTile({ tool, onOpen }: { tool: ToolInfo; onOpen: () => void }) {
  const theme = useTheme();
  const isDark = useIsDark();

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${tool.title}. ${tool.subtitle}`}
      accessibilityHint="Opens it here, without leaving this screen"
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.card,
          borderColor: withAlpha(tool.hue, isDark ? 0.4 : 0.26),
          boxShadow: tintedShadow(tool.hue, isDark),
        },
        pressed && PressFeedback,
      ]}>
      <View style={[styles.tileBadge, { backgroundColor: withAlpha(tool.hue, isDark ? 0.18 : 0.12) }]}>
        <Icon name={tool.icon} size="lg" color={tool.hue} />
      </View>
      <View style={styles.tileCopy}>
        <ThemedText type="defaultBold" numberOfLines={1}>
          {tool.label}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {tool.subtitle}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function ToolsMenuModal({ visible, onClose }: ToolsMenuModalProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const [activeKey, setActiveKey] = useState<ToolKey | null>(null);
  const active = TOOLS.find((tool) => tool.key === activeKey) ?? null;

  const handleClose = () => {
    setActiveKey(null);
    onClose();
  };

  const open = (key: ToolKey) => {
    triggerHaptic();
    setActiveKey(key);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      {/*
        A React Native Modal renders into its own native view tree, which the
        GestureHandlerRootView in src/app/_layout.tsx does not reach. Without
        this second root every gesture inside the sheet is silently dropped —
        the timer wheel would not turn here even though it works on the full
        Stopwatch page.
      */}
      <GestureHandlerRootView style={styles.gestureRoot}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
            <Pressable
              style={styles.backdropPressable}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close quick tools"
            />

            <View
              style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}
              accessibilityViewIsModal>
              <View style={[styles.dragHandleBar, { backgroundColor: theme.border }]} />

              <View style={styles.header}>
                {active ? (
                  <IconButton icon="arrow-left" variant="tinted" label="Back to tools" onPress={() => setActiveKey(null)} />
                ) : null}
                {active ? (
                  <View style={[styles.headerBadge, { backgroundColor: withAlpha(active.hue, isDark ? 0.18 : 0.12) }]}>
                    <Icon name={active.icon} size="md" color={active.hue} />
                  </View>
                ) : null}
                <View style={styles.headerCopy}>
                  <ThemedText type="subtitle" accessibilityRole="header" numberOfLines={1}>
                    {active ? active.title : 'Quick Tools'}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                    {active ? active.subtitle : 'Open a tool without leaving this screen'}
                  </ThemedText>
                </View>
                <IconButton icon="close" variant="tinted" label="Close quick tools" onPress={handleClose} />
              </View>

              <View style={styles.content}>
                {!active ? (
                  <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                    {TOOLS.map((tool) => (
                      <ToolTile key={tool.key} tool={tool} onOpen={() => open(tool.key)} />
                    ))}
                  </ScrollView>
                ) : (
                  <ScrollView
                    contentContainerStyle={styles.toolScrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled">
                    {active.key === 'calculator' ? (
                      <CalculatorTool />
                    ) : active.key === 'notes' ? (
                      <NotesTool />
                    ) : active.key === 'stopwatch' ? (
                      <StopwatchTool />
                    ) : active.key === 'currency' ? (
                      <CurrencyTool />
                    ) : active.key === 'todo' ? (
                      <TodoTool />
                    ) : (
                      <CalendarTool onNavigate={handleClose} />
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  keyboardView: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropPressable: { ...StyleSheet.absoluteFill },
  container: {
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    maxHeight: '90%',
    minHeight: 500,
    gap: Spacing.three,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    marginBottom: Spacing.half,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: MinTouchTarget },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: Spacing.half },
  content: { flex: 1 },
  // Padding on every side so the tiles' glow is never clipped by the scroll view.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    padding: Spacing.one,
    paddingBottom: Spacing.four,
  },
  // Two across, sized by their content: compact enough that all six fit at
  // once on a normal phone, and free to grow with large text.
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCopy: { gap: Spacing.half },
  toolScrollContent: { paddingBottom: 64 },
});
