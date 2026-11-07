import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import {
  AmountField,
  Badge,
  Button,
  Chip,
  FormField,
  SearchField,
  Icon,
  IconButton,
  ListRow,
  ProgressMeter,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Section,
  Sheet,
  SkeletonList,
  StatStrip,
  SwitchRow,
} from '@/components/ui';
import { HeroCard } from '@/components/ui/hero-card';
import { Icons, type IconConcept } from '@/constants/icons';
import {
  Brand,
  Elevation,
  FeatureColors,
  glow,
  Palette,
  PressFeedback,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';

const TEXT_ROLES = [
  { label: 'Display 32', type: 'hero' },
  { label: 'Title 22', type: 'title' },
  { label: 'Heading 18', type: 'subtitle' },
  { label: 'Body 16', type: 'default' },
  { label: 'Label 14', type: 'smallBold' },
  { label: 'Caption 12', type: 'caption' },
  { label: 'Micro 11', type: 'micro' },
] as const;

const DEPTH_LEVELS = [
  { key: 'none', label: 'Flat', use: 'Rows, items inside cards' },
  { key: 'low', label: 'Raised', use: 'Every resting card' },
  { key: 'medium', label: 'Lifted', use: 'Selected tiles, controls' },
  { key: 'high', label: 'Floating', use: 'Sheets, toasts, the tools button' },
] as const;

/**
 * Development-only reference page: every shared component in one place, so a
 * change to the design system can be checked in light and dark at a glance.
 */
export default function StyleGuideScreen() {
  const theme = useTheme();
  const isDark = useIsDark();
  const [chip, setChip] = useState('Food');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [repeat, setRepeat] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [alerts, setAlerts] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

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

        <Section
          title="Depth"
          subtitle={
            isDark
              ? 'Dark mode: surfaces separate by lightness and a hairline edge. Shadows vanish on black.'
              : 'Light mode: two-layer navy shadows on the off-white page. Tap a tile to feel the press.'
          }>
          <View style={styles.depthGrid}>
            {DEPTH_LEVELS.map((level) => (
              <Pressable
                key={level.key}
                accessibilityRole="button"
                accessibilityLabel={`${level.label} depth example`}
                style={({ pressed }) => [
                  styles.depthTile,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  !isDark && Elevation[level.key],
                  pressed && PressFeedback,
                ]}>
                <ThemedText type="smallBold">{level.label}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {level.use}
                </ThemedText>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Brand glow example"
              style={({ pressed }) => [
                styles.depthTile,
                styles.glowTile,
                pressed && PressFeedback,
              ]}>
              <ThemedText type="smallBold" style={styles.onBrand}>
                Glow
              </ThemedText>
              <ThemedText type="caption" style={styles.onBrandMuted}>
                One brand surface per page
              </ThemedText>
            </Pressable>
          </View>
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

        <Section title="Form fields" subtitle="Label above, helper or error below.">
          <View style={styles.stack}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search" label="Search example" />
            <FormField label="Note" value={name} onChangeText={setName} placeholder="What was it for?" helper="Optional" />
            <AmountField label="Amount" value={amount} onChangeText={setAmount} symbol="৳" error={amount === '0' ? 'Enter more than zero.' : undefined} />
            <SegmentedControl
              label="Repeat"
              value={repeat}
              onChange={setRepeat}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
            <Card padded={false}>
              <SwitchRow label="Budget alerts" description="Warn me at 80% and 100%" value={alerts} onValueChange={setAlerts} />
            </Card>
          </View>
        </Section>

        <Section title="Progress and sheet">
          <ProgressMeter fill={0.62} color={theme.success} marker={0.8} label="Example" valueText="62 percent">
            <ThemedText type="caption" themeColor="textSecondary">62% of the way there</ThemedText>
          </ProgressMeter>
          <Button label="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
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
      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Example sheet">
        <ThemedText type="small" themeColor="textSecondary">
          Sheets hold short tasks that do not need a full page.
        </ThemedText>
        <Button label="Done" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  iconCell: { width: 72, alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.one },
  // Extra padding so the floating shadow is not clipped by the section edge.
  depthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, paddingBottom: Spacing.two },
  depthTile: {
    flexBasis: '46%',
    flexGrow: 1,
    minHeight: 92,
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
  },
  glowTile: {
    backgroundColor: Brand.primary,
    borderColor: 'transparent',
    boxShadow: glow(Brand.primary),
  },
  onBrand: { color: Palette.white },
  onBrandMuted: { color: Palette.white, opacity: 0.9 },
});
