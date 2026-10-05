import { ExternalLink } from '@/components/external-link';
import { SpendlyLogo } from '@/components/spendly-logo';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import Constants from 'expo-constants';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

const DONATION_URL = 'https://buymeacoffee.com/mr.nas';

/** expoConfig is null when no config is embedded, so keep a visible fallback. */
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.container}>
        <View style={styles.brandPanel}>
          <SpendlyLogo />
          <ThemedText type="subtitle" style={styles.headline}>Money, made clearer.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            CashTrack is an independent expense tracker built to make everyday spending easier to understand—without making money management feel complicated.
          </ThemedText>
        </View>

        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">Your data stays yours</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">A simple, honest promise about how CashTrack works.</ThemedText>
        </View>
        <Card style={styles.privacyCard}>
          <PromiseRow title="No account or data uploads" detail="Your expenses, budgets, and optional profile are saved on this device. CashTrack does not send them to a CashTrack server." />
          <PromiseRow title="No ads or tracking" detail="CashTrack includes no advertisements, analytics, or ad-tracking SDKs." />
          <PromiseRow title="You choose what to share" detail="Monthly PDFs are created on your device. They leave it only if you choose to save or share them." />
          <View style={[styles.localOnlyNote, { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="caption" themeColor="textSecondary">
              Because CashTrack is local-only, it does not sync or keep a cloud backup. Save a report you need before changing or removing your device.
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.supportCard}>
          <View style={[styles.coffeeMark, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="title" themeColor="textSecondary" style={styles.coffeeMarkText}>♥</ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.supportTitle}>Support independent development</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.supportCopy}>
            If CashTrack helps you feel more in control of your spending, you can leave a voluntary tip. Donations help support future improvements. They do not unlock features or change how the app works.
          </ThemedText>
          <ExternalLink href={DONATION_URL} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Support CashTrack on Buy Me a Coffee"
              style={({ pressed }) => [styles.donateButton, { borderColor: theme.accent }, pressed && styles.pressed]}>
              <ThemedText type="defaultBold" style={{ color: theme.accent }}>Buy me a coffee  ↗</ThemedText>
            </Pressable>
          </ExternalLink>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.donationNote}>
            Donations are processed by Buy Me a Coffee. CashTrack does not receive your payment details.
          </ThemedText>
        </Card>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.version}>CashTrack · Version {APP_VERSION}</ThemedText>
      </View>
    </ScrollView>
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
  container: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  brandPanel: { gap: Spacing.three, paddingVertical: Spacing.two },
  headline: { fontSize: 28, lineHeight: 34 },
  sectionHeading: { gap: Spacing.one, marginTop: Spacing.two },
  privacyCard: { gap: Spacing.three },
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
