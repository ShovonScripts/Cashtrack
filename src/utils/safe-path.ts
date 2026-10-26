const FILE_SCHEME = 'file://';

/**
 * Resolves a `file://` URI to a normalized absolute path made of decoded
 * segments. Returns null for anything that could escape the intended
 * directory (encoded slashes, `..`, queries, or non-file schemes).
 */
export function resolveFileUriPath(uri: string): string | null {
  if (typeof uri !== 'string' || !uri.startsWith(FILE_SCHEME)) return null;

  const rawPath = uri.slice(FILE_SCHEME.length).split(/[?#]/, 1)[0];
  if (!rawPath) return null;

  const decoded: string[] = [];
  for (const segment of rawPath.split('/')) {
    let value: string;
    try {
      value = decodeURIComponent(segment);
    } catch {
      return null;
    }
    if (value.includes('/') || value.includes('\\') || value.includes('\0')) return null;
    decoded.push(value);
  }

  const normalized: string[] = [];
  for (const segment of decoded) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') return null;
    normalized.push(segment);
  }

  return `/${normalized.join('/')}`;
}

/** True when `uri` resolves to `directoryUri` itself or a descendant of it. */
export function isUriWithinDirectory(uri: string, directoryUri: string): boolean {
  const path = resolveFileUriPath(uri);
  const directory = resolveFileUriPath(directoryUri);
  if (!path || !directory || directory === '/') return false;
  return path === directory || path.startsWith(`${directory}/`);
}

const PROFILE_IMAGE_FILE = /^(?:cover|avatar)-\d+\.[a-z0-9]{2,5}$/i;

/**
 * Only image files owned by CashTrack may be deleted: receipts, restored
 * backup attachments, and the two profile photo prefixes written by the
 * profile screen. This prevents a restored backup from pointing deletion at
 * the app database or any other sandbox file.
 */
export function isSafeImageDeletionUri(uri: string | null | undefined, documentDirectoryUri: string): boolean {
  if (!uri) return false;
  if (!isUriWithinDirectory(uri, documentDirectoryUri)) return false;

  const path = resolveFileUriPath(uri);
  const document = resolveFileUriPath(documentDirectoryUri);
  if (!path || !document) return false;

  const relative = path.slice(document.length + 1);
  const segments = relative.split('/');
  if (segments.length >= 2) {
    return segments[0] === 'receipts' || segments[0] === 'backup-restore';
  }
  return segments.length === 1 && PROFILE_IMAGE_FILE.test(segments[0]);
}
