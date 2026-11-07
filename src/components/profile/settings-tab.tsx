import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ListRow, Section, SegmentedControl } from '@/components/ui';
import { FeatureColors, Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { triggerHaptic } from '@/utils/motion';

/** Appearance, security and regional formats. These apply straight away; no Save needed. */
export function SettingsTab() {
  const {
    country,
    themeMode,
    setThemeMode,
    temperatureUnit,
    setTemperatureUnit,
    firstDayOfWeek,
    setFirstDayOfWeek,
    appLockEnabled,
  } = usePreferences();

  const pick = <T,>(apply: (value: T) => void) => (value: T) => {
    triggerHaptic();
    apply(value);
  };

  return (
    <>
      <Section title="Appearance">
        <Card style={styles.card}>
          <Choice label="Theme" hint="Auto follows your phone's light or dark setting.">
            <SegmentedControl
              label="Theme"
              value={themeMode}
              onChange={pick(setThemeMode)}
              options={[
                { value: 'system', label: 'Auto' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </Choice>
        </Card>
      </Section>

      <Section title="Security">
        <Card padded={false}>
          <ListRow
            title="App Lock"
            subtitle={appLockEnabled ? 'On: unlock with your phone’s security' : 'Off: protect CashTrack with your phone lock'}
            icon="cellphone-lock"
            color={FeatureColors.teal}
            onPress={() => {
              triggerHaptic();
              router.push('/app-lock');
            }}
          />
        </Card>
      </Section>

      <Section title="Region and formats">
        <Card padded={false}>
          <ListRow
            title="Country & Currency"
            subtitle={`${country.name} · ${country.currencyCode} ${country.symbol.trim()}`}
            icon="map-marker-outline"
            color={FeatureColors.green}
            onPress={() => {
              triggerHaptic();
              router.push('/country');
            }}
          />
          <CardDivider />
          <View style={styles.inset}>
            <Choice label="Temperature" hint="Used by the weather card and the Weather page.">
              <SegmentedControl
                label="Temperature unit"
                value={temperatureUnit}
                onChange={pick(setTemperatureUnit)}
                options={[
                  { value: 'C', label: '°C' },
                  { value: 'F', label: '°F' },
                ]}
              />
            </Choice>
            <Choice label="Week starts on" hint="Used by weekly totals and the year progress card.">
              <SegmentedControl
                label="First day of the week"
                value={firstDayOfWeek}
                onChange={pick(setFirstDayOfWeek)}
                options={[
                  { value: 'monday', label: 'Monday' },
                  { value: 'sunday', label: 'Sunday' },
                ]}
              />
            </Choice>
          </View>
        </Card>
      </Section>
    </>
  );
}

function Choice({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <View style={styles.choice}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      <ThemedText type="caption" themeColor="textSecondary">
        {hint}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  inset: { padding: Spacing.three, gap: Spacing.three },
  choice: { gap: Spacing.one },
});
