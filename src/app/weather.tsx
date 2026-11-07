import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AnimatedWeather } from '@/components/animated-weather';
import { Card, CardDivider } from '@/components/card';
import { WeatherWorldClocks } from '@/components/dashboard/WeatherWorldClocks';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Icon, ProgressMeter, Screen, Section, SkeletonList } from '@/components/ui';
import { WeatherBackground } from '@/components/weather-background';
import type { GlyphName } from '@/constants/icons';
import { BadgeSize, FeatureColors, IconSize, MinTouchTarget, OnPhotoColors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { fixLocationAccess, useWeather, type WeatherStatus } from '@/hooks/use-weather';
import { formatTemperature, getFinancialWeatherTip, type TemperatureUnit, type WeatherData } from '@/utils/weather';

/** "just now", "12 min ago", "3 h ago". */
function updatedAgo(fetchedAt: number, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - fetchedAt) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}

/** Wind in words, from the Beaufort scale (km/h). */
function windFeel(kmh: number): string {
  if (kmh < 2) return 'Calm';
  if (kmh < 12) return 'Light breeze';
  if (kmh < 29) return 'Moderate breeze';
  if (kmh < 50) return 'Strong wind';
  return 'Gale. Take care outside';
}

function rainFeel(percent: number): string {
  if (percent < 20) return 'Unlikely';
  if (percent < 50) return 'Possible';
  if (percent < 75) return 'Likely. Take an umbrella';
  return 'Very likely';
}

function humidityFeel(percent: number): string {
  if (percent < 30) return 'Dry';
  if (percent < 60) return 'Comfortable';
  if (percent < 80) return 'Humid';
  return 'Very humid';
}

