import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import type { Expense } from '@/types/expense';

export default function ReceiptsArchiveScreen() {
  const theme = useTheme();
  const { expenses, formatAmount } = useExpenses();
  const [query, setQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Expense | null>(null);

  const expensesWithReceipts = expenses.filter((e) => Boolean(e.receiptUri));

  const filtered = expensesWithReceipts.filter((e) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      e.category.toLowerCase().includes(needle) ||
      e.note.toLowerCase().includes(needle) ||
      String(e.amount).includes(needle)
    );
  });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Receipt Archive</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            All receipt attachments from your recorded expenses in one place.
          </ThemedText>
        </View>

        <View style={[styles.searchField, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search receipts by category or note"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" hitSlop={8} style={styles.clearBtn}>
              <ThemedText type="smallBold" themeColor="textSecondary">×</ThemedText>
            </Pressable>
          )}
        </View>

        {filtered.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No receipts found"
              message="Attach receipt images when adding expenses to build your archive."
              tone={theme.accent}
            />
          </Card>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedReceipt(item)}
                accessibilityRole="button"
                accessibilityLabel={`Receipt for ${item.category}, ${formatAmount(item.amount)}`}
                style={({ pressed }) => [styles.receiptCard, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]}>
                {item.receiptUri ? (
                  <Image source={{ uri: item.receiptUri }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbPlaceholder, { backgroundColor: theme.cardMuted }]}>
                    <MaterialCommunityIcons name="file-image-outline" size={28} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <ThemedText type="smallBold" numberOfLines={1}>{item.note || item.category}</ThemedText>
                  <View style={styles.cardSub}>
                    <ThemedText type="caption" themeColor="textSecondary">{formatDate(item.date)}</ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>{formatAmount(item.amount)}</ThemedText>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Fullscreen Receipt Modal */}
      <Modal visible={Boolean(selectedReceipt)} transparent animationType="fade" onRequestClose={() => setSelectedReceipt(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedReceipt(null)} accessibilityLabel="Close receipt view" />
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <ThemedText type="defaultBold">{selectedReceipt?.note || selectedReceipt?.category}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {selectedReceipt ? `${formatDate(selectedReceipt.date)} · ${formatAmount(selectedReceipt.amount)}` : ''}
                </ThemedText>
              </View>
              <Pressable onPress={() => setSelectedReceipt(null)} accessibilityRole="button" hitSlop={10} style={styles.closeBtn}>
                <ThemedText type="defaultBold">✕</ThemedText>
              </Pressable>
            </View>

            {selectedReceipt?.receiptUri ? (
              <Image source={{ uri: selectedReceipt.receiptUri }} style={styles.fullImage} resizeMode="contain" />
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  title: { fontSize: 26, lineHeight: 32 },
  searchField: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, paddingHorizontal: Spacing.three },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: Spacing.two },
  clearBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  receiptCard: { width: '48%', borderRadius: Radius.large, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', gap: Spacing.two },
  thumbnail: { width: '100%', height: 130, backgroundColor: '#000000' },
  thumbPlaceholder: { width: '100%', height: 130, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { padding: Spacing.three, paddingTop: 0, gap: 4 },
  cardSub: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  modalContent: { width: '100%', maxWidth: 520, maxHeight: '85%', borderRadius: Radius.large, overflow: 'hidden', padding: Spacing.four, gap: Spacing.three },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalHeaderCopy: { flex: 1, gap: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.06)' },
  fullImage: { width: '100%', height: 360 },
  pressed: { opacity: 0.78 },
});
