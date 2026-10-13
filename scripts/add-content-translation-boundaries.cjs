// One-time source migration. Inserts React boundaries without reformatting files.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const changed = [];
for (const file of [...files('src/app'), ...files('src/components')]) {
  const normalized = file.replaceAll('\\', '/');
  if (!file.endsWith('.tsx') || /\/(admin|preview|providers|i18n|ui|transliteration|__tests__)\//.test(normalized) || /\/(layout|global-error|language-toggle)\.tsx$/.test(normalized)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes('import { TranslatedContent }')) continue;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node, component = false) {
    if (ts.isFunctionLike(node)) {
      const name = node.name?.getText(ast) || (ts.isVariableDeclaration(node.parent) ? node.parent.name.getText(ast) : '');
      component = /^[A-Z]/.test(name);
    }
    if (component && ts.isReturnStatement(node) && node.expression) {
      let expression = node.expression;
      while (ts.isParenthesizedExpression(expression)) expression = expression.expression;
      if (ts.isJsxElement(expression) || ts.isJsxSelfClosingElement(expression) || ts.isJsxFragment(expression)) {
        edits.push({ at: expression.getStart(ast), text: '<TranslatedContent>' });
        edits.push({ at: expression.end, text: '</TranslatedContent>' });
      }
    }
    ts.forEachChild(node, child => visit(child, component));
  }
  visit(ast);
  if (!edits.length) continue;
  let output = source;
  for (const edit of edits.sort((a, b) => b.at - a.at)) output = output.slice(0, edit.at) + edit.text + output.slice(edit.at);
  const directive = /^(?:\uFEFF)?["']use client["'];?\s*/.exec(output);
  const at = directive ? directive[0].length : 0;
  output = output.slice(0, at) + 'import { TranslatedContent } from "@/components/i18n/translated-content";\n' + output.slice(at);
  fs.writeFileSync(file, output);
  changed.push(normalized);
}
console.log(JSON.stringify({ boundariesAddedTo: changed.length, files: changed }, null, 2));
