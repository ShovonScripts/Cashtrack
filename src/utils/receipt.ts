import { Directory, File, Paths } from 'expo-file-system';

/**
 * Receipts are copied into the document directory because the image picker hands back a
 * URI inside a cache folder the OS is free to purge at any time.
 */
const RECEIPTS_DIRECTORY = 'receipts';

function getReceiptsDirectory(): Directory {
  const directory = new Directory(Paths.document, RECEIPTS_DIRECTORY);
  if (!directory.exists) {
    directory.create({ intermediates: true });
  }
  return directory;
}

/**
 * Copies a picked image out of the picker's temporary cache into a persistent directory
 * and returns the persistent URI.
 *
 * If the copy fails the picker URI is returned unchanged rather than throwing, so a
 * receipt can still be attached even when the file cannot be relocated. The picker URI
 * points at a cache path, so that receipt can break later — the failure is logged rather
 * than swallowed so it is visible in development.
 */
export async function saveReceiptLocally(tempUri: string): Promise<string> {
  try {
    const filename = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
    const destination = new File(getReceiptsDirectory(), filename);
    await new File(tempUri).copy(destination);
    return destination.uri;
  } catch (error) {
    console.error(
      '[cashtrack] Could not copy the receipt into the document directory. Falling back to the picker URI, which may be purged by the OS.',
      error,
    );
    return tempUri;
  }
}

export async function deleteLocalReceipt(uri: string): Promise<void> {
  try {
    if (uri && uri.startsWith('file://')) {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    }
  } catch (error) {
    console.error('[cashtrack] Could not delete the stored receipt.', error);
  }
}
