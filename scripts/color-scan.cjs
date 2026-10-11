const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = getAllFiles(srcDir);

const colorRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b|rgba?\([^)]+\)/i;

const hits = [];

files.forEach((filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');

  function getParentContext(node) {
    let propName = 'style/prop';
    let isHeroOrGlassContext = false;

    let curr = node.parent;
    while (curr) {
      if (curr.kind === ts.SyntaxKind.PropertyAssignment && curr.name) {
        propName = curr.name.getText();
        const parentObj = curr.parent;
        if (parentObj && parentObj.parent && parentObj.parent.kind === ts.SyntaxKind.PropertyAssignment) {
          const styleName = parentObj.parent.name.getText();
          if (
            /Orb|hero|glass|intelligenceHero|displayCard/i.test(styleName) ||
            styleName.includes('Hero') ||
            styleName.includes('Glass')
          ) {
            isHeroOrGlassContext = true;
          }
        }
      }
      if (curr.kind === ts.SyntaxKind.JsxAttribute && curr.name) {
        propName = curr.name.getText();
      }
      curr = curr.parent;
    }
    return { propName, isHeroOrGlassContext };
  }

  function classifyHit(relPath, propName, text, isHeroOrGlassContext) {
    const val = text.trim();

    // 1. Excluded files
    if (
      relPath.startsWith('src/constants/') ||
      relPath.includes('src/utils/monthly-report.ts') ||
      relPath.includes('src/utils/weather.ts')
    ) {
      return 'excluded (constants/utility asset)';
    }

    // 2. Class (b): Brand-fixed hero/brand card styles and files
    if (
      val === '#00109D' ||
      val === '#0152F5' ||
      val === '#14E7FD' ||
      relPath.includes('facebook-cover-header') ||
      relPath.includes('sliding-hero-banner') ||
      relPath.includes('money-summary-card') ||
      isHeroOrGlassContext
    ) {
      return '(b) brand-fixed';
    }

    // 3. Class (d): shadowColor '#000' and rgba(0,0,0,x) scrims/backdrops
    if (
      propName === 'shadowColor' ||
      val === '#000' ||
      val === '#000000' ||
      val.startsWith('rgba(0, 0, 0') ||
      val.startsWith('rgba(0,0,0')
    ) {
      return '(d) overlay/scrim';
    }

    // 4. Class (a): Everything else
    return '(a) semantic';
  }

  function checkLiteral(node, text) {
    if (!text || typeof text !== 'string') return;
    if (colorRegex.test(text)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const { propName, isHeroOrGlassContext } = getParentContext(node);

      if (node.kind === ts.SyntaxKind.JsxText) return;

      const category = classifyHit(relPath, propName, text, isHeroOrGlassContext);

      hits.push({
        file: relPath,
        line,
        prop: propName,
        value: text.slice(0, 35),
        category,
      });
    }
  }

  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      checkLiteral(node, node.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
});

console.log(`=== COLOR SCAN INVENTORY ===`);
console.log(`Total Hits Found: ${hits.length}\n`);

const summary = {
  '(a) semantic': 0,
  '(b) brand-fixed': 0,
  '(d) overlay/scrim': 0,
  'excluded (constants/utility asset)': 0,
};

hits.forEach((h) => {
  if (summary[h.category] !== undefined) summary[h.category]++;
  else summary[h.category] = 1;
});

console.log('=== CLASSIFICATION SUMMARY ===');
console.table(summary);

const classAHits = hits.filter((h) => h.category === '(a) semantic');
console.log(`\n=== CLASS (a) SEMANTIC HITS (${classAHits.length}) GROUPED BY FILE ===\n`);

const grouped = {};
classAHits.forEach((h) => {
  if (!grouped[h.file]) grouped[h.file] = [];
  grouped[h.file].push(`${h.line}:${h.prop}=${h.value}`);
});

Object.keys(grouped).forEach((f) => {
  console.log(`- ${f} (${grouped[f].length} hits):`);
  grouped[f].forEach((item) => console.log(`    L${item}`));
});
