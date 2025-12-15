
import { getPageInstance } from '../browser-manager.js';

export interface NetworkRecorderArgs {
    duration?: number;
    filterTypes?: string[];
}

export interface AjaxExtractorArgs {
    duration?: number;
    url?: string;
}

export interface FetchXhrArgs {
    duration?: number;
}

export interface ApiFinderArgs {
    deepScan?: boolean;
}

async function captureNetwork(page: any, duration: number, filter: (req: any, res: any) => boolean) {
    const captured: any[] = [];

    const responseHandler = async (response: any) => {
        try {
            const request = response.request();
            if (filter(request, response)) {
                let body = '[Binary or Too Large]';
                try {
                    const type = response.headers()['content-type'] || '';
                    if (type.includes('text') || type.includes('json') || type.includes('xml')) {
                        body = await response.text();
                    }
                } catch (e) {
                    // Ignore
                }

                captured.push({
                    url: response.url(),
                    method: request.method(),
                    type: request.resourceType(),
                    status: response.status(),
                    headers: response.headers(),
                    body: body.slice(0, 5000)
                });
            }
        } catch (e) {
            // ignore
        }
    };

    page.on('response', responseHandler);

    await new Promise(resolve => setTimeout(resolve, duration));

    page.off('response', responseHandler);
    return captured;
}

export async function handleNetworkRecorder(args: NetworkRecorderArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const duration = args.duration || 10000;

    const results = await captureNetwork(page, duration, (req, res) => {
        if (!args.filterTypes || args.filterTypes.length === 0) return true;
        const type = req.resourceType().toLowerCase();
        return args.filterTypes.includes(type);
    });

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
        }]
    };
}

export async function handleAjaxExtractor(args: AjaxExtractorArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const duration = args.duration || 15000;

    const results = await captureNetwork(page, duration, (req, res) => {
        const type = req.resourceType();
        const isXhr = type === 'xhr' || type === 'fetch';
        if (!isXhr) return false;
        if (args.url && !req.url().includes(args.url)) return false;
        return true;
    });

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
        }]
    };
}

export async function handleFetchXhr(args: FetchXhrArgs) {
    return handleAjaxExtractor({ duration: args.duration });
}

export async function handleApiFinder(args: ApiFinderArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    // 1. Static Analysis
    const staticApis = await page.evaluate(() => {
        const patterns = [/\/api\//, /\/v\d+\//, /graphql/, /\.json$/];
        const candidates = new Set<string>();

        document.querySelectorAll('script').forEach(s => {
            if (s.src) candidates.add(s.src);
        });

        document.querySelectorAll('a').forEach(a => {
            candidates.add(a.href);
        });

        return Array.from(candidates).filter(url => patterns.some(p => p.test(url)));
    });

    // 2. Dynamic Analysis
    const dynamicApis = await captureNetwork(page, 5000, (req, res) => {
        const type = req.resourceType();
        const contentType = res.headers()['content-type'] || '';
        return (type === 'xhr' || type === 'fetch') && contentType.includes('json');
    });

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                staticAnalysis: staticApis,
                dynamicCapture: dynamicApis.map(d => d.url)
            }, null, 2)
        }]
    };
}
