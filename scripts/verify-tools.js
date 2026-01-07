
import { TOOLS } from '../dist/tool-definitions.js';

try {
    console.log('Successfully imported TOOLS.');
    console.log(`Total tools count: ${TOOLS.length}`);

    const json = JSON.stringify(TOOLS, null, 2);
    console.log(`JSON length: ${json.length} characters`);

    TOOLS.forEach((tool, index) => {
        if (!tool.name) console.error(`Tool at index ${index} has no name`);
        if (!tool.inputSchema) console.error(`Tool ${tool.name} has no inputSchema`);
        try {
            JSON.stringify(tool.inputSchema);
        } catch (e) {
            console.error(`Tool ${tool.name} schema is not serializable: ${e.message}`);
        }
    });

    console.log('Verification complete.');
} catch (error) {
    console.error('Failed to inspect TOOLS:', error);
    process.exit(1);
}
