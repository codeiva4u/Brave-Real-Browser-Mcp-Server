import { PuppeteerBlocker, fullLists } from '@cliqz/adblocker-puppeteer';
import fetch from 'cross-fetch';
import { Page } from 'brave-real-puppeteer-core';
import { injectStealth } from './stealth';
import { injectScriptlets } from './scriptlets';
import { injectCosmeticFiltering } from './cosmetic';
import { injectRedirectBlocking } from './redirects';
import { FilterUpdater, getFilterUpdater, FilterUpdaterOptions } from './filter-updater';
import * as fs from 'fs';
import * as path from 'path';

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
    /** Path to custom filter list file */
    customFiltersPath?: string;
    /** Enable auto-update of uBlock Origin filters */
    enableFilterAutoUpdate?: boolean;
    /** Filter updater options */
    filterUpdaterOptions?: FilterUpdaterOptions;
}

// Additional filter lists for aggressive blocking
const EXTRA_FILTER_LISTS = [
    'https://raw.githubusercontent.com/nicholast/nicholast-adblock-list/main/nicholast-adblock-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-annoyance-list/main/nicholast-annoyance-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-anti-script-list/main/nicholast-anti-script-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-anti-popup-list/main/nicholast-anti-popup-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-anti-redirect-list/main/nicholast-anti-redirect-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-anti-adblock-list/main/nicholast-anti-adblock-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-anti-overlay-list/main/nicholast-anti-overlay-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-anti-cookie-list/main/nicholast-anti-cookie-list.txt',
    'https://raw.githubusercontent.com/nicholast/nicholast-anti-tracking-list/main/nicholast-anti-tracking-list.txt'
];

// Built-in custom filters for file hosting sites
const BUILTIN_CUSTOM_FILTERS = `
! ==========================================
! Built-in Anti-Popup/Redirect Rules
! ==========================================

! Block common popup domains
||profitableratecpm.com^$all
||engridfanlike.com^$all
||pubfuture.com^$all
||highcpmrevenuegate.com^$all
||clickadu.com^$all
||propellerads.com^$all
||popads.net^$all
||popcash.net^$all
||adcash.com^$all
||exoclick.com^$all
||trafficjunky.net^$all
||juicyads.com^$all

! Block all third-party popups
*$popup,third-party

! Block popup/ad scripts from file hosting sites
*$script,third-party,domain=oxxfile.info|hubcloud.club|filepress.top|hubcloud.lol|hubcloud.art|gdtot.cfd

! Generic ad element hiding
##div[id^="div-gpt-ad"]
##div[class*="adsbygoogle"]
##ins.adsbygoogle
##div[id*="taboola"]
##div[id*="outbrain"]
##iframe[src*="ads"]
##div[class*="popup-ad"]
##div[class*="overlay-ad"]
##div[class*="interstitial"]
`;

export class BraveBlocker {
    private blocker: PuppeteerBlocker | null = null;
    private options: BraveBlockerOptions;
    private initialized: boolean = false;
    private filterUpdater: FilterUpdater | null = null;

    constructor(options: BraveBlockerOptions = {}) {
        this.options = options;
        
        // Initialize filter updater if auto-update is enabled (default: true)
        if (this.options.enableFilterAutoUpdate !== false) {
            this.filterUpdater = getFilterUpdater({
                customFiltersPath: this.options.customFiltersPath,
                ...this.options.filterUpdaterOptions
            });
        }
    }

    /**
     * Initialize the blocker engine by downloading lists
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Start with prebuilt lists
            this.blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
            
            // Add built-in custom filters
            const customBlocker = await PuppeteerBlocker.parse(BUILTIN_CUSTOM_FILTERS);
            
            // Try to fetch latest filters using FilterUpdater (auto-update from uBlock Origin)
            if (this.filterUpdater) {
                try {
                    console.log('[BraveBlocker] Fetching latest uBlock Origin filters...');
                    const latestFilters = await this.filterUpdater.getFilters();
                    
                    if (latestFilters && latestFilters.length > 0) {
                        const latestBlocker = await PuppeteerBlocker.parse(latestFilters);
                        
                        // Merge all blockers
                        this.blocker = PuppeteerBlocker.deserialize(
                            Buffer.concat([
                                this.blocker.serialize(),
                                customBlocker.serialize(),
                                latestBlocker.serialize()
                            ])
                        );
                        
                        const cacheInfo = this.filterUpdater.getCacheInfo();
                        console.log('[BraveBlocker] Loaded latest uBlock Origin filters');
                        console.log('[BraveBlocker] Cache expires:', cacheInfo.expiresAt?.toISOString());
                    }
                } catch (filterError) {
                    console.warn('[BraveBlocker] Failed to fetch latest filters, using fallback:', filterError);
                    // Fall back to local custom filters
                    await this.loadLocalCustomFilters(customBlocker);
                }
            } else {
                // No filter updater, use local custom filters only
                await this.loadLocalCustomFilters(customBlocker);
            }
            
            this.initialized = true;
            console.log('[BraveBlocker] Initialized with ad blocking engine');
        } catch (e) {
            console.error('[BraveBlocker] Failed to initialize:', e);
            // Fallback to basic blocker
            this.blocker = await PuppeteerBlocker.parse(BUILTIN_CUSTOM_FILTERS);
            this.initialized = true;
        }
    }
    
    /**
     * Load local custom filters as fallback
     */
    private async loadLocalCustomFilters(customBlocker: PuppeteerBlocker) {
        const customFiltersPath = this.options.customFiltersPath || 
            path.join(__dirname, '..', 'assets', 'ublock-custom-filters.txt');
        
        if (fs.existsSync(customFiltersPath)) {
            try {
                const customFilters = fs.readFileSync(customFiltersPath, 'utf-8');
                const fileBlocker = await PuppeteerBlocker.parse(customFilters);
                // Merge all blockers
                this.blocker = PuppeteerBlocker.deserialize(
                    Buffer.concat([
                        this.blocker!.serialize(),
                        customBlocker.serialize(),
                        fileBlocker.serialize()
                    ])
                );
                console.log('[BraveBlocker] Loaded custom filters from:', customFiltersPath);
            } catch (e) {
                console.warn('[BraveBlocker] Failed to load custom filters:', e);
            }
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

        // 1. First inject scriptlets (earliest protection)
        if (opts.enableScriptlets) {
            await injectScriptlets(page);
        }

        // 2. Enable network-level ad blocking
        if (opts.enableAdBlocking) {
            if (!this.initialized) {
                await this.init();
            }
            if (this.blocker) {
                await this.blocker.enableBlockingInPage(page);
            }
        }

        // 3. Inject stealth protections
        if (opts.enableStealth) {
            await injectStealth(page);
        }

        // 4. Cosmetic filtering (CSS + MutationObserver)
        if (opts.enableCosmeticFiltering) {
            await injectCosmeticFiltering(page);
        }

        // 5. Redirect/Popup blocking (Puppeteer level)
        if (opts.enableRedirectBlocking) {
            await injectRedirectBlocking(page);
        }
        
        console.log('[BraveBlocker] All protections enabled for page');
    }
    
    /**
     * Check if a URL should be blocked
     */
    shouldBlock(url: string): boolean {
        if (!this.blocker) return false;
        const result = this.blocker.match({ url, type: 'script' } as any);
        return result.match;
    }
}
