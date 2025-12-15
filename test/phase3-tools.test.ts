
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleBrowserInit, handleBrowserClose } from '../src/handlers/browser-handlers.js';
import { handleNavigate } from '../src/handlers/navigation-handlers.js';
import {
    handleVideoSourceExtractor,
    handleVideoPlayerFinder,
    handleVideoDownloadLinkFinder
} from '../src/handlers/advanced-video-media-handlers.js';
// Import browser manager to access page instance for injection
import { getPageInstance } from '../src/browser-manager.js';

describe('Phase 3 Tools Verification', () => {
    beforeAll(async () => {
        await handleBrowserInit({ headless: true });
        await handleNavigate({ url: 'https://example.com' });
    }, 30000);

    afterAll(async () => {
        await handleBrowserClose();
    });

    it('should extract video sources with handleVideoSourceExtractor', async () => {
        const result = await handleVideoSourceExtractor({});
        expect(result).toBeDefined();
        const data = JSON.parse(result.content[0].text);
        expect(Array.isArray(data)).toBe(true);
    });

    it('should find video players with handleVideoPlayerFinder', async () => {
        const result = await handleVideoPlayerFinder({});
        const text = result.content[0].text;
        expect(text).toContain('Detected Players');
    });

    it('should find download links with handleVideoDownloadLinkFinder', async () => {
        // Inject a mock link
        const page = getPageInstance();
        if (page) {
            await page.evaluate(() => {
                const a = document.createElement('a');
                a.href = 'https://example.com/video.mp4';
                a.textContent = 'Download Video';
                document.body.appendChild(a);
            });
        }

        const result = await handleVideoDownloadLinkFinder({
            extensions: ['.mp4']
        });

        const data = JSON.parse(result.content[0].text);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0].href).toContain('.mp4');
    });
});
