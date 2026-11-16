import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LoadErrorState } from '@/components/load-error-state';
import { QuoteCard } from '@/components/quotes/quote-card';
import { QuoteSettingsSheet } from '@/components/quotes/quote-settings-sheet';
import { TodayQuoteCard } from '@/components/quotes/today-quote-card';
import { ThemedText } from '@/components/themed-text';
import { Chip, IconButton, Screen, SearchField, SegmentedControl, SkeletonList } from '@/components/ui';
import {
  FINANCIAL_QUOTES,
  getDailyQuote,
  getQuoteById,
  QUOTE_TOPICS,
  type FinancialQuote,
  type QuoteTopic,
} from '@/constants/quotes';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useToast } from '@/context/toast-context';
import { useNow } from '@/hooks/use-now';
import { reloadSavedQuotes, useSavedQuotes } from '@/hooks/use-saved-quotes';
import type { SavedQuote } from '@/types/saved-quote';
import { notify } from '@/utils/confirm';
import { triggerHaptic } from '@/utils/motion';
import { filterQuotes, savedOnLabel } from '@/utils/quote-browse';
import { shareQuote } from '@/utils/quote-share';

type Tab = 'explore' | 'saved';

/** One row in either list: a library quote, or a saved copy (which may have left the library). */
type Row = {
  id: string;
  quote: string;
  author: string;
  topic?: QuoteTopic;
  meta?: string;
};

const DATE_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function libraryRow(quote: FinancialQuote): Row {
  return { id: quote.id, quote: quote.quote, author: quote.author, topic: quote.topics[0] };
}

function savedRow(entry: SavedQuote, now: Date): Row {
  return {
    id: entry.id,
    quote: entry.quote,
    author: entry.author,
    topic: getQuoteById(entry.id)?.topics[0],
    meta: savedOnLabel(entry.savedAt, now),
  };
}

