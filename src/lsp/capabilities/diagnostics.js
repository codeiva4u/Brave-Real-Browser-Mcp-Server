/**
 * Diagnostics Capability
 */
const { DiagnosticSeverity } = require('vscode-languageserver/node');

function getDiagnostics(document, tools, lang, maxDiagnostics = 100) {
  const text = document.getText();
  const diagnostics = [];
  let browserInit = false, browserClosed = false;
  const browserRequired = ['navigate','get_content','wait','click','type','solve_captcha','random_scroll','find_element','save_content_as_markdown','search_regex','extract_json','scrape_meta_tags','press_key','deep_analysis','network_recorder','link_harvester','cookie_manager','iframe_handler','stream_extractor','js_scrape','execute_js','player_api_hook','form_automator'];
  const toolNames = tools.map(t => t.name);
  const regex = new RegExp(`(${toolNames.join('|')})\\s*\\(`, 'g');
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length && diagnostics.length < maxDiagnostics; i++) {
    const line = lines[i];
    let match;
    while ((match = regex.exec(line)) !== null) {
      const name = match[1];
      const range = { start: { line: i, character: match.index }, end: { line: i, character: match.index + name.length } };
      
      if (name === 'browser_init') { browserInit = true; browserClosed = false; }
      if (name === 'browser_close') browserClosed = true;
      
      if (browserRequired.includes(name) && !browserInit) {
        diagnostics.push({ severity: DiagnosticSeverity.Error, range, message: lang.diagnostics?.browserNotInit || 'Browser not initialized', source: 'brave-real-browser', code: 'browser-not-init' });
      }
      if (browserRequired.includes(name) && browserClosed) {
        diagnostics.push({ severity: DiagnosticSeverity.Error, range, message: 'Browser already closed', source: 'brave-real-browser', code: 'browser-closed' });
      }
    }
    regex.lastIndex = 0;
  }
  
  if (browserInit && !browserClosed) {
    diagnostics.push({ severity: DiagnosticSeverity.Information, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, message: 'Consider adding browser_close() at the end', source: 'brave-real-browser', code: 'missing-cleanup' });
  }
  
  return diagnostics;
}

module.exports = { getDiagnostics };
