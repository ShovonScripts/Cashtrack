import { Pressable, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { giftGlyph, giftHueColor } from '@/components/gifts/gift-style';
import { ThemedText } from '@/components/themed-text';
import { Icon, ProgressMeter } from '@/components/ui';
import { MinTouchTarget, PressFeedback, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { getInitials } from '@/utils/expense';
import type { CategoryTotal, GiverTotal } from '@/utils/gifts';

export function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

type CategoryListProps = {
  rows: readonly CategoryTotal[];
  lifetime: number;
  formatAmount: (value: number) => string;
  onOpen: (categoryId: string) => void;
};

/** Where the gifts came from: each category's share, largest first. Tap to see its gifts. */
export function GiftCategoryTotals({ rows, lifetime, formatAmount, onOpen }: CategoryListProps) {
  const theme = useTheme();
  const isDark = useIsDark();

  return (
    <Card padded={false}>
      {rows.map((row, index) => {
        const share = lifetime > 0 ? row.total / lifetime : 0;
        const percent = Math.round(share * 100);
        const hue = giftHueColor(row.category.hue);
        return (
          <View key={row.category.id}>
            {index > 0 ? <CardDivider /> : null}
            <Pressable
              onPress={() => onOpen(row.category.id)}
              accessibilityRole="button"
              accessibilityLabel={`${row.category.name}, ${formatAmount(row.total)}, ${percent} percent, ${plural(row.count, 'gift', 'gifts')}`}
              accessibilityHint="Shows these gifts"
              style={({ pressed }) => [styles.row, pressed && PressFeedback]}>
              <View style={styles.line}>
                <View style={[styles.badge, { backgroundColor: withAlpha(hue, isDark ? 0.18 : 0.12) }]}>
                  <Icon name={giftGlyph(row.category.icon)} size="md" color={hue} />
                </View>
                <View style={styles.copy}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {row.category.name}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {plural(row.count, 'gift', 'gifts')}
                  </ThemedText>
                </View>
                <View style={styles.end}>
                  <ThemedText type="smallBold">{formatAmount(row.total)}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {percent}%
                  </ThemedText>
                </View>
                <Icon name="next" size="sm" color={theme.textSecondary} />
              </View>
              {/* The meter repeats the row's words, so a screen reader hears them once, on the row. */}
              <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <ProgressMeter fill={share} color={hue} label={row.category.name} valueText={`${percent} percent`} />
              </View>
            </Pressable>
          </View>
        );
      })}
    </Card>
  );
}

type GiverListProps = {
  rows: readonly GiverTotal[];
  /** Gifts with no giver written down, so the list can say why someone is missing. */
  unnamed: number;
  formatAmount: (value: number) => string;
  onOpen: (giver: string) => void;
};

/** The people who gave, most first, with how many of their gifts you have thanked them for. */
export function GiftGiverTotals({ rows, unnamed, formatAmount, onOpen }: GiverListProps) {
  const theme = useTheme();

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="account-heart-outline"
          title="No names yet"
          message="Add who gave each gift, and the people you are grateful to will gather here."
        />
      </Card>
    );
  }

  return (
    <View style={styles.stack}>
      <Card padded={false}>
        {rows.map((row, index) => {
          const allThanked = row.thanked === row.count;
          const thanks = allThanked
            ? row.count === 1
              ? 'Thanked'
              : 'Thanked for all'
            : `Thanked for ${row.thanked} of ${row.count}`;
          return (
            <View key={row.giver}>
              {index > 0 ? <CardDivider /> : null}
              <Pressable
                onPress={() => onOpen(row.giver)}
                accessibilityRole="button"
                accessibilityLabel={`${row.giver}, ${formatAmount(row.total)}, ${plural(row.count, 'gift', 'gifts')}, ${thanks}`}
                accessibilityHint="Shows what they gave"
                style={({ pressed }) => [styles.row, styles.line, pressed && PressFeedback]}>
                <View style={[styles.avatar, { backgroundColor: theme.accentMuted }]}>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {getInitials(row.giver)}
                  </ThemedText>
                </View>
                <View style={styles.copy}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {row.giver}
                  </ThemedText>
                  <View style={styles.thanks}>
                    {allThanked ? <Icon name="hand-heart-outline" size="sm" color={theme.success} /> : null}
                    <ThemedText type="caption" themeColor={allThanked ? 'success' : 'textSecondary'}>
                      {plural(row.count, 'gift', 'gifts')} · {thanks}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="smallBold">{formatAmount(row.total)}</ThemedText>
                <Icon name="next" size="sm" color={theme.textSecondary} />
              </Pressable>
            </View>
          );
        })}
      </Card>
      {unnamed > 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {plural(unnamed, 'gift has', 'gifts have')} no name yet. Add who gave {unnamed === 1 ? 'it' : 'them'} to see them here.
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.two },
  row: {
    minHeight: MinTouchTarget + Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  badge: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: Spacing.half },
  end: { alignItems: 'flex-end', gap: Spacing.half },
  thanks: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
