import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { LaunchQuoteOverlay } from '@/components/launch-quote/launch-quote-overlay';
import { FINANCIAL_QUOTES } from '@/constants/quotes';
import { useAppLock } from '@/context/app-lock-context';
import { usePreferences } from '@/context/expense-context';
import { readLastLaunchQuoteIndex, saveLastLaunchQuoteIndex } from '@/storage/launch-quote-storage';
import { getFirstName, pickLaunchQuoteIndex } from '@/utils/launch-quote';
import { getGreeting, getGreetingLabel } from '@/utils/year-progress';

/**
 * Set once the launch quote has been decided for this JS session, so a remount
 * of the navigator (for example after a data reload) never shows it twice.
 * Returning from the background keeps the session, so it only appears on a
 * cold start.
 */
let decidedThisSession = false;

type Phase = 'pending' | 'showing' | 'done';

/**
 * Renders the launch quote above the app. While it shows, the app behind it
 * (`children`) is hidden from screen readers and the floating chrome
 * (`floating`, e.g. the tools button) is held back so nothing floats over the
 * quote. Mount it only inside the App Lock provider.
 */
export function LaunchQuoteLayer({ children, floating }: { children: ReactNode; floating?: ReactNode }) {
  const { active, shown, overlay } = useLaunchQuote();
  const covered = overlay !== null;
  return (
    <>
      <View
        style={styles.fill}
        accessibilityElementsHidden={covered}
        importantForAccessibility={covered ? 'no-hide-descendants' : 'auto'}>
        {children}
      </View>
      {active ? null : floating}
      {/*
        The quote sets a light status bar. Nothing else in the app sets one, so
        when it unmounts React Native falls back to 'default' (white icons on
        Android, invisible on light screens). Hand control back to the system
        colour scheme, which is what the bar followed before the quote. It mounts
        before the overlay, so the quote's own entry (pushed later) wins while
        the quote is on screen.
      */}
      {shown ? <StatusBar style="auto" /> : null}
      {overlay}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

/**
 * Decides whether to show the motivational quote on this launch and returns
 * the overlay to render. It waits for App Lock: the quote appears right after
 * the user unlocks, never hidden behind the lock screen.
 */
export function useLaunchQuote(): { active: boolean; shown: boolean; overlay: ReactNode } {
  const { showLaunchQuote, hasCompletedOnboarding, profile } = usePreferences();
  const { isLocked } = useAppLock();
  // Decided once from the values at launch; later changes apply next launch.
  // The first launch belongs to onboarding, and the setting can turn it off.
  const [phase, setPhase] = useState<Phase>(() =>
    decidedThisSession || !showLaunchQuote || !hasCompletedOnboarding || FINANCIAL_QUOTES.length === 0
      ? 'done'
      : 'pending',
  );
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);

  useEffect(() => {
    decidedThisSession = true;
    if (phase !== 'pending') return;

    let cancelled = false;
    void readLastLaunchQuoteIndex().then((lastIndex) => {
      if (cancelled) return;
      const index = pickLaunchQuoteIndex(FINANCIAL_QUOTES.length, lastIndex);
      setQuoteIndex(index);
      setPhase('showing');
      void saveLastLaunchQuoteIndex(index);
    });
    return () => {
      cancelled = true;
    };
    // Runs once per mount; `phase` only matters for its value at launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => setPhase('done'), []);

  const now = useMemo(() => new Date(), []);
  const period = getGreeting(now);
  const firstName = getFirstName(profile?.name);
  const greetingLabel = getGreetingLabel(period);
  const greeting = firstName ? `${greetingLabel}, ${firstName}` : greetingLabel;
  // 'en' like every other date in the app, so a Bengali-locale phone does not get one stray Bengali date.
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

  const visible = phase === 'showing' && quoteIndex !== null && !isLocked;
  const quote = quoteIndex !== null ? FINANCIAL_QUOTES[quoteIndex] : undefined;

  return {
    active: phase !== 'done',
    // A quote was picked this session, so its status bar entry has been mounted.
    shown: quoteIndex !== null,
    overlay:
      visible && quote ? (
        <LaunchQuoteOverlay
          quote={quote}
          greeting={greeting}
          dateLabel={dateLabel}
          period={period}
          onContinue={dismiss}
        />
      ) : null,
  };
}
