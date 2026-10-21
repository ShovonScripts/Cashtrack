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

type DualClockWidgetProps = {
  variant?: 'default' | 'compact' | 'page';
  readOnly?: boolean;
};

export function DualClockWidget({ variant = 'default', readOnly = false }: DualClockWidgetProps) {
  const theme = useTheme();
  const compact = variant === 'compact';
  const page = variant === 'page';
  const isDark = theme.text === '#ffffff';

  const [city1Id, setCity1Id] = useState<string>('local');
  const [city2Id, setCity2Id] = useState<string>('london');
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const now = useNow(1000);

  useEffect(() => {
    async function loadSavedClocks() {
      try {
        const val1 = await AsyncStorage.getItem(CLOCK_1_KEY);
        const val2 = await AsyncStorage.getItem(CLOCK_2_KEY);
        if (val1) setCity1Id(val1);
        if (val2) setCity2Id(val2);
      } catch {}
    }
    void loadSavedClocks();
  }, []);

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
    if (activeSlot === 1) {
      setCity1Id(city.id);
      await AsyncStorage.setItem(CLOCK_1_KEY, city.id);
    } else {
      setCity2Id(city.id);
      await AsyncStorage.setItem(CLOCK_2_KEY, city.id);
    }
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
          <Pressable style={styles.backdropPressable} onPress={closePicker} />
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Select Clock {activeSlot} Pin</ThemedText>
              <Pressable
                onPress={closePicker}
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
    width: 32,
    height: 32,
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
