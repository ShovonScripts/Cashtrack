import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Elevation, MaxContentWidth, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToastOptions = {
  message: string;
  /** Label of the optional action button, such as "Undo". */
  actionLabel?: string;
  /** Runs when the action button is tapped. The toast closes and `onExpire` is skipped. */
  onAction?: () => void;
  /** Runs when the toast goes away without the action: timeout or replaced by a newer toast. */
  onExpire?: () => void;
  /** Milliseconds before the toast closes on its own. */
  duration?: number;
};

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;
// Tab bar is 62 plus the bottom inset; keep the toast clear of it.
const TAB_BAR_BASE = 62;

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const activeRef = useRef<(ToastOptions & { id: number }) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const expireActive = useCallback(() => {
    clearTimer();
    const current = activeRef.current;
    activeRef.current = null;
    setToast(null);
    current?.onExpire?.();
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      // A newer toast replaces the old one, which counts as expiring so a
      // pending action (such as a delete) is never left hanging.
      const previous = activeRef.current;
      clearTimer();
      previous?.onExpire?.();

      counterRef.current += 1;
      const next = { ...options, id: counterRef.current };
      activeRef.current = next;
      setToast(next);
      timerRef.current = setTimeout(expireActive, options.duration ?? DEFAULT_DURATION);
    },
    [expireActive]
  );

  const handleAction = () => {
    const current = activeRef.current;
    if (!current) return;
    clearTimer();
    activeRef.current = null;
    setToast(null);
    current.onAction?.();
  };

  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ show }), [show]);
  const bottom = Math.max(insets.bottom, 10) + TAB_BAR_BASE + Spacing.three;

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.fill}>
        {children}
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.duration(180)}
            exiting={FadeOutDown.duration(140)}
            pointerEvents="box-none"
            style={[styles.host, { bottom }]}>
            <View
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={[
                styles.toast,
                Elevation.high,
                { backgroundColor: theme.text, maxWidth: MaxContentWidth },
              ]}>
              <ThemedText type="small" style={[styles.message, { color: theme.background }]} numberOfLines={2}>
                {toast.message}
              </ThemedText>
              {toast.actionLabel ? (
                <Pressable
                  onPress={handleAction}
                  accessibilityRole="button"
                  accessibilityLabel={toast.actionLabel}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={{ color: theme.accentOnBrand }}>
                    {toast.actionLabel}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a <ToastProvider>');
  return context;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  host: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
    zIndex: 10000,
  },
  toast: {
    width: '100%',
    minHeight: MinTouchTarget + Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    borderRadius: Radius.medium,
  },
  message: { flex: 1 },
  action: {
    minWidth: MinTouchTarget,
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
