import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { GoalProgressCard } from '@/components/goal-progress-card';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useGoals } from '@/context/goal-context';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';

type FilterTab = 'active' | 'completed' | 'all';

export default function GoalsOverviewScreen() {
  const theme = useTheme();
  const { goals } = useGoals();
  const { formatAmount } = useExpenses();
  const [tab, setTab] = useState<FilterTab>('active');

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const filtered = goals.filter((g) => {
    if (tab === 'active') return !g.isCompleted;
    if (tab === 'completed') return g.isCompleted;
    return true;
  });

  const totalPlanned = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.contributedAmount, 0);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: Brand.deep }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>MONEY PLAN & POTS</ThemedText>
              <Pressable
                onPress={() => router.push('/goals/add')}
                accessibilityRole="button"
                accessibilityLabel="Create a new goal or pot"
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <ThemedText type="defaultBold" style={styles.addButtonText}>＋ New pot</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>TOTAL SAVED</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(totalSaved)}
                </ThemedText>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>ACTIVE TARGETS</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(totalPlanned)}
                </ThemedText>
              </View>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['active', 'completed', 'all'] as FilterTab[]).map((t) => {
            const selected = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.tab,
                  {
                    backgroundColor: selected ? theme.accent : theme.cardMuted,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? '#FFFFFF' : theme.textSecondary, textTransform: 'capitalize' }}>
                  {t} ({t === 'active' ? activeGoals.length : t === 'completed' ? completedGoals.length : goals.length})
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Goals List */}
        <View style={styles.listSection}>
          {filtered.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No financial pots yet"
                message="Plan ahead for travel, investments, or major purchases by creating your first pot."
                tone={theme.accent}
              />
            </Card>
          ) : (
            filtered.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                formatAmount={formatAmount}
                onPress={() => router.push({ pathname: '/goals/[id]', params: { id: goal.id } })}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  hero: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'center',
  },
  heroContent: { gap: Spacing.two, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroLabel: { color: 'rgba(255,255,255,0.72)', letterSpacing: 1 },
  addButton: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  addButtonText: { color: Brand.deep },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginVertical: Spacing.half },
  heroStat: { flex: 1, gap: Spacing.half },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  heroStatVal: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroOrbLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -90, top: -100, backgroundColor: 'rgba(139,123,255,0.2)' },
  heroOrbSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: 14, bottom: -90, backgroundColor: 'rgba(176,76,252,0.2)' },
  tabsRow: { flexDirection: 'row', gap: Spacing.two },
  tab: { flex: 1, height: 40, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  pressed: { opacity: 0.75 },
});
