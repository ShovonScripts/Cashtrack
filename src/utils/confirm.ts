import { Alert, Platform } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmLabel = 'Delete',
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}

export function confirmDelete(title: string, message: string, onConfirm: () => void | Promise<void>) {
  confirmAction(title, message, onConfirm);
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}
