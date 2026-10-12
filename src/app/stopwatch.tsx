import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { StopwatchTool } from '@/components/floating-tools/tools/StopwatchTool';

export default function StopwatchScreen() {
  const insets = useSafeAreaInsets();

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
          <View style={styles.header}>
            <ThemedText type="title">Stopwatch & Timer</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Track elapsed time for tasks, billing hours, or parking
            </ThemedText>
          </View>

          <Card style={styles.cardContainer}>
            <StopwatchTool />
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
  cardContainer: {
    padding: Spacing.three,
  },
});
