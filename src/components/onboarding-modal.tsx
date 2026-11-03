import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { SpendlyLogo } from '@/components/spendly-logo';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';

type OnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function OnboardingModal({ visible, onClose }: OnboardingModalProps) {
  const theme = useTheme();
  const { country } = usePreferences();
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
              accessibilityRole="button"
              hitSlop={6}
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
      id: 'features',
      icon: 'view-grid-outline' as const,
      title: 'Everything in one place',
      subtitle: 'Four things to know, then you are ready.',
      content: (
        <View style={styles.slideBody}>
          <FeatureBullet
            icon="calculator"
            title="Fast expense entry"
            description="Type sums like 12.50 + 4.99 right in the amount, and pick from your recent categories."
          />
          <FeatureBullet
            icon="scale-balance"
            title="Budgets, bills and debts"
            description="Set category limits with warnings at 80% and 100%, track bills, and note money lent or borrowed."
          />
          <FeatureBullet
            icon="chart-donut-variant"
            title="Savings pots and insights"
            description="Save toward goals and get plain-language spending advice."
          />
          <FeatureBullet
            icon="file-document-outline"
            title="Reports you can export"
            description="Monthly PDF and CSV reports are in the Insights tab."
          />
        </View>
      ),
    },
    {
      id: 'privacy',
      icon: 'shield-lock-outline' as const,
      title: 'Private by design',
      subtitle: 'Your money data stays on this device.',
      content: (
        <View style={styles.slideBody}>
          <FeatureBullet
            icon="shield-check-outline"
            title="No account, no cloud"
            description="Nothing is uploaded. There are no ads and no tracking."
          />
          <FeatureBullet
            icon="grid"
            title="More tab"
            description="Bills, debts, goals, tools and settings are all under More."
          />
          <Pressable
            onPress={() => {
              onClose();
              router.push('/add-expense');
            }}
            accessibilityRole="button"
            accessibilityLabel="Add my first expense"
            style={({ pressed }) => [
              styles.changeCountryBtn,
              { borderColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="plus-circle-outline" size={16} color={theme.accent} />
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Add my first expense
              </ThemedText>
            </View>
          </Pressable>
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
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
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
                  accessibilityRole="button"
                  accessibilityLabel={`Go to slide ${index + 1}`}
                  accessibilityState={{ selected: index === currentSlide }}
                  style={styles.dotWrapper}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: index === currentSlide ? theme.accent : theme.border,
                        width: index === currentSlide ? 20 : 8,
                      },
                    ]}
                  />
                </Pressable>
              ))}
            </View>

            {/* Buttons Row */}
            <View style={styles.actionsRow}>
              {currentSlide > 0 ? (
                <Pressable
                  onPress={handlePrev}
                  accessibilityRole="button"
                  accessibilityLabel="Previous slide"
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
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.nextButton,
                  { backgroundColor: theme.accentFill },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="defaultBold" style={{ color: Palette.white }}>
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
    minHeight: 44,
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
  },
  dotWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    minHeight: 44,
    marginStart: Spacing.two,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
