import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  APP_LOCK_BACKGROUND_TIMEOUT_MS,
  appLockErrorNeedsDeviceSetup,
  describeAppLockAuthError,
  parseAppLockFlag,
  resolveAppLockAvailability,
  resolveInitialAppLockEnabled,
  shouldLockAfterBackground,
} from '../src/utils/app-lock.ts';

describe('shouldLockAfterBackground', () => {
  it('locks when enabled and the timeout has elapsed', () => {
    assert.equal(shouldLockAfterBackground(true, APP_LOCK_BACKGROUND_TIMEOUT_MS), true);
    assert.equal(shouldLockAfterBackground(true, APP_LOCK_BACKGROUND_TIMEOUT_MS + 1), true);
  });

  it('keeps the app unlocked during the grace period', () => {
    assert.equal(shouldLockAfterBackground(true, APP_LOCK_BACKGROUND_TIMEOUT_MS - 1), false);
  });

  it('never locks when the setting is off or elapsed time is invalid', () => {
    assert.equal(shouldLockAfterBackground(false, APP_LOCK_BACKGROUND_TIMEOUT_MS), false);
    assert.equal(shouldLockAfterBackground(true, Number.NaN), false);
  });

  it('accepts a custom timeout', () => {
    assert.equal(shouldLockAfterBackground(true, 5_000, 5_000), true);
    assert.equal(shouldLockAfterBackground(true, 4_999, 5_000), false);
  });
});

describe('resolveAppLockAvailability', () => {
  it('is unsupported on web', () => {
    assert.equal(resolveAppLockAvailability(true, 3), 'unsupported');
  });

  it('requires an enrolled device lock', () => {
    assert.equal(resolveAppLockAvailability(false, 0), 'not-enrolled');
    assert.equal(resolveAppLockAvailability(false, 1), 'available');
    assert.equal(resolveAppLockAvailability(false, 2), 'available');
    assert.equal(resolveAppLockAvailability(false, 3), 'available');
  });
});

describe('resolveInitialAppLockEnabled', () => {
  it('prefers the dedicated App Lock key', () => {
    assert.equal(resolveInitialAppLockEnabled(true, false, false), true);
    assert.equal(resolveInitialAppLockEnabled(false, true, false), false);
  });

  it('falls back to preferences when the dedicated key is missing', () => {
    assert.equal(resolveInitialAppLockEnabled(null, true, false), true);
    assert.equal(resolveInitialAppLockEnabled(null, false, false), false);
  });

  it('fails closed when preferences failed and the key is unavailable', () => {
    assert.equal(resolveInitialAppLockEnabled(null, false, true), true);
    assert.equal(resolveInitialAppLockEnabled(undefined, false, true), true);
  });
});

describe('parseAppLockFlag', () => {
  it('reads explicit true and false values', () => {
    assert.equal(parseAppLockFlag('true'), true);
    assert.equal(parseAppLockFlag('false'), false);
  });

  it('treats a missing key as missing and corrupt data as enabled', () => {
    assert.equal(parseAppLockFlag(null), null);
    assert.equal(parseAppLockFlag('corrupt'), true);
  });
});

describe('describeAppLockAuthError', () => {
  it('stays quiet when the user cancels', () => {
    assert.equal(describeAppLockAuthError(undefined), null);
    assert.equal(describeAppLockAuthError('user_cancel'), null);
    assert.equal(describeAppLockAuthError('app_cancel'), null);
    assert.equal(describeAppLockAuthError('system_cancel'), null);
    assert.equal(describeAppLockAuthError('user_fallback'), null);
  });

  it('explains missing or unavailable device security', () => {
    assert.match(describeAppLockAuthError('not_enrolled') ?? '', /screen lock/i);
    assert.match(describeAppLockAuthError('passcode_not_set') ?? '', /screen lock/i);
    assert.match(describeAppLockAuthError('not_available') ?? '', /screen lock/i);
    assert.match(describeAppLockAuthError('lockout') ?? '', /Too many attempts/i);
  });

  it('falls back to a retry message', () => {
    assert.match(describeAppLockAuthError('unknown') ?? '', /try again/i);
    assert.match(describeAppLockAuthError('authentication_failed') ?? '', /try again/i);
  });
});

describe('appLockErrorNeedsDeviceSetup', () => {
  it('recognises errors that only the device settings can fix', () => {
    assert.equal(appLockErrorNeedsDeviceSetup('not_enrolled'), true);
    assert.equal(appLockErrorNeedsDeviceSetup('passcode_not_set'), true);
    assert.equal(appLockErrorNeedsDeviceSetup('not_available'), true);
    assert.equal(appLockErrorNeedsDeviceSetup('user_cancel'), false);
    assert.equal(appLockErrorNeedsDeviceSetup('lockout'), false);
  });
});
