export type Currency = {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number; // Exchange rate relative to 1 USD
};

export const CURRENCIES: Currency[] = [
  // Major & High Population Countries
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1.0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToUSD: 83.5 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateToUSD: 7.25 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rateToUSD: 16250.0 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rateToUSD: 278.5 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rateToUSD: 1480.0 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rateToUSD: 5.45 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rateToUSD: 117.5 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rateToUSD: 91.5 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', rateToUSD: 18.2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rateToUSD: 58.2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rateToUSD: 25450.0 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rateToUSD: 48.2 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', rateToUSD: 57.5 },

  // Major Global Currencies & Economies
  { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToUSD: 0.79 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToUSD: 155.0 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rateToUSD: 1380.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rateToUSD: 1.37 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToUSD: 1.51 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rateToUSD: 0.90 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToUSD: 1.35 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rateToUSD: 32.8 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rateToUSD: 18.4 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rateToUSD: 36.7 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rateToUSD: 4.72 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rateToUSD: 3.75 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateToUSD: 3.67 },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$', rateToUSD: 905.0 },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COL$', rateToUSD: 4120.0 },
];

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  const fromCurr = CURRENCIES.find((c) => c.code === fromCode) || CURRENCIES[0];
  const toCurr = CURRENCIES.find((c) => c.code === toCode) || CURRENCIES[1];

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromCurr.rateToUSD;
  const converted = amountInUSD * toCurr.rateToUSD;

  return Number(converted.toFixed(4));
}
