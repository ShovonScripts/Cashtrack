import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Icon, IconButton, ListRow, SearchField, Sheet } from '@/components/ui';
import { MinTouchTarget, PressFeedback, Spacing, Typography } from '@/constants/theme';
import { WORLD_CITIES, type WorldCity, getFormattedTimeForZone } from '@/constants/world-timezones';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

const WEATHER_CLOCKS_KEY = '@cashtrack_weather_world_clocks';
const DEFAULT_WEATHER_CLOCKS = ['local', 'london'];
const MAX_WEATHER_CLOCKS = 4;

let cachedWeatherClocks: string[] = DEFAULT_WEATHER_CLOCKS;
let weatherClocksHydrated = false;
const weatherClockListeners = new Set<() => void>();

function emitWeatherClockChange() {
  weatherClockListeners.forEach((listener) => listener());
}

async function hydrateWeatherClocks() {
  if (weatherClocksHydrated) return;
  weatherClocksHydrated = true;
  try {
    const val = await AsyncStorage.getItem(WEATHER_CLOCKS_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedWeatherClocks = parsed.slice(0, MAX_WEATHER_CLOCKS);
        emitWeatherClockChange();
      }
    }
  } catch {}
}

async function saveWeatherClocks(ids: string[]) {
  const limited = ids.slice(0, MAX_WEATHER_CLOCKS);
  cachedWeatherClocks = limited;
  emitWeatherClockChange();
  try {
    await AsyncStorage.setItem(WEATHER_CLOCKS_KEY, JSON.stringify(limited));
  } catch {}
}

/** "3:41:07" -> "3:41". */
const hoursMinutes = (timeStr: string) => timeStr.slice(0, timeStr.lastIndexOf(':'));
const zoneOf = (city: WorldCity) => (city.id === 'local' ? undefined : city.timeZone);

/** The clocks pinned to the Home weather card: tap a row to change it, add up to four. */
export function WeatherWorldClocks() {
  const theme = useTheme();
  const [cityIds, setCityIds] = useState<string[]>(cachedWeatherClocks);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const now = useNow(60_000);

  useEffect(() => {
    const listener = () => setCityIds(cachedWeatherClocks);
    weatherClockListeners.add(listener);
    void hydrateWeatherClocks();
    return () => {
      weatherClockListeners.delete(listener);
    };
  }, []);

  const openPicker = (index: number | null) => {
    triggerHaptic();
    setEditingIndex(index);
    setSearch('');
    setPickerOpen(true);
  };

  const selectCity = async (city: WorldCity) => {
    triggerHaptic();
    if (editingIndex !== null && editingIndex < cityIds.length) {
      const updated = [...cityIds];
      updated[editingIndex] = city.id;
      await saveWeatherClocks(updated);
    } else if (!cityIds.includes(city.id) && cityIds.length < MAX_WEATHER_CLOCKS) {
      await saveWeatherClocks([...cityIds, city.id]);
    }
    setPickerOpen(false);
  };

  const removeCity = async (cityId: string) => {
    if (cityIds.length <= 1) return;
    triggerHaptic();
    await saveWeatherClocks(cityIds.filter((id) => id !== cityId));
  };

  const activeCities = cityIds
    .map((id) => WORLD_CITIES.find((c) => c.id === id))
    .filter((c): c is WorldCity => Boolean(c));

  const query = search.trim().toLowerCase();
  const choices = WORLD_CITIES.filter(
    (c) => !query || c.cityName.toLowerCase().includes(query) || c.countryName.toLowerCase().includes(query),
  );

  return (
    <>
      <Card padded={false}>
        {activeCities.map((city, index) => {
          const time = getFormattedTimeForZone(zoneOf(city), now);
          return (
            <View key={`${city.id}-${index}`}>
              {index > 0 ? <CardDivider /> : null}
              <View style={styles.row}>
                <Pressable
                  onPress={() => openPicker(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`${city.cityName}, ${hoursMinutes(time.timeStr)} ${time.ampm}, ${time.dateStr}`}
                  accessibilityHint="Choose a different city for this clock"
                  style={({ pressed }) => [styles.rowMain, pressed && PressFeedback]}>
                  <ThemedText style={styles.flag}>{city.flag}</ThemedText>
                  <View style={styles.copy}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {city.cityName}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                      {time.dateStr}
                    </ThemedText>
                  </View>
                  <View style={styles.time}>
                    <ThemedText type="subtitle" style={styles.digits}>
                      {hoursMinutes(time.timeStr)}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.accent }}>
                      {time.ampm}
                    </ThemedText>
                  </View>
                </Pressable>
                {cityIds.length > 1 ? (
                  <IconButton icon="close" label={`Remove ${city.cityName} clock`} onPress={() => void removeCity(city.id)} />
                ) : null}
              </View>
            </View>
          );
        })}

        {cityIds.length < MAX_WEATHER_CLOCKS ? (
          <>
            <CardDivider />
            <ListRow
              title="Add a clock"
              subtitle={`${cityIds.length} of ${MAX_WEATHER_CLOCKS} used`}
              icon="add"
              color={theme.accent}
              onPress={() => openPicker(null)}
            />
          </>
        ) : null}
      </Card>

      <Sheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={editingIndex !== null ? 'Change clock' : 'Add a clock'}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search city or country" label="Search city or country" />
        {choices.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.noMatch}>
            No city matches “{search.trim()}”.
          </ThemedText>
        ) : (
          <Card padded={false} elevated={false}>
            {choices.map((city, index) => {
              const pinned = cityIds.includes(city.id);
              const disabled = pinned && editingIndex === null;
              const time = getFormattedTimeForZone(zoneOf(city), now);
              return (
                <View key={city.id}>
                  {index > 0 ? <CardDivider /> : null}
                  <Pressable
                    onPress={() => void selectCity(city)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={`${city.cityName}, ${city.countryName}, ${hoursMinutes(time.timeStr)} ${time.ampm}`}
                    accessibilityState={{ disabled, selected: pinned }}
                    style={({ pressed }) => [styles.choice, disabled && styles.disabled, pressed && PressFeedback]}>
                    <ThemedText style={styles.flag}>{city.flag}</ThemedText>
                    <View style={styles.copy}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {city.cityName}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                        {city.countryName}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.digits}>
                      {hoursMinutes(time.timeStr)} {time.ampm}
                    </ThemedText>
                    {pinned ? <Icon name="check" size="md" color={theme.accent} /> : null}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingEnd: Spacing.one },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouchTarget + Spacing.three,
    paddingStart: Spacing.three,
    paddingEnd: Spacing.two,
    paddingVertical: Spacing.two,
  },
  flag: { ...Typography.title },
  copy: { flex: 1, gap: Spacing.half },
  time: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.one },
  digits: { fontVariant: ['tabular-nums'] },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouchTarget + Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  disabled: { opacity: 0.5 },
  noMatch: { textAlign: 'center', paddingVertical: Spacing.four },
});
