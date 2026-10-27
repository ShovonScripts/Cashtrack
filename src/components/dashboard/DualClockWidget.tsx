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

const CLOCK_1_KEY = '@cashtrack_banner_clock_1';
const CLOCK_2_KEY = '@cashtrack_banner_clock_2';

type ClockPreferences = { city1Id: string; city2Id: string };

let clockPreferences: ClockPreferences = { city1Id: 'local', city2Id: 'london' };
let clockPreferencesHydrated = false;
const clockPreferenceListeners = new Set<() => void>();

function emitClockPreferenceChange() {
  clockPreferenceListeners.forEach((listener) => listener());
}

async function hydrateClockPreferences() {
  if (clockPreferencesHydrated) return;
  clockPreferencesHydrated = true;
  try {
    const [savedCity1, savedCity2] = await Promise.all([
      AsyncStorage.getItem(CLOCK_1_KEY),
      AsyncStorage.getItem(CLOCK_2_KEY),
    ]);
    if (!savedCity1 && !savedCity2) return;
    clockPreferences = {
      city1Id: savedCity1 ?? clockPreferences.city1Id,
      city2Id: savedCity2 ?? clockPreferences.city2Id,
    };
    emitClockPreferenceChange();
  } catch {}
}

async function saveClockCity(slot: 1 | 2, cityId: string) {
  clockPreferences =
    slot === 1
      ? { ...clockPreferences, city1Id: cityId }
      : { ...clockPreferences, city2Id: cityId };
  emitClockPreferenceChange();
  try {
    await AsyncStorage.setItem(slot === 1 ? CLOCK_1_KEY : CLOCK_2_KEY, cityId);
  } catch {}
}

function useClockPreferences() {
  const [preferences, setPreferences] = useState(clockPreferences);

  useEffect(() => {
    const listener = () => setPreferences(clockPreferences);
    clockPreferenceListeners.add(listener);
    void hydrateClockPreferences();
    return () => {
      clockPreferenceListeners.delete(listener);
    };
  }, []);

  return preferences;
}

type DualClockWidgetProps = {
  variant?: 'default' | 'compact' | 'page';
  readOnly?: boolean;
};

export function DualClockWidget({ variant = 'default', readOnly = false }: DualClockWidgetProps) {
  const theme = useTheme();
  const compact = variant === 'compact';
  const page = variant === 'page';
  const isDark = theme.background !== '#ffffff';

  const { city1Id, city2Id } = useClockPreferences();
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const now = useNow(1000);

  const openPicker = (slot: 1 | 2) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSlot(slot);
    setPickerModalVisible(true);
  };

  const closePicker = () => {
    setPickerModalVisible(false);
  };

  const handleSelectCity = async (city: WorldCity) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await saveClockCity(activeSlot, city.id);
    closePicker();
  };

  const city1 = WORLD_CITIES.find((c) => c.id === city1Id) || WORLD_CITIES[0];
  const city2 = WORLD_CITIES.find((c) => c.id === city2Id) || WORLD_CITIES[2];

  const time1 = getFormattedTimeForZone(city1.id === 'local' ? undefined : city1.timeZone, now);
  const time2 = getFormattedTimeForZone(city2.id === 'local' ? undefined : city2.timeZone, now);

  const renderClockCard = (slot: 1 | 2, city: WorldCity, timeInfo: ReturnType<typeof getFormattedTimeForZone>, accentColor: string) => {
    const cardStyle = [
      styles.clockCard,
      compact && styles.clockCardCompact,
      page && { backgroundColor: theme.cardMuted, borderColor: theme.border },
    ];

    const content = (
      <>
        <View style={styles.clockTopRow}>
          <Text
            style={[
              styles.clockLabel,
              compact && styles.clockLabelCompact,
              page && styles.clockLabelPage,
              page && { color: theme.textSecondary },
            ]}
            numberOfLines={1}>
            {city.flag} {city.cityName.toUpperCase()}
          </Text>
          {!readOnly && (
            <Ionicons
              name={page ? 'pencil' : 'swap-horizontal'}
              size={compact ? 10 : 11}
              color={page ? theme.textSecondary : 'rgba(255,255,255,0.6)'}
            />
          )}
        </View>
        <View style={styles.timeRow}>
          <Text
            style={[
              styles.timeText,
              compact && styles.timeTextCompact,
              page && { color: theme.text },
            ]}
            numberOfLines={1}>
            {timeInfo.timeStr}
          </Text>
          <Text style={[styles.ampmText, { color: accentColor }]}>
            {timeInfo.ampm}
          </Text>
        </View>
        <Text
          style={[
            styles.dateText,
            compact && styles.dateTextCompact,
            page && { color: theme.textSecondary },
          ]}
          numberOfLines={1}>
          {timeInfo.dateStr}
        </Text>
      </>
    );

    if (readOnly) {
      return (
        <View key={slot} style={cardStyle}>
          {content}
        </View>
      );
    }

    return (
      <Pressable
        key={slot}
        onPress={() => openPicker(slot)}
        accessibilityRole="button"
        accessibilityLabel={`Change ${city.cityName} clock`}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}>
        {content}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={compact ? styles.clocksColumn : styles.clocksRow}>
        {renderClockCard(1, city1, time1, page ? (isDark ? '#4ade80' : '#16A34A') : '#4ade80')}
        {renderClockCard(2, city2, time2, page ? (isDark ? '#38bdf8' : '#0284C7') : '#38bdf8')}
      </View>

      {/* City Selector Modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}>
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropPressable}
            onPress={closePicker}
            accessibilityRole="button"
            accessibilityLabel="Close city picker"
          />
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Select Clock {activeSlot} Pin</ThemedText>
              <Pressable
                onPress={closePicker}
                accessibilityRole="button"
                accessibilityLabel="Close city picker"
                style={[styles.closeBtn, { backgroundColor: theme.cardMuted }]}>
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {WORLD_CITIES.map((city) => {
                const selected = (activeSlot === 1 ? city1Id : city2Id) === city.id;
                const cityTime = getFormattedTimeForZone(city.id === 'local' ? undefined : city.timeZone, now);
                return (
                  <Pressable
                    key={city.id}
                    onPress={() => handleSelectCity(city)}
                    accessibilityRole="button"
                    accessibilityLabel={`Set clock ${activeSlot} to ${city.cityName}, ${city.countryName}`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.cityRow,
                      {
                        backgroundColor: selected ? `${theme.accent}15` : theme.cardMuted,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}>
                    <View style={styles.cityLeft}>
                      <ThemedText style={styles.flagEmoji}>{city.flag}</ThemedText>
                      <View>
                        <ThemedText type="defaultBold">{city.cityName}</ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">{city.countryName}</ThemedText>
                      </View>
                    </View>
                    <ThemedText type="smallBold" style={{ color: selected ? theme.accent : theme.text }}>
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
  clocksRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clocksColumn: {
    flexDirection: 'column',
    gap: 6,
  },
  clockCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: Radius.medium,
    padding: 10,
    gap: 3,
  },
  clockCardCompact: {
    flex: 0,
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 1,
    borderRadius: Radius.small,
  },
  clockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clockLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 4,
  },
  clockLabelCompact: {
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  clockLabelPage: {
    fontSize: 10,
    letterSpacing: 0.25,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  timeTextCompact: {
    fontSize: 16,
    letterSpacing: 0,
  },
  ampmText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10.5,
    fontWeight: '500',
  },
  dateTextCompact: {
    fontSize: 9,
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
