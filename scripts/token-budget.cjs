/**
 * Style-family budgets.
 *
 * Counts places where screens drift from the design system and fails when a
 * count rises above the recorded budget. Budgets only go down: when you clean
 * something up, run `npm run check:tokens -- --write` to lock in the new low.
 *
 *   fontSizes  font sizes outside the seven text roles (11, 12, 14, 16, 18, 22, 32)
 *   ionicons   files that still import Ionicons (the app uses MaterialCommunityIcons)
 *   shadows    hand-written shadow props outside the theme file: any
 *              shadowColor/shadowOpacity/shadowRadius/elevation (inline or on
 *              their own line) and any boxShadow written as a literal string.
 *              Use `Elevation.*` or `glow()` from src/constants/theme.ts.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['src/app', 'src/components', 'src/context'];
const ALLOWED_SIZES = new Set([11, 12, 14, 16, 18, 22, 32]);
const BUDGET_FILE = path.join(__dirname, 'token-budget.json');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

const counts = { fontSizes: 0, ionicons: 0, shadows: 0 };
for (const dir of DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/fontSize: ([0-9.]+)/g)) {
      if (!ALLOWED_SIZES.has(Number(m[1]))) counts.fontSizes += 1;
    }
    if (/import \{[^}]*\bIonicons\b[^}]*\} from '@expo\/vector-icons'/.test(text)) counts.ionicons += 1;
    counts.shadows += (text.match(/\b(shadowColor|shadowOpacity|shadowRadius|elevation):/g) || []).length;
    counts.shadows += (text.match(/\bboxShadow:\s*['"`]/g) || []).length;
  }
}

if (process.argv.includes('--write')) {
  fs.writeFileSync(BUDGET_FILE, JSON.stringify(counts, null, 2) + '\n');
  console.log('Budget written:', counts);
  process.exit(0);
}

const budget = JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));
let failed = false;
for (const key of Object.keys(counts)) {
  const now = counts[key];
  const max = budget[key];
  const status = now > max ? 'OVER' : now < max ? 'under' : 'ok';
  console.log(`${key.padEnd(10)} ${String(now).padStart(4)} (budget ${max}) ${status}`);
  if (now > max) failed = true;
}
if (failed) {
  console.error('Over budget. Use the design-system tokens and components instead of new one-off styles.');
  process.exit(1);
}
if (Object.keys(counts).some((k) => counts[k] < budget[k])) {
  console.log('Some counts are under budget. Run `npm run check:tokens -- --write` to lock them in.');
}
