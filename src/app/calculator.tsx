import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { CalculatorTool } from '@/components/floating-tools/tools/CalculatorTool';

export default function CalculatorScreen() {
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
            <ThemedText type="title">Quick Calculator</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Compute math, tips & bill splitting on the fly
            </ThemedText>
          </View>

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
