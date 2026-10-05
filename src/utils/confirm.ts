import { Alert, Platform } from 'react-native';

export function confirmDelete(title: string, message: string, onConfirm: () => void | Promise<void>) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
