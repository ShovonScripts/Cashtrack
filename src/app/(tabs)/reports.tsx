import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { getBudgetInsights, getMonthExpenses } from '@/utils/advisor';
import { formatDate, sumAmounts, totalForMonth } from '@/utils/expense';
import { buildMonthlyReportHtml } from '@/utils/monthly-report';
import { generateCsvReport } from '@/utils/csv';
import type { Expense } from '@/types/expense';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

function sameMonth(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
}

/** 6-Month Historical Spending Comparison Chart */
function SixMonthTrendChart({
  expenses,
  currentMonth,
  onSelectMonth,
  formatAmount,
}: {
  expenses: Expense[];
  currentMonth: Date;
  onSelectMonth: (monthDate: Date) => void;
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();

  const monthsData = Array.from({ length: 6 }, (_, index) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (5 - index), 1, 12);
    const spent = totalForMonth(expenses, d);
    return {
      date: d,
      label: new Intl.DateTimeFormat('en', { month: 'short' }).format(d),
      spent,
      isSelected: sameMonth(d, currentMonth),
    };
  });

  const maxSpent = Math.max(...monthsData.map((m) => m.spent), 1);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons name="chart-bar" size={18} color={theme.accent} />
          </View>
          <View style={styles.titleCopy}>
            <ThemedText type="defaultBold">6-Month Spending Trend</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Tap any month bar to switch report view
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.barChartContainer}>
        {monthsData.map((m) => {
          const barHeight = m.spent > 0 ? Math.max(12, (m.spent / maxSpent) * 82) : 4;
          return (
            <Pressable
              key={m.date.toISOString()}
              onPress={() => {
                triggerHaptic();
                onSelectMonth(m.date);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${m.label}: ${formatAmount(m.spent)}`}
              style={styles.barColumn}>
              <ThemedText
                type="caption"
                style={[
                  styles.barValueText,
                  { color: m.isSelected ? theme.accent : theme.textSecondary },
                ]}
                numberOfLines={1}>
                {m.spent > 0 ? formatAmount(m.spent).replace(/[^0-9.,]/g, '') : '—'}
              </ThemedText>
              <View style={[styles.barTrack, { backgroundColor: theme.cardMuted }]}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: barHeight,
                      backgroundColor: m.isSelected ? theme.accent : theme.border,
                    },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                style={[
                  styles.barLabelText,
                  { color: m.isSelected ? theme.text : theme.textSecondary, fontWeight: m.isSelected ? '800' : '500' },
                ]}>
                {m.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

/** Stacked Proportional Category Share Bar */
function SpendingDistributionChart({
  monthExpenses,
  total,
  formatAmount,
}: {
  monthExpenses: Expense[];
  total: number;
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (total === 0 || monthExpenses.length === 0) return null;

  const categoryTotals = new Map<string, number>();
  monthExpenses.forEach((e) => {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount);
  });

  const categories = [...categoryTotals.entries()]
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percent: (amt / total) * 100,
      color: getCategoryColor(cat),
    }))
    .sort((a, b) => b.amount - a.amount);

  const active = selectedCategory ? categories.find((c) => c.category === selectedCategory) : null;

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons name="chart-arc" size={18} color={theme.accent} />
          </View>
          <View style={styles.titleCopy}>
            <ThemedText type="defaultBold">Category Proportions</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {active
                ? `${active.category}: ${formatAmount(active.amount)} (${active.percent.toFixed(1)}% of total)`
                : 'Tap a category to see its share of monthly total'}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Multi-segment proportional stacked bar */}
      <View style={[styles.stackedBarTrack, { backgroundColor: theme.cardMuted }]}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <Pressable
              key={cat.category}
              onPress={() => {
                triggerHaptic();
                setSelectedCategory(isSelected ? null : cat.category);
              }}
              style={[
                styles.stackedSegment,
                {
                  flex: cat.percent,
                  backgroundColor: cat.color,
                  opacity: selectedCategory && !isSelected ? 0.3 : 1,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Category legend chips */}
      <View style={styles.legendContainer}>
        {categories.slice(0, 6).map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <Pressable
              key={cat.category}
              onPress={() => {
                triggerHaptic();
                setSelectedCategory(isSelected ? null : cat.category);
              }}
              style={[
                styles.legendChip,
                {
                  backgroundColor: isSelected ? theme.accentMuted : theme.cardMuted,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
              ]}>
              <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
              <ThemedText type="caption" style={styles.legendText}>
                {cat.category} ({cat.percent.toFixed(0)}%)
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

export default function ReportsScreen() {
  const theme = useTheme();
  const {
    expenses,
    categoryLimits,
    categoryIcons,
    profile,
    country,
    formatAmount,
    toggleThemeMode,
    themeMode,
  } = useExpenses();

  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const monthExpenses = getMonthExpenses(expenses, month);
  const total = sumAmounts(monthExpenses);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month);
  const isCurrentMonth = sameMonth(month, new Date());

  // Category aggregates
  const categoryTotals = new Map<string, number>();
  monthExpenses.forEach((expense) => categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount));
  const categoriesUsed = [...categoryTotals.entries()].sort((first, second) => second[1] - first[1]);
  const categories = [...new Set([...categoryTotals.keys(), ...Object.keys(categoryLimits)])]
    .map((category) => [category, categoryTotals.get(category) ?? 0] as const)
    .sort((first, second) => second[1] - first[1]);

  const budgetInsights = getBudgetInsights(expenses, categoryLimits, month);
  const overBudgetCount = budgetInsights.filter((insight) => insight.level === 'over').length;

  // Executive Metric Calculations
  const now = new Date();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const activeDays = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const dailyAvg = Math.round(total / (activeDays || 1));

  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1, 12);
  const prevMonthExpenses = getMonthExpenses(expenses, prevMonth);
  const prevTotal = sumAmounts(prevMonthExpenses);
  const diffAmount = total - prevTotal;
  const diffPercent = prevTotal > 0 ? Math.round((Math.abs(diffAmount) / prevTotal) * 100) : 0;

  const totalLimit = Object.values(categoryLimits).reduce((sum, l) => sum + l, 0);
  const limitPercent = totalLimit > 0 ? Math.round((total / totalLimit) * 100) : null;

  const changeMonth = (amount: number) => {
    triggerHaptic();
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
    setMessage('');
  };

  const createPdf = async () => {
    if (isGenerating) return;
    triggerHaptic();
    setIsGenerating(true);
    setMessage('');
    try {
      const html = buildMonthlyReportHtml({
        month,
        expenses,
        limits: categoryLimits,
        name: profile.name,
        countryName: country.name,
        currencyCode: country.currencyCode,
        formatAmount,
      });

      if (Platform.OS === 'web') {
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) throw new Error('The report window was blocked.');
        reportWindow.document.open();
        reportWindow.document.write(html);
        reportWindow.document.close();
        reportWindow.focus();
        window.setTimeout(() => reportWindow.print(), 500);
        setMessage('Your print-ready report opened in a new tab. Choose “Save as PDF” to download it.');
      } else {
        const { uri } = await Print.printToFileAsync({ html, margins: { top: 40, right: 36, bottom: 40, left: 36 } });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: `CashTrack ${monthLabel} report`,
          });
          setMessage('Your PDF is ready. Choose where to save or share it.');
        } else {
          await Print.printAsync({ html });
          setMessage('Your report is ready in the system print dialog.');
        }
      }
    } catch {
      setMessage('Could not create the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createCsv = async () => {
    if (isGenerating) return;
    triggerHaptic();
    setIsGenerating(true);
    setMessage('');
    try {
      const csvString = generateCsvReport({
        expenses: monthExpenses,
        currencyCode: country.currencyCode,
      });

      if (Platform.OS === 'web') {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `CashTrack-${monthLabel.replace(/\s+/g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMessage('Your CSV report has been downloaded.');
      } else {
        const filename = `CashTrack-${monthLabel.replace(/\s+/g, '-')}.csv`;
        const file = new File(Paths.cache, filename);
        file.create({ overwrite: true });
        file.write(csvString);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'text/csv',
            dialogTitle: `CashTrack ${monthLabel} CSV report`,
          });
          setMessage('Your CSV file is ready to share or save.');
        } else {
          setMessage('File sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('[cashtrack] CSV export failed.', error);
      setMessage('Could not create the CSV export. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + Spacing.two, Spacing.four) }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header Intro Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
              FINANCIAL INTELLIGENCE
            </ThemedText>
            <ThemedText type="title">Analytics & Reports</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Comprehensive monthly insights, spending patterns, and export tools.
            </ThemedText>
          </View>

          {/* Quick Theme Switcher Action */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              toggleThemeMode();
            }}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            style={({ pressed }) => [
              styles.themeIconButton,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <MaterialCommunityIcons
              name={themeMode === 'dark' ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={themeMode === 'dark' ? '#F59E0B' : theme.text}
            />
          </Pressable>
        </View>

        {/* 1. Month Selector Card */}
        <Card style={styles.monthSelector}>
          <Pressable
            onPress={() => changeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={[styles.monthArrow, { backgroundColor: theme.cardMuted }]}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>

          <View style={styles.monthLabelBlock}>
            <ThemedText type="defaultBold" style={styles.monthLabel}>
              {monthLabel}
            </ThemedText>
            <View style={[styles.statusPill, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
                {isCurrentMonth ? 'Month to Date' : 'Full Month Report'}
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={() => changeMonth(1)}
            disabled={isCurrentMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: isCurrentMonth }}
            style={[styles.monthArrow, { backgroundColor: theme.cardMuted }, isCurrentMonth && styles.disabled]}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={isCurrentMonth ? theme.textSecondary : theme.text}
            />
          </Pressable>
        </Card>

        {/* 2. CashTrack Brand Multi-Tone Glass Hero Card */}
        <View style={styles.heroGlassCard}>
          <View pointerEvents="none" style={styles.primaryBlueOrb} />
          <View pointerEvents="none" style={styles.brightCyanOrb} />

          <View style={styles.heroHeaderRow}>
            <ThemedText type="caption" style={styles.heroLabel}>
              TOTAL MONTHLY SPENDING
            </ThemedText>
            <View style={styles.reportBadgePill}>
              <MaterialCommunityIcons name="chart-box-outline" size={12} color={Brand.bright} />
              <ThemedText type="caption" style={{ color: Brand.bright, fontWeight: '700' }}>
                {monthLabel}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(total)}
          </ThemedText>

          <View style={styles.heroFooter}>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="receipt" size={13} color="#FFFFFF" />
              <ThemedText type="caption" style={styles.heroDetailText}>
                {monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}
              </ThemedText>
            </View>

            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="tag-multiple" size={13} color="#FFFFFF" />
              <ThemedText type="caption" style={styles.heroDetailText}>
                {categoriesUsed.length} {categoriesUsed.length === 1 ? 'category' : 'categories'}
              </ThemedText>
            </View>

            {overBudgetCount > 0 && (
              <View style={[styles.heroStatPill, { backgroundColor: 'rgba(239, 68, 68, 0.3)' }]}>
                <MaterialCommunityIcons name="alert-circle" size={13} color="#F87171" />
                <ThemedText type="caption" style={{ color: '#F87171', fontWeight: '700' }}>
                  {overBudgetCount} over limit
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* 3. Executive Metrics Row */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <View style={[styles.metricIcon, { backgroundColor: theme.accentMuted }]}>
                <MaterialCommunityIcons name="calendar-today" size={16} color={theme.accent} />
              </View>
            </View>
            <View style={styles.metricContent}>
              <ThemedText type="caption" themeColor="textSecondary">
                DAILY AVG
              </ThemedText>
              <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(dailyAvg)}
              </ThemedText>
            </View>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <View style={[styles.metricIcon, { backgroundColor: theme.accentMuted }]}>
                <MaterialCommunityIcons name="swap-vertical" size={16} color={theme.accent} />
              </View>
              {prevTotal > 0 && (
                <View
                  style={[
                    styles.trendBadge,
                    { backgroundColor: diffAmount <= 0 ? 'rgba(39, 174, 96, 0.15)' : 'rgba(235, 87, 87, 0.15)' },
                  ]}>
                  <ThemedText
                    type="caption"
                    style={{ color: diffAmount <= 0 ? '#27AE60' : theme.danger, fontWeight: '700', fontSize: 10 }}>
                    {diffAmount <= 0 ? `↓ ${diffPercent}%` : `↑ ${diffPercent}%`}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.metricContent}>
              <ThemedText type="caption" themeColor="textSecondary">
                VS PREV MONTH
              </ThemedText>
              <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {prevTotal > 0 ? (diffAmount <= 0 ? `-${formatAmount(Math.abs(diffAmount))}` : `+${formatAmount(diffAmount)}`) : 'N/A'}
              </ThemedText>
            </View>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <View style={[styles.metricIcon, { backgroundColor: theme.accentMuted }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color={theme.accent} />
              </View>
              {limitPercent !== null ? (
                <View
                  style={[
                    styles.trendBadge,
                    { backgroundColor: limitPercent <= 100 ? 'rgba(39, 174, 96, 0.15)' : 'rgba(235, 87, 87, 0.15)' },
                  ]}>
                  <ThemedText
                    type="caption"
                    style={{ color: limitPercent <= 100 ? '#27AE60' : theme.danger, fontWeight: '700', fontSize: 10 }}>
                    {limitPercent <= 100 ? 'On track' : 'Over limit'}
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.trendBadge, { backgroundColor: theme.accentMuted }]}>
                  <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700', fontSize: 10 }}>
                    Safe
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.metricContent}>
              <ThemedText type="caption" themeColor="textSecondary">
                BUDGET USED
              </ThemedText>
              <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {limitPercent !== null ? `${limitPercent}%` : 'No limits'}
              </ThemedText>
            </View>
          </Card>
        </View>

        {/* 4. Visual Analytics Section */}
        <SixMonthTrendChart
          expenses={expenses}
          currentMonth={month}
          onSelectMonth={(selectedDate) => setMonth(selectedDate)}
          formatAmount={formatAmount}
        />

        <SpendingDistributionChart
          monthExpenses={monthExpenses}
          total={total}
          formatAmount={formatAmount}
        />

        {/* 5. Category Breakdown with Limits Progress */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Category Breakdown</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Monthly spending vs category guardrails
            </ThemedText>
          </View>
          <Pressable onPress={() => router.push('/budgets')} accessibilityRole="button" hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Manage limits →
            </ThemedText>
          </Pressable>
        </View>

        {categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText type="defaultBold">Nothing recorded for {monthLabel}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Choose another month or add an expense to start building your report.
            </ThemedText>
          </Card>
        ) : (
          <Card style={styles.breakdownCard}>
            {categories.map(([category, amount], index) => {
              const limit = categoryLimits[category];
              const fraction = limit ? Math.min(amount / limit, 1) : amount / Math.max(total, 1);
              const over = limit !== undefined && amount > limit;
              const color = over ? theme.danger : getCategoryColor(category);
              return (
                <View key={category} style={styles.categoryItem}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.categoryLine}>
                    <CategoryIcon
                      category={category}
                      customIcons={categoryIcons}
                      color={color}
                      size={15}
                      containerSize={28}
                    />
                    <ThemedText type="smallBold" style={styles.categoryName}>
                      {category}
                    </ThemedText>
                    <ThemedText type="smallBold">{formatAmount(amount)}</ThemedText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.progressFill, { width: `${Math.max(fraction * 100, 3)}%`, backgroundColor: color }]} />
                  </View>
                  {limit !== undefined && (
                    <ThemedText type="caption" themeColor={over ? 'danger' : 'textSecondary'}>
                      {over
                        ? `${formatAmount(amount - limit)} over limit`
                        : `${formatAmount(limit - amount)} left of ${formatAmount(limit)} limit`}
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {/* 6. Export & Download Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Export & Downloads</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Generate print-ready documents and raw spreadsheets
            </ThemedText>
          </View>
        </View>

        {/* PDF Export Action Card */}
        <Pressable
          onPress={createPdf}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Monthly report as PDF"
          accessibilityState={{ disabled: isGenerating }}
          style={({ pressed }) => [
            styles.exportCardPdf,
            pressed && styles.pressed,
            isGenerating && styles.disabled,
          ]}>
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.pdfIconBadge}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.exportCopy}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>
              {isGenerating ? 'Preparing PDF Document…' : 'Monthly PDF Report'}
            </ThemedText>
            <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {Platform.OS === 'web' ? 'Print dialog · choose Save as PDF' : 'Formatted PDF document with breakdown'}
            </ThemedText>
          </View>
          {!isGenerating && <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />}
        </Pressable>

        {/* CSV Export Action Card */}
        <Pressable
          onPress={createCsv}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Monthly report as CSV"
          accessibilityState={{ disabled: isGenerating }}
          style={({ pressed }) => [
            styles.exportCardCsv,
            pressed && styles.pressed,
            isGenerating && styles.disabled,
          ]}>
          <View style={styles.csvIconBadge}>
            <MaterialCommunityIcons name="file-excel-box" size={24} color="#34D399" />
          </View>
          <View style={styles.exportCopy}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>
              {isGenerating ? 'Preparing CSV Spreadsheet…' : 'Monthly CSV File'}
            </ThemedText>
            <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Excel / Google Sheets friendly raw data export
            </ThemedText>
          </View>
          {!isGenerating && <MaterialCommunityIcons name="arrow-right" size={20} color="#34D399" />}
        </Pressable>

        {message ? (
          <ThemedText type="caption" themeColor={message.startsWith('Could not') ? 'danger' : 'textSecondary'} accessibilityLiveRegion="polite">
            {message}
          </ThemedText>
        ) : null}

        {/* 7. Transactions Log for this Month */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Transactions in this Report</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {monthExpenses.length} {monthExpenses.length === 1 ? 'entry' : 'entries'} recorded in {monthLabel}
            </ThemedText>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/expenses')} accessibilityRole="button" hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              All expenses →
            </ThemedText>
          </Pressable>
        </View>

        {monthExpenses.length > 0 ? (
          <Card style={styles.transactionCard}>
            {monthExpenses.slice(0, 5).map((expense, index) => (
              <View key={expense.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <View style={styles.transactionRow}>
                  <CategoryIcon category={expense.category} customIcons={categoryIcons} color={getCategoryColor(expense.category)} size={16} containerSize={36} />
                  <View style={styles.transactionCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {expense.note || expense.category}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {formatDate(expense.date)} · {expense.category}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'] }}>{formatAmount(expense.amount)}</ThemedText>
                </View>
              </View>
            ))}
            {monthExpenses.length > 5 && (
              <ThemedText type="caption" themeColor="textSecondary" style={styles.moreTransactions}>
                + {monthExpenses.length - 5} more transactions in this month
              </ThemedText>
            )}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <ThemedText type="small" themeColor="textSecondary">
              No transactions recorded for {monthLabel}.
            </ThemedText>
          </Card>
        )}

        <ThemedText type="caption" themeColor="textSecondary" style={styles.footer}>
          Monthly report analytics are computed offline on your device. Historical comparisons use your active category limits.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 110 },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: { letterSpacing: 1, fontWeight: '800', fontSize: 10 },
  themeIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelBlock: { flex: 1, alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: 16, fontWeight: '800' },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  heroGlassCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Brand.deep, // #00109D
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(1, 82, 245, 0.45)',
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(20, 231, 253, 0.3)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroLabel: { color: 'rgba(255,255,255,0.75)', letterSpacing: 1, fontSize: 11, fontWeight: '800' },
  reportBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 231, 253, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 46,
    fontVariant: ['tabular-nums'],
    zIndex: 2,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    zIndex: 2,
  },
  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  heroDetailText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.three,
    minHeight: 110,
  },
  metricContent: {
    gap: 2,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  metricValue: {
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  chartCard: { gap: Spacing.two, padding: Spacing.three },
  chartHeader: { gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCopy: { flex: 1, gap: 2 },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: Spacing.two,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValueText: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    width: 18,
    alignItems: 'center',
    borderRadius: Radius.small,
    overflow: 'hidden',
  },
  trendBar: {
    width: '100%',
    borderRadius: Radius.small,
  },
  barLabelText: {
    fontSize: 11,
  },
  stackedBarTrack: {
    height: 14,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  stackedSegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    paddingTop: Spacing.one,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  legendText: {
    fontSize: 11,
  },
  exportCardPdf: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Brand.primary, // #0152F5
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.3)',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  exportCardCsv: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#064E3B', // Deep Emerald Slate
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pdfIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  csvIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportCopy: { flex: 1, gap: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  sectionCopy: { flex: 1, gap: 2 },
  breakdownCard: { gap: Spacing.three },
  categoryItem: { gap: Spacing.two },
  categoryLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryName: { flex: 1 },
  progressTrack: { height: 7, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: Spacing.two },
  transactionCard: { gap: Spacing.two },
  transactionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  transactionCopy: { flex: 1, minWidth: 0, gap: 2 },
  moreTransactions: { textAlign: 'center', paddingTop: Spacing.one },
  emptyCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  emptyText: { textAlign: 'center', maxWidth: 420 },
  footer: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.two, marginTop: Spacing.one },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
