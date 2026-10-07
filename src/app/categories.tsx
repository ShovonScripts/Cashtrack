import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { CategoryIcon } from '@/components/category-icon';
import { useExpenses } from '@/context/expense-context';
import { getCategoryColor, ICON_PACK } from '@/constants/categories';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

export default function CategoriesScreen() {
  const theme = useTheme();
  const { expenses, categories, customCategories, categoryIcons, addCategory, renameCategory, deleteCategory } = useExpenses();
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag.fill');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState('');

  const builtInCount = categories.length - customCategories.length;

  const create = () => {
    triggerHaptic();
    const success = addCategory(newName, selectedIcon);
    setMessage(success ? `Category "${newName.trim()}" created successfully.` : 'Choose a unique name that is not already in use.');
    if (success) setNewName('');
  };

  const saveRename = (category: string) => {
    triggerHaptic();
    if (!renameCategory(category, editName)) {
      setMessage('Category name is empty or already in use.');
      return;
    }
    setEditing(null);
    setEditName('');
    setMessage(`Category renamed to "${editName.trim()}".`);
  };

  const remove = (category: string) => {
    triggerHaptic();
    const result = deleteCategory(category);
    if (result === 'in-use') {
      setMessage(`Move or recategorize expenses using "${category}" before deleting it.`);
    } else if (result === 'deleted') {
      setMessage(`Category "${category}" removed.`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Intro */}
        <View style={styles.intro}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
            EXPENSE CATEGORIES & ICONS
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Organize spending with custom category names and icons
          </ThemedText>
        </View>

        {/* Spendly Multi-Tone Glass Hero Header */}
        <View style={styles.heroGlassCard}>
          <View pointerEvents="none" style={styles.primaryBlueOrb} />
          <View pointerEvents="none" style={styles.brightCyanOrb} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>
                TOTAL CATEGORIES
              </ThemedText>
              <View style={styles.customBadgePill}>
                <MaterialCommunityIcons name="shape-outline" size={12} color="#14E7FD" />
                <ThemedText type="caption" style={styles.customBadgeText}>
                  {customCategories.length} Custom
                </ThemedText>
              </View>
            </View>

            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>ACTIVE CATEGORIES</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal}>
                  {categories.length}
                </ThemedText>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>BUILT-IN</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal}>
                  {builtInCount}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Create Category Form */}
        <Card style={styles.addCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.headerIconBadge, { backgroundColor: theme.accentMuted }]}>
              <MaterialCommunityIcons name="folder-plus-outline" size={18} color={theme.accent} />
            </View>
            <ThemedText type="defaultBold" style={{ fontSize: 16 }}>Create New Category</ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Category Name</ThemedText>
            <View style={styles.addRow}>
              <TextInput
                value={newName}
                onChangeText={(value) => { setNewName(value.slice(0, 28)); setMessage(''); }}
                placeholder="e.g. Pets, Travel, Subscriptions"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="done"
                onSubmitEditing={create}
                accessibilityLabel="New expense category name"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
              <Pressable
                onPress={create}
                disabled={!newName.trim()}
                accessibilityRole="button"
                accessibilityState={{ disabled: !newName.trim() }}
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                  !newName.trim() && styles.disabled,
                ]}>
                <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                <ThemedText type="smallBold" style={styles.addButtonText}>Add</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Category Icon</ThemedText>
            <View style={styles.iconPackGrid}>
              {ICON_PACK.map((item) => {
                const isSelected = selectedIcon === item.name;
                return (
                  <Pressable
                    key={item.name}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedIcon(item.name);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    style={({ pressed }) => [
                      styles.iconChoice,
                      {
                        backgroundColor: isSelected ? theme.accentMuted : theme.cardMuted,
                        borderColor: isSelected ? theme.accent : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <CategoryIcon category="Other" customIcons={{ Other: item.name }} color={isSelected ? theme.accent : theme.textSecondary} size={18} containerSize={30} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {message ? (
            <ThemedText type="caption" themeColor={message.includes('created') || message.includes('renamed') ? 'accent' : message.includes('removed') ? 'textSecondary' : 'danger'}>
              {message}
            </ThemedText>
          ) : null}
        </Card>

        {/* Categories List */}
        <View style={styles.listHeading}>
          <ThemedText type="defaultBold">All Categories</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{categories.length} categories</ThemedText>
        </View>

        <Card padded={false}>
          {categories.map((category, index) => {
            const isCustom = customCategories.includes(category);
            const usageCount = expenses.filter((expense) => expense.category === category).length;
            const isEditing = editing === category;
            const color = getCategoryColor(category);

            return (
              <View key={category}>
                {index > 0 && <CardDivider />}
                <View style={styles.categoryRow}>
                  <CategoryIcon category={category} customIcons={categoryIcons} color={color} size={18} containerSize={36} />

                  <View style={styles.categoryInfo}>
                    {isEditing ? (
                      <TextInput
                        value={editName}
                        onChangeText={(value) => setEditName(value.slice(0, 28))}
                        autoFocus
                        accessibilityLabel={`Rename ${category}`}
                        style={[styles.renameInput, { borderColor: theme.accent, color: theme.text, backgroundColor: theme.cardMuted }]}
                      />
                    ) : (
                      <ThemedText type="defaultBold" numberOfLines={1} style={{ fontSize: 15 }}>
                        {category}
                      </ThemedText>
                    )}

                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: isCustom ? theme.accentMuted : theme.cardMuted }]}>
                        <ThemedText type="caption" style={{ color: isCustom ? theme.accent : theme.textSecondary, fontWeight: '700', fontSize: 10 }}>
                          {isCustom ? 'Custom' : 'Built-in'}
                        </ThemedText>
                      </View>

                      <ThemedText type="caption" themeColor="textSecondary">
                        {usageCount} {usageCount === 1 ? 'expense' : 'expenses'} logged
                      </ThemedText>
                    </View>
                  </View>

                  {isCustom && (
                    isEditing ? (
                      <View style={styles.rowActions}>
                        <Pressable onPress={() => saveRename(category)} style={({ pressed }) => [styles.actionPill, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
                          <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '800' }}>Save</ThemedText>
                        </Pressable>
                        <Pressable onPress={() => setEditing(null)} style={({ pressed }) => [styles.actionPill, { backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
                          <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancel</ThemedText>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.rowActions}>
                        <Pressable onPress={() => { triggerHaptic(); setEditing(category); setEditName(category); }} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                          <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.accent} />
                        </Pressable>
                        <Pressable onPress={() => remove(category)} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                          <MaterialCommunityIcons name="delete-outline" size={18} color={theme.danger} />
                        </Pressable>
                      </View>
                    )
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  eyebrow: { letterSpacing: 1.1, fontWeight: '800', fontSize: 10 },
  heroGlassCard: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(1, 82, 245, 0.5)',
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(20, 231, 253, 0.3)',
  },
  heroContent: { gap: Spacing.two, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, fontSize: 11, fontWeight: '700' },
  customBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  customBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroStat: { flex: 1, gap: 2 },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  heroStatVal: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'], fontWeight: '800' },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  addCard: { gap: Spacing.three },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBadge: { width: 32, height: 32, borderRadius: Radius.small, justifyContent: 'center', alignItems: 'center' },
  field: { gap: Spacing.one },
  addRow: { flexDirection: 'row', gap: Spacing.two },
  input: { flex: 1, minWidth: 0, minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, fontSize: 15 },
  addButton: { minWidth: 80, minHeight: 48, borderRadius: Radius.medium, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: Spacing.three },
  addButtonText: { color: '#FFFFFF' },
  iconPackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChoice: { width: 40, height: 40, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  categoryRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  categoryInfo: { flex: 1, minWidth: 0, gap: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  renameInput: { minHeight: 40, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.small, paddingHorizontal: Spacing.two, fontSize: 14 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  iconBtn: { padding: 6 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
