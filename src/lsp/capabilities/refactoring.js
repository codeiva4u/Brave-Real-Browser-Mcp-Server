/**
 * Refactoring Capability
 */
const { CodeActionKind } = require('vscode-languageserver/node');

function getRefactorings(document, range, context, tools, lang) {
  const actions = [];
  for (const diag of context.diagnostics || []) {
    if (diag.code === 'browser-not-init') {
      actions.push({ title: 'Add browser_init() at start', kind: CodeActionKind.QuickFix, diagnostics: [diag], edit: { changes: { [document.uri]: [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, newText: "await browser_init({ headless: false });\n\n" }] } } });
    }
    if (diag.code === 'missing-cleanup') {
      const lastLine = document.lineCount - 1;
      actions.push({ title: 'Add browser_close() at end', kind: CodeActionKind.QuickFix, diagnostics: [diag], edit: { changes: { [document.uri]: [{ range: { start: { line: lastLine, character: 9999 }, end: { line: lastLine, character: 9999 } }, newText: "\n\nawait browser_close();" }] } } });
    }
  }
  const selectedText = document.getText(range);
  if (selectedText.includes('await')) {
    actions.push({ title: 'Wrap in try-catch', kind: CodeActionKind.RefactorRewrite, edit: { changes: { [document.uri]: [{ range, newText: `try {\n  ${selectedText.split('\n').join('\n  ')}\n} catch (error) {\n  console.error(error);\n}` }] } } });
  }
  return actions;
}
module.exports = { getRefactorings };
