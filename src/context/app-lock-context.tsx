import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Keyboard, Platform } from 'react-native';

import { usePreferences } from '@/context/expense-context';
import { saveAppLockFlag } from '@/storage/app-lock-storage';
import {
  appLockErrorNeedsDeviceSetup,
  describeAppLockAuthError,
  resolveAppLockAvailability,
  shouldLockAfterBackground,
  type AppLockAvailability,
} from '@/utils/app-lock';

type AppLockActionResult = { ok: true } | { ok: false; reason: string };

type AppLockContextValue = {
  enabled: boolean;
  isLocked: boolean;
  isAuthenticating: boolean;
  isPrivacyCovered: boolean;
  availability: AppLockAvailability;
  authError: string | null;
  authNeedsDeviceSetup: boolean;
  setEnabled: (enabled: boolean) => Promise<AppLockActionResult>;
  unlock: () => Promise<boolean>;
  lockNow: () => void;
  disableForUnavailableDevice: () => Promise<AppLockActionResult>;
  refreshAvailability: () => Promise<AppLockAvailability>;
};

const AppLockContext = createContext<AppLockContextValue | undefined>(undefined);

type AuthenticationOutcome = { success: boolean; reason: string | null };

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { appLockEnabled, setAppLockEnabled } = usePreferences();
  const native = Platform.OS !== 'web';
  const enabled = appLockEnabled && native;
  const [isLocked, setIsLocked] = useState(appLockEnabled && native);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isPrivacyCovered, setIsPrivacyCovered] = useState(false);
  const [availability, setAvailability] = useState<AppLockAvailability>(
    native ? 'checking' : 'unsupported',
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNeedsDeviceSetup, setAuthNeedsDeviceSetup] = useState(false);

  const enabledRef = useRef(enabled);
  const authenticatingRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);
  const pendingBackgroundAtRef = useRef<number | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const refreshAvailability = useCallback(async (): Promise<AppLockAvailability> => {
    if (!native) {
      setAvailability('unsupported');
      return 'unsupported';
    }
    try {
      const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
      const next = resolveAppLockAvailability(false, enrolledLevel);
      setAvailability(next);
      return next;
    } catch (error) {
      console.error('[cashtrack] Failed to check device authentication availability', error);
      setAvailability('error');
      return 'error';
    }
  }, [native]);

  useEffect(() => {
    if (!native) return;
    const timer = setTimeout(() => {
      void refreshAvailability();
    }, 0);
    return () => clearTimeout(timer);
  }, [native, refreshAvailability]);

  const completeReturn = useCallback((authSucceeded: boolean | null) => {
    const awayAt = backgroundedAtRef.current ?? pendingBackgroundAtRef.current;
    backgroundedAtRef.current = null;
    pendingBackgroundAtRef.current = null;

    if (
      enabledRef.current &&
      awayAt !== null &&
      authSucceeded !== true &&
      shouldLockAfterBackground(true, Date.now() - awayAt)
    ) {
      Keyboard.dismiss();
      if (authSucceeded === null) {
        setAuthError(null);
        setAuthNeedsDeviceSetup(false);
      }
      setIsLocked(true);
    }
    setIsPrivacyCovered(false);
  }, []);

  const runAuthentication = useCallback(async (promptMessage: string): Promise<AuthenticationOutcome> => {
    if (!native) {
      const reason = 'App Lock is only available in the mobile app.';
      setAuthError(reason);
      return { success: false, reason };
    }
    if (authenticatingRef.current) {
      const reason = 'Authentication is already in progress.';
      setAuthError(reason);
      return { success: false, reason };
    }

    authenticatingRef.current = true;
    setIsAuthenticating(true);
    setAuthError(null);

    let outcome: AuthenticationOutcome;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        promptDescription: 'Confirm it is you to continue.',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        backgroundedAtRef.current = null;
        pendingBackgroundAtRef.current = null;
        setAuthNeedsDeviceSetup(false);
        outcome = { success: true, reason: null };
      } else {
        const needsSetup = appLockErrorNeedsDeviceSetup(result.error);
        setAuthNeedsDeviceSetup(needsSetup);
        if (needsSetup) void refreshAvailability();
        const reason = describeAppLockAuthError(result.error);
        if (reason) setAuthError(reason);
        outcome = { success: false, reason };
      }
    } catch (error) {
      console.error('[cashtrack] Device authentication failed', error);
      setAuthNeedsDeviceSetup(false);
      const reason = 'Could not verify your identity. Please try again.';
      setAuthError(reason);
      outcome = { success: false, reason };
    } finally {
      authenticatingRef.current = false;
      setIsAuthenticating(false);
      if (backgroundedAtRef.current === null && pendingBackgroundAtRef.current === null) {
        setIsPrivacyCovered(false);
      }
    }

    if (pendingBackgroundAtRef.current !== null) {
      completeReturn(outcome.success);
    }

    return outcome;
  }, [completeReturn, native, refreshAvailability]);

  const unlock = useCallback(async () => {
    const result = await runAuthentication('Unlock CashTrack');
    if (result.success) {
      backgroundedAtRef.current = null;
      pendingBackgroundAtRef.current = null;
      setIsLocked(false);
      setIsPrivacyCovered(false);
      setAuthError(null);
      setAuthNeedsDeviceSetup(false);
    }
    return result.success;
  }, [runAuthentication]);

  const persistEnabled = useCallback(async (next: boolean): Promise<AppLockActionResult> => {
    try {
      await saveAppLockFlag(next);
    } catch (error) {
      console.error('[cashtrack] Failed to save the App Lock setting', error);
      const reason = 'Could not save the App Lock setting. Please try again.';
      setAuthError(reason);
      return { ok: false, reason };
    }

    enabledRef.current = next;
    setAppLockEnabled(next);
    setIsLocked(false);
    setIsPrivacyCovered(false);
    setAuthError(null);
    setAuthNeedsDeviceSetup(false);
    backgroundedAtRef.current = null;
    pendingBackgroundAtRef.current = null;
    return { ok: true };
  }, [setAppLockEnabled]);

  const setEnabled = useCallback(async (next: boolean): Promise<AppLockActionResult> => {
    const currentAvailability = await refreshAvailability();
    if (next) {
      if (currentAvailability === 'unsupported') {
        return { ok: false, reason: 'App Lock is only available in the mobile app.' };
      }
      if (currentAvailability === 'error') {
        return { ok: false, reason: 'Could not check device security. Please try again.' };
      }
      if (currentAvailability !== 'available') {
        return { ok: false, reason: 'Set up a screen lock on your device before turning on App Lock.' };
      }
    } else {
      if (currentAvailability === 'unsupported') {
        return persistEnabled(false);
      }
      // Turning the lock off must always prove identity. If the device check
      // itself failed or was cancelled, keep the lock on (fail closed). Users
      // whose device security was removed can still unlock via the recovery
      // action on the lock screen.
      const result = await runAuthentication('Turn off App Lock');
      if (!result.success) {
        return { ok: false, reason: result.reason ?? 'Authentication was cancelled.' };
      }
      return persistEnabled(false);
    }

    const result = await runAuthentication('Turn on App Lock');
    if (!result.success) {
      return { ok: false, reason: result.reason ?? 'Authentication was cancelled.' };
    }

    return persistEnabled(next);
  }, [persistEnabled, refreshAvailability, runAuthentication]);

  const disableForUnavailableDevice = useCallback(
    () => persistEnabled(false),
    [persistEnabled],
  );

  const lockNow = useCallback(() => {
    if (enabledRef.current && native) {
      Keyboard.dismiss();
      setAuthError(null);
      setAuthNeedsDeviceSetup(false);
      setIsPrivacyCovered(false);
      setIsLocked(true);
    }
  }, [native]);

  useEffect(() => {
    const showCover = () => {
      if (enabledRef.current) setIsPrivacyCovered(true);
    };

    const markBackground = () => {
      showCover();
      if (enabledRef.current && backgroundedAtRef.current === null) {
        backgroundedAtRef.current = Date.now();
      }
    };

    const handleForeground = () => {
      if (authenticatingRef.current) {
        if (backgroundedAtRef.current !== null) {
          pendingBackgroundAtRef.current = backgroundedAtRef.current;
          backgroundedAtRef.current = null;
        }
        return;
      }
      completeReturn(null);
    };

    const changeSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        handleForeground();
      } else if (nextState === 'background') {
        markBackground();
      } else if (nextState === 'inactive') {
        // Control Center, permission dialogs and native pickers make the app
        // inactive but do not mean the user left. Cover the screen, but do not
        // start the auto-lock timer until the app is actually backgrounded.
        showCover();
      }
    });

    const blurSubscription = Platform.OS === 'android'
      ? AppState.addEventListener('blur', showCover)
      : null;
    const focusSubscription = Platform.OS === 'android'
      ? AppState.addEventListener('focus', handleForeground)
      : null;

    return () => {
      changeSubscription.remove();
      blurSubscription?.remove();
      focusSubscription?.remove();
    };
  }, [completeReturn]);

  return (
    <AppLockContext.Provider
      value={{
        enabled,
        isLocked,
        isAuthenticating,
        isPrivacyCovered,
        availability,
        authError,
        authNeedsDeviceSetup,
        setEnabled,
        unlock,
        lockNow,
        disableForUnavailableDevice,
        refreshAvailability,
      }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within AppLockProvider');
  }
  return context;
}
