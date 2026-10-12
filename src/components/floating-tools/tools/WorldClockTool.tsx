import { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Modal, ScrollView, TextInput, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { GlassView } from 'expo-glass-effect';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WORLD_CITIES, WorldCity, getFormattedTimeForZone } from '@/constants/world-timezones';

const CUSTOM_CLOCKS_KEY = '@cashtrack_user_world_clocks';
const DEFAULT_SELECTED_IDS = ['nyc', 'london', 'tokyo', 'sydney', 'dubai', 'paris'];

export function WorldClockTool() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [selectedCityIds, setSelectedCityIds] = useState<string[]>(DEFAULT_SELECTED_IDS);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_CLOCKS_KEY).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedCityIds(parsed);
          }
        } catch {}
      }
    });

    const interval = setInterval(() => {
      setTick((c) => c + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveSelectedIds = async (ids: string[]) => {
    setSelectedCityIds(ids);
    await AsyncStorage.setItem(CUSTOM_CLOCKS_KEY, JSON.stringify(ids));
  };

  const handleAddCity = async (city: WorldCity) => {
    if (selectedCityIds.includes(city.id)) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = [...selectedCityIds, city.id];
    await saveSelectedIds(updated);
  };

  const handleRemoveCity = async (cityId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const updated = selectedCityIds.filter((id) => id !== cityId);
    await saveSelectedIds(updated);
  };

  // Glass card styling helper for next-level glassmorphism
  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(35, 36, 48, 0.65)' : 'rgba(255, 255, 255, 0.8)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1.5,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 1)',
    shadowColor: isDark ? '#000' : '#8898aa',
  };

  const getOffsetHours = (timeZone: string) => {
    try {
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone }));
      return Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60));
    } catch {
      return 0;
    }
  };

  const getTimeDifferenceLabel = (timeZone: string) => {
    if (!timeZone) return '';
    try {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const localOffset = getOffsetHours(localTz);
      const targetOffset = getOffsetHours(timeZone);
      const diff = targetOffset - localOffset;

      if (diff === 0) return 'Same time';
      if (diff > 0) return `+${diff} hrs ahead`;
      return `${Math.abs(diff)} hrs behind`;
    } catch {
      return '';
    }
  };

  const activeCities = selectedCityIds
    .map((id) => WORLD_CITIES.find((c) => c.id === id))
    .filter((c): c is WorldCity => Boolean(c));

  const filteredModalCities = WORLD_CITIES.filter((c) => {
    if (c.id === 'local') return false;
    const query = searchQuery.toLowerCase();
    return (
      c.cityName.toLowerCase().includes(query) ||
      c.countryName.toLowerCase().includes(query)
    );
  });

  const localTime = getFormattedTimeForZone(undefined);

  return (
    <View style={styles.container}>
      {/* Master Hero Banner */}
      <View style={[styles.heroBanner, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.heroLeft}>
          <View style={[styles.heroIconBox, { backgroundColor: `${theme.accent}20` }]}>
            <MaterialCommunityIcons name="clock-digital" size={22} color={theme.accent} />
          </View>
          <View>
            <ThemedText type="caption" themeColor="textSecondary">LOCAL DEVICE TIME</ThemedText>
            <ThemedText type="defaultBold" style={[styles.heroTime, { color: theme.text }]}>
              {localTime.timeStr} <ThemedText type="smallBold" style={{ color: theme.accent }}>{localTime.ampm}</ThemedText>
            </ThemedText>
          </View>
        </View>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.heroDate}>
          {localTime.dateStr}
        </ThemedText>
      </View>

      {/* Action Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <ThemedText type="subtitle">Pinned Timezones ({activeCities.length})</ThemedText>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.accent },
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Add City</ThemedText>
        </Pressable>
      </View>

      {/* Clocks Grid */}
      {activeCities.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="earth-off" size={40} color={theme.textSecondary} />
          <ThemedText type="defaultBold" style={{ marginTop: 8 }}>No world clocks pinned</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Tap &apos;Add City&apos; above to pin world timezones to your board.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.citiesGrid}>
          {activeCities.map((city) => {
            const timeInfo = getFormattedTimeForZone(city.timeZone);
            const diffLabel = getTimeDifferenceLabel(city.timeZone);

            const cardContent = (
              <View style={styles.cityCardInner}>
                <View style={styles.cityCardTop}>
                  <View style={styles.cityNameRow}>
                    <ThemedText style={styles.flag}>{city.flag}</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultBold" numberOfLines={1}>{city.cityName}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                        {city.countryName} {diffLabel ? `• ${diffLabel}` : ''}
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveCity(city.id)}
                    hitSlop={12}
                    style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}>
                    <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.timeSection}>
                  <ThemedText type="title" style={[styles.timeText, { color: theme.text }]}>
                    {timeInfo.timeStr}
                  </ThemedText>
                  <View style={[styles.ampmBadge, { backgroundColor: `${theme.accent}15` }]}>
                    <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 11 }}>
                      {timeInfo.ampm}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    📅 {timeInfo.dateStr}
                  </ThemedText>
                </View>
              </View>
            );

            return (
              <View key={city.id} style={[styles.cityCard, glassCardStyle]}>
                {Platform.OS === 'ios' ? (
                  <GlassView glassEffectStyle="regular" style={styles.iosGlassWrap}>
                    {cardContent}
                  </GlassView>
                ) : (
                  cardContent
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Add City Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropPressable} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add World Clock</ThemedText>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.cardMuted }]}
                accessibilityRole="button"
                accessibilityLabel="Close modal">
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={[styles.searchBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search city or country..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search city or country"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {filteredModalCities.map((city) => {
                const added = selectedCityIds.includes(city.id);
                const cityTime = getFormattedTimeForZone(city.timeZone);

                return (
                  <Pressable
                    key={city.id}
                    onPress={() => handleAddCity(city)}
                    disabled={added}
                    style={[
                      styles.modalCityRow,
                      {
                        backgroundColor: added ? `${theme.accent}12` : theme.cardMuted,
                        borderColor: added ? theme.accent : theme.border,
                        opacity: added ? 0.65 : 1,
                      },
                    ]}>
                    <View style={styles.cityLeft}>
                      <ThemedText style={styles.flag}>{city.flag}</ThemedText>
                      <View>
                        <ThemedText type="defaultBold">{city.cityName}</ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">{city.countryName}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.modalRowRight}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <ThemedText type="smallBold" style={{ color: added ? theme.accent : theme.text }}>
                          {cityTime.timeStr}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {cityTime.dateStr}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.addIndicator,
                          { backgroundColor: added ? theme.accent : theme.card, borderColor: theme.border },
                        ]}>
                        <Ionicons name={added ? 'checkmark' : 'add'} size={14} color={added ? '#FFFFFF' : theme.text} />
                      </View>
                    </View>
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
    gap: Spacing.three,
  },
  heroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTime: {
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  heroDate: {
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  citiesGrid: {
    gap: Spacing.two,
  },
  cityCard: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  iosGlassWrap: {
    padding: Spacing.three,
  },
  cityCardInner: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cityCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  flag: {
    fontSize: 26,
  },
  deleteBtn: {
    padding: 4,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  timeText: {
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  ampmBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  emptyContainer: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    maxHeight: '80%',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  modalScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  modalCityRow: {
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
  modalRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  addIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
