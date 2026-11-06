/**
 * Builds docs/privacy-policy.html from src/constants/privacy-policy.ts, so the
 * hosted page (the URL in the store listings) always matches the in-app screen.
 *
 *   npm run build:privacy
 *
 * Runs on plain Node 22.18+ (built-in TypeScript type stripping).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PRIVACY_APP_NAME,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_SECTIONS,
  PRIVACY_SUMMARY,
  PRIVACY_UPDATED,
  formatPolicyDate,
  type PolicyBlock,
} from '../src/constants/privacy-policy.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'docs', 'privacy-policy.html');

const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escape, then turn bare URLs and the contact email into links. */
const rich = (text: string) =>
  esc(text)
    .replace(/https:\/\/[^\s)]+/g, (url) => `<a href="${url}">${url}</a>`)
    .replace(new RegExp(esc(PRIVACY_CONTACT_EMAIL).replace(/\./g, '\\.'), 'g'), (mail) => `<a href="mailto:${mail}">${mail}</a>`);

function block(b: PolicyBlock): string {
  if (b.type === 'paragraph') return `<p>${rich(b.text)}</p>`;
  if (b.type === 'bullets') return `<ul>${b.items.map((i) => `<li>${rich(i)}</li>`).join('')}</ul>`;
  const head = b.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join('');
  const rows = b.rows
    .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${rich(c)}</td>`)).join('')}</tr>`)
    .join('');
  return `<div class="table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

const sections = PRIVACY_SECTIONS.map(
  (s) => `<section id="${s.id}"><h2>${esc(s.title)}</h2>${s.blocks.map(block).join('\n')}</section>`,
).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${PRIVACY_APP_NAME} Privacy Policy</title>
<meta name="description" content="How the ${PRIVACY_APP_NAME} expense tracker handles your information.">
<style>
:root { --bg: #F4F6FA; --card: #FFFFFF; --text: #0F172A; --muted: #475569; --accent: #0152F5; --accent-bg: #E8EFFE; --border: #E2E8F0; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg: #000000; --card: #16181D; --text: #F1F5F9; --muted: #A3ADBD; --accent: #7AA5FF; --accent-bg: #14223F; --border: #2A2F38; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 32px; line-height: 1.2; margin: 0 0 4px; }
h2 { font-size: 20px; margin: 0 0 8px; }
.updated { color: var(--muted); font-size: 14px; margin: 0 0 24px; }
.summary, section { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
.summary { background: var(--accent-bg); border-color: transparent; }
.summary h2 { font-size: 16px; }
p, li, td { color: var(--muted); }
p { margin: 0 0 12px; } p:last-child { margin-bottom: 0; }
ul { margin: 0 0 12px; padding-left: 20px; } ul:last-child { margin-bottom: 0; }
li { margin-bottom: 6px; }
a { color: var(--accent); overflow-wrap: anywhere; }
.table { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; vertical-align: top; padding: 8px; border-bottom: 1px solid var(--border); }
thead th { color: var(--text); }
tbody th { color: var(--text); font-weight: 600; }
footer { color: var(--muted); font-size: 14px; text-align: center; margin-top: 24px; }
</style>
</head>
<body>
<main>
<h1>${PRIVACY_APP_NAME} Privacy Policy</h1>
<p class="updated">Last updated ${formatPolicyDate(PRIVACY_UPDATED)}</p>
<div class="summary"><h2>The short version</h2><ul>${PRIVACY_SUMMARY.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
${sections}
<footer>${PRIVACY_APP_NAME} · <a href="mailto:${PRIVACY_CONTACT_EMAIL}">${PRIVACY_CONTACT_EMAIL}</a></footer>
</main>
</body>
</html>
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
console.log(`Wrote ${outFile}`);
