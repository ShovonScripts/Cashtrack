export const APP_LOCK_BACKGROUND_TIMEOUT_MS = 30_000;

export type AppLockAvailability = 'checking' | 'available' | 'not-enrolled' | 'unsupported' | 'error';

export function shouldLockAfterBackground(
  enabled: boolean,
  backgroundDurationMs: number,
  timeoutMs = APP_LOCK_BACKGROUND_TIMEOUT_MS,
): boolean {
  return enabled && backgroundDurationMs >= timeoutMs;
}

export function resolveAppLockAvailability(isWeb: boolean, enrolledLevel: number): AppLockAvailability {
  if (isWeb) return 'unsupported';
  return enrolledLevel > 0 ? 'available' : 'not-enrolled';
}

/**
 * Resolves the persisted App Lock flag. The dedicated key wins over preferences
 * so a corrupt preferences read cannot silently turn the lock off. If neither
 * value can be trusted after a preferences failure, fail closed.
 */
export function resolveInitialAppLockEnabled(
  stored: boolean | null | undefined,
  preferencesEnabled: boolean,
  preferencesFailed: boolean,
): boolean {
  if (typeof stored === 'boolean') return stored;
  return preferencesFailed ? true : preferencesEnabled;
}

/**
 * Parses the dedicated App Lock value. A missing key is null, but an
 * unrecognised value fails closed so a damaged flag cannot bypass the lock.
 */
export function parseAppLockFlag(raw: string | null): boolean | null {
  if (raw === null) return null;
  return raw !== 'false';
}

export function appLockErrorNeedsDeviceSetup(error: string | undefined): boolean {
  return error === 'not_enrolled' || error === 'passcode_not_set' || error === 'not_available';
}

export function describeAppLockAuthError(error: string | undefined): string | null {
  switch (error) {
    case undefined:
    case 'user_cancel':
    case 'app_cancel':
    case 'system_cancel':
    case 'user_fallback':
      return null;
    case 'lockout':
      return 'Too many attempts. Try again later or use your device passcode.';
    case 'not_enrolled':
    case 'passcode_not_set':
    case 'not_available':
      return 'Set up a screen lock on your device to use App Lock.';
    default:
      return 'Could not verify your identity. Please try again.';
  }
}
