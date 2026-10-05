import type { ExpenseCategory } from '@/types/expense';

/** Fixed accents for built-in categories, selected to stay legible in both themes. */
export const CategoryColors: Partial<Record<ExpenseCategory, string>> = {
  Food: '#F2994A',
  Transport: '#2D9CDB',
  Shopping: '#BB6BD9',
  Bills: '#EB5757',
  Health: '#27AE60',
  Entertainment: '#F2C94C',
  Other: '#828282',
};

const CUSTOM_PALETTE = ['#7667F2', '#159A8C', '#D45C85', '#C17A24', '#5077C8', '#87953B'];

/** Give user-created categories a stable accent without storing presentation data. */
export function getCategoryColor(category: ExpenseCategory): string {
  const builtIn = CategoryColors[category];
  if (builtIn) return builtIn;

  let hash = 0;
  for (let index = 0; index < category.length; index += 1) {
    hash = (hash * 31 + category.charCodeAt(index)) | 0;
  }
  return CUSTOM_PALETTE[Math.abs(hash) % CUSTOM_PALETTE.length];
}

export const ICON_PACK = [
  // Food & Dining
  { name: 'silverware-fork-knife', label: 'Dining' },
  { name: 'cup', label: 'Coffee & Drinks' },
  { name: 'pizza', label: 'Fast Food' },
  { name: 'store', label: 'Groceries' },

  // Transport & Travel
  { name: 'car', label: 'Car' },
  { name: 'plane', label: 'Flight & Travel' },
  { name: 'bus', label: 'Public Transit' },
  { name: 'gas-station', label: 'Fuel' },

  // Shopping & Lifestyle
  { name: 'shopping', label: 'Shopping' },
  { name: 'cart', label: 'Market' },
  { name: 'tshirt-crew', label: 'Clothing' },
  { name: 'gift', label: 'Gifts' },

  // Electronics & Gadgets
  { name: 'cellphone', label: 'Phone' },
  { name: 'laptop', label: 'Tech' },
  { name: 'wifi', label: 'Internet' },
  { name: 'gamepad-variant', label: 'Gaming' },

  // Home & Bills
  { name: 'home', label: 'Housing' },
  { name: 'flash', label: 'Electricity' },
  { name: 'water', label: 'Utilities' },
  { name: 'wrench', label: 'Maintenance' },

  // Health & Personal Care
  { name: 'heart', label: 'Health' },
  { name: 'pill', label: 'Pharmacy' },
  { name: 'dumbbell', label: 'Fitness' },
  { name: 'hospital-building', label: 'Medical' },

  // Leisure & Media
  { name: 'ticket', label: 'Entertainment' },
  { name: 'movie-open', label: 'Movies' },
  { name: 'music', label: 'Music & Subscriptions' },
  { name: 'beach', label: 'Vacation' },

  // Finance & Business
  { name: 'credit-card', label: 'Credit Card' },
  { name: 'cash-multiple', label: 'Cash' },
  { name: 'bank', label: 'Banking' },
  { name: 'piggy-bank', label: 'Savings' },
  { name: 'briefcase', label: 'Work' },

  // Education & Family
  { name: 'book', label: 'Education' },
  { name: 'school', label: 'School' },
  { name: 'baby-carriage', label: 'Family & Kids' },
  { name: 'dog', label: 'Pets' },

  // General & Tags
  { name: 'tag', label: 'General Tag' },
  { name: 'star', label: 'Important' },
  { name: 'diamond', label: 'Luxury' },
  { name: 'shield-check', label: 'Insurance' },
];

const DEFAULT_ICONS: Record<string, string> = {
  Food: 'silverware-fork-knife',
  Transport: 'car',
  Shopping: 'shopping',
  Bills: 'flash',
  Health: 'heart',
  Entertainment: 'ticket',
  Other: 'tag',
};

export function getCategorySymbolName(category: ExpenseCategory, customIcons?: Record<string, string>): string {
  if (customIcons && customIcons[category]) {
    return customIcons[category];
  }
  return DEFAULT_ICONS[category] || 'tag';
}
