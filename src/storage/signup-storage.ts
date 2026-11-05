import AsyncStorage from '@react-native-async-storage/async-storage';

export const SIGNUP_STORAGE_KEY = '@cashtrack/signup';

/**
 *   pending           saved on the phone, not yet received by the sheet
 *   sent              the sheet confirmed it
 *   withdraw-pending  the user withdrew; the deletion request is not yet received
 *   withdrawn         the sheet confirmed the details were deleted
 */
export type SignupStatus = 'pending' | 'sent' | 'withdraw-pending' | 'withdrawn';

export type SignupRecord = {
  id: string;
  status: SignupStatus;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  country: string;
  createdAt: string;
  sentAt?: string;
};

const STATUSES: readonly SignupStatus[] = ['pending', 'sent', 'withdraw-pending', 'withdrawn'];

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

/** Accepts only a well-formed record; anything else reads as "never signed up". */
export function sanitizeSignupRecord(raw: unknown): SignupRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 64);
  const status = STATUSES.includes(r.status as SignupStatus) ? (r.status as SignupStatus) : null;
  if (!id || !status) return null;
  return {
    id,
    status,
    name: str(r.name, 50),
    email: str(r.email, 254),
    phone: str(r.phone, 20),
    consent: r.consent === true,
    country: str(r.country, 8),
    createdAt: str(r.createdAt, 40),
    sentAt: typeof r.sentAt === 'string' ? r.sentAt.slice(0, 40) : undefined,
  };
}

export async function readSignupRecord(): Promise<SignupRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(SIGNUP_STORAGE_KEY);
    return raw ? sanitizeSignupRecord(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function writeSignupRecord(record: SignupRecord): Promise<void> {
  await AsyncStorage.setItem(SIGNUP_STORAGE_KEY, JSON.stringify(record));
}
