import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import {
  USER_MANUAL_SECTIONS,
  manualSectionMatches,
  type ManualBlock,
  type ManualSection,
} from '@/constants/user-manual';
import { useTheme } from '@/hooks/use-theme';

type InlineTextProps = {
  text: string;
  type?: 'small' | 'smallBold' | 'caption' | 'default';
  themeColor?: ThemeColor;
};

function InlineText({ text, type = 'small', themeColor }: InlineTextProps) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return (
    <ThemedText type={type} themeColor={themeColor}>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <Text key={index} style={styles.inlineStrong}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          part
        )
      )}
    </ThemedText>
  );
}

function MetaPill({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.metaPill,
        { backgroundColor: theme.cardMuted, borderColor: theme.border },
      ]}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function ManualBlockView({ block }: { block: ManualBlock }) {
  const theme = useTheme();

  if (block.type === 'heading') {
    return (
      <ThemedText type="smallBold" style={styles.blockHeading}>
        {block.text}
      </ThemedText>
    );
  }

  if (block.type === 'paragraph') {
    return <InlineText text={block.text} />;
  }

  if (block.type === 'bullets') {
    return (
      <View style={styles.listStack}>
        {block.items.map((item, index) => (
          <View key={`${index}-${item}`} style={styles.listRow}>
            <View style={[styles.bullet, { backgroundColor: theme.textSecondary }]} />
            <View style={styles.listCopy}>
              <InlineText text={item} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'steps') {
    return (
      <View style={styles.listStack}>
        {block.items.map((item, index) => (
          <View key={`${index}-${item}`} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="caption" style={[styles.stepNumberText, { color: theme.accent }]}>
                {index + 1}
              </ThemedText>
            </View>
            <View style={styles.listCopy}>
              <InlineText text={item} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'note') {
    return (
      <View
        style={[
          styles.note,
          { backgroundColor: theme.cardMuted, borderLeftColor: theme.accent },
        ]}>
        <MaterialCommunityIcons name="information-outline" size={17} color={theme.accent} />
        <View style={styles.listCopy}>
          <InlineText text={block.text} themeColor="textSecondary" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.table, { borderColor: theme.border }]}>
      <View
        style={[
          styles.tableHeader,
          { backgroundColor: theme.cardMuted, borderBottomColor: theme.border },
        ]}>
        <View style={styles.tableCellLeft}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.tableHeaderText}>
            {block.headers[0]}
          </ThemedText>
        </View>
        <View style={styles.tableCellRight}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.tableHeaderText}>
            {block.headers[1]}
          </ThemedText>
        </View>
      </View>
      {block.rows.map(([left, right], index) => (
        <View
          key={`${left}-${index}`}
          style={[
            styles.tableRow,
            index < block.rows.length - 1 && { borderBottomColor: theme.border },
          ]}>
          <View style={styles.tableCellLeft}>
            <InlineText text={left} type="smallBold" />
          </View>
          <View style={styles.tableCellRight}>
            <InlineText text={right} themeColor="textSecondary" />
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionCard({
  section,
  expanded,
  searchActive,
  onToggle,
}: {
  section: ManualSection;
  expanded: boolean;
  searchActive: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();

  return (
    <Card padded={false} style={styles.sectionCard}>
      <Pressable
        onPress={onToggle}
        disabled={searchActive}
        accessibilityRole="button"
        accessibilityLabel={`${section.title}. ${section.summary}`}
        accessibilityState={{ expanded, disabled: searchActive }}
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
        <View style={[styles.sectionIcon, { backgroundColor: `${section.color}1E` }]}>
          <MaterialCommunityIcons name={section.icon} size={21} color={section.color} />
        </View>
        <View style={styles.sectionCopy}>
          <ThemedText type="smallBold">{section.title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {section.summary}
          </ThemedText>
        </View>
        {searchActive ? (
          <View style={[styles.matchPill, { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
              Match
            </ThemedText>
          </View>
        ) : (
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={21}
            color={theme.textSecondary}
          />
        )}
      </Pressable>
      {expanded && (
        <View style={[styles.sectionBody, { borderTopColor: theme.border }]}>
          {section.blocks.map((block, index) => (
            <ManualBlockView key={`${section.id}-${index}`} block={block} />
          ))}
        </View>
      )}
    </Card>
  );
}

export default function UserManualScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['getting-started'])
  );

  const hasQuery = query.trim().length > 0;

  const visibleSections = useMemo(
    () => USER_MANUAL_SECTIONS.filter((section) => manualSectionMatches(section, query)),
    [query]
  );

  const toggleSection = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={28}
              color={theme.accent}
            />
          </View>
          <ThemedText type="title">User Manual</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.heroCopy}>
            Everything you need to use CashTrack, from your first expense to backups and
            troubleshooting.
          </ThemedText>
          <View style={styles.metaRow}>
            <MetaPill label={`${USER_MANUAL_SECTIONS.length} topics`} />
            <MetaPill label="Version 1.0.0" />
            <MetaPill label="Works offline" />
          </View>
        </View>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: theme.cardMuted, borderColor: theme.border },
          ]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search the manual"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search the user manual"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={({ pressed }) => pressed && styles.pressed}>
              <MaterialCommunityIcons
                name="close-circle"
                size={19}
                color={theme.textSecondary}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.resultRow}>
          <ThemedText type="caption" themeColor="textSecondary">
            {hasQuery
              ? `${visibleSections.length} of ${USER_MANUAL_SECTIONS.length} topics`
              : `${USER_MANUAL_SECTIONS.length} topics · tap a topic to expand`}
          </ThemedText>
        </View>

        {visibleSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            expanded={hasQuery || expandedIds.has(section.id)}
            searchActive={hasQuery}
            onToggle={() => toggleSection(section.id)}
          />
        ))}

        {visibleSections.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.accentMuted }]}>
              <MaterialCommunityIcons
                name="text-box-search-outline"
                size={24}
                color={theme.accent}
              />
            </View>
            <ThemedText type="defaultBold">No topics found</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyCopy}>
              Try a different word, such as “backup”, “budget”, or “notifications”.
            </ThemedText>
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear manual search"
              style={({ pressed }) => [
                styles.clearButton,
                { borderColor: theme.accent },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Clear search
              </ThemedText>
            </Pressable>
          </Card>
        )}

        <View style={styles.footer}>
          <ThemedText type="caption" themeColor="textSecondary">
            CashTrack 1.0.0 · local-first personal finance
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            CashTrack and Spendly refer to the same app.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  hero: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  heroCopy: {
    maxWidth: 620,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  metaPill: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingVertical: 0,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  sectionCard: {
    marginBottom: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    minHeight: 64,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    flex: 1,
    gap: 2,
  },
  matchPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  blockHeading: {
    marginTop: Spacing.one,
  },
  listStack: {
    gap: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  listCopy: {
    flex: 1,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontWeight: '700',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: 12,
    borderRadius: Radius.small,
    borderLeftWidth: 3,
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.small,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  tableCellLeft: {
    flex: 0.42,
    paddingRight: Spacing.two,
  },
  tableCellRight: {
    flex: 0.58,
  },
  inlineStrong: {
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    textAlign: 'center',
    maxWidth: 320,
  },
  clearButton: {
    marginTop: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
