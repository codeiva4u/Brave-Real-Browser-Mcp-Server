
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log to a file in the project root (up one level from src, or relative to where it runs)
// We try to find a writable location.
const LOG_FILE = path.join(process.cwd(), 'mcp-server-debug.log');

export function logDebug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${message}`;

    if (data) {
        try {
            logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        } catch (e) {
            logMessage += `\nData: [Circular or Non-Serializable]`;
        }
    }

    logMessage += '\n' + '-'.repeat(40) + '\n';

    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (error) {
        // If we can't write to file, fallback to stderr (which is safe for MCP)
        console.error(`[DEBUG FAILED] ${message}`);
    }
}
