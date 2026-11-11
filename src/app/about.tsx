import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ExternalLink } from '@/components/external-link';
import { CashTrackLogo } from '@/components/cashtrack-logo';
import { ThemedText } from '@/components/themed-text';
import { Icon, ListRow, Screen, Section } from '@/components/ui';
import type { GlyphName } from '@/constants/icons';
import { SUPPORT_EMAIL } from '@/constants/privacy-policy';
import { notify } from '@/utils/confirm';
import { BadgeSize, MinTouchTarget, PressFeedback, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DONATION_URL = 'https://buymeacoffee.com/mr.nas';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <Screen topInset={false}>
      <View style={styles.brandPanel}>
        <CashTrackLogo />
        <ThemedText type="title">Money, made clearer.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          CashTrack is a next-generation, independent personal finance and expense tracker built to give you absolute clarity over your cash flow without compromising your privacy or overwhelming you with complexity.
        </ThemedText>
      </View>

      <Section title="Why CashTrack matters today" subtitle="Built for today’s economic landscape.">
        <Card style={styles.stack}>
          <FeatureRow
            icon="trending-up"
            title="Navigating Inflation & Rising Costs"
            detail="With living expenses and subscription fatigue on the rise, having real-time visibility into your daily and monthly spending pace is essential to staying ahead financially."
          />
          <FeatureRow
            icon="shield-account"
            title="100% Privacy & Data Ownership"
            detail="Unlike traditional apps that harvest your banking credentials and upload your financial data to cloud servers, CashTrack stores everything strictly on your device."
          />
          <FeatureRow
            icon="emoticon-happy-outline"
            title="Zero Financial Anxiety"
            detail="We believe managing money should feel empowering, not punitive. CashTrack uses gentle advisor prompts and clean visuals to make budgeting a breeze."
          />
        </Card>
      </Section>

      <Section title="How CashTrack works" subtitle="Your complete financial command center.">
        <Card style={styles.stack}>
          <FeatureRow icon="cash-multiple" title="Cash Flow & Daily Cost" detail="Instantly track what you spend each day, month, and all-time, balanced against your incoming cash flow." />
          <FeatureRow icon="piggy-bank" title="Money Plan & Pots" detail="Save towards targets in pots (General, Junior, Emergency, Milestone), with auto-save from income and a pace to keep." />
          <FeatureRow icon="account-cash" title="Lend & Borrow Tracker" detail="Keep clear records of money you’ve lent to friends or borrowed, tracking your net debt at a glance." />
          <FeatureRow icon="calendar-clock" title="Bills & Reminders" detail="Never miss a rent, utility, or subscription renewal with advance alerts and one-tap payment tracking." />
          <FeatureRow icon="creation" title="Smart Spending Advisor" detail="Get early heads-ups when category spending trends over budget before you reach your limits." />
        </Card>
      </Section>

      <Section title="Our privacy promise" subtitle="An honest commitment to your security.">
        <Card style={styles.stack}>
          <FeatureRow icon="check-circle-outline" title="No account or data uploads" detail="Your expenses, savings pots, and debts remain on your device. We never send them to an external server." />
          <FeatureRow icon="check-circle-outline" title="No ads or ad trackers" detail="CashTrack contains zero advertisements, analytics trackers, or third-party marketing SDKs." />
          <View style={[styles.note, { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="caption" themeColor="textSecondary">
              Because CashTrack is 100% local-only, it does not sync cloud backups automatically. Remember to save reports or export your data before changing devices.
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/privacy')}
            style={({ pressed }) => [styles.policyLink, pressed && PressFeedback]}>
            <Icon name="shield-lock-outline" size="md" />
            <ThemedText type="smallBold" style={[styles.flex, { color: theme.accent }]}>
              Read the full privacy policy
            </ThemedText>
            <Icon name="chevron-right" size="md" color={theme.textSecondary} />
          </Pressable>
        </Card>
      </Section>

      <Section title="Help and feedback" subtitle="Questions, problems, ideas, or a request to delete your data.">
        <Card padded={false}>
          <ListRow
            title="Email support"
            subtitle={SUPPORT_EMAIL}
            icon="email-outline"
            color={theme.accent}
            accessibilityHint="Opens your email app with a new message to CashTrack support"
            onPress={() =>
              void Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`CashTrack support (version ${APP_VERSION}, ${Platform.OS})`)}`,
              ).catch(() => notify('No email app found', `Write to ${SUPPORT_EMAIL} from any email app.`))
            }
          />
        </Card>
      </Section>

      <Card style={styles.support}>
        <Icon name="heart-outline" size="xl" color={theme.textSecondary} />
        <ThemedText type="subtitle" style={styles.centered}>
          Support independent development
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          If CashTrack helps you feel more in control of your money, consider leaving a voluntary tip. Donations support future improvements without paywalling any features.
        </ThemedText>
        <ExternalLink href={DONATION_URL} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Support CashTrack on Buy Me a Coffee"
            style={({ pressed }) => [styles.donate, { borderColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: theme.accent }}>
              Buy me a coffee ↗
            </ThemedText>
          </Pressable>
        </ExternalLink>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.centered}>
          Donations are securely processed by Buy Me a Coffee. CashTrack never receives your payment details.
        </ThemedText>
      </Card>

      <Section title="Built by" subtitle="Independent developer.">
        <Card padded={false}>
          <ListRow
            title="NAS Digital"
            subtitle="https://nasdigital.uk"
            icon="domain"
            color={theme.accent}
            accessibilityHint="Opens NAS Digital website"
            onPress={() => void Linking.openURL('https://nasdigital.uk/')}
          />
        </Card>
      </Section>

      <ThemedText type="caption" themeColor="textSecondary" style={styles.centered}>
        CashTrack · Version {APP_VERSION}
      </ThemedText>
    </Screen>
  );
}

function FeatureRow({ icon, title, detail }: { icon: GlyphName; title: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={styles.featureRow}>
      <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
        <Icon name={icon} size="md" />
      </View>
      <View style={styles.featureCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandPanel: { gap: Spacing.two, paddingVertical: Spacing.two },
  stack: { gap: Spacing.three },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  badge: {
    width: BadgeSize.md,
    height: BadgeSize.md,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: { flex: 1, gap: Spacing.half },
  note: { borderRadius: Radius.medium, padding: Spacing.three },
  policyLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: MinTouchTarget },
  flex: { flex: 1 },
  support: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  centered: { textAlign: 'center' },
  donate: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
