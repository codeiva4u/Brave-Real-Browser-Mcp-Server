/**
 * Workflow Simulation Capability
 */
function simulateWorkflow(document, tools, lang, execute = false) {
  const text = document.getText();
  const codeLenses = [];
  const toolNames = tools.map(t => t.name);
  const regex = new RegExp(`(${toolNames.join('|')})\\s*\\(`, 'g');
  const lines = text.split('\n');
  let stepCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = regex.exec(lines[i])) !== null) {
      stepCount++;
      const tool = tools.find(t => t.name === match[1]);
      codeLenses.push({
        range: { start: { line: i, character: match.index }, end: { line: i, character: match.index + match[1].length } },
        command: { title: `${tool?.emoji || '▶️'} Step ${stepCount}`, command: 'braveRealBrowser.stepDetails', arguments: [match[1], i] }
      });
    }
    regex.lastIndex = 0;
  }
  
  if (stepCount > 0) {
    codeLenses.unshift({ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, command: { title: `▶️ Run Simulation (${stepCount} steps)`, command: 'braveRealBrowser.runSimulation', arguments: [document.uri] } });
  }
  
  return codeLenses;
}
module.exports = { simulateWorkflow };
