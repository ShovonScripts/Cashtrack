import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LoadErrorState } from '@/components/load-error-state';
import { QuoteCard } from '@/components/quotes/quote-card';
import { QuoteSettingsSheet } from '@/components/quotes/quote-settings-sheet';
import { TodayQuoteCard } from '@/components/quotes/today-quote-card';
import { ThemedText } from '@/components/themed-text';
import { IconButton, Screen, SearchField, SkeletonList } from '@/components/ui';
import { getDailyQuote, getQuoteById, type QuoteTopic } from '@/constants/quotes';
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

/** One row in the list: a saved quote, which may have left the library since. */
type Row = {
  id: string;
  quote: string;
  author: string;
  topic?: QuoteTopic;
  meta?: string;
};

const DATE_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** Below this many saved quotes, a search box is more clutter than help. */
const SEARCH_FROM = 5;

function savedRow(entry: SavedQuote, now: Date): Row {
  return {
    id: entry.id,
    quote: entry.quote,
    author: entry.author,
    topic: getQuoteById(entry.id)?.topics[0],
    meta: savedOnLabel(entry.savedAt, now),
  };
}

/**
 * The page is the reader's own collection, not the whole library. One quote
 * arrives a day — on the opening screen, the Home cover and the morning
 * notification — and whatever is kept lands here. Listing every quote would
 * undo that: there would be nothing left to look forward to.
 */
export default function QuotesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { quoteTopics } = usePreferences();
  const now = useNow(60_000);
  const { items: saved, status, isSaved, save, remove, restore } = useSavedQuotes();

  const [search, setSearch] = useState('');
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

  const rows = useMemo<Row[]>(
    () => filterQuotes(saved, search).map((entry) => savedRow(entry, now)),
    // `now` only changes the "Saved 3 Nov" labels, once a minute at most.
    [saved, search, now],
  );

  const searching = search.trim().length > 0;
  const showSearch = saved.length >= SEARCH_FROM;
  const countLabel = `${searching ? `${rows.length} of ` : ''}${saved.length} saved · long press a quote to copy it`;

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

      {showSearch ? (
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search saved quotes"
          label="Search saved quotes"
        />
      ) : null}

      {status === 'ready' && saved.length > 0 ? (
        <ThemedText type="caption" themeColor="textSecondary" accessibilityLiveRegion="polite">
          {countLabel}
        </ThemedText>
      ) : null}
    </View>
  );

  const empty =
    status === 'loading' || status === 'idle' ? (
      <SkeletonList rows={2} label="Loading your saved quotes" />
    ) : status === 'error' ? (
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
    ) : searching ? (
      <Card>
        <EmptyState
          title="No matching quotes"
          message="Try a different word, or clear the search."
          icon="text-search"
        />
      </Card>
    ) : (
      <Card>
        <EmptyState
          title="No saved quotes yet"
          message="Tap the heart on today's quote above to keep it here. A new quote arrives every day on the opening screen and the Home cover. Saved quotes stay on your phone and are included in backups."
          icon="heart-outline"
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
  list: { gap: Spacing.two },
});
