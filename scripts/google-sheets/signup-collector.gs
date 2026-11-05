/**
 * CashTrack "Stay in touch" collector.
 *
 * Paste this whole file into your Google Sheet: Extensions > Apps Script.
 * Then deploy it as a web app (see README.md in this folder).
 *
 * The app sends one JSON body per request:
 *   { action: 'join' | 'withdraw', key, id, name, email, phone, consent,
 *     country, platform, appVersion, createdAt }
 * and expects { ok: true } back. Anything else makes the app retry later.
 */

/** Must match EXPO_PUBLIC_SIGNUP_KEY in the app's .env. Use a long random string. */
const SHARED_KEY = 'Hello-Cashtract-Creator-Johirul-Islam-&-Mr-Nasir';

const SHEET_NAME = 'Signups';
const HEADERS = [
  'Received at',
  'Install ID',
  'Name',
  'Email',
  'Phone',
  'Wants updates',
  'Country',
  'Platform',
  'App version',
  'Signed up at (device)',
];
const ID_COLUMN = 2; // "Install ID"
const PHONE_COLUMN = 5;

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply(false, 'bad-json');
  }
  if (!data || data.key !== SHARED_KEY) return reply(false, 'unauthorized');

  const id = clean(data.id, 64);
  if (!/^[0-9a-f-]{8,64}$/i.test(id)) return reply(false, 'bad-id');

  // One writer at a time, so two sign-ups arriving together cannot collide.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return reply(false, 'busy');
  try {
    const sheet = getSheet();
    const row = findRow(sheet, id);

    if (data.action === 'withdraw') {
      // Real deletion: the whole row goes. Unknown ids count as already deleted.
      if (row) sheet.deleteRow(row);
      return reply(true);
    }
    if (data.action !== 'join') return reply(false, 'bad-action');

    const name = clean(data.name, 50);
    const email = clean(data.email, 254).toLowerCase();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply(false, 'invalid');

    const values = [
      new Date(),
      id,
      safe(name),
      safe(email),
      safe(clean(data.phone, 20)),
      data.consent === true ? 'Yes' : 'No',
      safe(clean(data.country, 8)),
      safe(clean(data.platform, 16)),
      safe(clean(data.appVersion, 20)),
      safe(clean(data.createdAt, 40)),
    ];
    // A retry or a re-join updates the same row instead of adding a duplicate.
    if (row) sheet.getRange(row, 1, 1, values.length).setValues([values]);
    else sheet.appendRow(values);
    return reply(true);
  } finally {
    lock.releaseLock();
  }
}

/** Open the web-app URL in a browser to check the deployment is live. */
function doGet() {
  return reply(true, 'CashTrack sign-up collector is running.');
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    // Plain text, so "+880..." keeps its plus sign and leading zeros survive.
    sheet.getRange(2, PHONE_COLUMN, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  }
  return sheet;
}

function findRow(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const match = sheet
    .getRange(2, ID_COLUMN, lastRow - 1, 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Formula-injection guard: a value starting with = + - @ (or a tab/return)
 * would run as a formula when the sheet is opened or exported. A leading
 * apostrophe makes Sheets store it as plain text (the apostrophe is hidden).
 */
function safe(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function reply(ok, message) {
  const body = ok ? { ok: true, message: message || undefined } : { ok: false, error: message };
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

