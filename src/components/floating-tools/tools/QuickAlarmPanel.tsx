import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, SwitchRow } from '@/components/ui';
import { MinTouchTarget, Palette, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useStopwatch, type StartAlarmResult } from '@/context/stopwatch-context';
import { useTheme } from '@/hooks/use-theme';
import {
  MAX_ACTIVE_ALARMS,
  QUICK_ALARM_MINUTES,
  SNOOZE_MS,
  formatCountdown,
  formatDurationLabel,
  parseDuration,
  type QuickAlarm,
} from '@/utils/stopwatch';

function explain(result: StartAlarmResult) {
  if (result === 'limit') {
    Alert.alert('Too many timers', `You can run up to ${MAX_ACTIVE_ALARMS} timers at once. Cancel one to add another.`);
  } else if (result === 'unavailable') {
    Alert.alert(
      'Alarm not set',
      'Allow notifications (and Alarms & reminders on Android) for CashTrack so the alarm can ring. Alarms are not available on web or Expo Go.',
    );
  }
}

/** One running countdown. Owns its own clock so the rest of the page does not re-render. */
function CountdownRow({ alarm, onCancel }: { alarm: QuickAlarm; onCancel: () => void }) {
  const theme = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, alarm.endAt - now);
  const progress = Math.min(1, Math.max(0, 1 - remaining / alarm.durationMs));

  return (
    <View
      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.accent }]}
      accessible
      accessibilityLabel={`${alarm.label} timer, ${formatCountdown(remaining)} remaining`}>
      <View style={styles.rowTop}>
        <View style={styles.rowCopy}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {alarm.label}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {formatDurationLabel(alarm.durationMs)} timer
          </ThemedText>
        </View>
        <ThemedText type="defaultBold" style={[styles.countdown, { color: theme.accent }]}>
          {formatCountdown(remaining)}
        </ThemedText>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={`Cancel ${alarm.label} timer`}
          hitSlop={4}
          style={styles.iconButton}>
          <MaterialCommunityIcons name="close-circle-outline" size={24} color={theme.textSecondary} />
        </Pressable>
      </View>
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View style={[styles.fill, { backgroundColor: theme.accent, width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

function FinishedRow({
  alarm,
  ringing,
  onDismiss,
  onSnooze,
}: {
  alarm: QuickAlarm;
  ringing: boolean;
  onDismiss: () => void;
  onSnooze: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.row, { backgroundColor: withAlpha(theme.danger, 0.1), borderColor: theme.danger }]}
      accessibilityLiveRegion="polite">
      <View style={styles.rowTop}>
        <MaterialCommunityIcons name={ringing ? 'bell-ring' : 'bell-outline'} size={ringing ? 28 : 22} color={theme.danger} />
        <View style={styles.rowCopy}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {alarm.label}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {ringing ? 'Ringing…' : 'Time’s up'} · {formatDurationLabel(alarm.durationMs)} timer
          </ThemedText>
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable
          onPress={onSnooze}
          accessibilityRole="button"
          accessibilityLabel={`Snooze ${alarm.label} for ${formatDurationLabel(SNOOZE_MS)}`}
          style={({ pressed }) => [styles.smallButton, { backgroundColor: theme.cardMuted, borderColor: theme.border }, pressed && styles.pressed]}>
          <ThemedText type="smallBold">Snooze {formatDurationLabel(SNOOZE_MS)}</ThemedText>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={`${ringing ? 'Stop' : 'Dismiss'} ${alarm.label}`}
          style={({ pressed }) => [styles.smallButton, { backgroundColor: theme.dangerFill, borderColor: theme.dangerFill }, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: Palette.white }}>
            {ringing ? 'Stop' : 'Dismiss'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function DigitField({
  label,
  value,
  onChange,
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.digitWrap}>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
        placeholder="00"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={label}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        style={[styles.digitInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
      />
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

export function QuickAlarmPanel() {
  const theme = useTheme();
  const {
    alarms,
    finishedAlarms,
    ringingIds,
    savedTimers,
    syncStopwatch,
    setSyncStopwatch,
    startQuickAlarm,
    cancelQuickAlarm,
    dismissFinishedAlarm,
    snoozeFinishedAlarm,
    saveTimer,
    removeSavedTimer,
  } = useStopwatch();

  const [customOpen, setCustomOpen] = useState(false);
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [busy, setBusy] = useState(false);

  const customMs = parseDuration(hours, minutes, seconds);
  const hasInput = hours !== '' || minutes !== '' || seconds !== '';
  const customError = hasInput && customMs === null ? 'Enter a time between 1 second and 23:59:59.' : undefined;

  const start = async (durationMs: number, label?: string) => {
    if (busy) return false;
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const result = await startQuickAlarm(durationMs, label);
      explain(result);
      return result === 'ok';
    } finally {
      setBusy(false);
    }
  };

  const startCustom = async () => {
    if (customMs === null) return;
    if (await start(customMs, name)) {
      setCustomOpen(false);
      setName('');
      setHours('');
      setMinutes('');
      setSeconds('');
    }
  };

  const saveCustom = () => {
    if (customMs === null) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    saveTimer(name, customMs);
  };

  const activeDurations = new Set(alarms.map((alarm) => alarm.durationMs));

  return (
    <View style={[styles.section, { backgroundColor: theme.cardMuted, borderColor: alarms.length ? theme.accent : theme.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="alarm" size={14} color={alarms.length ? theme.accent : theme.textSecondary} />
          <ThemedText type="smallBold" style={styles.title}>
            TIMER &amp; ALARM{alarms.length ? ` (${alarms.length})` : ''}
          </ThemedText>
        </View>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.smallText}>
          Rings your phone
        </ThemedText>
      </View>

      {finishedAlarms.map((alarm) => (
        <FinishedRow
          key={alarm.id}
          alarm={alarm}
          ringing={ringingIds.includes(alarm.id)}
          onDismiss={() => dismissFinishedAlarm(alarm.id)}
          onSnooze={async () => explain(await snoozeFinishedAlarm(alarm.id))}
        />
      ))}

      {alarms.map((alarm) => (
        <CountdownRow
          key={alarm.id}
          alarm={alarm}
          onCancel={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            cancelQuickAlarm(alarm.id);
          }}
        />
      ))}

      <View style={styles.chipRow}>
        {QUICK_ALARM_MINUTES.map((m) => {
          const active = activeDurations.has(m * 60_000);
          return (
            <Pressable
              key={m}
              onPress={() => void start(m * 60_000)}
              accessibilityRole="button"
              accessibilityLabel={`Start ${m} minute timer`}
              accessibilityState={{ selected: active, busy }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? withAlpha(theme.accent, 0.15) : theme.card,
                  borderColor: active ? theme.accent : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="defaultBold" style={{ fontSize: 16 }}>
                {m}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.chipUnit}>
                min
              </ThemedText>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setCustomOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={customOpen ? 'Close custom timer' : 'Create custom timer'}
          accessibilityState={{ expanded: customOpen }}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: customOpen ? theme.accentFill : theme.card,
              borderColor: customOpen ? theme.accentFill : theme.border,
            },
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons name={customOpen ? 'close' : 'plus'} size={20} color={customOpen ? theme.onBrand : theme.accent} />
          <ThemedText type="caption" style={[styles.chipUnit, { color: customOpen ? theme.onBrand : theme.textSecondary }]}>
            custom
          </ThemedText>
        </Pressable>
      </View>

      {customOpen && (
        <View style={[styles.editor, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name (optional) – e.g. Tea, Laundry"
            placeholderTextColor={theme.textSecondary}
            maxLength={24}
            accessibilityLabel="Timer name"
            returnKeyType="next"
            style={[styles.nameInput, { color: theme.text, backgroundColor: theme.cardMuted, borderColor: theme.border }]}
          />
          <View style={styles.digitRow}>
            <DigitField label="hours" value={hours} onChange={setHours} />
            <ThemedText type="defaultBold" style={styles.colon}>:</ThemedText>
            <DigitField label="minutes" value={minutes} onChange={setMinutes} />
            <ThemedText type="defaultBold" style={styles.colon}>:</ThemedText>
            <DigitField label="seconds" value={seconds} onChange={setSeconds} onSubmit={() => void startCustom()} />
          </View>
          <ThemedText
            type="caption"
            style={{ color: customError ? theme.danger : theme.textSecondary, textAlign: 'center' }}
            accessibilityLiveRegion="polite">
            {customError ?? (customMs ? `Rings in ${formatDurationLabel(customMs)}` : 'Set how long the timer should run.')}
          </ThemedText>
          <View style={styles.editorActions}>
            <Button
              label="Save timer"
              variant="secondary"
              onPress={saveCustom}
              disabled={customMs === null}
              style={styles.flex}
            />
            <Button
              label="Start"
              onPress={() => void startCustom()}
              disabled={customMs === null}
              loading={busy}
              style={styles.flex}
            />
          </View>
        </View>
      )}

      {savedTimers.length > 0 && (
        <View style={styles.saved}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.smallText}>
            MY TIMERS
          </ThemedText>
          {savedTimers.map((timer) => (
            <View key={timer.id} style={[styles.savedRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Pressable
                onPress={() => void start(timer.durationMs, timer.label)}
                accessibilityRole="button"
                accessibilityLabel={`Start ${timer.label}, ${formatDurationLabel(timer.durationMs)}`}
                style={({ pressed }) => [styles.savedMain, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="play-circle-outline" size={24} color={theme.accent} />
                <View style={styles.rowCopy}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {timer.label}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {formatDurationLabel(timer.durationMs)}
                  </ThemedText>
                </View>
              </Pressable>
              <Pressable
                onPress={() => removeSavedTimer(timer.id)}
                accessibilityRole="button"
                accessibilityLabel={`Delete saved timer ${timer.label}`}
                hitSlop={4}
                style={styles.iconButton}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <SwitchRow
        label="Run with stopwatch"
        description="Starting a timer also starts the stopwatch, and a lap marker is added when it rings."
        value={syncStopwatch}
        onValueChange={setSyncStopwatch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontSize: 11, letterSpacing: 0.5 },
  smallText: { fontSize: 11 },
  row: { borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.two, gap: Spacing.two },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowCopy: { flex: 1, gap: 1 },
  rowActions: { flexDirection: 'row', gap: Spacing.two },
  countdown: { fontSize: 22, fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: 4, borderRadius: Radius.pill },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  smallButton: {
    flex: 1,
    minHeight: MinTouchTarget,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', gap: Spacing.one },
  chip: {
    flex: 1,
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipUnit: { fontSize: 11 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  editor: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, padding: Spacing.two, gap: Spacing.two },
  nameInput: {
    minHeight: MinTouchTarget,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  digitRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: Spacing.one },
  digitWrap: { flex: 1, maxWidth: 84, alignItems: 'center', gap: 2 },
  digitInput: {
    width: '100%',
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  colon: { fontSize: 22, lineHeight: 56, width: 10, textAlign: 'center' },
  editorActions: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  saved: { gap: Spacing.one },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingRight: Spacing.one,
  },
  savedMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.two,
  },
});
