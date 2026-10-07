import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { sumAmounts } from '@/utils/expense';
import { getBudgetInsights } from '@/utils/advisor';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

export default function BudgetsScreen() {
  const theme = useTheme();
  const { expenses, categories, categoryLimits, setCategoryLimit, formatAmount, country, categoryIcons } = useExpenses();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const now = new Date();
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(now);
  const insights = getBudgetInsights(expenses, categoryLimits, now);
  const currencySymbol = country.symbol.trim();

  const spentThisMonth = (category: string) => sumAmounts(expenses.filter((expense) => {
    const date = new Date(expense.date);
    return expense.category === category && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }));

  const totalSpentThisMonth = sumAmounts(expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }));

  const totalCap = Object.values(categoryLimits).reduce((sum, limit) => sum + (limit || 0), 0);

  const saveLimit = (category: string) => {
    triggerHaptic();
    const raw = (drafts[category] ?? (categoryLimits[category] === undefined ? '' : String(categoryLimits[category]))).trim();
    const amount = raw ? Number(raw) : null;
    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a monthly limit greater than zero.');
      return;
    }
    setCategoryLimit(category, amount);
    setDrafts((current) => ({ ...current, [category]: String(amount) }));
    setMessage(`${category} limit saved for ${monthLabel}.`);
  };

  const removeLimit = (category: string) => {
    triggerHaptic();
    setCategoryLimit(category, null);
    setDrafts((current) => ({ ...current, [category]: '' }));
    setMessage(`${category} limit removed.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* Spendly Multi-Tone Glass Hero Section */}
        <View style={styles.heroGlassCard}>
          <View pointerEvents="none" style={styles.primaryBlueOrb} />
          <View pointerEvents="none" style={styles.brightCyanOrb} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>
                SPENDING CAPS & BUDGETS
              </ThemedText>
              <View style={styles.monthPill}>
                <MaterialCommunityIcons name="calendar-month" size={12} color="#14E7FD" />
                <ThemedText type="caption" style={styles.monthPillText}>
                  {monthLabel}
                </ThemedText>
              </View>
            </View>

            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>TOTAL SPENT</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(totalSpentThisMonth)}
                </ThemedText>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>TOTAL BUDGET CAP</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {totalCap > 0 ? formatAmount(totalCap) : 'Uncapped'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {message ? (
          <ThemedText type="caption" themeColor={message.includes('saved') ? 'accent' : 'danger'} accessibilityLiveRegion="polite">
            {message}
          </ThemedText>
        ) : null}

        {categories.map((category) => {
          const limit = categoryLimits[category];
          const draft = drafts[category] ?? (limit === undefined ? '' : String(limit));
          const spent = spentThisMonth(category);
          const isOver = limit !== undefined && spent > limit;
          const notice = insights.find((insight) => insight.category === category);
          const progress = limit ? Math.min(spent / limit, 1) : 0;
          const accent = isOver ? theme.danger : getCategoryColor(category);

          return (
            <Card key={category} style={styles.categoryCard}>
              <View style={styles.categoryHeading}>
                <CategoryIcon category={category} customIcons={categoryIcons} color={getCategoryColor(category)} size={16} containerSize={36} />
                <ThemedText type="defaultBold" style={styles.categoryName}>{category}</ThemedText>

                <View style={[styles.statusPill, { backgroundColor: limit !== undefined ? (isOver ? 'rgba(235, 87, 87, 0.15)' : 'rgba(16, 185, 129, 0.15)') : theme.cardMuted }]}>
                  <ThemedText type="caption" style={{ color: limit !== undefined ? (isOver ? theme.danger : '#10B981') : theme.textSecondary, fontWeight: '800' }}>
                    {limit !== undefined ? (isOver ? 'Over Limit' : 'Active') : 'No Limit'}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="caption" themeColor="textSecondary">
                Spent <ThemedText type="smallBold" style={{ color: theme.text }}>{formatAmount(spent)}</ThemedText>{limit !== undefined ? ` of ${formatAmount(limit)} limit` : ''}
              </ThemedText>

              {limit !== undefined && (
                <View style={styles.progressBlock}>
                  <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
                  </View>
                  <View style={styles.progressFooter}>
                    <ThemedText type="caption" themeColor={isOver ? 'danger' : 'textSecondary'}>
                      {isOver ? `${formatAmount(spent - limit)} over limit` : `${formatAmount(limit - spent)} remaining`}
                    </ThemedText>
                    <ThemedText type="caption" style={{ fontWeight: '700', color: accent }}>
                      {Math.round(progress * 100)}%
                    </ThemedText>
                  </View>
                </View>
              )}

              {notice && (
                <View style={[styles.noticeBox, { backgroundColor: notice.level === 'over' ? '#FF6B6B15' : notice.level === 'near' ? '#BD711915' : theme.cardMuted }]}>
                  <MaterialCommunityIcons
                    name={notice.level === 'over' ? 'alert-circle' : notice.level === 'near' ? 'clock-alert' : 'information'}
                    size={14}
                    color={notice.level === 'over' ? theme.danger : notice.level === 'near' ? '#BD7119' : theme.accent}
                  />
                  <ThemedText type="caption" style={[styles.budgetNotice, { color: notice.level === 'over' ? theme.danger : notice.level === 'near' ? '#BD7119' : theme.accent }]}>
                    {notice.level === 'over'
                      ? `Over limit by ${formatAmount(Math.abs(notice.remaining))}.`
                      : notice.level === 'near'
                        ? `${Math.round(notice.percentUsed * 100)}% used · ${formatAmount(Math.max(0, notice.remaining))} left.`
                        : `At this pace, month-end spending may reach ${formatAmount(notice.projectedSpend)}.`}
                  </ThemedText>
                </View>
              )}

              <View style={styles.limitEntry}>
                <View style={[styles.moneyInput, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
                  <ThemedText type="small" themeColor="textSecondary">{currencySymbol}</ThemedText>
                  <TextInput
                    value={draft}
                    onChangeText={(value) => { setDrafts((current) => ({ ...current, [category]: value.replace(/[^0-9.]/g, '') })); setMessage(''); }}
                    placeholder="Set monthly cap"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    accessibilityLabel={`${category} monthly spending limit`}
                    style={[styles.limitInput, { color: theme.text }]}
                  />
                </View>
                <Pressable
                  onPress={() => saveLimit(category)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.saveText}>Save</ThemedText>
                </Pressable>
                {limit !== undefined && (
                  <Pressable
                    onPress={() => removeLimit(category)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${category} monthly limit`}
                    hitSlop={6}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color={theme.danger} />
                  </Pressable>
                )}
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  heroGlassCard: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Brand.primary,
    opacity: 0.5,
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Brand.bright,
    opacity: 0.25,
  },
  heroContent: { gap: Spacing.two, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, fontSize: 11, fontWeight: '700' },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  monthPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroStat: { flex: 1, gap: 2 },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  heroStatVal: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontVariant: ['tabular-nums'], fontWeight: '800' },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  categoryCard: { gap: Spacing.two },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryName: { flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill },
  progressBlock: { gap: 4 },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noticeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.small },
  budgetNotice: { fontWeight: '700', fontSize: 11 },
  limitEntry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 4 },
  moneyInput: { flex: 1, minWidth: 0, minHeight: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.three },
  limitInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: Spacing.two },
  saveButton: { minHeight: 46, borderRadius: Radius.medium, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four },
  saveText: { color: '#FFFFFF' },
  removeButton: { width: 40, height: 46, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
