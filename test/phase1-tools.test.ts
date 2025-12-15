
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleBrowserInit, handleBrowserClose } from '../src/handlers/browser-handlers.js';
import { handleNavigate } from '../src/handlers/navigation-handlers.js';
import {
    handleHtmlElementsExtractor,
    handleTagsFinder
} from '../src/handlers/dom-handlers.js';
import {
    handleHtmlToText,
    handleDuplicateRemover
} from '../src/handlers/data-transform-handlers.js';

describe('Phase 1 Tools Verification', () => {
    beforeAll(async () => {
        await handleBrowserInit({ headless: true });
        await handleNavigate({ url: 'https://example.com' });
    }, 30000);

    afterAll(async () => {
        await handleBrowserClose();
    });

    it('should extract HTML elements with handleHtmlElementsExtractor', async () => {
        const result = await handleHtmlElementsExtractor({
            selector: 'h1',
            maxElements: 1,
            includeStyles: true
        });

        expect(result).toBeDefined();
        const data = JSON.parse(result.content[0].text);
        expect(data).toHaveLength(1);
        expect(data[0].tagName).toBe('h1');
        expect(data[0].text).toContain('Example Domain');
        expect(data[0].styles).toBeDefined();
    });

    it('should find tags with handleTagsFinder', async () => {
        const result = await handleTagsFinder({
            tags: ['h1', 'p']
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.h1).toBeDefined();
        expect(data.p).toBeDefined();
        expect(data.p.length).toBeGreaterThan(0);
    });

    it('should convert HTML to text with handleHtmlToText', async () => {
        const html = '<h1>Hello</h1><p>World</p>';
        const result = await handleHtmlToText({ html });
        console.log('HTML to Text Result:', result.content[0].text);
        expect(result.content[0].text).toContain('Hello');
        expect(result.content[0].text).toContain('World');
    });

    it('should remove duplicates with handleDuplicateRemover', async () => {
        const data = [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
            { id: 1, name: 'A' }
        ];
        const result = await handleDuplicateRemover({
            data,
            uniqueKey: 'id'
        });

        const unique = JSON.parse(result.content[0].text);
        expect(unique).toHaveLength(2);
        expect(unique.find((x: any) => x.id === 1)).toBeDefined();
    });
});
