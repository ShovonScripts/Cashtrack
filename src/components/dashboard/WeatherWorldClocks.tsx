import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { WORLD_CITIES, WorldCity, getFormattedTimeForZone } from '@/constants/world-timezones';

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

export function WeatherWorldClocks() {
  const theme = useTheme();
  const isDark = theme.text === '#ffffff';

  const [cityIds, setCityIds] = useState<string[]>(cachedWeatherClocks);
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const now = useNow(1000);

  useEffect(() => {
    const listener = () => setCityIds(cachedWeatherClocks);
    weatherClockListeners.add(listener);
    void hydrateWeatherClocks();
    return () => {
      weatherClockListeners.delete(listener);
    };
  }, []);

  const openPicker = (index?: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingIndex(index ?? null);
    setPickerModalVisible(true);
  };

  const handleSelectCity = async (city: WorldCity) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (editingIndex !== null && editingIndex < cityIds.length) {
      const updated = [...cityIds];
      updated[editingIndex] = city.id;
      await saveWeatherClocks(updated);
    } else {
      if (!cityIds.includes(city.id) && cityIds.length < MAX_WEATHER_CLOCKS) {
        await saveWeatherClocks([...cityIds, city.id]);
      }
    }
    setPickerModalVisible(false);
  };

  const handleRemoveCity = async (cityId: string) => {
    if (cityIds.length <= 1) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = cityIds.filter((id) => id !== cityId);
    await saveWeatherClocks(updated);
  };

  const activeCities = cityIds
    .map((id) => WORLD_CITIES.find((c) => c.id === id))
    .filter((c): c is WorldCity => Boolean(c));

  return (
    <View style={styles.container}>
      <View style={styles.clocksGrid}>
        {activeCities.map((city, index) => {
          const timeInfo = getFormattedTimeForZone(city.id === 'local' ? undefined : city.timeZone, now);
          const accentColor = index % 2 === 0 ? (isDark ? '#4ade80' : '#16A34A') : (isDark ? '#38bdf8' : '#0284C7');

          return (
            <Pressable
              key={`${city.id}-${index}`}
              onPress={() => openPicker(index)}
              accessibilityRole="button"
              accessibilityLabel={`Clock for ${city.cityName}. Tap to change.`}
              style={({ pressed }) => [
                styles.clockCard,
                { backgroundColor: theme.cardMuted, borderColor: theme.border },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}>
              <View style={styles.clockTopRow}>
                <Text style={[styles.clockLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  {city.flag} {city.cityName.toUpperCase()}
                </Text>
                {cityIds.length > 1 && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      void handleRemoveCity(city.id);
                    }}
                    hitSlop={8}>
                    <Ionicons name="close-circle" size={14} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>
              <View style={styles.timeRow}>
                <Text style={[styles.timeText, { color: theme.text }]} numberOfLines={1}>
                  {timeInfo.timeStr}
                </Text>
                <Text style={[styles.ampmText, { color: accentColor }]}>
                  {timeInfo.ampm}
                </Text>
              </View>
              <Text style={[styles.dateText, { color: theme.textSecondary }]} numberOfLines={1}>
                {timeInfo.dateStr}
              </Text>
            </Pressable>
          );
        })}

        {cityIds.length < MAX_WEATHER_CLOCKS && (
          <Pressable
            onPress={() => openPicker()}
            accessibilityRole="button"
            accessibilityLabel="Add world clock"
            style={({ pressed }) => [
              styles.addClockCard,
              { backgroundColor: theme.cardMuted, borderColor: theme.border },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}>
            <Ionicons name="add" size={22} color={theme.accent} />
            <Text style={[styles.addClockText, { color: theme.accent }]}>
              Add Clock ({cityIds.length}/{MAX_WEATHER_CLOCKS})
            </Text>
          </Pressable>
        )}
      </View>

      {/* City Selector Modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}>
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropPressable}
            onPress={() => setPickerModalVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close city picker"
          />
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">
                {editingIndex !== null ? 'Change World Clock' : `Add World Clock (Max ${MAX_WEATHER_CLOCKS})`}
              </ThemedText>
              <Pressable
                onPress={() => setPickerModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close city picker"
                style={[styles.closeBtn, { backgroundColor: theme.cardMuted }]}>
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {WORLD_CITIES.map((city) => {
                const added = cityIds.includes(city.id);
                const cityTime = getFormattedTimeForZone(city.id === 'local' ? undefined : city.timeZone, now);
                return (
                  <Pressable
                    key={city.id}
                    onPress={() => handleSelectCity(city)}
                    disabled={added && editingIndex === null}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${city.cityName}, ${city.countryName}`}
                    style={[
                      styles.cityRow,
                      {
                        backgroundColor: added ? `${theme.accent}15` : theme.cardMuted,
                        borderColor: added ? theme.accent : theme.border,
                        opacity: added && editingIndex === null ? 0.6 : 1,
                      },
                    ]}>
                    <View style={styles.cityLeft}>
                      <ThemedText style={styles.flagEmoji}>{city.flag}</ThemedText>
                      <View>
                        <ThemedText type="defaultBold">{city.cityName}</ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">{city.countryName}</ThemedText>
                      </View>
                    </View>
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      {cityTime.timeStr} {cityTime.ampm}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  clocksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  clockCard: {
    flex: 1,
    minWidth: '47%',
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: 10,
    gap: 3,
  },
  addClockCard: {
    flex: 1,
    minWidth: '47%',
    minHeight: 80,
    borderWidth: 1,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
  },
  addClockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clockLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.25,
    flex: 1,
    marginRight: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  ampmText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalContainer: {
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    maxHeight: '75%',
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flagEmoji: {
    fontSize: 24,
  },
});
