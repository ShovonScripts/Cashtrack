import type { ReactNode } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import { AppLockScreen } from '@/components/app-lock/app-lock-screen';
import { PrivacyCover } from '@/components/app-lock/privacy-cover';
import { useAppLock } from '@/context/app-lock-context';

export function AppLockGate({ children }: { children: ReactNode }) {
  const { isLocked, isPrivacyCovered } = useAppLock();
  const obscured = isLocked || isPrivacyCovered;

  return (
    <View style={styles.container}>
      {/*
        collapsable={false} keeps this wrapper a real native view all the time.
        Otherwise React Native drops it while nothing is hidden and creates it
        when the lock or cover turns on, moving the whole app into it and back.
        On Android that move detaches every view, so open pop-ups (Quick Add,
        Quick Tools, sheets) close and the screen flickers.
      */}
      <View
        collapsable={false}
        style={[styles.container, obscured && styles.hidden]}
        pointerEvents={obscured ? 'none' : 'auto'}
        accessibilityElementsHidden={obscured}
        importantForAccessibility={obscured ? 'no-hide-descendants' : 'auto'}>
        {children}
      </View>

      {isPrivacyCovered && !isLocked && Platform.OS === 'ios' ? (
        <FullWindowOverlay unstable_accessibilityContainerViewIsModal>
          <PrivacyCover />
        </FullWindowOverlay>
      ) : null}

      {isPrivacyCovered && !isLocked && Platform.OS !== 'ios' ? (
        <View style={styles.privacyOverlay}>
          <PrivacyCover />
        </View>
      ) : null}

      {isLocked && Platform.OS === 'ios' ? (
        <FullWindowOverlay unstable_accessibilityContainerViewIsModal>
          <View style={styles.container}>
            <AppLockScreen />
          </View>
        </FullWindowOverlay>
      ) : null}

      {isLocked && Platform.OS !== 'ios' ? (
        <Modal
          visible
          animationType="fade"
          presentationStyle="fullScreen"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => {}}>
          <AppLockScreen />
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  privacyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    elevation: 10,
  },
});