export default function WeatherScreen() {
  const theme = useTheme();
  const { temperatureUnit } = usePreferences();
  const { data: weather, status, refreshing, refresh } = useWeather();
  const [pulled, setPulled] = useState(false);

  const onRefresh = async () => {
    setPulled(true);
    await refresh();
    setPulled(false);
  };

  return (
    <Screen
      topInset={false}
      refreshControl={<RefreshControl refreshing={pulled && refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}>
      {weather ? (
        <LiveWeather weather={weather} status={status} unit={temperatureUnit} />
      ) : status === 'loading' ? (
        <SkeletonList rows={4} label="Loading the weather" />
      ) : (
        <NoWeather status={status} busy={refreshing} onRetry={() => void refresh()} />
      )}

      <Section title="Home screen clocks" subtitle="The two clocks on the Home weather card. Tap one to change it.">
        <WeatherWorldClocks />
      </Section>
    </Screen>
  );
}

type NoWeatherCopy = {
  title: string;
  message: string;
  action?: string;
  /** `settings` sends the person to fix location; `retry` loads again (and may show the prompt). */
  kind?: 'retry' | 'settings';
  icon: 'map-marker-outline' | 'map-marker-off-outline' | 'crosshairs-question' | 'cloud-off-outline' | 'cloud-question-outline';
};

function noWeatherCopy(status: WeatherStatus): NoWeatherCopy {
  switch (status) {
    case 'no-permission':
      return {
        title: 'See your local weather',
        message: 'CashTrack uses your location only to fetch the forecast. Your location is not stored.',
        action: 'Use my location',
        kind: 'retry',
        icon: 'map-marker-outline',
      };
    case 'blocked':
      return {
        title: 'Location is not allowed',
        message: 'You turned off location for CashTrack. Allow it in Settings to see your local weather.',
        action: 'Open settings',
        kind: 'settings',
        icon: 'map-marker-off-outline',
      };
    case 'location-off':
      return {
        title: 'Location is switched off',
        message: 'Turn on Location on your phone so CashTrack can find your local weather.',
        action: 'Turn on location',
        kind: 'settings',
        icon: 'map-marker-off-outline',
      };
    case 'no-fix':
      return {
        title: 'Could not find your location',
        message: 'Your phone did not get a location in time. Try again, ideally near a window or outdoors.',
        action: 'Try again',
        kind: 'retry',
        icon: 'crosshairs-question',
      };
    case 'unsupported':
      return { title: 'Weather not available', message: 'Live weather needs location, which this device does not offer.', icon: 'cloud-question-outline' };
    default:
      return {
        title: 'Weather unavailable',
        message: 'We could not reach the forecast service. Check your internet connection.',
        action: 'Try again',
        kind: 'retry',
        icon: 'cloud-off-outline',
      };
  }
}

function NoWeather({ status, busy, onRetry }: { status: WeatherStatus; busy: boolean; onRetry: () => void }) {
  const copy = noWeatherCopy(status);
  const act = copy.kind === 'settings' ? () => void fixLocationAccess(status) : onRetry;

  return (
    <Card>
      <EmptyState
        title={busy ? 'Getting your weather…' : copy.title}
        message={busy ? 'Finding your location and the forecast. This can take a few seconds.' : copy.message}
        icon={copy.icon}
        actionLabel={busy ? undefined : copy.action}
        onAction={copy.action ? act : undefined}
      />
    </Card>
  );
}

function LiveWeather({ weather, status, unit }: { weather: WeatherData; status: WeatherStatus; unit: TemperatureUnit }) {
  const theme = useTheme();
  const now = useNow(60_000);
  const t = (c: number, withUnit = true) => formatTemperature(c, unit, withUnit);
  const stale = status !== 'live';
  const wind = unit === 'F' ? `${Math.round(weather.windSpeedKmH * 0.621371)} mph` : `${weather.windSpeedKmH} km/h`;
  const span = Math.max(1, weather.tempMaxC - weather.tempMinC);
  const nowInRange = (weather.tempC - weather.tempMinC) / span;

  const weekMin = Math.min(weather.tempMinC, ...weather.dailyForecast.map((d) => d.tempMinC));
  const weekMax = Math.max(weather.tempMaxC, ...weather.dailyForecast.map((d) => d.tempMaxC));
  const weekSpan = Math.max(1, weekMax - weekMin);

  return (
    <>
      {/* Hero: photo for the condition, with the reading on top. */}
      <View
        style={styles.hero}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${weather.locationName}: ${t(weather.tempC)}, ${weather.condition}. High ${t(weather.tempMaxC)}, low ${t(
          weather.tempMinC,
        )}. Updated ${updatedAgo(weather.fetchedAt, now)}.`}>
        <WeatherBackground conditionType={weather.conditionType} />
        <View style={styles.heroBody}>
          <View style={styles.heroTop}>
            <View style={styles.glassPill}>
              <Icon name="map-marker" size="sm" color={OnPhotoColors.text} />
              <ThemedText type="smallBold" numberOfLines={1} style={styles.onPhoto}>
                {weather.locationName}
              </ThemedText>
            </View>
            <View style={styles.glassPill}>
              <Icon name={stale ? 'cloud-off-outline' : 'update'} size="sm" color={OnPhotoColors.text} />
              <ThemedText type="caption" style={styles.onPhoto}>
                {stale ? `Offline · ${updatedAgo(weather.fetchedAt, now)}` : `Updated ${updatedAgo(weather.fetchedAt, now)}`}
              </ThemedText>
            </View>
          </View>

          <View style={styles.heroCenter}>
            <AnimatedWeather conditionType={weather.conditionType} size={IconSize.display} />
            <ThemedText type="hero" style={[styles.onPhoto, styles.heroTemp]}>
              {t(weather.tempC)}
            </ThemedText>
            <ThemedText type="default" style={styles.onPhotoMuted}>
              {weather.condition}
            </ThemedText>
            <View style={styles.glassPill}>
              <ThemedText type="smallBold" style={styles.onPhoto}>
                H {t(weather.tempMaxC, false)}
              </ThemedText>
              <ThemedText type="small" style={styles.onPhotoMuted}>
                ·
              </ThemedText>
              <ThemedText type="smallBold" style={styles.onPhoto}>
                L {t(weather.tempMinC, false)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Money tip that matches today's weather. */}
      <Card style={styles.tipCard}>
        <View style={[styles.tipIcon, { backgroundColor: withAlpha(FeatureColors.gold, 0.16) }]}>
          <Icon name="lightbulb-on-outline" size="md" color={FeatureColors.amber} />
        </View>
        <View style={styles.flex}>
          <ThemedText type="smallBold">Today&apos;s money tip</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {getFinancialWeatherTip(weather.tempC, weather.rainProbability, weather.conditionType, weather.isNight, unit)}
          </ThemedText>
        </View>
      </Card>

      {weather.hourlyForecast.length > 0 ? (
        <Section title="Next 24 hours">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourly}>
            {weather.hourlyForecast.map((hour, index) => {
              const isNow = index === 0;
              return (
                <View
                  key={hour.time}
                  accessible
                  accessibilityLabel={`${hour.hourLabel}, ${t(hour.tempC)}, ${hour.rainProbability}% chance of rain`}
                  style={[
                    styles.hourPill,
                    {
                      backgroundColor: isNow ? theme.accentMuted : theme.card,
                      borderColor: isNow ? theme.accent : theme.cardBorder,
                    },
                  ]}>
                  <ThemedText type="caption" style={{ color: isNow ? theme.accent : theme.textSecondary }}>
                    {hour.hourLabel}
                  </ThemedText>
                  <AnimatedWeather conditionType={hour.conditionType} size={IconSize.lg} />
                  <ThemedText type="micro" style={[styles.rainText, { color: theme.info, opacity: hour.rainProbability > 0 ? 1 : 0 }]}>
                    {hour.rainProbability}%
                  </ThemedText>
                  <ThemedText type="defaultBold" style={isNow ? { color: theme.accent } : undefined}>
                    {t(hour.tempC, false)}
                  </ThemedText>
                </View>
              );
            })}
          </ScrollView>
        </Section>
      ) : null}

      <Section title="Right now">
        <View style={styles.metrics}>
          <Metric
            icon="umbrella-outline"
            color={FeatureColors.cyan}
            label="Rain chance"
            value={`${weather.rainProbability}%`}
            fill={weather.rainProbability / 100}
            note={rainFeel(weather.rainProbability)}
          />
          <Metric
            icon="water-outline"
            color={FeatureColors.blue}
            label="Humidity"
            value={weather.humidity === null ? 'Not given' : `${weather.humidity}%`}
            fill={weather.humidity === null ? undefined : weather.humidity / 100}
            note={weather.humidity === null ? 'The forecast did not include it' : humidityFeel(weather.humidity)}
          />
          <Metric
            icon="weather-windy"
            color={FeatureColors.violet}
            label="Wind"
            value={wind}
            note={windFeel(weather.windSpeedKmH)}
          />
          <Metric
            icon="thermometer"
            color={FeatureColors.amber}
            label="Today's range"
            value={`${t(weather.tempMinC, false)} – ${t(weather.tempMaxC, false)}`}
            // Where the current temperature sits between today's low and high.
            fill={nowInRange}
            valueText={`Now ${t(weather.tempC)}, between ${t(weather.tempMinC)} and ${t(weather.tempMaxC)}`}
            note={`Now ${t(weather.tempC)}`}
          />
        </View>
      </Section>

      {weather.dailyForecast.length > 0 ? (
        <Section title="5-day forecast">
          <Card padded={false}>
            {weather.dailyForecast.map((day, index) => {
              const left = ((day.tempMinC - weekMin) / weekSpan) * 100;
              const width = Math.max(8, ((day.tempMaxC - day.tempMinC) / weekSpan) * 100);
              return (
                <View key={day.date}>
                  {index > 0 ? <CardDivider /> : null}
                  <View
                    style={styles.dayRow}
                    accessible
                    accessibilityLabel={`${day.dayName}: ${day.condition}, low ${t(day.tempMinC)}, high ${t(day.tempMaxC)}, ${
                      day.rainProbability
                    }% chance of rain`}>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.dayName}>
                      {day.dayName}
                    </ThemedText>
                    <AnimatedWeather conditionType={day.conditionType} size={IconSize.lg} />
                    <ThemedText type="caption" style={[styles.dayRain, { color: theme.info, opacity: day.rainProbability > 0 ? 1 : 0 }]}>
                      {day.rainProbability}%
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.dayTemp}>
                      {t(day.tempMinC, false)}
                    </ThemedText>
                    <View style={[styles.rangeTrack, { backgroundColor: theme.backgroundElement }]}>
                      <View style={[styles.rangeFill, { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }]} />
                    </View>
                    <ThemedText type="smallBold" style={styles.dayTemp}>
                      {t(day.tempMaxC, false)}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </Card>
        </Section>
      ) : null}

      <ThemedText type="caption" themeColor="textSecondary" style={styles.footnote}>
        Pull down to refresh. Forecast by Open-Meteo.
      </ThemedText>
    </>
  );
}

type MetricProps = {
  icon: GlyphName;
  color: string;
  label: string;
  value: string;
  /** 0 to 1. Leave out when there is no meaningful scale. */
  fill?: number;
  valueText?: string;
  /** Plain-words reading, such as "Light breeze". */
  note?: string;
};

function Metric({ icon, color, label, value, fill, valueText, note }: MetricProps) {
  return (
    <Card style={styles.metric}>
      <View style={styles.metricHead}>
        <View style={[styles.metricIcon, { backgroundColor: withAlpha(color, 0.14) }]}>
          <Icon name={icon} size="sm" color={color} />
        </View>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" numberOfLines={1}>
        {value}
      </ThemedText>
      {fill !== undefined ? <ProgressMeter fill={fill} color={color} label={label} valueText={valueText ?? value} /> : null}
      {note ? (
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
          {note}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { minHeight: 280, borderRadius: Radius.xlarge, overflow: 'hidden', backgroundColor: OnPhotoColors.fallback },
  heroBody: { flex: 1, padding: Spacing.four, justifyContent: 'space-between', gap: Spacing.three },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  heroCenter: { alignItems: 'center', gap: Spacing.one },
  heroTemp: { fontWeight: '800' },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexShrink: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: OnPhotoColors.shade,
  },
  onPhoto: { color: OnPhotoColors.text },
  onPhotoMuted: { color: OnPhotoColors.muted },
  tipCard: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  tipIcon: { width: BadgeSize.md, height: BadgeSize.md, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  hourly: { gap: Spacing.two, paddingVertical: Spacing.half },
  hourPill: {
    minWidth: 72,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rainText: { fontWeight: '700' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metric: { flexBasis: '47%', flexGrow: 1, gap: Spacing.two },
  metricHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  metricIcon: { width: BadgeSize.sm, height: BadgeSize.sm, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  // Columns size to their text (no fixed widths) so large text never clips.
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: MinTouchTarget + Spacing.two, paddingHorizontal: Spacing.three },
  dayName: { flex: 1, minWidth: 64 },
  dayRain: { minWidth: 36, textAlign: 'right', fontWeight: '700' },
  dayTemp: { minWidth: 34, textAlign: 'center' },
  rangeTrack: { flex: 1.2, height: Spacing.one + 2, borderRadius: Radius.pill, overflow: 'hidden' },
  rangeFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: Radius.pill, backgroundColor: FeatureColors.amber },
  footnote: { textAlign: 'center' },
});
