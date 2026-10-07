import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { SpendlyLogo } from '@/components/spendly-logo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';

type OnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function OnboardingModal({ visible, onClose }: OnboardingModalProps) {
  const theme = useTheme();
  const { country } = useExpenses();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'welcome',
      icon: 'hand-wave' as const,
      title: 'Welcome to CashTrack',
      subtitle: 'Your smart, private, and local-first money manager.',
      content: (
        <View style={styles.slideBody}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.bodyText}>
            CashTrack helps you track spending, monitor income streams, stick to monthly budgets, and manage debts—all without creating an account.
          </ThemedText>

          <Card style={styles.highlightCard}>
            <View style={styles.countryHeader}>
              <View style={[styles.symbolBadge, { backgroundColor: theme.accentMuted }]}>
                <ThemedText type="subtitle" style={{ color: theme.accent }}>{country.symbol.trim()}</ThemedText>
              </View>
              <View style={styles.countryInfo}>
                <ThemedText type="caption" themeColor="textSecondary">Selected Country & Currency</ThemedText>
                <ThemedText type="defaultBold">{country.name} ({country.currencyCode} {country.symbol.trim()})</ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => {
                onClose();
                router.push('/country');
              }}
              style={({ pressed }) => [
                styles.changeCountryBtn,
                { borderColor: theme.accent },
                pressed && styles.pressed,
              ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="earth" size={16} color={theme.accent} />
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  Change Country or Currency
                </ThemedText>
              </View>
            </Pressable>
          </Card>
        </View>
      ),
    },
    {
      id: 'transactions',
      icon: 'receipt' as const,
      title: 'Transactions & Income',
      subtitle: 'Log expenses effortlessly with built-in math.',
      content: (
        <View style={styles.slideBody}>
          <FeatureBullet
            icon="calculator"
            title="Smart Expression Calculator"
            description="Type calculations directly like 12.50 + 4.99 = 17.49 when recording receipts."
          />
          <FeatureBullet
            icon="wallet-plus-outline"
            title="Income Streams"
            description="Track recurring salary, freelance gigs, and diverse cash inflows."
          />
          <FeatureBullet
            icon="tag-multiple-outline"
            title="Custom Categories & Tags"
            description="Organize expenses by intuitive categories or create custom tags with custom icons."
          />
        </View>
      ),
    },
    {
      id: 'liabilities',
      icon: 'scale-balance' as const,
      title: 'Budgets, Bills & Debts',
      subtitle: 'Stay in full control of your financial obligations.',
      content: (
        <View style={styles.slideBody}>
          <FeatureBullet
            icon="target"
            title="Monthly Budget Caps"
            description="Set limits for categories and get automatic alerts at 80% and 100% spend."
          />
          <FeatureBullet
            icon="calendar-clock"
            title="Bills & Reminders"
            description="Never miss a payment with upcoming payment alerts and EMIs."
          />
          <FeatureBullet
            icon="account-cash-outline"
            title="Debts & IOUs Tracker"
            description="Track money you lent or borrowed, log partial returns, and mark items settled."
          />
        </View>
      ),
    },
    {
      id: 'insights',
      icon: 'chart-box-outline' as const,
      title: 'AI Advisor & Reports',
      subtitle: 'Deep intelligence and exportable data.',
      content: (
        <View style={styles.slideBody}>
          <FeatureBullet
            icon="robot-outline"
            title="AI Financial Advisor"
            description="Get personalized budget check-ins and insights generated right on your phone."
          />
          <FeatureBullet
            icon="chart-donut-variant"
            title="Savings Goals & Pots"
            description="Allocate funds toward specific milestone targets and watch your pots grow."
          />
          <FeatureBullet
            icon="file-document-outline"
            title="PDF & CSV Data Exports"
            description="Generate clean monthly PDF reports or CSV spreadsheets whenever needed."
          />
        </View>
      ),
    },
    {
      id: 'privacy',
      icon: 'shield-lock-outline' as const,
      title: '100% Private & Offline',
      subtitle: 'Your money data stays exclusively on your device.',
      content: (
        <View style={styles.slideBody}>
          <FeatureBullet
            icon="shield-check-outline"
            title="No Account Required"
            description="Your expenses are stored locally in an encrypted SQLite database."
          />
          <FeatureBullet
            icon="cancel"
            title="Zero Ads or Tracking"
            description="No analytics SDKs, no targeted ads, and no cloud server uploads."
          />
          <FeatureBullet
            icon="grid"
            title="Unified Menu Hub"
            description="Access all features, tools, and preferences instantly from one central hub."
          />
        </View>
      ),
    },
  ];

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onClose();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <SpendlyLogo />
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Skip
              </ThemedText>
            </Pressable>
          </View>

          {/* Slide Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.titleSection}>
              <View style={[styles.iconBadge, { backgroundColor: theme.accentMuted }]}>
                <MaterialCommunityIcons name={slide.icon} size={28} color={theme.accent} />
              </View>
              <ThemedText type="subtitle" style={styles.slideTitle}>
                {slide.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.slideSubtitle}>
                {slide.subtitle}
              </ThemedText>
            </View>

            {slide.content}
          </ScrollView>

          {/* Pagination & Navigation Footer */}
          <View style={styles.footer}>
            {/* Dots */}
            <View style={styles.dotsRow}>
              {slides.map((_, index) => (
                <Pressable
                  key={`dot-${index}`}
                  onPress={() => setCurrentSlide(index)}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentSlide ? theme.accent : theme.border,
                      width: index === currentSlide ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Buttons Row */}
            <View style={styles.actionsRow}>
              {currentSlide > 0 ? (
                <Pressable
                  onPress={handlePrev}
                  style={({ pressed }) => [
                    styles.prevButton,
                    { borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    Back
                  </ThemedText>
                </Pressable>
              ) : (
                <View style={{ width: 70 }} />
              )}

              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.nextButton,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>
                  {isLastSlide ? 'Get Started' : 'Next →'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FeatureBullet({ icon, title, description }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; description: string }) {
  const theme = useTheme();
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletIcon, { backgroundColor: theme.cardMuted }]}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.accent} />
      </View>
      <View style={styles.bulletTextGroup}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  titleSection: {
    alignItems: 'center',
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  slideTitle: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  slideSubtitle: {
    textAlign: 'center',
    maxWidth: 340,
  },
  slideBody: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  bodyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  highlightCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  countryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  symbolBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryInfo: {
    flex: 1,
    gap: 2,
  },
  changeCountryBtn: {
    height: 40,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bulletIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletTextGroup: {
    flex: 1,
    gap: 2,
  },
  footer: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: Radius.pill,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prevButton: {
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    height: 44,
    marginLeft: Spacing.two,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
