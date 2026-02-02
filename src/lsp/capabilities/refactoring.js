/**
 * Refactoring Capability - Quick Fixes & Code Actions
 * 
 * Provides automatic fixes for diagnostics and code improvements
 */
const { CodeActionKind } = require('vscode-languageserver/node');

/**
 * Get refactoring actions for range
 */
function getRefactorings(document, range, context, tools, lang) {
  const text = document.getText();
  const actions = [];
  
  // Process diagnostics and provide fixes
  for (const diagnostic of context.diagnostics || []) {
    const fixes = getQuickFixesForDiagnostic(document, diagnostic, tools, lang);
    actions.push(...fixes);
  }
  
  // Get selection-based refactorings
  const selectedText = document.getText(range);
  if (selectedText && selectedText.trim()) {
    actions.push(...getSelectionRefactorings(document, range, selectedText, tools));
  }
  
  return actions;
}

/**
 * Get quick fixes for a specific diagnostic
 */
function getQuickFixesForDiagnostic(document, diagnostic, tools, lang) {
  const fixes = [];
  
  switch (diagnostic.code) {
    case 'browser-not-init':
      fixes.push({
        title: '🚀 Add browser_init() at start',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        isPreferred: true,
        edit: {
          changes: {
            [document.uri]: [{
              range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
              newText: "await browser_init({ headless: false, turnstile: true });\n\n"
            }]
          }
        }
      });
      
      fixes.push({
        title: '🚀 Add browser_init() (headless mode)',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
          changes: {
            [document.uri]: [{
              range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
              newText: "await browser_init({ headless: true });\n\n"
            }]
          }
        }
      });
      break;
      
    case 'missing-cleanup':
      const lastLine = document.lineCount - 1;
      fixes.push({
        title: '🔴 Add browser_close() at end',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        isPreferred: true,
        edit: {
          changes: {
            [document.uri]: [{
              range: { start: { line: lastLine, character: 9999 }, end: { line: lastLine, character: 9999 } },
              newText: "\n\nawait browser_close();"
            }]
          }
        }
      });
      break;
      
    case 'no-page-loaded':
      // Insert navigate before the problematic line
      fixes.push({
        title: '🧭 Add navigate() before this',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        isPreferred: true,
        edit: {
          changes: {
            [document.uri]: [{
              range: { start: { line: diagnostic.range.start.line, character: 0 }, end: { line: diagnostic.range.start.line, character: 0 } },
              newText: "await navigate({ url: 'https://example.com' });\n"
            }]
          }
        }
      });
      break;
      
    case 'missing-required':
      if (diagnostic.data?.param && diagnostic.data?.tool) {
        const tool = tools.find(t => t.name === diagnostic.data.tool);
        const prop = tool?.inputSchema?.properties?.[diagnostic.data.param];
        let defaultValue = getDefaultValue(prop);
        
        fixes.push({
          title: `➕ Add missing parameter: ${diagnostic.data.param}`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          isPreferred: true
          // Note: Complex edit - would need to parse and modify the call
        });
      }
      break;
      
    case 'unknown-tool':
      // Suggest similar tools
      if (diagnostic.data?.suggestions) {
        for (const suggestion of diagnostic.data.suggestions) {
          const tool = tools.find(t => t.name === suggestion);
          fixes.push({
            title: `🔄 Did you mean: ${tool?.emoji || ''} ${suggestion}?`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            edit: {
              changes: {
                [document.uri]: [{
                  range: diagnostic.range,
                  newText: suggestion
                }]
              }
            }
          });
        }
      }
      break;
      
    case 'timeout-too-long':
      fixes.push({
        title: '⏱️ Reduce timeout to 30 seconds',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic]
      });
      break;
      
    case 'network-not-stopped':
      const lastLine2 = document.lineCount - 1;
      fixes.push({
        title: '📡 Add network_recorder stop',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
          changes: {
            [document.uri]: [{
              range: { start: { line: lastLine2, character: 9999 }, end: { line: lastLine2, character: 9999 } },
              newText: "\nawait network_recorder({ action: 'stop' });"
            }]
          }
        }
      });
      break;
      
    case 'security-risk':
      fixes.push({
        title: '⚠️ Review security implications',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        command: {
          title: 'Show security documentation',
          command: 'braveRealBrowser.showSecurityDocs'
        }
      });
      break;
      
    case 'invalid-url':
      fixes.push({
        title: '🔗 Fix URL format',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic]
      });
      break;
      
    case 'empty-text':
      fixes.push({
        title: '📝 Remove empty type call',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic]
      });
      break;
  }
  
  return fixes;
}

/**
 * Get refactorings for selected text
 */
function getSelectionRefactorings(document, range, selectedText, tools) {
  const refactorings = [];
  
  // Wrap in try-catch
  if (selectedText.includes('await')) {
    refactorings.push({
      title: '🛡️ Wrap in try-catch',
      kind: CodeActionKind.RefactorRewrite,
      edit: {
        changes: {
          [document.uri]: [{
            range,
            newText: `try {\n${indentText(selectedText, 2)}\n} catch (error) {\n  console.error('Automation error:', error.message);\n  await browser_close();\n  throw error;\n}`
          }]
        }
      }
    });
  }
  
  // Add wait after navigation
  if (selectedText.includes('navigate(') && !selectedText.includes('wait(')) {
    refactorings.push({
      title: '⏳ Add wait after navigation',
      kind: CodeActionKind.RefactorRewrite,
      edit: {
        changes: {
          [document.uri]: [{
            range: { start: range.end, end: range.end },
            newText: "\nawait wait({ type: 'networkidle', value: '2000' });"
          }]
        }
      }
    });
  }
  
  // Convert click to human-like
  if (selectedText.includes('click(') && !selectedText.includes('humanLike')) {
    refactorings.push({
      title: '👆 Make click human-like',
      kind: CodeActionKind.RefactorRewrite
    });
  }
  
  // Extract to function
  if (selectedText.split('\n').length > 3 && selectedText.includes('await')) {
    refactorings.push({
      title: '📦 Extract to async function',
      kind: CodeActionKind.RefactorExtract,
      command: {
        title: 'Extract to function',
        command: 'braveRealBrowser.extractFunction',
        arguments: [document.uri, range]
      }
    });
  }
  
  // Add progress tracking
  if (selectedText.split('await').length > 3) {
    refactorings.push({
      title: '📈 Add progress tracking',
      kind: CodeActionKind.RefactorRewrite
    });
  }
  
  return refactorings;
}

/**
 * Get default value for a parameter
 */
function getDefaultValue(prop) {
  if (!prop) return '""';
  
  if (prop.default !== undefined) {
    return typeof prop.default === 'string' ? `'${prop.default}'` : String(prop.default);
  }
  
  switch (prop.type) {
    case 'string': return "''";
    case 'number': return '0';
    case 'boolean': return 'false';
    case 'array': return '[]';
    case 'object': return '{}';
    default: return '""';
  }
}

/**
 * Indent text by spaces
 */
function indentText(text, spaces) {
  const indent = ' '.repeat(spaces);
  return text.split('\n').map(line => indent + line).join('\n');
}

module.exports = { getRefactorings };
