import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CardDivider } from '@/components/card';
import { giftGlyph, giftHueColor } from '@/components/gifts/gift-style';
import { ThemedText } from '@/components/themed-text';
import { Button, FormField, Icon, IconButton, Sheet } from '@/components/ui';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import type { GiftCategory, ReceivedGift } from '@/types/gift';
import { confirmAction, notify } from '@/utils/confirm';
import { GIFT_LIMITS, type CategoryChange } from '@/utils/gifts';

type GiftCategoriesSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The person's own categories. */
  categories: readonly GiftCategory[];
  gifts: readonly ReceivedGift[];
  onAdd: (name: string) => Promise<CategoryChange>;
  onRename: (id: string, name: string) => Promise<CategoryChange>;
  onDelete: (id: string) => Promise<void>;
  /** Called with a category just made, so the form can select it. */
  onCreated?: (category: GiftCategory) => void;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Make, rename and delete your own gift categories. Built-in ones stay fixed. */
export function GiftCategoriesSheet({
  visible,
  onClose,
  categories,
  gifts,
  onAdd,
  onRename,
  onDelete,
  onCreated,
}: GiftCategoriesSheetProps) {
  const isDark = useIsDark();
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setNewName('');
    setAddError('');
    setEditingId(null);
    onClose();
  };

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const change = await onAdd(newName);
      if (!change.ok) {
        setAddError(change.error);
        return;
      }
      setNewName('');
      setAddError('');
      if (onCreated) {
        onCreated(change.category);
        close();
      }
    } catch {
      notify('Could not add', 'The category could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveRename = async () => {
    if (!editingId || busy) return;
    setBusy(true);
    try {
      const change = await onRename(editingId, editName);
      if (!change.ok) {
        setEditError(change.error);
        return;
      }
      setEditingId(null);
      setEditError('');
    } catch {
      notify('Could not rename', 'The category could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const askDelete = (category: GiftCategory, used: number) => {
    confirmAction(
      `Delete "${category.name}"?`,
      used > 0
        ? `Its ${plural(used, 'gift', 'gifts')} will move to Other. Nothing is lost.`
        : 'No gifts use this category.',
      async () => {
        try {
          await onDelete(category.id);
        } catch {
          notify('Could not delete', 'The category could not be deleted. Please try again.');
        }
      },
    );
  };

  return (
    <Sheet visible={visible} onClose={close} title="Gift categories">
      <View style={styles.addBlock}>
        <FormField
          label="New category"
          value={newName}
          onChangeText={(value) => {
            setNewName(value);
            setAddError('');
          }}
          placeholder="e.g. Eid Salami, Wedding"
          maxLength={GIFT_LIMITS.categoryName}
          error={addError || undefined}
          returnKeyType="done"
          onSubmitEditing={() => void add()}
        />
        <Button label="Add category" onPress={() => void add()} disabled={newName.trim() === ''} loading={busy && !editingId} />
      </View>

      <ThemedText type="smallBold">Your categories</ThemedText>
      {categories.length === 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          None yet. The built-in ones (Education, Gift, Food & Invitations and more) are always there and cannot be changed.
        </ThemedText>
      ) : (
        <View>
          {categories.map((category, index) => {
            const used = gifts.filter((gift) => gift.categoryId === category.id).length;
            const hue = giftHueColor(category.hue);
            return (
              <View key={category.id}>
                {index > 0 ? <CardDivider /> : null}
                {editingId === category.id ? (
                  <View style={styles.editBlock}>
                    <FormField
                      label={`Rename "${category.name}"`}
                      value={editName}
                      onChangeText={(value) => {
                        setEditName(value);
                        setEditError('');
                      }}
                      maxLength={GIFT_LIMITS.categoryName}
                      error={editError || undefined}
                      returnKeyType="done"
                      onSubmitEditing={() => void saveRename()}
                    />
                    <View style={styles.editActions}>
                      <Button label="Cancel" variant="ghost" onPress={() => setEditingId(null)} style={styles.flex} />
                      <Button label="Save" onPress={() => void saveRename()} loading={busy} style={styles.flex} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.row}>
                    <View style={[styles.badge, { backgroundColor: withAlpha(hue, isDark ? 0.18 : 0.12) }]}>
                      <Icon name={giftGlyph(category.icon)} size="md" color={hue} />
                    </View>
                    <View style={styles.copy}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {category.name}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {used > 0 ? plural(used, 'gift', 'gifts') : 'Not used yet'}
                      </ThemedText>
                    </View>
                    <IconButton
                      icon="edit"
                      label={`Rename ${category.name}`}
                      onPress={() => {
                        setEditingId(category.id);
                        setEditName(category.name);
                        setEditError('');
                      }}
                    />
                    <IconButton icon="delete" tone="danger" label={`Delete ${category.name}`} onPress={() => askDelete(category, used)} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  addBlock: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  badge: { width: 36, height: 36, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: Spacing.half },
  editBlock: { gap: Spacing.two, paddingVertical: Spacing.two },
  editActions: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
});
