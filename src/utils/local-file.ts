import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { isSafeImageDeletionUri } from '@/utils/safe-path';

export async function deleteLocalFile(uri?: string | null): Promise<void> {
  if (Platform.OS === 'web' || !uri || !uri.startsWith('file://')) return;
  if (!isSafeImageDeletionUri(uri, Paths.document.uri)) {
    console.warn('[cashtrack] Refusing to delete a file outside CashTrack image directories');
    return;
  }
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('[cashtrack] Could not delete a local file', error);
  }
}
