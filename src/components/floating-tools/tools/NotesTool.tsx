import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STORAGE_KEY = '@cashtrack_quick_notes';

export function NotesTool() {
  const theme = useTheme();
  const [note, setNote] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<string>('');

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

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const charCount = note.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="cloud-done-outline" size={16} color={savedStatus ? theme.success : theme.textSecondary} />
          <ThemedText type="smallBold" style={{ color: savedStatus ? theme.success : theme.textSecondary }}>
            {savedStatus || 'Auto-saved locally'}
          </ThemedText>
        </View>
        <ThemedText type="caption" themeColor="textSecondary">
          {wordCount} words • {charCount} chars
        </ThemedText>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    flex: 1,
    minHeight: 280,
    paddingBottom: Spacing.six,
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
    gap: Spacing.half,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.three,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 240,
  },
});
