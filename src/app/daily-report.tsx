import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { Card } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, sumAmounts } from '@/utils/expense';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DailyReportScreen() {
  const theme = useTheme();
  const { expenses, categoryIcons, formatAmount } = useExpenses();

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const isToday = isSameDay(selectedDate, new Date());
  const dateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(selectedDate);

  const dayExpenses = expenses
    .filter((e) => isSameDay(new Date(e.date), selectedDate))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = sumAmounts(dayExpenses);
  const transactionCount = dayExpenses.length;
  const largestExpense = dayExpenses.length ? Math.max(...dayExpenses.map((e) => e.amount)) : 0;
  const avgExpense = transactionCount > 0 ? total / transactionCount : 0;

  const categoryTotals = new Map<string, number>();
  for (const exp of dayExpenses) {
    categoryTotals.set(exp.category, (categoryTotals.get(exp.category) ?? 0) + exp.amount);
  }
  const categories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const topCategory = categories.length > 0 ? categories[0] : null;

  const changeDate = (days: number) => {
    triggerHaptic();
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return new Date(next.getFullYear(), next.getMonth(), next.getDate(), 12, 0, 0);
    });
    setMessage('');
  };

  const jumpToToday = () => {
    triggerHaptic();
    const today = new Date();
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0));
    setMessage('');
  };

  const exportDailyPdf = async () => {
    if (isGenerating) return;
    triggerHaptic();
    setIsGenerating(true);
    setMessage('');

    try {
      const categoryRows = categories.length
        ? categories
            .map(([cat, amt]) => {
              const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
              return `<tr><td><strong>${cat}</strong></td><td class="numeric">${formatAmount(amt)}</td><td class="numeric">${pct}%</td></tr>`;
            })
            .join('')
        : '<tr><td colspan="3" class="empty">No expenses recorded on this day.</td></tr>';

      const txRows = dayExpenses.length
        ? dayExpenses
            .map(
              (e) =>
                `<tr><td>${formatDate(e.date)}</td><td><strong>${e.category}</strong></td><td>${e.note || '—'}</td><td class="numeric">${formatAmount(e.amount)}</td></tr>`
            )
            .join('')
        : '<tr><td colspan="4" class="empty">No transactions.</td></tr>';

      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CashTrack Daily Report — ${dateLabel}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    body { font: 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #1e1e2d; margin: 0; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eaeaf2; padding-bottom: 12px; margin-bottom: 16px; }
    .wordmark { color: ${Brand.primary}; font-size: 22px; font-weight: 800; }
    .hero { background: ${Brand.deep}; color: white; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
    .hero-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: ${Brand.bright}; font-weight: 700; }
    .hero-value { font-size: 32px; font-weight: 800; margin-top: 4px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .stat { border: 1px solid #e4e4ed; border-radius: 8px; padding: 10px; background: #fbfbfc; }
    .stat-lbl { font-size: 8px; text-transform: uppercase; color: #707080; font-weight: 700; }
    .stat-val { font-size: 14px; font-weight: 700; margin-top: 4px; color: #111118; }
    h2 { font-size: 13px; color: #1e1b4b; border-left: 3px solid ${Brand.primary}; padding-left: 8px; margin: 18px 0 8px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px; }
    th { padding: 6px 8px; background: ${Brand.accentWash}; color: ${Brand.primary}; text-align: left; font-weight: 700; border-bottom: 1px solid #dcdce6; }
    td { padding: 6px 8px; border-bottom: 1px solid #eeedf4; }
    .numeric { text-align: right; white-space: nowrap; }
    .empty { text-align: center; color: #737385; font-style: italic; padding: 12px; }
    .footer { margin-top: 20px; border-top: 1px solid #e4e4ed; padding-top: 8px; font-size: 8px; color: #858596; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="wordmark">CashTrack</div>
      <div style="font-size: 9px; color: #6e6e80; text-transform: uppercase; font-weight: 700;">Daily Expense Report</div>
    </div>
    <div style="text-align: right;">
      <h1 style="margin: 0; font-size: 18px;">${dateLabel}</h1>
      <div style="font-size: 9px; color: #737385;">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="hero">
    <div class="hero-label">Total Spent on ${dateLabel}</div>
    <div class="hero-value">${formatAmount(total)}</div>
    <div style="font-size: 11px; color: #c0d0ff; margin-top: 4px;">${transactionCount} ${transactionCount === 1 ? 'transaction' : 'transactions'} recorded</div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-lbl">Largest Expense</div>
      <div class="stat-val">${formatAmount(largestExpense)}</div>
    </div>
    <div class="stat">
      <div class="stat-lbl">Average Transaction</div>
      <div class="stat-val">${formatAmount(avgExpense)}</div>
    </div>
    <div class="stat">
      <div class="stat-lbl">Top Category</div>
      <div class="stat-val">${topCategory ? topCategory[0] : 'None'}</div>
    </div>
  </div>

  <h2>Category Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th class="numeric">Amount</th>
        <th class="numeric">% of Day</th>
      </tr>
    </thead>
    <tbody>
      ${categoryRows}
    </tbody>
  </table>

  <h2>Transaction Ledger (${dayExpenses.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Time / Date</th>
        <th>Category</th>
        <th>Note</th>
        <th class="numeric">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${txRows}
    </tbody>
  </table>

  <div class="footer">
    <span>CashTrack · Local-First Daily Expense Report</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;

      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (!win) throw new Error('Popup blocked.');
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
        setMessage('Daily report opened in print dialog.');
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `CashTrack Daily Report (${dateLabel})` });
          setMessage('Daily PDF report ready to share.');
        } else {
          setMessage('PDF ready.');
        }
      }
    } catch {
      setMessage('Could not generate daily PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header Intro */}
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
              DAILY FINANCIAL REPORT
            </ThemedText>
            <ThemedText type="title">Daily Expense Breakdown</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Detailed breakdown of expenses and categories for any selected day.
            </ThemedText>
          </View>
        </View>

        {/* Date Selector Bar */}
        <Card style={styles.dateSelectorCard}>
          <Pressable
            onPress={() => changeDate(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            style={[styles.arrowButton, { backgroundColor: theme.cardMuted }]}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>

          <View style={styles.dateLabelBlock}>
            <ThemedText type="defaultBold" style={styles.dateLabelText}>
              {dateLabel}
            </ThemedText>
            {!isToday && (
              <Pressable onPress={jumpToToday} accessibilityRole="button">
                <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
                  Jump to Today
                </ThemedText>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => changeDate(1)}
            accessibilityRole="button"
            accessibilityLabel="Next day"
            style={[styles.arrowButton, { backgroundColor: theme.cardMuted }]}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.text} />
          </Pressable>
        </Card>

        {/* Hero Card for Day */}
        <View style={styles.heroGlassCard}>
          <View pointerEvents="none" style={styles.primaryBlueOrb} />
          <View pointerEvents="none" style={styles.brightCyanOrb} />

          <View style={styles.heroHeaderRow}>
            <ThemedText type="caption" style={styles.heroLabelText}>TOTAL DAILY SPENDING</ThemedText>
            <View style={styles.reportBadgePill}>
              <MaterialCommunityIcons name="calendar-today" size={12} color={Brand.bright} />
              <ThemedText type="caption" style={{ color: Brand.bright, fontWeight: '700' }}>
                {isToday ? 'Today' : dateLabel}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="hero" style={styles.heroValueText} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(total)}
          </ThemedText>

          <View style={styles.heroFooterRow}>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="receipt" size={13} color="#FFFFFF" />
              <ThemedText type="caption" style={styles.heroDetailText}>
                {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
              </ThemedText>
            </View>

            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="tag" size={13} color="#FFFFFF" />
              <ThemedText type="caption" style={styles.heroDetailText}>
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <ThemedText type="caption" themeColor="textSecondary">LARGEST EXPENSE</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1}>
              {formatAmount(largestExpense)}
            </ThemedText>
          </Card>
          <Card style={styles.metricCard}>
            <ThemedText type="caption" themeColor="textSecondary">AVERAGE</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1}>
              {formatAmount(avgExpense)}
            </ThemedText>
          </Card>
          <Card style={styles.metricCard}>
            <ThemedText type="caption" themeColor="textSecondary">TOP CATEGORY</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1}>
              {topCategory ? topCategory[0] : 'None'}
            </ThemedText>
          </Card>
        </View>

        {/* Category Breakdown */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Category Breakdown</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Share of total daily spending
          </ThemedText>
        </View>

        {categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText type="defaultBold">No expenses on {dateLabel}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              You haven&apos;t recorded any expenses for this date.
            </ThemedText>
          </Card>
        ) : (
          <Card style={styles.breakdownCard}>
            {categories.map(([category, amount], index) => {
              const pct = total > 0 ? (amount / total) * 100 : 0;
              const color = getCategoryColor(category);
              return (
                <View key={category} style={styles.categoryItem}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.categoryLine}>
                    <CategoryIcon category={category} customIcons={categoryIcons} color={color} size={15} containerSize={28} />
                    <ThemedText type="smallBold" style={styles.categoryName}>{category}</ThemedText>
                    <ThemedText type="smallBold">{formatAmount(amount)} ({pct.toFixed(0)}%)</ThemedText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.progressFill, { width: `${Math.max(pct, 3)}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Transaction Ledger for this Day */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Transactions on {dateLabel}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{dayExpenses.length} entries</ThemedText>
        </View>

        {dayExpenses.length > 0 ? (
          <Card style={styles.transactionCard}>
            {dayExpenses.map((expense, index) => (
              <View key={expense.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <View style={styles.transactionRow}>
                  <CategoryIcon category={expense.category} customIcons={categoryIcons} color={getCategoryColor(expense.category)} size={16} containerSize={36} />
                  <View style={styles.transactionCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {expense.note || expense.category}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {expense.category} · {formatDate(expense.date)}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'] }}>{formatAmount(expense.amount)}</ThemedText>
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <ThemedText type="small" themeColor="textSecondary">No transactions recorded.</ThemedText>
          </Card>
        )}

        {/* Export Daily Report Button */}
        <Pressable
          onPress={exportDailyPdf}
          disabled={isGenerating}
          style={({ pressed }) => [styles.exportButton, pressed && styles.pressed, isGenerating && styles.disabled]}>
          <MaterialCommunityIcons name="file-pdf-box" size={22} color="#FFFFFF" />
          <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>
            {isGenerating ? 'Generating PDF...' : 'Download / Print Daily Report (PDF)'}
          </ThemedText>
        </Pressable>

        {message ? (
          <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            {message}
          </ThemedText>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 110 },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, gap: Spacing.three },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.two },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: { letterSpacing: 1, fontWeight: '800', fontSize: 10 },
  dateSelectorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.two },
  arrowButton: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  dateLabelBlock: { flex: 1, alignItems: 'center', gap: 2 },
  dateLabelText: { fontSize: 15, fontWeight: '800' },
  heroGlassCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Brand.deep,
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
  primaryBlueOrb: { position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(1, 82, 245, 0.45)' },
  brightCyanOrb: { position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(20, 231, 253, 0.3)' },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  heroLabelText: { color: 'rgba(255,255,255,0.75)', letterSpacing: 1, fontSize: 11, fontWeight: '800' },
  reportBadgePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(20, 231, 253, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  heroValueText: { color: '#FFFFFF', fontSize: 38, lineHeight: 46, fontVariant: ['tabular-nums'], zIndex: 2 },
  heroFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, zIndex: 2 },
  heroStatPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  heroDetailText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  metricsRow: { flexDirection: 'row', gap: Spacing.two },
  metricCard: { flex: 1, padding: Spacing.three, gap: 4, minHeight: 80 },
  metricValue: { fontSize: 14, fontVariant: ['tabular-nums'] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
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
  emptyCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  emptyText: { textAlign: 'center' },
  exportButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.large,
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
