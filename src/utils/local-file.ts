import { File } from 'expo-file-system';

export async function deleteLocalFile(uri?: string | null): Promise<void> {
  if (!uri || !uri.startsWith('file://')) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('[cashtrack] Could not delete a local file', error);
  }
}
