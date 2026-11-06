import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Icon, Screen, Section } from '@/components/ui';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_SECTIONS,
  PRIVACY_SUMMARY,
  PRIVACY_UPDATED,
  formatPolicyDate,
  type PolicyBlock,
} from '@/constants/privacy-policy';
import { MinTouchTarget, PressFeedback, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PrivacyPolicyScreen() {
  const theme = useTheme();

  return (
    <Screen topInset={false}>
      <View style={styles.intro}>
        <ThemedText type="title">Privacy policy</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          Last updated {formatPolicyDate(PRIVACY_UPDATED)}
        </ThemedText>
      </View>

      <Card style={[styles.stack, { backgroundColor: theme.accentMuted }]} elevated={false}>
        <ThemedText type="smallBold">The short version</ThemedText>
        {PRIVACY_SUMMARY.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Icon name="check-circle-outline" size="sm" color={theme.accent} />
            <ThemedText type="small" style={styles.flex}>
              {item}
            </ThemedText>
          </View>
        ))}
      </Card>

      {PRIVACY_SECTIONS.map((section) => (
        <Section key={section.id} title={section.title}>
          <Card style={styles.stack}>
            {section.blocks.map((block, index) => (
              <PolicyBlockView key={index} block={block} />
            ))}
          </Card>
        </Section>
      ))}

      <Pressable
        onPress={() => void Linking.openURL(`mailto:${PRIVACY_CONTACT_EMAIL}?subject=CashTrack%20privacy`)}
        accessibilityRole="link"
        accessibilityLabel={`Email ${PRIVACY_CONTACT_EMAIL} about privacy`}
        style={({ pressed }) => [styles.contact, { borderColor: theme.border }, pressed && PressFeedback]}>
        <Icon name="email-outline" size="md" color={theme.accent} />
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          Email a privacy question
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

function PolicyBlockView({ block }: { block: PolicyBlock }) {
  const theme = useTheme();

  if (block.type === 'paragraph') {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        {block.text}
      </ThemedText>
    );
  }

  if (block.type === 'bullets') {
    return (
      <View style={styles.list}>
        {block.items.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <ThemedText type="small" themeColor="textSecondary" importantForAccessibility="no">
              •
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
              {item}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  }

  // A three-column table is too wide for a phone, so each row becomes a small stacked card.
  const [, serviceLabel, sentLabel] = block.headers;
  return (
    <View style={styles.list}>
      {block.rows.map(([feature, service, sent]) => (
        <View key={feature} style={[styles.tableRow, { backgroundColor: theme.cardMuted }]}>
          <ThemedText type="smallBold">{feature}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {serviceLabel}: {service}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {sentLabel}: {sent}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing.one, paddingVertical: Spacing.two },
  stack: { gap: Spacing.three },
  list: { gap: Spacing.two },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  flex: { flex: 1 },
  tableRow: { borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.half },
  contact: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    marginBottom: Spacing.four,
  },
});
