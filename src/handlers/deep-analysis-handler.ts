// @ts-nocheck
import { getCurrentPage } from '../browser-manager.js';
import { withErrorHandling, sleep } from '../system-utils.js';
import { validateWorkflow } from '../workflow-validation.js';

export interface DeepAnalysisArgs {
    url?: string;
    duration?: number; // Duration to record network/logs in ms (default 5000)
    screenshots?: boolean; // Take screenshots (default true)
    network?: boolean; // Capture network logs (default true)
    logs?: boolean; // Capture console logs (default true)
    dom?: boolean; // Capture simplified DOM snapshot (default true)
}

/**
 * Deep Analysis Tool
 * Captures a comprehensive snapshot of the page including network traces, console logs, and DOM state.
 */
export async function handleDeepAnalysis(args: DeepAnalysisArgs) {
    return await withErrorHandling(async () => {
        validateWorkflow('deep_analysis', {
            requireBrowser: true,
            requirePage: true,
        });

        const page = getCurrentPage();
        const { url, duration = 5000, screenshots = true, network = true, logs = true, dom = true } = args;

        // Navigate if URL provided
        if (url && page.url() !== url) {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }

        // Storage for captured data
        const capturedData: any = {
            network: [],
            console: [],
            error: null
        };

        // Setup Listeners
        const listeners: any[] = [];

        if (network) {
            const netHandler = (req: any) => {
                capturedData.network.push({
                    type: 'request',
                    url: req.url(),
                    method: req.method(),
                    resource: req.resourceType(),
                    timestamp: Date.now()
                });
            };
            page.on('request', netHandler);
            listeners.push(() => page.off('request', netHandler));
        }

        if (logs) {
            const logHandler = (msg: any) => {
                capturedData.console.push({
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: Date.now()
                });
            };
            page.on('console', logHandler);
            listeners.push(() => page.off('console', logHandler));
        }

        // Wait and Record
        await sleep(duration);

        // Cleanup Listeners
        listeners.forEach(cleanup => cleanup());

        // Take Snapshot
        const result: any = {
            timestamp: new Date().toISOString(),
            url: page.url(),
            title: await page.title(),
            recordingDuration: duration,
            networkRequests: capturedData.network.length,
            consoleLogs: capturedData.console.length,
            data: {
                network: capturedData.network,
                console: capturedData.console
            }
        };

        if (dom) {
            result.data.dom = await page.evaluate(() => {
                // Simplified DOM snapshot
                const cleanText = (text: string) => text?.replace(/\\s+/g, ' ').trim() || '';
                return {
                    title: document.title,
                    headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({ tag: h.tagName, text: cleanText(h.textContent) })),
                    buttons: Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]')).map(b => cleanText(b.textContent)),
                    links: Array.from(document.querySelectorAll('a')).slice(0, 50).map(a => ({ text: cleanText(a.textContent), href: a.href })),
                    inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(i => ({ tag: i.tagName, type: (i as any).type, id: i.id, placeholder: (i as any).placeholder }))
                };
            });
        }

        if (screenshots) {
            result.data.screenshot = await page.screenshot({ encoding: 'base64', type: 'webp', quality: 50 });
        }

        const summary = `
🔍 Deep Analysis Report
═══════════════════════

📍 URL: ${result.url}
⏱️ Duration: ${duration}ms
📅 Time: ${result.timestamp}

📊 Statistics:
  • Network Requests: ${result.networkRequests}
  • Console Logs: ${result.consoleLogs}
  ${dom ? `• DOM Elements: ${result.data.dom.headings.length} headings, ${result.data.dom.buttons.length} buttons, ${result.data.dom.links.length} links` : ''}

${logs && result.data.console.length > 0 ? `
📝 Recent Console Logs (Last 5):
${result.data.console.slice(-5).map(l => `  [${l.type}] ${l.text}`).join('\n')}
` : ''}

${dom ? `
🏗️ Page Structure:
  • Headings: ${result.data.dom.headings.map(h => h.text).join(', ')}
  • Interactive: ${result.data.dom.buttons.length} buttons
` : ''}
`;

        return {
            content: [
                { type: 'text', text: summary },
                ...(screenshots ? [{ type: 'image', data: result.data.screenshot, mimeType: 'image/webp' }] : [])
            ],
            // Return full dataset as JSON for programmatic use if needed (MCP usually just text/image)
            // We embed the summary logic here.
        };

    }, 'Deep Analysis Failed');
}
