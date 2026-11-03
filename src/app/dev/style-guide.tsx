import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Chip,
  Icon,
  IconButton,
  ListRow,
  Screen,
  ScreenHeader,
  Section,
  SkeletonList,
  StatStrip,
} from '@/components/ui';
import { HeroCard } from '@/components/ui/hero-card';
import { Icons, type IconConcept } from '@/constants/icons';
import { FeatureColors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TEXT_ROLES = [
  { label: 'Display 32', type: 'hero' },
  { label: 'Title 22', type: 'title' },
  { label: 'Heading 18', type: 'subtitle' },
  { label: 'Body 16', type: 'default' },
  { label: 'Label 14', type: 'smallBold' },
  { label: 'Caption 12', type: 'caption' },
  { label: 'Micro 11', type: 'micro' },
] as const;

/**
 * Development-only reference page: every shared component in one place, so a
 * change to the design system can be checked in light and dark at a glance.
 */
export default function StyleGuideScreen() {
  const theme = useTheme();
  const [chip, setChip] = useState('Food');

  if (!__DEV__) return <Redirect href="/" />;

  const noop = () => {};

  return (
    <>
      <Stack.Screen options={{ title: 'Style guide' }} />
      <Screen>
        <ScreenHeader
          title="Style guide"
          subtitle="Every shared building block, as used across the app."
          action={<IconButton icon="settings" label="Example icon button" onPress={noop} variant="tinted" />}
        />

        <Section title="Text roles" subtitle={`Seven sizes only. Base size ${Typography.body.fontSize}.`}>
          <Card style={styles.stack}>
            {TEXT_ROLES.map((role) => (
              <ThemedText key={role.label} type={role.type} numberOfLines={1}>
                {role.label}
              </ThemedText>
            ))}
          </Card>
        </Section>

        <Section title="Hero card" subtitle="One per page, at most.">
          <HeroCard
            eyebrow="Total spent"
            value="12,480"
            caption="14 expenses this month"
            footer={<Badge label="Down 12% vs Sep" tone="success" icon="trendDown" />}
          />
        </Section>

        <Section title="Stat strip" subtitle="The calm replacement for banners on list pages.">
          <StatStrip
            items={[
              { label: 'Spent', value: '12,480' },
              { label: 'Budget', value: '20,000' },
              { label: 'Left', value: '7,520', tone: 'success' },
            ]}
          />
        </Section>

        <Section title="Buttons">
          <View style={styles.stack}>
            <Button label="Primary" onPress={noop} />
            <Button label="Secondary" variant="secondary" onPress={noop} />
            <Button label="Ghost" variant="ghost" onPress={noop} />
            <Button label="Danger" variant="danger" onPress={noop} />
            <Button label="Loading" loading onPress={noop} />
            <Button label="Disabled" disabled onPress={noop} />
          </View>
        </Section>

        <Section title="Icon buttons and chips">
          <View style={styles.wrap}>
            <IconButton icon="edit" label="Edit" onPress={noop} />
            <IconButton icon="share" label="Share" onPress={noop} variant="tinted" />
            <IconButton icon="delete" label="Delete" onPress={noop} tone="danger" variant="tinted" />
            {['Food', 'Transport', 'Bills'].map((name) => (
              <Chip key={name} label={name} selected={chip === name} onPress={() => setChip(name)} />
            ))}
          </View>
        </Section>

        <Section title="Badges">
          <View style={styles.wrap}>
            <Badge label="Neutral" />
            <Badge label="Accent" tone="accent" />
            <Badge label="On track" tone="success" icon="success" />
            <Badge label="Near limit" tone="warning" icon="warning" />
            <Badge label="Over limit" tone="danger" icon="error" />
          </View>
        </Section>

        <Section title="List rows">
          <Card padded={false}>
            <ListRow title="Bills" subtitle="Upcoming payments" icon="calendar-clock" color={FeatureColors.red} badge="2 due" onPress={noop} />
            <ListRow title="Savings pots" subtitle="Targets and progress" icon="piggy-bank-outline" color={FeatureColors.leaf} onPress={noop} />
          </Card>
        </Section>

        <Section title="Empty and loading states">
          <Card>
            <EmptyState
              title="Nothing here yet"
              message="Empty states say what is missing and offer the next step."
              icon="receipt-text-outline"
              actionLabel="Add expense"
              onAction={noop}
            />
          </Card>
          <SkeletonList rows={2} label="Loading example" />
        </Section>

        <Section title="Icon registry" subtitle="One glyph per concept. Outline by default.">
          <Card style={styles.wrap}>
            {(Object.keys(Icons) as IconConcept[]).map((concept) => (
              <View key={concept} style={styles.iconCell} accessible accessibilityLabel={concept}>
                <Icon name={concept} size="lg" />
                <ThemedText type="micro" themeColor="textSecondary" numberOfLines={1}>
                  {concept}
                </ThemedText>
              </View>
            ))}
          </Card>
        </Section>

        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          This screen exists in development builds only.
        </ThemedText>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  iconCell: { width: 72, alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.one },
});
