
import * as fs from 'fs';
import * as path from 'path';

// Simple regex parser since we can't easily import the typescript modules directly in a node script without compilation steps
function checkRegistration() {
    const rootDir = path.resolve(__dirname, '..');
    const toolDefsPath = path.join(rootDir, 'src', 'tool-definitions.ts');
    const indexPath = path.join(rootDir, 'src', 'index.ts');

    console.log(`Checking definitions in: ${toolDefsPath}`);
    console.log(`Checking registration in: ${indexPath}`);

    const toolDefsContent = fs.readFileSync(toolDefsPath, 'utf8');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // Extract TOOL_NAMES constants
    // Looks like:   BROWSER_INIT: 'browser_init',
    const toolNameRegex = /([A-Z_]+):\s*'([^']+)'/g;
    const definedTools = new Map();
    let match;

    // We only want the ones inside "export const TOOL_NAMES = {" block
    // So let's isolate that block roughly
    const toolsBlockMatch = toolDefsContent.match(/export const TOOL_NAMES = \{([\s\S]*?)\}/);
    if (!toolsBlockMatch) {
        console.error("Could not find TOOL_NAMES block in definitions!");
        return;
    }
    const toolsBlock = toolsBlockMatch[1];

    while ((match = toolNameRegex.exec(toolsBlock)) !== null) {
        // match[1] is Key (BROWSER_INIT), match[2] is Value (browser_init)
        const key = match[1];
        const value = match[2];
        definedTools.set(key, value);
    }

    console.log(`Found ${definedTools.size} defined tools.`);

    // Check index.ts for cases
    // We look for `case TOOL_NAMES.KEY:` or `case "value":`
    const missingTools = [];

    for (const [key, value] of definedTools.entries()) {
        const keyPattern = `case TOOL_NAMES.${key}`;
        const valuePattern = `case "${value}"`;
        const valuePatternSingle = `case '${value}'`;

        if (!indexContent.includes(keyPattern) &&
            !indexContent.includes(valuePattern) &&
            !indexContent.includes(valuePatternSingle)) {
            missingTools.push({ key, value });
        }
    }

    if (missingTools.length > 0) {
        console.error("❌ The following tools are MISSING in index.ts:");
        missingTools.forEach(t => console.error(`   - ${t.key} (${t.value})`));
        process.exit(1);
    } else {
        console.log("✅ All tools appear to be registered in index.ts!");
    }
}

checkRegistration();
