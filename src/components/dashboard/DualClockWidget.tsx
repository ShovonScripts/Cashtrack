import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { GlassView } from 'expo-glass-effect';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WORLD_CITIES, WorldCity, getFormattedTimeForZone } from '@/constants/world-timezones';

const STORAGE_KEY = '@cashtrack_second_clock_city';

export function DualClockWidget() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [secondCityId, setSecondCityId] = useState<string>('london');
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setSecondCityId(val);
    });

    const interval = setInterval(() => {
      setTick((c) => c + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectCity = async (city: WorldCity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecondCityId(city.id);
    setPickerVisible(false);
    await AsyncStorage.setItem(STORAGE_KEY, city.id);
  };

  const secondCity = WORLD_CITIES.find((c) => c.id === secondCityId) || WORLD_CITIES[2]; // Default London

  const localTime = getFormattedTimeForZone(undefined);
  const secondTime = getFormattedTimeForZone(secondCity.timeZone);

  // Ultra-refined glassmorphism styling for pristine frosted glass effect
  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(30, 30, 42, 0.55)' : 'rgba(255, 255, 255, 0.65)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1.5,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.95)',
    shadowColor: isDark ? '#000' : '#8898aa',
  };

  const renderCardContent = (label: string, dateStr: string, timeStr: string, ampm: string, accentColor: string, rightIcon?: React.ReactNode, isLocal?: boolean) => (
    <>
      <View style={styles.clockTopRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {isLocal && <MaterialCommunityIcons name="map-marker" size={12} color={theme.textSecondary} />}
          <ThemedText type="caption" themeColor="textSecondary" style={styles.clockLabel}>
            {label}
          </ThemedText>
        </View>
        {rightIcon || <ThemedText type="caption" themeColor="textSecondary">{dateStr}</ThemedText>}
      </View>
      <View style={styles.timeRow}>
        <ThemedText type="defaultBold" style={[styles.timeText, { color: theme.text }]}>
          {timeStr}
        </ThemedText>
        <ThemedText type="smallBold" style={[styles.ampmText, { color: accentColor }]}>
          {ampm}
        </ThemedText>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/world-clock');
        }}
        style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.accent} />
          <ThemedText type="smallBold" style={{ letterSpacing: 0.6 }}>WORLD CLOCKS</ThemedText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ThemedText type="caption" themeColor="textSecondary">
            {localTime.dateStr}
          </ThemedText>
          <Ionicons name="chevron-forward" size={12} color={theme.textSecondary} />
        </View>
      </Pressable>

      <View style={styles.clocksRow}>
        {/* Clock 1: Local */}
        {Platform.OS === 'ios' ? (
          <GlassView glassEffectStyle="regular" style={[styles.clockCard, glassCardStyle]}>
            {renderCardContent('LOCAL', localTime.dateStr, localTime.timeStr, localTime.ampm, theme.accent, undefined, true)}
          </GlassView>
        ) : (
          <View style={[styles.clockCard, glassCardStyle]}>
            {renderCardContent('LOCAL', localTime.dateStr, localTime.timeStr, localTime.ampm, theme.accent, undefined, true)}
          </View>
        )}

        {/* Clock 2: Configurable World Clock */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerVisible(true);
          }}
          style={({ pressed }) => [
            styles.clockCard,
            glassCardStyle,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}>
          {Platform.OS === 'ios' ? (
            <GlassView glassEffectStyle="regular" style={styles.innerGlassWrapper}>
              {renderCardContent(
                `${secondCity.flag} ${secondCity.cityName.toUpperCase()}`,
                secondTime.dateStr,
                secondTime.timeStr,
                secondTime.ampm,
                theme.success,
                <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
              )}
            </GlassView>
          ) : (
            renderCardContent(
              `${secondCity.flag} ${secondCity.cityName.toUpperCase()}`,
              secondTime.dateStr,
              secondTime.timeStr,
              secondTime.ampm,
              theme.success,
              <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
            )
          )}
        </Pressable>
      </View>

      {/* Timezone Selector Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropPressable} onPress={() => setPickerVisible(false)} />
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Select 2nd Country Clock</ThemedText>
              <Pressable onPress={() => setPickerVisible(false)} style={[styles.closeBtn, { backgroundColor: theme.cardMuted }]}>
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {WORLD_CITIES.filter((c) => c.id !== 'local').map((city) => {
                const selected = city.id === secondCityId;
                const cityTime = getFormattedTimeForZone(city.timeZone);
                return (
                  <Pressable
                    key={city.id}
                    onPress={() => handleSelectCity(city)}
                    style={[
                      styles.cityRow,
                      { backgroundColor: selected ? `${theme.accent}15` : theme.cardMuted, borderColor: selected ? theme.accent : theme.border },
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
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clocksRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  clockCard: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.two,
    gap: Spacing.half,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  innerGlassWrapper: {
    flex: 1,
    margin: -Spacing.two,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  clockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clockLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ampmText: {
    fontSize: 10,
    fontWeight: '800',
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
