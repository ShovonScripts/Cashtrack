/**
 * The quote library. Every place that shows a quote (opening screen, Home
 * cover, morning notification) picks from here through `getDailyQuote`, so
 * they always agree on the day's quote.
 *
 * Kept free of React Native and `@/` imports so it runs under the node test
 * runner.
 */

export type QuoteTopic =
  | 'saving'
  | 'spending'
  | 'investing'
  | 'debt'
  | 'earning'
  | 'mindset'
  | 'giving'
  | 'contentment';

export const QUOTE_TOPICS: readonly { key: QuoteTopic; label: string }[] = [
  { key: 'saving', label: 'Saving' },
  { key: 'spending', label: 'Spending & Budget' },
  { key: 'investing', label: 'Investing & Wealth' },
  { key: 'debt', label: 'Debt' },
  { key: 'earning', label: 'Earning & Work' },
  { key: 'mindset', label: 'Mindset & Discipline' },
  { key: 'giving', label: 'Giving' },
  { key: 'contentment', label: 'Contentment' },
];

const TOPIC_KEYS = new Set<string>(QUOTE_TOPICS.map((topic) => topic.key));

export function isQuoteTopic(value: unknown): value is QuoteTopic {
  return typeof value === 'string' && TOPIC_KEYS.has(value);
}

export interface FinancialQuote {
  /** Stable id. Never change or reuse one: saved quotes point at it. */
  id: string;
  quote: string;
  author: string;
  /** One or more topics; the first is the main one shown as a tag. */
  topics: QuoteTopic[];
}

export const FINANCIAL_QUOTES: FinancialQuote[] = [
  {
    id: 'buffett-spend-what-is-left',
    quote: 'Do not save what is left after spending, but spend what is left after saving.',
    author: 'Warren Buffett',
    topics: ['saving', 'spending'],
  },
  {
    id: 'buffett-price-value',
    quote: 'Price is what you pay. Value is what you get.',
    author: 'Warren Buffett',
    topics: ['investing', 'spending'],
  },
  {
    id: 'ramsey-budget-tells-money',
    quote: 'A budget is telling your money where to go instead of wondering where it went.',
    author: 'Dave Ramsey',
    topics: ['spending'],
  },
  {
    id: 'franklin-little-expenses',
    quote: 'Beware of little expenses; a small leak will sink a great ship.',
    author: 'Benjamin Franklin',
    topics: ['spending', 'saving'],
  },
  {
    id: 'franklin-knowledge-interest',
    quote: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
    topics: ['investing', 'earning'],
  },
  {
    id: 'wealth-is-options',
    quote: "Wealth is not having a lot of money; it's having a lot of options.",
    author: 'Chris Rock',
    topics: ['investing', 'contentment'],
  },
  {
    id: 'munger-habit-of-saving',
    quote: 'The habit of saving is itself an education; it fosters every virtue, teaches self-denial, and cultivates order.',
    author: 'T.T. Munger',
    topics: ['saving', 'mindset'],
  },
  {
    id: 'ramsey-financial-peace',
    quote: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    author: 'Dave Ramsey',
    topics: ['contentment', 'spending'],
  },
  {
    id: 'kiyosaki-how-much-you-keep',
    quote: "It's not how much money you make, but how much money you keep.",
    author: 'Robert Kiyosaki',
    topics: ['saving', 'earning'],
  },
  {
    id: 'barnum-master-servant',
    quote: 'Money is a terrible master but an excellent servant.',
    author: 'P.T. Barnum',
    topics: ['mindset'],
  },
  {
    id: 'jefferson-spend-before-earned',
    quote: 'Never spend your money before you have earned it.',
    author: 'Thomas Jefferson',
    topics: ['debt', 'spending'],
  },
  {
    id: 'rogers-fold-it-over',
    quote: 'The quickest way to double your money is to fold it over and put it back in your pocket.',
    author: 'Will Rogers',
    topics: ['saving'],
  },
  {
    id: 'dickens-twenty-pounds',
    quote: 'Annual income twenty pounds, annual expenditure nineteen nineteen and six, result happiness.',
    author: 'Charles Dickens',
    topics: ['spending', 'debt'],
  },
  {
    id: 'living-like-broke',
    quote: "Rich people stay rich by living like they're broke. Broke people stay broke by living like they're rich.",
    author: 'Naval Ravikant',
    topics: ['spending', 'mindset'],
  },
  {
    id: 'eggs-one-basket',
    quote: 'Do not put all eggs in one basket.',
    author: 'Warren Buffett',
    topics: ['investing'],
  },
  {
    id: 'orman-small-amounts-daily',
    quote: 'Small amounts saved daily add up to huge investments over time.',
    author: 'Suze Orman',
    topics: ['saving', 'investing'],
  },
  {
    id: 'brogan-life-on-your-terms',
    quote: "The goal isn't more money. The goal is living life on your terms.",
    author: 'Chris Brogan',
    topics: ['contentment', 'mindset'],
  },
  {
    id: 'lappe-casting-a-vote',
    quote: "Every time you spend money, you're casting a vote for the kind of world you want.",
    author: 'Anna Lappé',
    topics: ['giving', 'spending'],
  },
  {
    id: 'pasteur-prepared-mind',
    quote: 'Fortune favors the prepared mind.',
    author: 'Louis Pasteur',
    topics: ['mindset'],
  },
  {
    id: 'frugality-creativity',
    quote: 'Frugality without creativity is deprivation.',
    author: 'Naval Ravikant',
    topics: ['contentment', 'spending'],
  },
  {
    id: 'buffett-impatient-patient',
    quote: 'The stock market is a device for transferring money from the impatient to the patient.',
    author: 'Warren Buffett',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'control-cash-flow',
    quote: 'Control your cash flow, control your freedom.',
    author: 'Morgan Housel',
    topics: ['spending', 'debt'],
  },
  {
    id: 'franklin-penny-saved',
    quote: 'A penny saved is a penny earned.',
    author: 'Benjamin Franklin',
    topics: ['saving'],
  },
  {
    id: 'kiyosaki-financial-freedom',
    quote: 'Financial freedom is available to those who learn about it and work for it.',
    author: 'Robert Kiyosaki',
    topics: ['earning', 'mindset'],
  },
  {
    id: 'munger-spend-less-invest',
    quote: 'Spend less than you make, invest the difference, and be patient.',
    author: 'Charlie Munger',
    topics: ['investing', 'saving'],
  },
  {
    id: 'proverb-plant-a-tree',
    quote: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'epictetus-few-wants',
    quote: 'Wealth consists not in having great possessions, but in having few wants.',
    author: 'Epictetus',
    topics: ['contentment'],
  },
  {
    id: 'edison-overalls',
    quote: 'Opportunity is missed by most people because it is dressed in overalls and looks like work.',
    author: 'Thomas Edison',
    topics: ['earning'],
  },
  {
    id: 'housel-peace-of-mind',
    quote: "It's simple, but it's not easy. True wealth is peace of mind.",
    author: 'Morgan Housel',
    topics: ['contentment'],
  },
  {
    id: 'save-today-saves-tomorrow',
    quote: 'Save money today and money will save you tomorrow.',
    author: 'Financial Wisdom',
    topics: ['saving', 'debt'],
  },
];

