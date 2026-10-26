import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isSafeImageDeletionUri,
  isUriWithinDirectory,
  resolveFileUriPath,
} from '../src/utils/safe-path.ts';

const DOCUMENT = 'file:///data/user/0/com.shovon.spendly/files/';

describe('safe-path', () => {
  it('resolves normalized file paths', () => {
    assert.equal(resolveFileUriPath('file:///data/files/receipts/a.jpg'), '/data/files/receipts/a.jpg');
    assert.equal(resolveFileUriPath('https://example.com/a.jpg'), null);
    assert.equal(resolveFileUriPath(''), null);
  });

  it('rejects traversal and encoded separators', () => {
    assert.equal(resolveFileUriPath('file:///data/files/../cashtrack.db'), null);
    assert.equal(resolveFileUriPath('file:///data/files/%2e%2e/cashtrack.db'), null);
    assert.equal(resolveFileUriPath('file:///data/files/receipts%2F..%2Fcashtrack.db'), null);
    assert.equal(resolveFileUriPath('file:///data/files/%2Fetc%2Fpasswd'), null);
  });

  it('checks directory containment on segment boundaries', () => {
    assert.equal(isUriWithinDirectory('file:///docs/receipts/a.jpg', 'file:///docs/receipts'), true);
    assert.equal(isUriWithinDirectory('file:///docs/receipts', 'file:///docs/receipts'), true);
    assert.equal(isUriWithinDirectory('file:///docs/receipts-evil/a.jpg', 'file:///docs/receipts'), false);
    assert.equal(isUriWithinDirectory('file:///docs/receipts/../db', 'file:///docs/receipts'), false);
    assert.equal(isUriWithinDirectory('file:///', 'file:///'), false);
  });

  it('only allows deleting CashTrack image files inside the document directory', () => {
    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.shovon.spendly/files/receipts/r.jpg', DOCUMENT), true);
    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.shovon.spendly/files/backup-restore/r.jpg', DOCUMENT), true);
    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.shovon.spendly/files/cover-123.jpg', DOCUMENT), true);
    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.shovon.spendly/files/avatar-123.png', DOCUMENT), true);

    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.shovon.spendly/files/cashtrack.db', DOCUMENT), false);
    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.shovon.spendly/files/cover.jpg', DOCUMENT), false);
    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.shovon.spendly/files/receipts/../cashtrack.db', DOCUMENT), false);
    assert.equal(isSafeImageDeletionUri('file:///data/user/0/com.other/files/receipts/r.jpg', DOCUMENT), false);
    assert.equal(isSafeImageDeletionUri('https://example.com/a.jpg', DOCUMENT), false);
    assert.equal(isSafeImageDeletionUri(undefined, DOCUMENT), false);
  });
});
