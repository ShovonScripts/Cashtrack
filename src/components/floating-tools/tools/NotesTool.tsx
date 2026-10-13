import { useEffect, useState } from 'react';
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
  const [savedStatus, setSavedStatus] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string>('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setNote(val);
    });
  }, []);

  const handleSave = async (text: string) => {
    setNote(text);
    await AsyncStorage.setItem(STORAGE_KEY, text);
    setSavedStatus('Synced');
    setTimeout(() => setSavedStatus(''), 2000);
  };

  const handleCopy = async () => {
    if (!note.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(note);
    setActionFeedback('Copied!');
    setTimeout(() => setActionFeedback(''), 2000);
  };

  const handleClear = async () => {
    if (!note) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setNote('');
    await AsyncStorage.removeItem(STORAGE_KEY);
    setActionFeedback('Cleared');
    setTimeout(() => setActionFeedback(''), 2000);
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

  return (
    <View style={styles.container}>
      {/* Top Status & Toolbar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="cloud-done-outline" size={15} color={savedStatus ? theme.success : theme.textSecondary} />
          <ThemedText type="smallBold" style={{ color: savedStatus ? theme.success : theme.textSecondary, fontSize: 12 }}>
            {actionFeedback || savedStatus || 'Auto-saved locally'}
          </ThemedText>
        </View>

        <View style={styles.toolbar}>
          <Pressable
            onPress={handleCopy}
            disabled={!note.trim()}
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
        onChangeText={handleSave}
        placeholder="Jot down quick thoughts, budget ideas, or shopping lists..."
        placeholderTextColor={theme.textSecondary}
        multiline
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
