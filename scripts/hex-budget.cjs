/**
 * Hardcoded colour budget.
 *
 * Counts 6-digit hex colour literals in screens and components. Colours should
 * come from `src/constants/theme.ts` (Colors, Palette, FeatureColors). The
 * budget in scripts/hex-budget.json can only go down: lower it whenever you
 * remove literals, and CI fails if the count ever rises above it.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['src/app', 'src/components'];
// 6-digit colours, and 8-digit ones with alpha ('#159A8C1E'), which a plain
// 6-digit pattern misses because the alpha digits break the word boundary.
const HEX = /#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?\b/g;

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (full.endsWith('.tsx')) acc.push(full);
  }
  return acc;
}

const perFile = [];
let total = 0;
for (const d of DIRS) {
  for (const file of walk(path.join(ROOT, d))) {
    const hits = (fs.readFileSync(file, 'utf8').match(HEX) || []).length;
    if (hits > 0) perFile.push([path.relative(ROOT, file).replace(/\\/g, '/'), hits]);
    total += hits;
  }
}

const budgetPath = path.join(__dirname, 'hex-budget.json');
const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8')).max;

if (process.argv.includes('--top')) {
  perFile.sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([f, n]) => console.log(String(n).padStart(4), f));
}

console.log(`Hardcoded hex colours: ${total} (budget ${budget})`);
if (total > budget) {
  console.error('Over budget. Use tokens from src/constants/theme.ts instead of new hex literals.');
  process.exit(1);
}
if (total < budget) {
  console.log(`Under budget by ${budget - total}. Lower "max" in scripts/hex-budget.json to ${total} to lock it in.`);
}
