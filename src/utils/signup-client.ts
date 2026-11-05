import type { SignupPayload } from '@/utils/signup';

/**
 * The Google Apps Script web-app URL and shared key, set in `.env`
 * (see scripts/google-sheets/README.md). EXPO_PUBLIC_ values are inlined at
 * build time, so the key only filters casual spam; it is not a secret.
 */
const SIGNUP_URL = process.env.EXPO_PUBLIC_SIGNUP_URL ?? '';
const SIGNUP_KEY = process.env.EXPO_PUBLIC_SIGNUP_KEY ?? '';

const TIMEOUT_MS = 12_000;

export function isSignupConfigured(): boolean {
  return SIGNUP_URL.startsWith('https://');
}

export function getSignupKey(): string {
  return SIGNUP_KEY;
}

/**
 * Posts one payload to the sheet. Resolves true only when the script answers
 * `{ ok: true }`; any network error, timeout or rejection resolves false so the
 * caller keeps the record pending and retries later.
 *
 * The body is sent as text/plain: that keeps it a "simple" request on web (no
 * CORS preflight, which Apps Script cannot answer). The script parses the JSON.
 */
export async function sendSignupPayload(payload: SignupPayload): Promise<boolean> {
  if (!isSignupConfigured()) {
    if (__DEV__) console.warn('[cashtrack] Sign-up not sent: EXPO_PUBLIC_SIGNUP_URL is not set.');
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Apps Script answers with a redirect to the result; fetch follows it.
    const response = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { ok?: boolean };
    return result?.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
