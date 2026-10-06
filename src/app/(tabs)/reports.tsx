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
          const barHeight = m.spent > 0 ? Math.max(12, (m.spent / maxSpent) * 82) : 6;
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
                {m.spent > 0 ? formatAmount(m.spent).replace(/[^0-9.,]/g, '') : '0'}
              </ThemedText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: barHeight,
                      backgroundColor: m.isSelected ? theme.accent : theme.accentMuted,
                      borderColor: m.isSelected ? theme.accent : 'transparent',
                    },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                style={[
                  styles.barLabelText,
                  { color: m.isSelected ? theme.text : theme.textSecondary, fontWeight: m.isSelected ? '700' : '400' },
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
  const { expenses, categoryLimits, categoryIcons, profile, country, formatAmount } = useExpenses();
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
        link.setAttribute('download', `cashtrack-${monthLabel.replace(/\s+/g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMessage('Your CSV report has been downloaded.');
      } else {
        const filename = `cashtrack-${monthLabel.replace(/\s+/g, '-')}.csv`;
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
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + Spacing.three, Spacing.five) }]} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header Intro */}
        <View style={styles.intro}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
            FINANCIAL INTELLIGENCE
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            Analytics & Reports
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Comprehensive monthly insights, spending patterns, and export tools.
          </ThemedText>
        </View>

        {/* 1. Month Selector Card */}
        <Card style={styles.monthSelector}>
          <Pressable
            onPress={() => changeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={[styles.monthArrow, { backgroundColor: theme.cardMuted }]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.monthLabelBlock}>
            <ThemedText type="defaultBold" style={styles.monthLabel}>
              {monthLabel}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {isCurrentMonth ? 'Month to Date' : 'Full Month Report'}
            </ThemedText>
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
              size={24}
              color={isCurrentMonth ? theme.textSecondary : theme.text}
            />
          </Pressable>
        </Card>

        {/* 2. Hero Card Summary */}
        <Card style={styles.hero}>
          <ThemedText type="caption" style={styles.heroLabel}>
            TOTAL MONTHLY SPENDING
          </ThemedText>
          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(total)}
          </ThemedText>
          <View style={styles.heroFooter}>
            <ThemedText type="small" style={styles.heroDetail}>
              {monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}
            </ThemedText>
            <View style={styles.heroDot} />
            <ThemedText type="small" style={styles.heroDetail}>
              {categoriesUsed.length} {categoriesUsed.length === 1 ? 'category' : 'categories'}
            </ThemedText>
            {overBudgetCount > 0 && (
              <>
                <View style={styles.heroDot} />
                <ThemedText type="small" style={styles.heroOver}>
                  {overBudgetCount} over limit
                </ThemedText>
              </>
            )}
          </View>
        </Card>

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
              {limitPercent !== null && (
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

        <Pressable
          onPress={createPdf}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Monthly report as PDF"
          accessibilityState={{ disabled: isGenerating }}
          style={({ pressed }) => [styles.pdfButton, { backgroundColor: theme.accent }, pressed && styles.pressed, isGenerating && styles.disabled]}>
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.pdfCopy}>
            <ThemedText type="defaultBold" style={styles.pdfTitle}>
              {isGenerating ? 'Preparing PDF Document…' : 'Monthly PDF Report'}
            </ThemedText>
            <ThemedText type="caption" style={styles.pdfSubtext}>
              {Platform.OS === 'web' ? 'Print dialog · choose Save as PDF' : 'Formatted PDF with breakdown & transactions'}
            </ThemedText>
          </View>
          {!isGenerating && <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />}
        </Pressable>

        <Pressable
          onPress={createCsv}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Monthly report as CSV"
          accessibilityState={{ disabled: isGenerating }}
          style={({ pressed }) => [styles.pdfButton, { backgroundColor: theme.cardMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }, pressed && styles.pressed, isGenerating && styles.disabled]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons name="file-excel-box" size={24} color={theme.accent} />
          </View>
          <View style={styles.pdfCopy}>
            <ThemedText type="defaultBold" style={{ color: theme.text }}>
              {isGenerating ? 'Preparing CSV Spreadsheet…' : 'Monthly CSV File'}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Excel / Google Sheets friendly raw data export
            </ThemedText>
          </View>
          {!isGenerating && <MaterialCommunityIcons name="arrow-right" size={20} color={theme.accent} />}
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
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  intro: { gap: Spacing.one },
  eyebrow: { letterSpacing: 1, fontWeight: '700' },
  title: { fontSize: 30, lineHeight: 36 },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  monthArrow: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelBlock: { flex: 1, alignItems: 'center', gap: 2 },
  monthLabel: { fontSize: 18 },
  hero: { backgroundColor: Brand.deep, borderWidth: 0, borderRadius: Radius.xlarge, padding: Spacing.four, gap: Spacing.one },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroValue: { color: '#FFFFFF', fontSize: 38, lineHeight: 46, fontVariant: ['tabular-nums'] },
  heroFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  heroDetail: { color: 'rgba(255,255,255,0.8)' },
  heroDot: { width: 4, height: 4, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.6)' },
  heroOver: { color: '#FFC0C0', fontWeight: '700' },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.three,
    minHeight: 115,
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
    width: 24,
    alignItems: 'center',
  },
  trendBar: {
    width: 16,
    borderRadius: Radius.small,
    borderWidth: 1,
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
  pdfButton: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  iconCircle: { width: 38, height: 38, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  pdfCopy: { flex: 1, gap: 2 },
  pdfTitle: { color: '#FFFFFF' },
  pdfSubtext: { color: 'rgba(255,255,255,0.78)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  sectionCopy: { flex: 1, gap: 2 },
  breakdownCard: { gap: Spacing.three },
  categoryItem: { gap: Spacing.two },
  categoryLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryDot: { width: 9, height: 9, borderRadius: Radius.pill },
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
  pressed: { opacity: 0.75 },
});
