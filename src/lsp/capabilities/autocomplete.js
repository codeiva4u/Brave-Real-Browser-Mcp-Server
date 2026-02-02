/**
 * Autocomplete Capability
 */
const { CompletionItemKind, InsertTextFormat } = require('vscode-languageserver/node');

function getCompletions(document, position, tools, lang, settings) {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const lineText = text.split('\n')[position.line] || '';
  const prefix = getPrefix(lineText, position.character);
  const completions = [];
  const context = detectContext(text, offset);

  if (context.type === 'tool_name' || context.type === 'start') {
    for (const tool of tools) {
      const toolLang = lang.tools[tool.name] || {};
      if (tool.name.toLowerCase().startsWith(prefix) || prefix === '') {
        completions.push({
          label: tool.name,
          kind: CompletionItemKind.Function,
          detail: `${tool.emoji} ${toolLang.detail || tool.description}`,
          documentation: toolLang.documentation || tool.description,
          insertText: generateToolSnippet(tool),
          insertTextFormat: InsertTextFormat.Snippet,
          data: { toolName: tool.name },
          sortText: `0_${tool.name}`,
        });
      }
    }
  }

  if (context.type === 'parameter_name') {
    const tool = tools.find(t => t.name === context.toolName);
    if (tool?.inputSchema?.properties) {
      const toolLang = lang.tools[tool.name] || {};
      for (const [name, schema] of Object.entries(tool.inputSchema.properties)) {
        if (name.toLowerCase().startsWith(prefix) || prefix === '') {
          completions.push({
            label: name,
            kind: CompletionItemKind.Property,
            detail: schema.type,
            documentation: toolLang.parameters?.[name] || schema.description,
            insertText: `${name}: `,
            sortText: tool.inputSchema.required?.includes(name) ? `0_${name}` : `1_${name}`,
          });
        }
      }
    }
  }

  if (context.type === 'parameter_value') {
    const tool = tools.find(t => t.name === context.toolName);
    const schema = tool?.inputSchema?.properties?.[context.paramName];
    if (schema?.enum) {
      for (const value of schema.enum) {
        completions.push({ label: value, kind: CompletionItemKind.EnumMember, insertText: `'${value}'` });
      }
    }
    if (schema?.type === 'boolean') {
      completions.push({ label: 'true', kind: CompletionItemKind.Keyword }, { label: 'false', kind: CompletionItemKind.Keyword });
    }
  }

  return completions;
}

function generateToolSnippet(tool) {
  const required = tool.inputSchema.required || [];
  const props = tool.inputSchema.properties || {};
  if (required.length === 0) return `${tool.name}()`;
  let i = 1;
  const params = required.map(p => {
    const prop = props[p];
    if (prop?.type === 'string') return `${p}: '\${${i++}}'`;
    if (prop?.type === 'boolean') return `${p}: \${${i++}:false}`;
    if (prop?.type === 'number') return `${p}: \${${i++}:0}`;
    return `${p}: \${${i++}}`;
  });
  return `${tool.name}({ ${params.join(', ')} })`;
}

function getPrefix(line, char) {
  let start = char;
  while (start > 0 && /\w/.test(line[start - 1])) start--;
  return line.substring(start, char).toLowerCase();
}

function detectContext(text, offset) {
  const before = text.substring(0, offset);
  if (/(\w+)\s*\(\s*\{[^}]*(\w+)\s*:\s*['"]?$/.test(before)) {
    const match = before.match(/(\w+)\s*\(\s*\{[^}]*(\w+)\s*:\s*['"]?$/);
    return { type: 'parameter_value', toolName: match[1], paramName: match[2] };
  }
  if (/(\w+)\s*\(\s*\{[^}]*$/.test(before)) {
    const match = before.match(/(\w+)\s*\(\s*\{[^}]*$/);
    return { type: 'parameter_name', toolName: match[1] };
  }
  if (/(?:await\s+|^\s*)$/.test(before)) return { type: 'tool_name' };
  return { type: 'start' };
}

module.exports = { getCompletions };
