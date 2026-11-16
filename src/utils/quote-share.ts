import { Share } from 'react-native';

type ShareableQuote = { quote: string; author: string };

/** The text every "Share quote" button sends, so it reads the same everywhere. */
export function formatQuoteForShare({ quote, author }: ShareableQuote): string {
  return `“${quote}”\n— ${author.toUpperCase()}\n\n💡 Daily Financial Wisdom via CashTrack\nhttps://nasdigital.uk`;
}

/** Opens the system share sheet for a quote. A cancelled sheet is not an error. */
export async function shareQuote(quote: ShareableQuote): Promise<void> {
  try {
    await Share.share({ message: formatQuoteForShare(quote), title: 'CashTrack Wisdom Card' });
  } catch (error) {
    console.error('[cashtrack] Could not share quote', error);
  }
}
