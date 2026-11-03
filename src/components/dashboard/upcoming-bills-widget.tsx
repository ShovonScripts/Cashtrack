import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { useTheme } from '@/hooks/use-theme';
import { getReminderRemainingAmount } from '@/utils/reminder-payment';
import { triggerHaptic } from '@/utils/haptics';

function getReminderCategoryIcon(category: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (category) {
    case 'Bills':
    case 'Utilities':
      return 'flash';
    case 'Rent':
      return 'home';
    case 'EMI':
    case 'Loan':
      return 'bank';
    case 'Credit Card':
      return 'credit-card';
    case 'Subscription':
      return 'repeat';
    case 'Insurance':
      return 'shield-check';
    default:
      return 'calendar-clock';
  }
}

function getReminderCategoryColor(
  category: string,
  isOverdue: boolean,
  isDueToday: boolean,
  theme: ReturnType<typeof useTheme>
): string {
  if (isOverdue) return '#E11D48';
  if (isDueToday) return '#D97706';
  switch (category) {
    case 'Rent':
      return '#2563EB';
    case 'Bills':
    case 'Utilities':
      return '#0284C7';
    case 'EMI':
    case 'Loan':
    case 'Credit Card':
      return '#7C3AED';
    case 'Subscription':
      return '#059669';
    case 'Insurance':
      return '#0891B2';
    default:
      return theme.accent;
  }
}

