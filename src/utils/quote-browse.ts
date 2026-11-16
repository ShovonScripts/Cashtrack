/**
 * Pure helpers for the Quotes page. No React Native or `@/` imports, so they
 * run under the node test runner.
 */
import { QUOTE_TOPICS, type QuoteTopic } from '../constants/quotes.ts';

type Searchable = { quote: string; author: string; topics?: readonly QuoteTopic[] };

/** Lower-case, accent-free text, so "lappe" finds "Lappé". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Filters by an optional topic and a free-text search over the quote and the
 * author. Every word must match somewhere, in any order.
 */
export function filterQuotes<T extends Searchable>(
  quotes: readonly T[],
  query: string,
  topic: QuoteTopic | null = null,
): T[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return quotes.filter((item) => {
    if (topic && !(item.topics ?? []).includes(topic)) return false;
    if (words.length === 0) return true;
    const haystack = fold(`${item.quote} ${item.author}`);
    return words.every((word) => haystack.includes(word));
  });
}

/** True when this topic feeds the daily quote. An empty choice means every topic. */
export function isTopicChosen(chosen: readonly QuoteTopic[], topic: QuoteTopic): boolean {
  return chosen.length === 0 || chosen.includes(topic);
}

/**
 * The topic choice after tapping one topic. Keeps at least one topic on, and
 * stores "all topics" as an empty list so topics added later are included.
 * Returns null when the tap would turn the last topic off.
 */
export function toggleTopicChoice(chosen: readonly QuoteTopic[], topic: QuoteTopic): QuoteTopic[] | null {
  const all = QUOTE_TOPICS.map((item) => item.key);
  const current = chosen.length === 0 ? all : all.filter((key) => chosen.includes(key));
  const next = current.includes(topic) ? current.filter((key) => key !== topic) : [...current, topic];
  if (next.length === 0) return null;
  return next.length === all.length ? [] : all.filter((key) => next.includes(key));
}

/** "Saved 16 Nov" style label; the year only when it is not this year. */
export function savedOnLabel(savedAt: string, now: Date = new Date()): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'Saved';
  const sameYear = date.getFullYear() === now.getFullYear();
  const text = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
  return `Saved ${text}`;
}
