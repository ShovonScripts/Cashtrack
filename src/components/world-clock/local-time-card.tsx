import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui';
import { CITY_PHOTO_HEADERS } from '@/constants/city-photos';
import type { GlyphName } from '@/constants/icons';
import { Elevation, MinTouchTarget, OnPhotoColors, Radius, SkyColors, Spacing, Typography } from '@/constants/theme';
import { getFormattedTimeForZone } from '@/constants/world-timezones';
import { useLocalPlace } from '@/hooks/use-local-place';
import { useIsDark } from '@/hooks/use-theme';
import { dayPhase, greetingFor, utcOffsetLabel, type DayPhase } from '@/utils/local-place';
import { triggerHaptic } from '@/utils/motion';

const PHASE_ICON: Record<DayPhase, GlyphName> = {
  dawn: 'weather-sunset-up',
  day: 'white-balance-sunny',
  dusk: 'weather-sunset-down',
  night: 'weather-night',
};

/**
 * The device's own time at the top of World Clocks: big live clock, the area
 * the phone is in, and a photo of that place (or a sky for the time of day).
 */
export function LocalTimeCard({ now }: { now: Date }) {
  const isDark = useIsDark();
  const { place, zone, photoUri, status, canLocate, locate } = useLocalPlace();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showPhoto = photoUri !== null && photoUri !== failedUri;

  const time = getFormattedTimeForZone(undefined, now);
  const [hhmm, seconds] = [time.timeStr.slice(0, time.timeStr.lastIndexOf(':')), time.timeStr.slice(-2)];
  const hour = now.getHours();
  const phase = dayPhase(hour);
  const offset = utcOffsetLabel(now);
  const fullDate = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const sourceText =
    status === 'locating'
      ? 'Finding your area…'
      : status === 'denied'
        ? 'Location is off, so this uses your time zone'
        : place.source === 'gps'
          ? 'From your location'
          : 'From your time zone';

  const action =
    !canLocate || status === 'locating'
      ? null
      : status === 'denied'
        ? { label: 'Open settings', icon: 'cog-outline' as GlyphName, onPress: () => void Linking.openSettings() }
        : place.source === 'gps'
          ? { label: 'Refresh', icon: 'refresh' as GlyphName, onPress: locate }
          : { label: 'Find my area', icon: 'crosshairs-gps' as GlyphName, onPress: locate };

  return (
    <View style={[styles.card, !isDark && Elevation.medium]}>
      {showPhoto ? (
        <>
          <Image
            source={{ uri: photoUri, headers: CITY_PHOTO_HEADERS }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="disk"
            transition={400}
            accessible={false}
            onError={() => setFailedUri(photoUri)}
          />
          <LinearGradient colors={OnPhotoColors.scrim} style={StyleSheet.absoluteFill} pointerEvents="none" />
        </>
      ) : (
        <LinearGradient
          colors={SkyColors[phase]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <View
        style={styles.body}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Your time: ${hhmm} ${time.ampm}, ${fullDate}, ${offset}. ${place.area}${
          place.region ? `, ${place.region}` : ''
        }. ${sourceText}.`}>
        <View style={styles.topRow}>
          <View style={styles.pill}>
            <Icon name="map-marker" size="sm" color={OnPhotoColors.text} />
            <ThemedText type="micro" style={styles.eyebrow}>
              YOUR TIME
            </ThemedText>
          </View>
          <View style={styles.phaseBubble}>
            <Icon name={PHASE_ICON[phase]} size="md" color={OnPhotoColors.text} />
          </View>
        </View>

        <View style={styles.clock}>
          <ThemedText type="small" style={styles.muted}>
            {greetingFor(hour)}
          </ThemedText>
          <View style={styles.timeRow}>
            <ThemedText type="hero" style={styles.time}>
              {hhmm}
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.seconds, styles.muted]}>
              :{seconds}
            </ThemedText>
            <View style={styles.ampm}>
              <ThemedText type="smallBold" style={styles.text}>
                {time.ampm}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" style={styles.muted}>
            {time.dateStr} · {offset}
            {zone ? ` · ${zone.replace(/_/g, ' ')}` : ''}
          </ThemedText>
        </View>

        <View style={styles.placeRow}>
          <ThemedText style={styles.flag}>{place.flag}</ThemedText>
          <View style={styles.placeCopy}>
            <ThemedText type="subtitle" numberOfLines={1} style={styles.text}>
              {place.area}
            </ThemedText>
            {place.region ? (
              <ThemedText type="small" numberOfLines={1} style={styles.muted}>
                {place.region}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText type="caption" numberOfLines={2} style={[styles.muted, styles.footerText]}>
          {sourceText}
        </ThemedText>
        {status === 'locating' ? (
          <ActivityIndicator color={OnPhotoColors.text} accessibilityLabel="Finding your area" />
        ) : action ? (
          <Pressable
            onPress={() => {
              triggerHaptic();
              action.onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityHint={action.label === 'Find my area' ? 'Asks to use your location once to name your area' : undefined}
            style={({ pressed }) => [styles.pill, styles.action, pressed && styles.pressed]}>
            <Icon name={action.icon} size="sm" color={OnPhotoColors.text} />
            <ThemedText type="smallBold" style={styles.text}>
              {action.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
    backgroundColor: OnPhotoColors.fallback,
  },
  body: { padding: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.four },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: OnPhotoColors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OnPhotoColors.glassEdge,
  },
  eyebrow: { color: OnPhotoColors.text, letterSpacing: 1 },
  phaseBubble: {
    width: MinTouchTarget - Spacing.one,
    height: MinTouchTarget - Spacing.one,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OnPhotoColors.glass,
  },
  clock: { gap: Spacing.one },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.one },
  time: { color: OnPhotoColors.text, fontVariant: ['tabular-nums'], fontWeight: '800' },
  seconds: { fontVariant: ['tabular-nums'] },
  ampm: {
    marginStart: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    backgroundColor: OnPhotoColors.glass,
  },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flag: { ...Typography.hero },
  placeCopy: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    minHeight: MinTouchTarget + Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OnPhotoColors.glassEdge,
  },
  footerText: { flex: 1 },
  action: { minHeight: MinTouchTarget, paddingHorizontal: Spacing.three },
  pressed: { opacity: 0.7 },
  text: { color: OnPhotoColors.text },
  muted: { color: OnPhotoColors.muted },
});
