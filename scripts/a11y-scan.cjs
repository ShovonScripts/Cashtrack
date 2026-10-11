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

  // Extract StyleSheet.create object definitions
  const styleDefs = {};
  function parseStyleSheet(node) {
    if (
      node.kind === ts.SyntaxKind.CallExpression &&
      node.expression &&
      node.expression.getText().includes('StyleSheet.create')
    ) {
      const arg = node.arguments[0];
      if (arg && arg.kind === ts.SyntaxKind.ObjectLiteralExpression) {
        arg.properties.forEach((prop) => {
          if (prop.kind === ts.SyntaxKind.PropertyAssignment && prop.name) {
            const styleName = prop.name.getText();
            styleDefs[styleName] = {};
            if (prop.initializer && prop.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression) {
              prop.initializer.properties.forEach((styleProp) => {
                if (styleProp.kind === ts.SyntaxKind.PropertyAssignment && styleProp.name) {
                  const key = styleProp.name.getText();
                  const valText = styleProp.initializer.getText();
                  const valNum = parseInt(valText, 10);
                  if (!isNaN(valNum)) {
                    styleDefs[styleName][key] = valNum;
                  }
                }
              });
            }
          }
        });
      }
    }
    ts.forEachChild(node, parseStyleSheet);
  }
  parseStyleSheet(sourceFile);

  function getAttribute(node, name) {
    if (!node.attributes) return null;
    return node.attributes.properties.find(
      (prop) => prop.kind === ts.SyntaxKind.JsxAttribute && prop.name && prop.name.getText() === name
    );
  }

  // Strictly check if JSX node contains a Text / ThemedText child
  function hasStrictTextChild(node) {
    if (!node.children) return false;
    for (const child of node.children) {
      if (child.kind === ts.SyntaxKind.JsxText) {
        const txt = child.getText().trim();
        if (txt.length > 0) return true;
      }
      if (child.kind === ts.SyntaxKind.JsxElement || child.kind === ts.SyntaxKind.JsxSelfClosingElement) {
        const tag = child.openingElement ? child.openingElement.tagName.getText() : child.tagName.getText();
        if (tag === 'ThemedText' || tag === 'Text') {
          return true;
        }
        if (child.children && hasStrictTextChild(child)) return true;
      }
      if (child.kind === ts.SyntaxKind.JsxExpression && child.expression) {
        const expr = child.expression;
        // If expression resolves to a ThemedText or Text component call/map
        if (expr.kind === ts.SyntaxKind.JsxElement || expr.kind === ts.SyntaxKind.JsxSelfClosingElement) {
          const tag = expr.openingElement ? expr.openingElement.tagName.getText() : expr.tagName.getText();
          if (tag === 'ThemedText' || tag === 'Text') return true;
        }
      }
    }
    return false;
  }

  function isSmallStyle(styleAttr, hitSlopAttr) {
    if (hitSlopAttr) return false;
    if (!styleAttr) return false;
    const styleText = styleAttr.getText();

    // Direct inline styles
    const widthMatch = styleText.match(/\bwidth\s*:\s*(\d+)/);
    const heightMatch = styleText.match(/\bheight\s*:\s*(\d+)/);
    const minHeightMatch = styleText.match(/\bminHeight\s*:\s*(\d+)/);
    const minWidthMatch = styleText.match(/\bminWidth\s*:\s*(\d+)/);

    let small = false;
    if (widthMatch && parseInt(widthMatch[1], 10) < 44 && parseInt(widthMatch[1], 10) > 0) small = true;
    if (heightMatch && parseInt(heightMatch[1], 10) < 44 && parseInt(heightMatch[1], 10) > 0) small = true;
    if (minHeightMatch && parseInt(minHeightMatch[1], 10) < 44 && parseInt(minHeightMatch[1], 10) > 0) small = true;
    if (minWidthMatch && parseInt(minWidthMatch[1], 10) < 44 && parseInt(minWidthMatch[1], 10) > 0) small = true;

    // Check referenced styles.xxx
    const refMatch = styleText.match(/styles\.([a-zA-Z0-9_$]+)/g);
    if (refMatch) {
      refMatch.forEach((ref) => {
        const sName = ref.replace('styles.', '');
        if (styleDefs[sName]) {
          const sObj = styleDefs[sName];
          if (sObj.width && sObj.width < 44 && sObj.width > 0) small = true;
          if (sObj.height && sObj.height < 44 && sObj.height > 0) small = true;
          if (sObj.minHeight && sObj.minHeight < 44 && sObj.minHeight > 0) small = true;
          if (sObj.minWidth && sObj.minWidth < 44 && sObj.minWidth > 0) small = true;
        }
      });
    }

    return small;
  }

  function visit(node) {
    if (node.kind === ts.SyntaxKind.JsxOpeningElement || node.kind === ts.SyntaxKind.JsxSelfClosingElement) {
      const tagName = node.tagName.getText();

      // Check TextInput and Switch without accessibilityLabel
      if (tagName === 'TextInput' || tagName === 'Switch') {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const labelAttr = getAttribute(node, 'accessibilityLabel') || getAttribute(node, 'aria-label');
        if (!labelAttr) {
          const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
          hits.push({
            file: relPath,
            line,
            element: `<${tagName}>`,
            reasons: `${tagName} missing accessibilityLabel`,
            snippet: fileContent.split('\n')[line - 1].trim().slice(0, 80),
          });
        }
      }

      // Check Pressable and TouchableOpacity
      if (tagName === 'Pressable' || tagName === 'TouchableOpacity') {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const roleAttr = getAttribute(node, 'accessibilityRole');
        const labelAttr = getAttribute(node, 'accessibilityLabel');
        const stateAttr = getAttribute(node, 'accessibilityState');
        const hitSlopAttr = getAttribute(node, 'hitSlop');
        const styleAttr = getAttribute(node, 'style');
        const parentElement = node.parent.kind === ts.SyntaxKind.JsxElement ? node.parent : null;

        const reasons = [];

        // Check (a): missing accessibilityRole
        if (!roleAttr) {
          reasons.push('missing accessibilityRole');
        }

        // Check toggle rule: button role with checked state
        if (roleAttr && roleAttr.initializer && roleAttr.initializer.getText().includes('button')) {
          if (stateAttr && stateAttr.getText().includes('checked')) {
            reasons.push('button role used with checked state (should use switch role)');
          }
        }

        // Check (b): icon-only control without accessibilityLabel
        const hasText = parentElement ? hasStrictTextChild(parentElement) : false;
        if (!hasText && !labelAttr) {
          reasons.push('icon-only control without accessibilityLabel');
        }

        // Check (c): touch target < 44dp without hitSlop
        if (isSmallStyle(styleAttr, hitSlopAttr)) {
          reasons.push('touch target < 44dp without hitSlop');
        }

        if (reasons.length > 0) {
          const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
          hits.push({
            file: relPath,
            line,
            element: `<${tagName}>`,
            reasons: reasons.join('; '),
            snippet: fileContent.split('\n')[line - 1].trim().slice(0, 80),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
});

console.log(`Scan completed. Total hits: ${hits.length}\n`);
if (hits.length > 0) {
  console.table(
    hits.map((h, index) => ({
      ID: `F-${110 + index}`,
      Location: `${h.file}:${h.line}`,
      Element: h.element,
      Issues: h.reasons,
      Snippet: h.snippet,
    }))
  );
}
