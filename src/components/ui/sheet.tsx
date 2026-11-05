import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Elevation, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Bottom sheet for short tasks that do not need a whole page. Tapping the dim
 * area, the close button, or the system back gesture all close it.
 */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Lifts the panel above the keyboard on iOS so fields in a sheet stay visible. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
        accessibilityViewIsModal>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.panel,
            Elevation.high,
            { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, Spacing.three) },
          ]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
              {title}
            </ThemedText>
            <IconButton icon="close" label="Close" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill },
  panel: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    maxHeight: '85%',
    borderTopStartRadius: Radius.xlarge,
    borderTopEndRadius: Radius.xlarge,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: Radius.pill, marginTop: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { flex: 1 },
  body: { gap: Spacing.three, paddingBottom: Spacing.two },
});
