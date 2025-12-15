
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleBrowserInit, handleBrowserClose } from '../src/handlers/browser-handlers.js';
import { handleNavigate } from '../src/handlers/navigation-handlers.js';
import {
    handleKeywordSearch,
    handleVisualElementFinder
} from '../src/handlers/search-filter-handlers.js';
import {
    handleContentClassification,
    handleSmartSelectorGenerator,
    handleSentimentAnalysis
} from '../src/handlers/ai-powered-handlers.js';

describe('Phase 2 Tools Verification', () => {
    beforeAll(async () => {
        await handleBrowserInit({ headless: true });
        await handleNavigate({ url: 'https://example.com' });
    }, 30000);

    afterAll(async () => {
        await handleBrowserClose();
    });

    it('should find keywords with handleKeywordSearch', async () => {
        const result = await handleKeywordSearch({
            keywords: ['Example', 'Domain'],
            caseSensitive: false
        });

        expect(result).toBeDefined();
        const text = result.content[0].text;
        expect(text).toContain('Total Matches');
        expect(text).toContain('Example');
    });

    it('should classify content with handleContentClassification', async () => {
        const result = await handleContentClassification({});

        expect(result).toBeDefined();
        const text = result.content[0].text;
        expect(text).toContain('Primary Category');
        // example.com might classify as Technology or Other depending on keywords
    });

    it('should generate smart selectors with handleSmartSelectorGenerator', async () => {
        const result = await handleSmartSelectorGenerator({
            description: 'Example Domain heading'
        });

        expect(result).toBeDefined();
        const text = result.content[0].text;
        expect(text).toContain('Best Match');
        expect(text).toContain('h1');
    });

    it('should analyze sentiment with handleSentimentAnalysis', async () => {
        const result = await handleSentimentAnalysis({
            text: 'This is a good and great example.'
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.sentiment).toBe('Positive');
        expect(data.score).toBeGreaterThan(0);
    });

    it('should find visual elements with handleVisualElementFinder', async () => {
        const result = await handleVisualElementFinder({
            criteria: { visible: true, hasText: true }
        });

        const text = result.content[0].text;
        expect(text).toContain('Visual Element Finder Results');
        expect(text).toContain('Top Matches');
    });
});