export default function QuotesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { quoteTopics } = usePreferences();
  const now = useNow(60_000);
  const { items: saved, status, isSaved, save, remove, restore } = useSavedQuotes();

  const [tab, setTab] = useState<Tab>('explore');
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState<QuoteTopic | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const dayKey = now.toDateString();
  // Same quote as the opening screen, the Home cover and the morning notification.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => getDailyQuote(now, quoteTopics), [dayKey, quoteTopics]);

  const toggleSave = useCallback(
    async (row: Pick<Row, 'id' | 'quote' | 'author'>) => {
      triggerHaptic();
      try {
        if (isSaved(row.id)) {
          const removed = await remove(row.id);
          if (removed) {
            toast.show({
              message: 'Removed from saved quotes',
              actionLabel: 'Undo',
              onAction: () => {
                restore(removed).catch(() =>
                  notify('Could not undo', 'The quote could not be put back. Please save it again.'),
                );
              },
            });
          }
        } else {
          await save(row);
          toast.show({ message: 'Saved to your quotes', duration: 2500 });
        }
      } catch {
        notify('Could not save', 'Your saved quotes could not be updated. Please try again.');
      }
    },
    [isSaved, remove, restore, save, toast],
  );

  const copy = useCallback(
    async (row: Pick<Row, 'quote' | 'author'>) => {
      try {
        await Clipboard.setStringAsync(`“${row.quote}” — ${row.author}`);
        triggerHaptic();
        toast.show({ message: 'Quote copied', duration: 2000 });
      } catch {
        notify('Could not copy', 'The quote could not be copied. Please try again.');
      }
    },
    [toast],
  );

  const rows = useMemo<Row[]>(() => {
    if (tab === 'saved') return filterQuotes(saved, search).map((entry) => savedRow(entry, now));
    return filterQuotes(FINANCIAL_QUOTES, search, topic).map(libraryRow);
    // `now` only changes the "Saved 3 Nov" labels, once a minute at most.
  }, [tab, saved, search, topic, now]);

  const switchTab = (next: Tab) => {
    triggerHaptic();
    setTab(next);
    setSearch('');
  };

  const total = tab === 'saved' ? saved.length : FINANCIAL_QUOTES.length;
  const filtered = search.trim().length > 0 || (tab === 'explore' && topic !== null);
  const countLabel =
    tab === 'saved'
      ? `${filtered ? `${rows.length} of ` : ''}${total} saved`
      : `${filtered ? `${rows.length} of ` : ''}${total} quotes`;

  const header = (
    <View style={styles.header}>
      <TodayQuoteCard
        quote={today}
        dateLabel={DATE_LABEL.format(now)}
        saved={isSaved(today.id)}
        onToggleSave={() => void toggleSave(today)}
        onShare={() => void shareQuote(today)}
        onCopy={() => void copy(today)}
      />

      <SegmentedControl
        label="Show"
        value={tab}
        onChange={switchTab}
        options={[
          { value: 'explore', label: 'Explore' },
          { value: 'saved', label: saved.length > 0 ? `Saved · ${saved.length}` : 'Saved' },
        ]}
      />

      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder={tab === 'saved' ? 'Search saved quotes' : 'Search quotes or authors'}
        label={tab === 'saved' ? 'Search saved quotes' : 'Search quotes or authors'}
      />

      {tab === 'explore' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipStrip}>
          <Chip
            label="All"
            selected={topic === null}
            onPress={() => {
              triggerHaptic();
              setTopic(null);
            }}
          />
          {QUOTE_TOPICS.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={topic === item.key}
              onPress={() => {
                triggerHaptic();
                setTopic((current) => (current === item.key ? null : item.key));
              }}
            />
          ))}
        </ScrollView>
      ) : null}

      {tab === 'explore' || status === 'ready' ? (
        <ThemedText type="caption" themeColor="textSecondary" accessibilityLiveRegion="polite">
          {countLabel}
          {tab === 'explore' ? ' · long press a quote to copy it' : ''}
        </ThemedText>
      ) : null}
    </View>
  );

  const empty =
    tab === 'saved' && (status === 'loading' || status === 'idle') ? (
      <SkeletonList rows={2} label="Loading your saved quotes" />
    ) : tab === 'saved' && status === 'error' ? (
      <Card>
        <LoadErrorState
          title="Couldn't load your saved quotes"
          message="Your saved quotes couldn't be read just now. Nothing has been deleted."
          isRetrying={retrying}
          onRetry={async () => {
            setRetrying(true);
            await reloadSavedQuotes();
            setRetrying(false);
          }}
        />
      </Card>
    ) : tab === 'saved' && saved.length === 0 ? (
      <Card>
        <EmptyState
          title="No saved quotes yet"
          message="Tap the heart on any quote to keep it here. Saved quotes stay on your phone and are included in backups."
          icon="heart-outline"
          actionLabel="Explore quotes"
          onAction={() => switchTab('explore')}
        />
      </Card>
    ) : (
      <Card>
        <EmptyState
          title="No matching quotes"
          message="Try a different word or topic, or clear the search."
          icon="text-search"
        />
      </Card>
    );

  return (
    <Screen scroll={false} topInset={false} contentStyle={styles.fill}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="settings"
              label="Quote settings"
              onPress={() => {
                triggerHaptic();
                setSettingsOpen(true);
              }}
            />
          ),
        }}
      />

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        style={styles.fill}
        contentContainerStyle={[styles.list, { paddingBottom: Spacing.four + insets.bottom }]}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <QuoteCard
            quote={item.quote}
            author={item.author}
            topic={item.topic}
            meta={item.meta}
            saved={isSaved(item.id)}
            onToggleSave={() => void toggleSave(item)}
            onShare={() => void shareQuote(item)}
            onCopy={() => void copy(item)}
          />
        )}
      />

      <QuoteSettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { gap: Spacing.three, paddingBottom: Spacing.one },
  chipStrip: { marginHorizontal: -Spacing.three },
  chips: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  list: { gap: Spacing.two },
});
