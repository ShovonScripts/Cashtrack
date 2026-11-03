/**
 * Money is stored as a decimal number, so every calculation is exposed to
 * binary floating-point drift. These helpers round at the boundaries where
 * amounts are written, summed or displayed; they are the single place that
 * decides how many decimal places a monetary value has.
 */

const MONEY_DECIMALS = 2;
const MONEY_SCALE = 10 ** MONEY_DECIMALS;

/** Rounds a monetary value to two decimal places. Non-finite values become 0. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * MONEY_SCALE) / MONEY_SCALE;
}

/** Converts a decimal amount to integer minor units (cents). */
export function toMinorUnits(value: number): number {
  return Math.round(roundMoney(value) * MONEY_SCALE);
}

/** Converts integer minor units (cents) back to a decimal amount. */
export function fromMinorUnits(units: number): number {
  return roundMoney(units / MONEY_SCALE);
}

/** Adds amounts in integer minor units so repeated additions cannot drift. */
export function sumMoney(values: Iterable<number>): number {
  let totalMinorUnits = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    totalMinorUnits += toMinorUnits(value);
  }
  return fromMinorUnits(totalMinorUnits);
}

/** Subtracts two amounts in integer minor units. */
export function subtractMoney(minuend: number, subtrahend: number): number {
  return fromMinorUnits(toMinorUnits(minuend) - toMinorUnits(subtrahend));
}
