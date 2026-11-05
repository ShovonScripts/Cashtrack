/**
 * "Stay in touch" sign-up: validation, clean-up and the payload sent to the
 * Google Sheet. Pure functions only, so they run under the node test runner.
 */

export const NAME_MAX = 50;
export const EMAIL_MAX = 254;
export const PHONE_MAX = 20;

export type SignupInput = {
  name: string;
  email: string;
  phone: string;
  /** Agreed to receive product updates. Never pre-ticked. */
  consent: boolean;
};

export type SignupErrors = Partial<Record<'name' | 'email' | 'phone', string>>;

/** Lowercased, trimmed email. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Keeps a leading + and digits only, so "+880 1712-345 678" becomes
 * "+8801712345678". Empty when nothing usable was typed.
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/\D/g, '');
  return digits ? plus + digits : '';
}

/** Collapses inner whitespace so "  Ada   Lovelace " becomes "Ada Lovelace". */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

// Deliberately simple: one @, something before it, a dot in the domain, no
// spaces. Strict RFC parsing rejects real addresses more often than it helps.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  const value = normalizeEmail(email);
  return value.length <= EMAIL_MAX && EMAIL_PATTERN.test(value);
}

/** 7 to 15 digits (the E.164 range), with an optional leading +. */
export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone).replace('+', '');
  return digits.length >= 7 && digits.length <= 15;
}

/** Name and email are required to join; phone is optional but must be valid if given. */
export function validateSignup(input: SignupInput): SignupErrors {
  const errors: SignupErrors = {};
  const name = normalizeName(input.name);

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > NAME_MAX) errors.name = `Use ${NAME_MAX} characters or fewer.`;

  if (!input.email.trim()) errors.email = 'Enter your email.';
  else if (!isValidEmail(input.email)) errors.email = 'Check the email address, for example name@example.com.';

  if (input.phone.trim() && !isValidPhone(input.phone)) {
    errors.phone = 'Check the number, including the country code, for example +8801712345678.';
  }

  return errors;
}

export function hasErrors(errors: SignupErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** True when the user has typed anything, so "Skip" should become "Join". */
export function hasAnyInput(input: Pick<SignupInput, 'name' | 'email' | 'phone'>): boolean {
  return Boolean(input.name.trim() || input.email.trim() || input.phone.trim());
}

export type SignupPayload = {
  action: 'join' | 'withdraw';
  key: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  country: string;
  platform: string;
  appVersion: string;
  createdAt: string;
};

/** A random install id, so a retry updates the same row instead of adding a duplicate. */
export function createInstallId(random: () => number = Math.random): string {
  const hex = () => Math.floor(random() * 0x10000).toString(16).padStart(4, '0');
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}
