import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling (lists, maps). */
  scroll?: boolean;
  /** Add room for the tab bar and the floating tools button. */
  tabInset?: boolean;
  /** Pad for the status bar. Turn off on pushed pages, whose native header already does. */
  topInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard page shell: themed background, safe-area top padding, a centred
 * column capped at `MaxContentWidth`, and consistent gutters.
 */
export function Screen({ children, scroll = true, tabInset = false, topInset = true, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottom = tabInset ? BottomTabInset + Spacing.six : Spacing.four;

  const column = (
    <View style={[styles.column, { paddingTop: topInset ? Math.max(insets.top, Spacing.three) : Spacing.three }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <ThemedView style={styles.root}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {column}
        </ScrollView>
      ) : (
        column
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
});
