import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STORAGE_KEY = '@cashtrack_quick_notes';

export function NotesTool() {
  const theme = useTheme();
  const [note, setNote] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef('');
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);
  const versionRef = useRef(0);
  const mountedRef = useRef(true);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const enqueueWrite = useCallback((operation: () => Promise<void>) => {
    const next = saveChainRef.current.catch(() => {}).then(operation);
    saveChainRef.current = next.catch(() => {});
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (cancelled) return;
        const next = val ?? '';
        noteRef.current = next;
        setNote(next);
        hydratedRef.current = true;
        dirtyRef.current = false;
        setIsHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setSavedStatus('Could not load note');
      });

    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

      if (hydratedRef.current && dirtyRef.current) {
        const value = noteRef.current;
        dirtyRef.current = false;
        void enqueueWrite(() => AsyncStorage.setItem(STORAGE_KEY, value)).catch(() => {});
      }
    };
  }, [enqueueWrite]);

  useEffect(() => {
    if (!isHydrated || !dirtyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const version = versionRef.current;

    saveTimerRef.current = setTimeout(() => {
      const value = noteRef.current;
      enqueueWrite(() => AsyncStorage.setItem(STORAGE_KEY, value))
        .then(() => {
          if (!mountedRef.current) return;
          if (version === versionRef.current) dirtyRef.current = false;
          setSavedStatus('Synced');
          if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
          savedStatusTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setSavedStatus('');
          }, 2000);
        })
        .catch(() => {
          if (mountedRef.current) setSavedStatus('Save failed');
        });
    }, 400);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [note, isHydrated, enqueueWrite]);

  const handleNoteChange = (value: string) => {
    noteRef.current = value;
    dirtyRef.current = true;
    versionRef.current += 1;
    setNote(value);
  };

  const retryLoad = () => {
    setIsHydrated(false);
    hydratedRef.current = false;
    setLoadError(false);
    setSavedStatus('');
    setLoadAttempt((attempt) => attempt + 1);
  };

  const handleCopy = async () => {
    if (!note.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(note);
    setActionFeedback('Copied!');
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setActionFeedback(''), 2000);
  };

  const handleClear = async () => {
    if (!note) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    versionRef.current += 1;
    dirtyRef.current = false;
    noteRef.current = '';
    setNote('');
    try {
      await enqueueWrite(() => AsyncStorage.removeItem(STORAGE_KEY));
      if (mountedRef.current) setActionFeedback('Cleared');
    } catch {
      if (mountedRef.current) setActionFeedback('Clear failed');
    }
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setActionFeedback('');
    }, 2000);
  };

  const handleShare = async () => {
    if (!note.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: note,
      });
    } catch {
      // ignore
    }
  };

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const charCount = note.length;
  const statusIsError = loadError || savedStatus === 'Save failed' || actionFeedback === 'Clear failed';
  const statusColor = statusIsError ? theme.danger : savedStatus ? theme.success : theme.textSecondary;

  return (
    <View style={styles.container}>
      {/* Top Status & Toolbar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="cloud-done-outline" size={15} color={statusColor} />
          <ThemedText type="smallBold" style={{ color: statusColor, fontSize: 12 }}>
            {actionFeedback || savedStatus || 'Auto-saved locally'}
          </ThemedText>
          {loadError && (
            <Pressable
              onPress={retryLoad}
              accessibilityRole="button"
              accessibilityLabel="Retry loading note"
              hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.accent, fontSize: 12 }}>Retry</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.toolbar}>
          <Pressable
            onPress={handleCopy}
            disabled={!note.trim()}
            accessibilityRole="button"
            accessibilityLabel="Copy note"
            hitSlop={6}
            style={({ pressed }) => [
              styles.toolBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              !note.trim() && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}>
            <Ionicons name="copy-outline" size={14} color={theme.accent} />
          </Pressable>

          <Pressable
            onPress={handleShare}
            disabled={!note.trim()}
            accessibilityRole="button"
            accessibilityLabel="Share note"
            hitSlop={6}
            style={({ pressed }) => [
              styles.toolBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              !note.trim() && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}>
            <Ionicons name="share-outline" size={14} color={theme.success} />
          </Pressable>

          <Pressable
            onPress={handleClear}
            disabled={!note}
            accessibilityRole="button"
            accessibilityLabel="Clear note"
            hitSlop={6}
            style={({ pressed }) => [
              styles.toolBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              !note && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}>
            <Ionicons name="trash-outline" size={14} color={theme.danger} />
          </Pressable>
        </View>
      </View>

      {/* Note Input */}
      <TextInput
        value={note}
        onChangeText={handleNoteChange}
        editable={isHydrated}
        placeholder={loadError ? 'Note could not be loaded' : 'Jot down quick thoughts, budget ideas, or shopping lists...'}
        placeholderTextColor={theme.textSecondary}
        multiline
        accessibilityLabel="Quick notes"
        style={[
          styles.input,
          { backgroundColor: theme.cardMuted, borderColor: theme.border, color: theme.text },
        ]}
      />

      {/* Footer stats */}
      <View style={styles.footer}>
        <ThemedText type="caption" themeColor="textSecondary">
          {wordCount} words • {charCount} chars
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.half,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 6,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.three,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 220,
    maxHeight: 280,
  },
  footer: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.half,
  },
});
