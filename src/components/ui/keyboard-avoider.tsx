import { useContext, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { HeaderHeightContext } from 'expo-router/react-navigation';

/** What the app's forms already used on iOS; left as it was. */
const IOS_OFFSET = 80;

/**
 * Keeps a form's focused field above the keyboard. Wrap a form screen (its
 * scrolling `Screen`) in this instead of a bare `KeyboardAvoidingView`.
 *
 * Android: from Android 15 (with target SDK 35) and on every Android 16 phone,
 * apps are drawn edge to edge, and the system then stops shrinking the window
 * for the keyboard. The old `behavior={undefined}` relied on that shrinking,
 * so fields near the bottom ended up behind the keyboard. 'padding' is safe on
 * every Android: KeyboardAvoidingView pads only by how far its own bottom sits
 * behind the keyboard, which is nothing on older phones that still shrink the
 * window, and exactly the keyboard's height on edge-to-edge ones.
 *
 * The offset is the navigation header's height. KeyboardAvoidingView compares
 * its own frame (which starts under the header) with the keyboard's position
 * on screen, so without it the bottom of the form would stay a header's height
 * behind the keyboard.
 */
export function KeyboardAvoider({ children }: { children: ReactNode }) {
  // The context, not useHeaderHeight: that throws on a screen with no header.
  const headerHeight = useContext(HeaderHeightContext) ?? 0;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? IOS_OFFSET : headerHeight}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
