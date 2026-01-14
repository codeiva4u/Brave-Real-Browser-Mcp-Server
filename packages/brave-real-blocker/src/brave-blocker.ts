import { PuppeteerBlocker } from '@cliqz/adblocker-puppeteer';
import fetch from 'cross-fetch';
import { Page } from 'brave-real-puppeteer-core';
import { injectStealth } from './stealth';
import { injectScriptlets } from './scriptlets';
import { injectCosmeticFiltering } from './cosmetic';
import { injectRedirectBlocking } from './redirects';

export interface BraveBlockerOptions {
    /** Enable standard network request blocking (Ads/Trackers) */
    enableAdBlocking?: boolean;
    /** Enable stealth evasions (Navigator, WebGL, etc.) */
    enableStealth?: boolean;
    /** Enable cosmetic filtering (Element hiding) */
    enableCosmeticFiltering?: boolean;
    /** Enable advanced redirect and popup blocking */
    enableRedirectBlocking?: boolean;
    /** Enable scriptlet injection for anti-adblock evasion */
    enableScriptlets?: boolean;
}

export class BraveBlocker {
    private blocker: PuppeteerBlocker | null = null;
    private options: BraveBlockerOptions;

    constructor(options: BraveBlockerOptions = {}) {
        this.options = options;
    }

    /**
     * Initialize the blocker engine by downloading lists
     */
    async init() {
        if (!this.blocker) {
            this.blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
        }
    }

    /**
     * Enable blocking on a Puppeteer page
     */
    async enable(page: Page) {
        // Defaults: enable everything if not explicitly disabled
        const opts = {
            enableAdBlocking: this.options.enableAdBlocking ?? true,
            enableStealth: this.options.enableStealth ?? true,
            enableCosmeticFiltering: this.options.enableCosmeticFiltering ?? true,
            enableRedirectBlocking: this.options.enableRedirectBlocking ?? true,
            enableScriptlets: this.options.enableScriptlets ?? true,
        };

        if (opts.enableAdBlocking) {
            if (!this.blocker) {
                await this.init();
            }
            await this.blocker!.enableBlockingInPage(page);
        }

        if (opts.enableStealth) {
            await injectStealth(page);
        }

        if (opts.enableScriptlets) {
            await injectScriptlets(page);
        }

        if (opts.enableCosmeticFiltering) {
            await injectCosmeticFiltering(page);
        }

        if (opts.enableRedirectBlocking) {
            await injectRedirectBlocking(page);
        }
    }
}