export function UpcomingBillsWidget({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { reminders } = useFinancialReminders();
  const theme = useTheme();

  const activeReminders = reminders
    .filter((r) => r.derivedStatus !== 'paid' && r.derivedStatus !== 'skipped')
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const upcomingList = activeReminders.slice(0, 3);
  const overdueCount = activeReminders.filter((r) => r.derivedStatus === 'overdue').length;
  const totalAmountDue = activeReminders.reduce((sum, r) => sum + (getReminderRemainingAmount(r) ?? 0), 0);
  const nextReminder = activeReminders[0];

  const safeFormat = (amt: number | null) => (amt !== null ? formatAmount(amt) : 'Variable');

  return (
    <View style={styles.billsWidgetContainer}>
      {/* SECTION 1: GLASSMOURPHIC SUMMARY HERO BANNER (TOP) */}
      <View style={[styles.billsHeroCard, overdueCount > 0 && styles.billsHeroCardAlert]}>
        <View pointerEvents="none" style={styles.heroOrbLarge} />
        <View pointerEvents="none" style={styles.heroOrbSmall} />
        {overdueCount > 0 && <View pointerEvents="none" style={styles.heroOrbRedAlert} />}

        <View style={styles.billsHeroContent}>
          {/* Top Eyebrow & View All Link */}
          <View style={styles.billsHeroHeader}>
            <View style={styles.billsHeroTitleGroup}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color="#14E7FD" />
              <Text style={styles.billsHeroEyebrow}>BILLS & REMINDERS</Text>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/bills');
              }}
              accessibilityRole="button"
              accessibilityLabel="View all bills and reminders"
              hitSlop={8}
              style={({ pressed }) => [styles.viewAllGlassLink, pressed && styles.pressed]}>
              <Text style={styles.viewAllGlassText}>View all →</Text>
            </Pressable>
          </View>

          {/* Hero Total Due & Overdue Alert Row */}
          <View style={styles.billsHeroMetrics}>
            <View style={styles.heroTotalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTotalLabel}>TOTAL AMOUNT DUE</Text>
                <Text style={styles.heroTotalValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                  {formatAmount(totalAmountDue)}
                </Text>
              </View>
              {overdueCount > 0 && (
                <View style={styles.overdueGlassPill}>
                  <Text style={styles.overdueGlassText}>🚨 {overdueCount} OVERDUE</Text>
                </View>
              )}
            </View>

            {nextReminder ? (
              <View style={styles.nextDueRow}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.nextDueText} numberOfLines={1}>
                  Next: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{nextReminder.title}</Text> · {
                    nextReminder.daysUntilDue < 0
                      ? `🚨 ${Math.abs(nextReminder.daysUntilDue)}d overdue`
                      : nextReminder.daysUntilDue === 0
                        ? 'Due today'
                        : `In ${nextReminder.daysUntilDue} day${nextReminder.daysUntilDue === 1 ? '' : 's'}`
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.nextDueRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#34D399" />
                <Text style={styles.nextDueText}>All upcoming bills caught up!</Text>
              </View>
            )}
          </View>

          {/* Subscriptions Hub Glass Bar */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/subscriptions');
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.subHubGlassBar, pressed && styles.pressed]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="repeat" size={16} color="#14E7FD" />
              <Text style={styles.subHubGlassText}>Subscriptions & Recurring Hub</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </View>

      {/* SECTION 2: INTERACTIVE CATEGORIZED PAYMENT FEED (BOTTOM) */}
      <View style={styles.billsFeedSection}>
        <View style={styles.feedHeaderRow}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.feedTitle}>
            UPCOMING PAYMENTS ({activeReminders.length})
          </ThemedText>
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/bills/add');
            }}
            accessibilityRole="button"
            accessibilityLabel="Add new bill"
            hitSlop={8}
            style={({ pressed }) => [styles.quickAddPill, { backgroundColor: theme.cardMuted, borderColor: theme.border }, pressed && styles.pressed]}>
            <Ionicons name="add" size={14} color={theme.accent} />
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>Add bill</ThemedText>
          </Pressable>
        </View>

        {activeReminders.length === 0 ? (
          <Card style={styles.emptyFeedCard}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/bills/add');
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.emptyFeedButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="calendar-plus" size={32} color={theme.accent} />
              <View style={{ gap: 2, alignItems: 'center' }}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  No upcoming bills due
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  Tap to set up rent, utilities, or subscription reminders.
                </ThemedText>
              </View>
            </Pressable>
          </Card>
        ) : (
          <View style={styles.feedList}>
            {upcomingList.map((rem) => {
              const isOverdue = rem.derivedStatus === 'overdue';
              const isDueToday = rem.derivedStatus === 'due_today';
              const accentColor = getReminderCategoryColor(rem.category, isOverdue, isDueToday, theme);
              const iconName = getReminderCategoryIcon(rem.category);
              const remainingAmount = getReminderRemainingAmount(rem);
              const isPartiallyPaid =
                Math.max(0, rem.paidAmountCurrentCycle ?? 0) > 0 && (remainingAmount ?? 0) > 0;

              const statusText = isOverdue
                ? `${Math.abs(rem.daysUntilDue)}d overdue`
                : isDueToday
                  ? 'Due today'
                  : `In ${rem.daysUntilDue}d`;

              return (
                <Card key={rem.id} style={styles.feedItemCard} padded={false}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      router.push({ pathname: '/bills/pay/[id]', params: { id: rem.id } });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Pay ${rem.title}, ${safeFormat(isPartiallyPaid ? remainingAmount : rem.amount)}`}
                    style={({ pressed }) => [styles.feedItemRow, pressed && styles.pressed]}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${accentColor}1C` }]}>
                      <MaterialCommunityIcons name={iconName} size={20} color={accentColor} />
                    </View>

                    <View style={styles.feedItemCopy}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ThemedText type="smallBold" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {rem.title}
                        </ThemedText>
                        {isOverdue && (
                          <View style={styles.alertPillTag}>
                            <Text style={styles.alertPillText}>OVERDUE</Text>
                          </View>
                        )}
                      </View>
                      <ThemedText type="caption" style={{ color: isOverdue ? theme.danger : theme.textSecondary, fontSize: 11 }}>
                        <Text style={{ fontWeight: '700', color: accentColor }}>{statusText}</Text> · {rem.category}
                        {isPartiallyPaid ? ' · Part paid' : ''}
                      </ThemedText>
                    </View>

                    <View style={styles.feedRightCol}>
                      <ThemedText type="smallBold" style={[styles.feedAmount, { color: isOverdue ? theme.danger : theme.text }]}>
                        {safeFormat(isPartiallyPaid ? remainingAmount : rem.amount)}
                      </ThemedText>
                      <View style={[styles.payNowBtn, { backgroundColor: `${accentColor}18` }]}>
                        <MaterialCommunityIcons name="check-circle-outline" size={12} color={accentColor} />
                        <Text style={[styles.payNowText, { color: accentColor }]}>Pay</Text>
                      </View>
                    </View>
                  </Pressable>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  billsWidgetContainer: {
    gap: Spacing.three,
  },
  billsHeroCard: {
    backgroundColor: '#00109D',
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#00109D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  billsHeroCardAlert: {
    borderColor: 'rgba(225, 29, 72, 0.45)',
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(139, 123, 255, 0.22)',
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    left: -40,
    bottom: -50,
    backgroundColor: 'rgba(20, 231, 253, 0.2)',
  },
  heroOrbRedAlert: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: 10,
    top: -40,
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
  },
  billsHeroContent: {
    gap: Spacing.three,
    zIndex: 2,
  },
  billsHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  billsHeroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billsHeroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  viewAllGlassLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pressed: {
    opacity: 0.75,
  },
  viewAllGlassText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  billsHeroMetrics: {
    gap: Spacing.one,
  },
  heroTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heroTotalLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTotalValue: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  overdueGlassPill: {
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(225, 29, 72, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  overdueGlassText: {
    color: '#FFD1D1',
    fontSize: 10,
    fontWeight: '800',
  },
  nextDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.medium,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  nextDueText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  subHubGlassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  subHubGlassText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  billsFeedSection: {
    gap: Spacing.two,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  feedTitle: {
    letterSpacing: 0.8,
    fontSize: 10.5,
    fontWeight: '800',
  },
  quickAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyFeedCard: {
    padding: Spacing.four,
  },
  emptyFeedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  feedList: {
    gap: Spacing.two,
  },
  feedItemCard: {
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  feedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  categoryBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedItemCopy: {
    flex: 1,
    gap: 2,
  },
  alertPillTag: {
    backgroundColor: '#E11D481C',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.small,
  },
  alertPillText: {
    color: '#E11D48',
    fontSize: 9,
    fontWeight: '800',
  },
  feedRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  feedAmount: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  payNowText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
