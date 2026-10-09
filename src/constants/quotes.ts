export interface FinancialQuote {
  quote: string;
  author: string;
}

export const FINANCIAL_QUOTES: FinancialQuote[] = [
  {
    quote: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
  },
  {
    quote: "Price is what you pay. Value is what you get.",
    author: "Warren Buffett",
  },
  {
    quote: "A budget is telling your money where to go instead of wondering where it went.",
    author: "Dave Ramsey",
  },
  {
    quote: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin",
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    quote: "Wealth is not having a lot of money; it's having a lot of options.",
    author: "Chris Rock",
  },
  {
    quote: "The habit of saving is itself an education; it fosters every virtue, teaches self-denial, and cultivates order.",
    author: "T.T. Munger",
  },
  {
    quote: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    author: "Dave Ramsey",
  },
  {
    quote: "It's not how much money you make, but how much money you keep.",
    author: "Robert Kiyosaki",
  },
  {
    quote: "Money is a terrible master but an excellent servant.",
    author: "P.T. Barnum",
  },
  {
    quote: "Never spend your money before you have earned it.",
    author: "Thomas Jefferson",
  },
  {
    quote: "The quickest way to double your money is to fold it over and put it back in your pocket.",
    author: "Will Rogers",
  },
  {
    quote: "Annual income twenty pounds, annual expenditure nineteen nineteen and six, result happiness.",
    author: "Charles Dickens",
  },
  {
    quote: "Rich people stay rich by living like they're broke. Broke people stay broke by living like they're rich.",
    author: "Naval Ravikant",
  },
  {
    quote: "Do not put all eggs in one basket.",
    author: "Warren Buffett",
  },
  {
    quote: "Small amounts saved daily add up to huge investments over time.",
    author: "Suze Orman",
  },
  {
    quote: "The goal isn't more money. The goal is living life on your terms.",
    author: "Chris Brogan",
  },
  {
    quote: "Every time you spend money, you're casting a vote for the kind of world you want.",
    author: "Anna Lappé",
  },
  {
    quote: "Fortune favors the prepared mind.",
    author: "Louis Pasteur",
  },
  {
    quote: "Frugality without creativity is deprivation.",
    author: "Naval Ravikant",
  },
  {
    quote: "The stock market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
  },
  {
    quote: "Control your cash flow, control your freedom.",
    author: "Morgan Housel",
  },
  {
    quote: "A penny saved is a penny earned.",
    author: "Benjamin Franklin",
  },
  {
    quote: "Financial freedom is available to those who learn about it and work for it.",
    author: "Robert Kiyosaki",
  },
  {
    quote: "Spend less than you make, invest the difference, and be patient.",
    author: "Charlie Munger",
  },
  {
    quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  {
    quote: "Wealth consists not in having great possessions, but in having few wants.",
    author: "Epictetus",
  },
  {
    quote: "Opportunity is missed by most people because it is dressed in overalls and looks like work.",
    author: "Thomas Edison",
  },
  {
    quote: "It's simple, but it's not easy. True wealth is peace of mind.",
    author: "Morgan Housel",
  },
  {
    quote: "Save money today and money will save you tomorrow.",
    author: "Financial Wisdom",
  },
];

/**
 * Returns the deterministic quote of the day for a given date.
 * Both the morning notification and dashboard cover slide use this function
 * to guarantee that the user sees the exact same quote.
 */
export function getQuoteOfTheDay(date: Date = new Date()): FinancialQuote {
  // Use local calendar date representation to determine day index
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Days elapsed since Jan 1, 2000
  const utcDate = Date.UTC(year, month, day);
  const epoch2000 = Date.UTC(2000, 0, 1);
  const dayIndex = Math.floor((utcDate - epoch2000) / (1000 * 60 * 60 * 24));

  const positiveDayIndex = Math.max(0, dayIndex);
  return FINANCIAL_QUOTES[positiveDayIndex % FINANCIAL_QUOTES.length];
}
