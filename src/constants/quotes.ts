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
    author: 'Proverb',
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
    author: 'CashTrack',
    topics: ['saving', 'debt'],
  },
  {
    id: 'saving-start-small-today',
    quote: 'Start small. A habit you keep beats a plan you never begin.',
    author: 'CashTrack',
    topics: ['saving', 'mindset'],
  },
  {
    id: 'saving-pay-yourself-first',
    quote: 'Pay yourself first. Everything else can wait its turn.',
    author: 'CashTrack',
    topics: ['saving', 'spending'],
  },
  {
    id: 'saving-money-you-never-see',
    quote: 'The easiest money to save is the money you never see.',
    author: 'CashTrack',
    topics: ['saving'],
  },
  {
    id: 'saving-rainy-day',
    quote: 'Save for the rainy day while the sun is still shining.',
    author: 'Proverb',
    topics: ['saving'],
  },
  {
    id: 'saving-many-drops',
    quote: 'Many drops make a river.',
    author: 'Proverb',
    topics: ['saving', 'mindset'],
  },
  {
    id: 'saving-gift-to-future-self',
    quote: 'Every amount you save today is a gift to the person you will be.',
    author: 'CashTrack',
    topics: ['saving', 'mindset'],
  },
  {
    id: 'saving-decide-first',
    quote: 'Saving is not what is left over. It is what you decide first.',
    author: 'CashTrack',
    topics: ['saving', 'spending'],
  },
  {
    id: 'saving-not-in-a-hurry',
    quote: 'Money grows quietly for the person who is not in a hurry.',
    author: 'CashTrack',
    topics: ['saving', 'investing'],
  },
  {
    id: 'saving-skip-one-thing',
    quote: 'Skip one small thing today and you have already saved.',
    author: 'CashTrack',
    topics: ['saving', 'spending'],
  },
  {
    id: 'saving-emergency-calm',
    quote: 'An emergency fund buys something better than things. It buys a calm night.',
    author: 'CashTrack',
    topics: ['saving', 'contentment'],
  },
  {
    id: 'spending-what-are-you-paying-for',
    quote: 'Before you buy, ask what you are really paying for.',
    author: 'CashTrack',
    topics: ['spending', 'mindset'],
  },
  {
    id: 'spending-wait-one-day',
    quote: 'Wait one day. Most wants go quiet on their own.',
    author: 'CashTrack',
    topics: ['spending'],
  },
  {
    id: 'spending-buy-cheap-buy-twice',
    quote: 'Buy cheap, buy twice.',
    author: 'Proverb',
    topics: ['spending'],
  },
  {
    id: 'spending-needs-first',
    quote: 'Needs first, wants after.',
    author: 'CashTrack',
    topics: ['spending'],
  },
  {
    id: 'spending-cannot-fix-unseen',
    quote: 'You cannot fix what you never look at.',
    author: 'CashTrack',
    topics: ['spending', 'mindset'],
  },
  {
    id: 'spending-small-leaks',
    quote: 'A small leak will sink a great ship.',
    author: 'Proverb',
    topics: ['spending', 'saving'],
  },
  {
    id: 'spending-hours-of-your-life',
    quote: 'Every price tag is also a number of hours from your life.',
    author: 'CashTrack',
    topics: ['spending', 'earning'],
  },
  {
    id: 'spending-sale-is-not-saving',
    quote: 'A sale is only a saving if you were going to buy it anyway.',
    author: 'CashTrack',
    topics: ['spending'],
  },
  {
    id: 'spending-budget-is-a-map',
    quote: 'A budget is not a cage. It is a map.',
    author: 'CashTrack',
    topics: ['spending', 'mindset'],
  },
  {
    id: 'spending-money-goes-somewhere',
    quote: 'Money never disappears. It goes somewhere. Find out where.',
    author: 'CashTrack',
    topics: ['spending'],
  },
  {
    id: 'spending-one-less-tap',
    quote: 'One less tap today, one more choice tomorrow.',
    author: 'CashTrack',
    topics: ['spending', 'saving'],
  },
  {
    id: 'spending-live-below-means',
    quote: 'Live below your means and your means will grow.',
    author: 'CashTrack',
    topics: ['spending', 'saving'],
  },
  {
    id: 'investing-time-in-market',
    quote: 'Time in the market beats timing the market.',
    author: 'Proverb',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'investing-buffett-rule-one',
    quote: 'Rule number one: never lose money. Rule number two: never forget rule number one.',
    author: 'Warren Buffett',
    topics: ['investing'],
  },
  {
    id: 'investing-slow-then-sudden',
    quote: 'Compounding is slow, then sudden. Give it years, not weeks.',
    author: 'CashTrack',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'investing-best-time-to-plant',
    quote: 'The best time to plant a tree was twenty years ago. The second best time is now.',
    author: 'Proverb',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'investing-explain-in-one-sentence',
    quote: 'Never invest in something you cannot explain in one sentence.',
    author: 'CashTrack',
    topics: ['investing'],
  },
  {
    id: 'investing-boring-is-good',
    quote: 'Good investing is boring. Excitement is usually expensive.',
    author: 'CashTrack',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'investing-small-and-often',
    quote: 'Small amounts invested often beat large amounts invested never.',
    author: 'CashTrack',
    topics: ['investing', 'saving'],
  },
  {
    id: 'investing-patience-is-cheap',
    quote: 'Patience is the cheapest thing you can bring to money.',
    author: 'CashTrack',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'investing-risk-not-knowing',
    quote: 'Risk comes from not knowing what you are doing.',
    author: 'Warren Buffett',
    topics: ['investing', 'mindset'],
  },
  {
    id: 'investing-share-of-a-business',
    quote: 'You are not buying a share. You are buying a share of a business.',
    author: 'CashTrack',
    topics: ['investing'],
  },
  {
    id: 'debt-out-of-danger',
    quote: 'Out of debt, out of danger.',
    author: 'Proverb',
    topics: ['debt'],
  },
  {
    id: 'debt-smallest-first',
    quote: 'Clear the smallest debt first. Winning once makes winning easier.',
    author: 'CashTrack',
    topics: ['debt', 'mindset'],
  },
  {
    id: 'debt-interest-never-sleeps',
    quote: 'Interest never sleeps, never takes a holiday, and never forgets.',
    author: 'CashTrack',
    topics: ['debt'],
  },
  {
    id: 'debt-stop-digging',
    quote: 'If you find yourself in a hole, stop digging.',
    author: 'Proverb',
    topics: ['debt', 'spending'],
  },
  {
    id: 'debt-minimum-keeps-the-debt',
    quote: 'Paying only the minimum keeps the debt, not the promise.',
    author: 'CashTrack',
    topics: ['debt'],
  },
  {
    id: 'debt-free-is-a-raise',
    quote: 'The day your debt ends, you give yourself a raise.',
    author: 'CashTrack',
    topics: ['debt', 'earning'],
  },
  {
    id: 'debt-borrow-for-what-lasts',
    quote: 'Borrow only for things that last longer than the loan.',
    author: 'CashTrack',
    topics: ['debt', 'spending'],
  },
  {
    id: 'debt-write-the-number-down',
    quote: 'Write the full number down. Debt shrinks once you can see it.',
    author: 'CashTrack',
    topics: ['debt', 'mindset'],
  },
  {
    id: 'debt-one-extra-payment',
    quote: 'One extra payment a year can cut years off a loan.',
    author: 'CashTrack',
    topics: ['debt', 'saving'],
  },
  {
    id: 'debt-stop-adding',
    quote: 'The fastest way out of debt is to stop adding to it.',
    author: 'CashTrack',
    topics: ['debt', 'spending'],
  },
  {
    id: 'debt-short-reckonings',
    quote: 'Short reckonings make long friends.',
    author: 'Proverb',
    topics: ['debt', 'giving'],
  },
  {
    id: 'debt-nothing-lighter',
    quote: 'Nothing feels lighter than money you no longer owe.',
    author: 'CashTrack',
    topics: ['debt', 'contentment'],
  },
  {
    id: 'debt-plan-beats-worry',
    quote: 'Worry has never paid a bill. A plan has.',
    author: 'CashTrack',
    topics: ['debt', 'mindset'],
  },
  {
    id: 'debt-next-months-money',
    quote: 'Credit is not extra money. It is next month’s money, spent early.',
    author: 'CashTrack',
    topics: ['debt', 'spending'],
  },
  {
    id: 'debt-ask-for-better-terms',
    quote: 'Ask for better terms. The worst answer is the one you already have.',
    author: 'CashTrack',
    topics: ['debt'],
  },
  {
    id: 'debt-mark-the-last-payment',
    quote: 'Mark the day you make the last payment. You earned it.',
    author: 'CashTrack',
    topics: ['debt', 'mindset'],
  },
  {
    id: 'earning-sharpen-the-skill',
    quote: 'Sharpen the skill and the pay follows.',
    author: 'CashTrack',
    topics: ['earning', 'mindset'],
  },
  {
    id: 'earning-one-thing-well',
    quote: 'Learn one thing well enough to be paid for it.',
    author: 'CashTrack',
    topics: ['earning'],
  },
  {
    id: 'earning-rope-and-net',
    quote: 'One income is a rope. Two is a net.',
    author: 'CashTrack',
    topics: ['earning', 'saving'],
  },
  {
    id: 'earning-show-up-again',
    quote: 'Most of success is showing up again tomorrow.',
    author: 'CashTrack',
    topics: ['earning', 'mindset'],
  },
  {
    id: 'earning-be-worth-more',
    quote: 'Earn more by being worth more, not by hoping for more.',
    author: 'CashTrack',
    topics: ['earning'],
  },
  {
    id: 'earning-name-your-price',
    quote: 'If you never name your price, someone else will.',
    author: 'CashTrack',
    topics: ['earning'],
  },
  {
    id: 'earning-todays-work',
    quote: 'Today’s work is tomorrow’s harvest.',
    author: 'Proverb',
    topics: ['earning', 'investing'],
  },
  {
    id: 'earning-take-the-stairs',
    quote: 'There is no lift to the top. You have to take the stairs.',
    author: 'Proverb',
    topics: ['earning', 'mindset'],
  },
  {
    id: 'earning-one-paid-hour',
    quote: 'A second income starts with one paid hour.',
    author: 'CashTrack',
    topics: ['earning'],
  },
  {
    id: 'earning-reputation-works',
    quote: 'Your reputation keeps working while you sleep.',
    author: 'CashTrack',
    topics: ['earning'],
  },
  {
    id: 'earning-time-is-capital',
    quote: 'Time is the one capital everybody starts with.',
    author: 'CashTrack',
    topics: ['earning', 'mindset'],
  },
  {
    id: 'earning-raise-your-floor',
    quote: 'Skills raise your floor, not just your ceiling.',
    author: 'CashTrack',
    topics: ['earning'],
  },
  {
    id: 'earning-finished-work-pays',
    quote: 'Finished work pays. Almost finished does not.',
    author: 'CashTrack',
    topics: ['earning', 'mindset'],
  },
  {
    id: 'earning-ask-for-it',
    quote: 'Nobody hands you what you never asked for.',
    author: 'CashTrack',
    topics: ['earning'],
  },
  {
    id: 'earning-keep-learning',
    quote: 'The day you stop learning is the day your income stops growing.',
    author: 'CashTrack',
    topics: ['earning', 'mindset'],
  },
  {
    id: 'mindset-money-is-a-tool',
    quote: 'Money is a tool, not a scoreboard.',
    author: 'CashTrack',
    topics: ['mindset', 'contentment'],
  },
  {
    id: 'mindset-habits-beat-luck',
    quote: 'Habits beat luck over a long enough time.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'mindset-small-step-daily',
    quote: 'A small step every day beats a big leap once a year.',
    author: 'CashTrack',
    topics: ['mindset', 'saving'],
  },
  {
    id: 'mindset-start-before-ready',
    quote: 'Start before you feel ready. Ready comes later.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'mindset-discipline-is-kindness',
    quote: 'Discipline today is kindness to yourself tomorrow.',
    author: 'CashTrack',
    topics: ['mindset', 'saving'],
  },
  {
    id: 'mindset-compare-to-your-plan',
    quote: 'Compare your money to your plan, not to other people.',
    author: 'CashTrack',
    topics: ['mindset', 'contentment'],
  },
  {
    id: 'mindset-mistakes-are-tuition',
    quote: 'A mistake you learn from is tuition, not loss.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'mindset-know-your-why',
    quote: 'Know why you are saving and the how gets easier.',
    author: 'CashTrack',
    topics: ['mindset', 'saving'],
  },
  {
    id: 'mindset-progress-not-perfection',
    quote: 'Progress, not perfection. Perfection never starts.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'mindset-choose-your-hard',
    quote: 'Choose your hard: saving now, or struggling later.',
    author: 'CashTrack',
    topics: ['mindset', 'saving'],
  },
  {
    id: 'mindset-one-decision-away',
    quote: 'You are always one decision away from a better month.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'mindset-calm-beats-clever',
    quote: 'Calm decisions make better money than clever ones.',
    author: 'CashTrack',
    topics: ['mindset', 'investing'],
  },
  {
    id: 'mindset-your-own-plan',
    quote: 'A plan you made yourself is a plan you will keep.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'mindset-slow-is-still-progress',
    quote: 'Slow progress is still progress. Stopping is not.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'mindset-look-weekly',
    quote: 'Look at your money every week and it will stop surprising you.',
    author: 'CashTrack',
    topics: ['mindset', 'spending'],
  },
  {
    id: 'mindset-begin-again',
    quote: 'Missed a month? Begin again. The plan is not broken.',
    author: 'CashTrack',
    topics: ['mindset'],
  },
  {
    id: 'giving-what-you-can',
    quote: 'Give what you can, where you are, with what you have.',
    author: 'CashTrack',
    topics: ['giving'],
  },
  {
    id: 'giving-kindness-returns',
    quote: 'Kindness is the one spend that always comes back.',
    author: 'CashTrack',
    topics: ['giving', 'contentment'],
  },
  {
    id: 'giving-no-gift-too-small',
    quote: 'No gift is too small for the person who receives it.',
    author: 'CashTrack',
    topics: ['giving'],
  },
  {
    id: 'giving-on-purpose',
    quote: 'Be generous on purpose, not by accident.',
    author: 'CashTrack',
    topics: ['giving', 'spending'],
  },
  {
    id: 'giving-harvest-shared',
    quote: 'A harvest shared is a harvest doubled.',
    author: 'Proverb',
    topics: ['giving'],
  },
  {
    id: 'giving-time-is-a-gift',
    quote: 'Sometimes the best thing you can give is your time.',
    author: 'CashTrack',
    topics: ['giving', 'contentment'],
  },
  {
    id: 'giving-put-it-in-the-budget',
    quote: 'Put giving in the budget and it will never be an afterthought.',
    author: 'CashTrack',
    topics: ['giving', 'spending'],
  },
  {
    id: 'giving-no-conditions',
    quote: 'A gift with conditions is a trade.',
    author: 'CashTrack',
    topics: ['giving'],
  },
  {
    id: 'giving-teach-someone',
    quote: 'Teach someone what you learned about money. It costs nothing.',
    author: 'CashTrack',
    topics: ['giving', 'mindset'],
  },
  {
    id: 'giving-lift-as-you-climb',
    quote: 'Lift as you climb.',
    author: 'Proverb',
    topics: ['giving', 'earning'],
  },
  {
    id: 'giving-quiet-giving',
    quote: 'The best giving makes no noise.',
    author: 'CashTrack',
    topics: ['giving'],
  },
  {
    id: 'giving-people-to-help',
    quote: 'Anyone with people to help is already rich.',
    author: 'CashTrack',
    topics: ['giving', 'contentment'],
  },
  {
    id: 'giving-need-not-be-wealthy',
    quote: 'You do not need to be wealthy to be generous.',
    author: 'CashTrack',
    topics: ['giving'],
  },
  {
    id: 'giving-thanks-first',
    quote: 'Give thanks before you give anything else.',
    author: 'CashTrack',
    topics: ['giving', 'contentment'],
  },
  {
    id: 'giving-leave-it-better',
    quote: 'Leave every place a little better than you found it.',
    author: 'Proverb',
    topics: ['giving'],
  },
  {
    id: 'contentment-decide-enough',
    quote: 'Decide what enough means to you, or the world will decide for you.',
    author: 'CashTrack',
    topics: ['contentment', 'mindset'],
  },
  {
    id: 'contentment-needing-less',
    quote: 'Wealth is not having more. It is needing less.',
    author: 'CashTrack',
    topics: ['contentment'],
  },
  {
    id: 'contentment-count-what-you-have',
    quote: 'Count what you have before you count what you want.',
    author: 'CashTrack',
    topics: ['contentment'],
  },
  {
    id: 'contentment-quiet-life',
    quote: 'A quiet life with no debt is its own kind of wealth.',
    author: 'CashTrack',
    topics: ['contentment', 'debt'],
  },
  {
    id: 'contentment-water-the-grass',
    quote: 'The grass is greener where you water it.',
    author: 'Proverb',
    topics: ['contentment', 'mindset'],
  },
  {
    id: 'contentment-best-things-free',
    quote: 'The best part of most days costs nothing.',
    author: 'CashTrack',
    topics: ['contentment'],
  },
  {
    id: 'contentment-not-a-race',
    quote: 'It is your life, not a race. There is no prize for finishing first.',
    author: 'CashTrack',
    topics: ['contentment', 'mindset'],
  },
  {
    id: 'contentment-gratitude-is-enough',
    quote: 'Gratitude turns what you have into enough.',
    author: 'Proverb',
    topics: ['contentment'],
  },
  {
    id: 'contentment-simple-pleasures',
    quote: 'Simple pleasures last longer than expensive ones.',
    author: 'CashTrack',
    topics: ['contentment', 'spending'],
  },
  {
    id: 'contentment-peace-over-price',
    quote: 'Choose peace of mind over the price tag.',
    author: 'CashTrack',
    topics: ['contentment', 'spending'],
  },
  {
    id: 'contentment-not-today',
    quote: 'You do not have to solve your whole life today.',
    author: 'CashTrack',
    topics: ['contentment', 'mindset'],
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
