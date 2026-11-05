import Constants from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { readSignupRecord, writeSignupRecord, type SignupRecord } from '@/storage/signup-storage';
import {
  createInstallId,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  type SignupInput,
  type SignupPayload,
} from '@/utils/signup';
import { getSignupKey, sendSignupPayload } from '@/utils/signup-client';

type SignupContextValue = {
  /** null until read from storage, or when the user never joined. */
  record: SignupRecord | null;
  loaded: boolean;
  /** Saves the details on the phone, then sends them in the background. */
  join: (input: SignupInput, country: string) => Promise<void>;
  /** Deletes the details on the phone now and asks the sheet to delete its copy. */
  withdraw: () => Promise<void>;
};

const SignupContext = createContext<SignupContextValue | null>(null);

const APP_VERSION = Constants.expoConfig?.version ?? '';

function toPayload(record: SignupRecord, action: SignupPayload['action']): SignupPayload {
  return {
    action,
    key: getSignupKey(),
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    consent: record.consent,
    country: record.country,
    platform: Platform.OS,
    appVersion: APP_VERSION,
    createdAt: record.createdAt,
  };
}

/**
 * Owns the optional "Stay in touch" sign-up. Saving is local first: the
 * details are written to the phone, then delivered to the Google Sheet when
 * possible. Anything not yet delivered is retried on launch and whenever the
 * app returns to the foreground, so being offline never loses a sign-up and
 * never blocks the user.
 */
export function SignupProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<SignupRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const recordRef = useRef<SignupRecord | null>(null);
  const syncing = useRef(false);

  const save = useCallback(async (next: SignupRecord) => {
    recordRef.current = next;
    setRecord(next);
    try {
      await writeSignupRecord(next);
    } catch (error) {
      console.error('[cashtrack] Failed to save sign-up on this device', error);
    }
  }, []);

  /**
   * Delivers whatever is waiting. Safe to call often; runs one at a time. If
   * the user joins or withdraws while a request is out, the loop picks up the
   * newer state and delivers that too (bounded, so it can never spin).
   */
  const sync = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      for (let round = 0; round < 3; round += 1) {
        const current = recordRef.current;
        if (!current || (current.status !== 'pending' && current.status !== 'withdraw-pending')) return;

        const action = current.status === 'pending' ? 'join' : 'withdraw';
        const delivered = await sendSignupPayload(toPayload(current, action));
        const changedMeanwhile = recordRef.current !== current;

        if (changedMeanwhile) continue; // deliver the newer state
        if (!delivered) return; // offline or rejected: retry on next launch or foreground
        await save({
          ...current,
          status: action === 'join' ? 'sent' : 'withdrawn',
          sentAt: new Date().toISOString(),
        });
        return;
      }
    } finally {
      syncing.current = false;
    }
  }, [save]);

  useEffect(() => {
    let cancelled = false;
    void readSignupRecord().then((stored) => {
      if (cancelled) return;
      recordRef.current = stored;
      setRecord(stored);
      setLoaded(true);
      void sync();
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [sync]);

  const join = useCallback(
    async (input: SignupInput, country: string) => {
      const previous = recordRef.current;
      await save({
        // Re-joining after a withdrawal reuses the id, so the sheet updates one row.
        id: previous?.id ?? createInstallId(),
        status: 'pending',
        name: normalizeName(input.name),
        email: normalizeEmail(input.email),
        phone: normalizePhone(input.phone),
        consent: input.consent,
        country,
        createdAt: new Date().toISOString(),
      });
      void sync();
    },
    [save, sync],
  );

  const withdraw = useCallback(async () => {
    const current = recordRef.current;
    if (!current) return;
    // Wipe the personal details on the phone right away; keep only the id
    // the sheet needs to find and delete its copy. Always ask the sheet, even
    // for a "pending" record: it may have arrived with only the reply lost.
    await save({
      ...current,
      status: 'withdraw-pending',
      name: '',
      email: '',
      phone: '',
      consent: false,
    });
    void sync();
  }, [save, sync]);

  const value = useMemo(() => ({ record, loaded, join, withdraw }), [record, loaded, join, withdraw]);

  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
}

export function useSignup(): SignupContextValue {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error('useSignup must be used within SignupProvider');
  return ctx;
}
