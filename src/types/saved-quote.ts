/**
 * A quote the person saved. Keeps a copy of the text, so a saved quote still
 * shows even if it is later edited or removed from the quote library.
 */
export type SavedQuote = {
  /** The library quote's stable id. */
  id: string;
  quote: string;
  author: string;
  /** ISO date-time the quote was saved. */
  savedAt: string;
};
