const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
};

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif']);

function normalizeExtension(value: string | null | undefined): string | null {
  if (!value) return null;
  const extension = value.toLowerCase().replace(/^\./, '');
  if (!IMAGE_EXTENSIONS.has(extension)) return null;
  return extension === 'jpeg' ? 'jpg' : extension;
}

function extensionFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  const match = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(name);
  return match ? normalizeExtension(match[1]) : null;
}

/**
 * Picks a safe image extension for a copied picker file. Picker URIs are not
 * guaranteed to end in a usable extension (some Android URIs are content://
 * paths), so the asset's filename and MIME type are preferred before falling
 * back to the URI and finally to `jpg`.
 */
export function imageFileExtension(
  uri: string,
  mimeType?: string | null,
  fileName?: string | null,
): string {
  const fromName = extensionFromName(fileName);
  if (fromName) return fromName;

  const normalizedMime = mimeType?.split(';')[0]?.trim().toLowerCase();
  const fromMime = normalizedMime ? MIME_EXTENSIONS[normalizedMime] : undefined;
  if (fromMime) return fromMime;

  return extensionFromName(uri) ?? 'jpg';
}