const MS_PER_DAY = 86_400_000;
const EPOCH_2000 = Date.UTC(2000, 0, 1);

/** Whole local calendar days since 1 Jan 2000, so DST and the time of day never matter. */
function dayIndex(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.floor((utc - EPOCH_2000) / MS_PER_DAY));
}

/** Small seeded random generator (mulberry32): same seed, same sequence, on every device. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Shuffled order of `count` slots for one round, the same on every call. */
function roundOrder(count: number, round: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  const random = seededRandom(Math.imul(round + 1, 2_654_435_761) ^ count);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The quotes in the chosen topics. No topics (or none valid) means every quote. */
export function getQuotePool(
  topics?: readonly QuoteTopic[] | null,
  quotes: readonly FinancialQuote[] = FINANCIAL_QUOTES,
): readonly FinancialQuote[] {
  const chosen = new Set((topics ?? []).filter(isQuoteTopic));
  if (chosen.size === 0) return quotes;
  const pool = quotes.filter((quote) => quote.topics.some((topic) => chosen.has(topic)));
  return pool.length > 0 ? pool : quotes;
}

/**
 * The quote for a given day. The opening screen, the Home cover and the
 * morning notification all call this, so they always show the same quote.
 *
 * The pool is shuffled once per "round" (one round = one day per quote), so
 * no quote repeats until every quote in the chosen topics has been shown, and
 * each round has a new order. A round never starts with the quote that ended
 * the previous one.
 */
export function getDailyQuote(
  date: Date = new Date(),
  topics?: readonly QuoteTopic[] | null,
  quotes: readonly FinancialQuote[] = FINANCIAL_QUOTES,
): FinancialQuote {
  const pool = getQuotePool(topics, quotes);
  const count = pool.length;
  if (count === 1) return pool[0];

  const day = dayIndex(date);
  const round = Math.floor(day / count);
  const position = day % count;

  const order = roundOrder(count, round);
  if (round > 0) {
    const previous = roundOrder(count, round - 1);
    if (order[0] === previous[count - 1]) {
      [order[0], order[1]] = [order[1], order[0]];
    }
  }
  return pool[order[position]];
}

/** Looks a quote up by its stable id. */
export function getQuoteById(id: string): FinancialQuote | undefined {
  return FINANCIAL_QUOTES.find((quote) => quote.id === id);
}
