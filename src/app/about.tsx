import { ExternalLink } from '@/components/external-link';
import { SpendlyLogo } from '@/components/spendly-logo';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import Constants from 'expo-constants';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DONATION_URL = 'https://buymeacoffee.com/mr.nas';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Brand Hero Panel */}
        <View style={styles.brandPanel}>
          <SpendlyLogo />
          <ThemedText type="subtitle" style={styles.headline}>Money, made clearer.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.headSub}>
            Spendly is a next-generation, independent personal finance and expense tracker built to give you absolute clarity over your cash flow without compromising your privacy or overwhelming you with complexity.
          </ThemedText>
        </View>

        {/* Why Spendly is Needed Today */}
        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">Why Spendly matters today</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Built for today’s economic landscape.</ThemedText>
        </View>

        <Card style={styles.card}>
          <FeatureWhyRow
            icon="trending-up"
            title="Navigating Inflation & Rising Costs"
            detail="With living expenses and subscription fatigue on the rise, having real-time visibility into your daily and monthly spending pace is essential to staying ahead financially."
          />
          <FeatureWhyRow
            icon="shield-account"
            title="100% Privacy & Data Ownership"
            detail="Unlike traditional apps that harvest your banking credentials and upload your financial data to cloud servers, Spendly stores everything strictly on your device."
          />
          <FeatureWhyRow
            icon="emoticon-happy-outline"
            title="Zero Financial Anxiety"
            detail="We believe managing money should feel empowering, not punitive. Spendly uses gentle advisor prompts and clean visuals to make budgeting a breeze."
          />
        </Card>

        {/* How Spendly Works */}
        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">How Spendly works</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Your complete financial command center.</ThemedText>
        </View>

        <Card style={styles.card}>
          <FeatureHowRow
            icon="cash-multiple"
            title="Cash Flow & Daily Cost"
            detail="Instantly track what you spend each day, month, and all-time, balanced against your incoming cash flow."
          />
          <FeatureHowRow
            icon="piggy-bank"
            title="Savings Pots & Money Plan"
            detail="Create dedicated savings stashes (Emergency funds, milestones, junior pots) with automated pacing calculators."
          />
          <FeatureHowRow
            icon="account-cash"
            title="Lend & Borrow Tracker"
            detail="Keep clear records of money you’ve lent to friends or borrowed, tracking your net debt at a glance."
          />
          <FeatureHowRow
            icon="calendar-clock"
            title="Bills & Reminders"
            detail="Never miss a rent, utility, or subscription renewal with advance alerts and one-tap payment tracking."
          />
          <FeatureHowRow
            icon="creation"
            title="Smart Spending Advisor"
            detail="Get early heads-ups when category spending trends over budget before you reach your limits."
          />
        </Card>

        {/* Privacy Promise */}
        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">Our privacy promise</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">An honest commitment to your security.</ThemedText>
        </View>
        <Card style={styles.privacyCard}>
          <PromiseRow title="No account or data uploads" detail="Your expenses, savings pots, and debts remain on your device. We never send them to an external server." />
          <PromiseRow title="No ads or ad trackers" detail="Spendly contains zero advertisements, analytics trackers, or third-party marketing SDKs." />
          <View style={[styles.localOnlyNote, { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="caption" themeColor="textSecondary">
              Because Spendly is 100% local-only, it does not sync cloud backups automatically. Remember to save reports or export your data before changing devices.
            </ThemedText>
          </View>
        </Card>

        {/* Support Independent Development */}
        <Card style={styles.supportCard}>
          <View style={[styles.coffeeMark, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="title" themeColor="textSecondary" style={styles.coffeeMarkText}>♥</ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.supportTitle}>Support independent development</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.supportCopy}>
            If Spendly helps you feel more in control of your money, consider leaving a voluntary tip. Donations support future improvements without paywalling any features.
          </ThemedText>
          <ExternalLink href={DONATION_URL} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Support Spendly on Buy Me a Coffee"
              style={({ pressed }) => [styles.donateButton, { borderColor: theme.accent }, pressed && styles.pressed]}>
              <ThemedText type="defaultBold" style={{ color: theme.accent }}>Buy me a coffee  ↗</ThemedText>
            </Pressable>
          </ExternalLink>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.donationNote}>
            Donations are securely processed by Buy Me a Coffee. Spendly never receives your payment details.
          </ThemedText>
        </Card>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.version}>Spendly · Version {APP_VERSION}</ThemedText>
      </View>
    </ScrollView>
  );
}

function FeatureWhyRow({ icon, title, detail }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIconBadge, { backgroundColor: theme.accentMuted }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.accent} />
      </View>
      <View style={styles.featureCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
    </View>
  );
}

function FeatureHowRow({ icon, title, detail }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIconBadge, { backgroundColor: theme.accentMuted }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.accent} />
      </View>
      <View style={styles.featureCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
    </View>
  );
}

function PromiseRow({ title, detail }: { title: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={styles.promiseRow}>
      <View style={[styles.check, { backgroundColor: theme.accentMuted }]}>
        <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '800' }}>✓</ThemedText>
      </View>
      <View style={styles.promiseCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  brandPanel: { gap: Spacing.two, paddingVertical: Spacing.two },
  headline: { fontSize: 28, lineHeight: 34 },
  headSub: { maxWidth: 620 },
  sectionHeading: { gap: Spacing.half, marginTop: Spacing.two },
  card: { gap: Spacing.three },
  privacyCard: { gap: Spacing.three },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  featureIconBadge: { width: 38, height: 38, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  featureCopy: { flex: 1, gap: 2 },
  promiseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  check: { width: 24, height: 24, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  promiseCopy: { flex: 1, gap: Spacing.one },
  localOnlyNote: { borderRadius: Radius.medium, padding: Spacing.three },
  supportCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  coffeeMark: { width: 46, height: 46, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  coffeeMarkText: { fontSize: 25, lineHeight: 30 },
  supportTitle: { fontSize: 22, lineHeight: 28, textAlign: 'center' },
  supportCopy: { textAlign: 'center', maxWidth: 500 },
  donateButton: {
    minHeight: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
    borderWidth: 1.5,
  },
  donationNote: { textAlign: 'center', maxWidth: 430 },
  version: { textAlign: 'center', marginTop: Spacing.one },
  pressed: { opacity: 0.74 },
});
