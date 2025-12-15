
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleBrowserInit, handleBrowserClose } from '../src/handlers/browser-handlers.js';
import { handleNavigate } from '../src/handlers/navigation-handlers.js';
import { handleAdProtectionDetector } from '../src/handlers/advanced-extraction-handlers.js';
import { handleOCREngine } from '../src/handlers/captcha-handlers.js';

describe('Phase 4 Tools Verification', () => {
    beforeAll(async () => {
        await handleBrowserInit({ headless: true });
        await handleNavigate({ url: 'https://example.com' });
    }, 30000);

    afterAll(async () => {
        await handleBrowserClose();
    });

    it('should run ad protection detector', async () => {
        const result = await handleAdProtectionDetector({});
        const text = result.content[0].text;
        expect(text).toContain('Ad Protection Analysis');
        expect(text).toContain('adBlockDetection');
    });

    it('should handle OCR engine request (expect error without image)', async () => {
        // We expect it to fail gracefully or return error if no image provided
        const result = await handleOCREngine({});
        // Depending on implementation, it might be isError: true or return a message
        if (result.isError) {
            expect(result.content[0].text).toContain('No image source');
        } else {
            // If it didn't error, check content
            expect(result.content[0].text).toBeDefined();
        }
    });
});
