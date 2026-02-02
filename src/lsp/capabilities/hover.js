/**
 * Hover Capability
 */
const { MarkupKind } = require('vscode-languageserver/node');

function getHoverInfo(document, position, tools, lang) {
  const text = document.getText();
  const lineText = text.split('\n')[position.line] || '';
  const word = getWordAtPosition(lineText, position.character);
  if (!word) return null;

  const tool = tools.find(t => t.name === word);
  if (tool) {
    const toolLang = lang.tools[tool.name] || {};
    const props = tool.inputSchema.properties || {};
    const required = tool.inputSchema.required || [];
    const paramDocs = Object.entries(props).map(([name, schema]) => {
      const isReq = required.includes(name);
      const desc = toolLang.parameters?.[name] || schema.description || '';
      return `| \`${name}\` | ${schema.type} | ${isReq ? '✅' : '❌'} | ${desc} |`;
    });

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: [
          `## ${tool.emoji} ${toolLang.label || tool.name}`,
          '', toolLang.documentation || tool.description, '',
          '### Parameters', '', '| Name | Type | Required | Description |', '|------|------|----------|-------------|',
          ...paramDocs, '',
          '### Example', '', '```javascript', generateExample(tool), '```'
        ].join('\n'),
      },
    };
  }
  return null;
}

function generateExample(tool) {
  const props = tool.inputSchema.properties || {};
  const required = tool.inputSchema.required || [];
  if (required.length === 0) return `await ${tool.name}();`;
  const params = required.map(p => {
    const prop = props[p];
    let val = prop?.default;
    if (val === undefined) {
      if (prop?.type === 'string') val = "'value'";
      else if (prop?.type === 'boolean') val = 'true';
      else if (prop?.type === 'number') val = '1000';
      else if (prop?.enum) val = `'${prop.enum[0]}'`;
      else val = '{}';
    } else if (typeof val === 'string') val = `'${val}'`;
    return `  ${p}: ${val}`;
  });
  return `await ${tool.name}({\n${params.join(',\n')}\n});`;
}

function getWordAtPosition(line, char) {
  let start = char, end = char;
  while (start > 0 && /\w/.test(line[start - 1])) start--;
  while (end < line.length && /\w/.test(line[end])) end++;
  return start === end ? null : line.substring(start, end);
}

module.exports = { getHoverInfo };
