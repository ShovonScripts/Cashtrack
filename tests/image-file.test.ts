import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { imageFileExtension } from '../src/utils/image-file.ts';

describe('imageFileExtension', () => {
  it('prefers the picker filename', () => {
    assert.equal(
      imageFileExtension('file:///cache/picker-image', 'image/png', 'receipt.jpeg'),
      'jpg',
    );
    assert.equal(
      imageFileExtension('file:///cache/picker-image', 'image/png', 'photo.WEBP'),
      'webp',
    );
  });

  it('uses the MIME type when the filename is missing', () => {
    assert.equal(imageFileExtension('content://media/123', 'image/png'), 'png');
    assert.equal(imageFileExtension('content://media/123', 'image/heic'), 'heic');
    assert.equal(imageFileExtension('content://media/123', 'image/jpeg; charset=binary'), 'jpg');
  });

  it('falls back to the URI extension and strips a query string', () => {
    assert.equal(imageFileExtension('file:///cache/photo.png?width=100'), 'png');
    assert.equal(imageFileExtension('file:///cache/photo.jpeg#fragment'), 'jpg');
  });

  it('rejects non-image values and falls back to jpg', () => {
    assert.equal(imageFileExtension('file:///cache/photo.svg'), 'jpg');
    assert.equal(imageFileExtension('file:///cache/no-extension', 'application/pdf', 'notes.txt'), 'jpg');
    assert.equal(imageFileExtension('file:///cache/no-extension', undefined, null), 'jpg');
  });
});
