
import TurndownService from 'turndown';

export interface HtmlToTextArgs {
    html: string;
    preserveLinks?: boolean;
    preserveFormatting?: boolean; // Turndown handles some of this
}

export interface DuplicateRemoverArgs {
    data: any[];
    uniqueKey?: string;
}

export async function handleHtmlToText(args: HtmlToTextArgs) {
    try {
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        // Config based on args
        if (!args.preserveLinks) {
            turndownService.addRule('no-links', {
                filter: 'a',
                replacement: function (content) { return content; }
            });
        }

        const text = turndownService.turndown(args.html);
        return {
            content: [{
                type: 'text',
                text: text
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error converting HTML to text: ${error}`
            }],
            isError: true
        };
    }
}

export async function handleDuplicateRemover(args: DuplicateRemoverArgs) {
    if (!Array.isArray(args.data)) {
        throw new Error("Input 'data' must be an array.");
    }

    let uniqueData;
    if (args.uniqueKey) {
        const seen = new Set();
        uniqueData = args.data.filter(item => {
            const val = item[args.uniqueKey!];
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    } else {
        // Deep equality check or simple JSON stringify check?
        // Use JSON stringify for simplicity and speed on complex objects
        const seen = new Set();
        uniqueData = args.data.filter(item => {
            const val = JSON.stringify(item);
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    }

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(uniqueData, null, 2)
        }]
    };
}
