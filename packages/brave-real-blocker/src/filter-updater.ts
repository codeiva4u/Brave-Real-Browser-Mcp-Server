/**
 * Filter Updater - Auto-fetch and cache uBlock Origin filter lists
 * Automatically patches custom filters when uBlock Origin updates
 */

import fetch from 'cross-fetch';
import * as fs from 'fs';
import * as path from 'path';

// Get directory of this module (works in both ESM and CJS)
function getCurrentDir(): string {
    // Try CommonJS __dirname first
    if (typeof __dirname !== 'undefined') {
        return __dirname;
    }
    // For ESM, use import.meta.url if available
    try {
        const { fileURLToPath } = require('url');
        const url = new URL('.', (globalThis as any).import?.meta?.url || 'file://' + process.cwd());
        return fileURLToPath(url);
    } catch {
        return process.cwd();
    }
}
const currentDir = getCurrentDir();

// uBlock Origin official filter list URLs
export const UBLOCK_FILTER_LISTS = {
    // Core uBlock Origin filters
    ublock_filters: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
    ublock_badware: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
    ublock_privacy: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
    ublock_resource_abuse: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt',
    ublock_unbreak: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/unbreak.txt',
    ublock_quick_fixes: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/quick-fixes.txt',
    ublock_annoyances: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt',
    
    // EasyList
    easylist: 'https://easylist.to/easylist/easylist.txt',
    easyprivacy: 'https://easylist.to/easylist/easyprivacy.txt',
    
    // uBlock Origin scriptlets and resources
    ublock_scriptlets: 'https://raw.githubusercontent.com/AzagraMac/nicholast-adblock-list/main/nicholast-adblock-list.txt',
    
    // Anti-popup and anti-redirect lists
    anti_popup: 'https://raw.githubusercontent.com/nicholast/nicholast-anti-popup-list/main/nicholast-anti-popup-list.txt',
    anti_redirect: 'https://raw.githubusercontent.com/nicholast/nicholast-anti-redirect-list/main/nicholast-anti-redirect-list.txt',
    anti_adblock: 'https://raw.githubusercontent.com/nicholast/nicholast-anti-adblock-list/main/nicholast-anti-adblock-list.txt',
};

// Alternative backup URLs (in case primary fails)
export const BACKUP_FILTER_LISTS = {
    easylist: 'https://raw.githubusercontent.com/AzagraMac/nicholast-adblock-list/main/nicholast-adblock-list.txt',
    easyprivacy: 'https://raw.githubusercontent.com/nicholast/nicholast-annoyance-list/main/nicholast-annoyance-list.txt',
};

export interface FilterCache {
    version: string;
    lastUpdated: number;
    expiresAt: number;
    filters: { [key: string]: string };
    combinedFilters: string;
}

export interface FilterUpdaterOptions {
    /** Cache directory path */
    cacheDir?: string;
    /** Cache expiry in milliseconds (default: 7 days) */
    cacheExpiry?: number;
    /** Which filter lists to use */
    enabledLists?: (keyof typeof UBLOCK_FILTER_LISTS)[];
    /** Custom filter file path */
    customFiltersPath?: string;
    /** Force update even if cache is valid */
    forceUpdate?: boolean;
    /** Timeout for fetch requests (default: 30000ms) */
    fetchTimeout?: number;
}

const DEFAULT_OPTIONS: Required<FilterUpdaterOptions> = {
    cacheDir: path.join(currentDir, '..', 'cache'),
    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabledLists: [
        'ublock_filters',
        'ublock_badware', 
        'ublock_privacy',
        'ublock_quick_fixes',
        'ublock_annoyances',
        'easylist',
        'easyprivacy'
    ],
    customFiltersPath: path.join(currentDir, '..', 'assets', 'ublock-custom-filters.txt'),
    forceUpdate: false,
    fetchTimeout: 30000
};

export class FilterUpdater {
    private options: Required<FilterUpdaterOptions>;
    private cacheFilePath: string;
    private cache: FilterCache | null = null;

    constructor(options: FilterUpdaterOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.cacheFilePath = path.join(this.options.cacheDir, 'filter-cache.json');
        this.ensureCacheDir();
    }

    private ensureCacheDir(): void {
        if (!fs.existsSync(this.options.cacheDir)) {
            fs.mkdirSync(this.options.cacheDir, { recursive: true });
        }
    }

    /**
     * Load cache from disk
     */
    private loadCache(): FilterCache | null {
        try {
            if (fs.existsSync(this.cacheFilePath)) {
                const data = fs.readFileSync(this.cacheFilePath, 'utf-8');
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('[FilterUpdater] Failed to load cache:', e);
        }
        return null;
    }

    /**
     * Save cache to disk
     */
    private saveCache(cache: FilterCache): void {
        try {
            fs.writeFileSync(this.cacheFilePath, JSON.stringify(cache, null, 2));
            console.log('[FilterUpdater] Cache saved successfully');
        } catch (e) {
            console.error('[FilterUpdater] Failed to save cache:', e);
        }
    }

    /**
     * Check if cache is valid (not expired)
     */
    private isCacheValid(): boolean {
        if (this.options.forceUpdate) return false;
        
        const cache = this.loadCache();
        if (!cache) return false;
        
        const now = Date.now();
        if (now >= cache.expiresAt) {
            console.log('[FilterUpdater] Cache expired, will update');
            return false;
        }
        
        this.cache = cache;
        return true;
    }

    /**
     * Fetch a single filter list with timeout and retry
     */
    private async fetchFilterList(name: string, url: string, retries = 2): Promise<string> {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.options.fetchTimeout);
                
                const response = await fetch(url, { 
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const text = await response.text();
                console.log(`[FilterUpdater] Fetched ${name}: ${text.length} bytes`);
                return text;
            } catch (e: any) {
                console.warn(`[FilterUpdater] Failed to fetch ${name} (attempt ${attempt + 1}):`, e.message);
                
                // Try backup URL if available
                const backupUrl = BACKUP_FILTER_LISTS[name as keyof typeof BACKUP_FILTER_LISTS];
                if (attempt === retries && backupUrl) {
                    console.log(`[FilterUpdater] Trying backup URL for ${name}`);
                    try {
                        const response = await fetch(backupUrl);
                        if (response.ok) {
                            return await response.text();
                        }
                    } catch (e2) {
                        // Backup also failed
                    }
                }
                
                if (attempt === retries) {
                    return ''; // Return empty string on final failure
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
        return '';
    }

    /**
     * Load custom filters from file
     */
    private loadCustomFilters(): string {
        try {
            if (fs.existsSync(this.options.customFiltersPath)) {
                const content = fs.readFileSync(this.options.customFiltersPath, 'utf-8');
                console.log(`[FilterUpdater] Loaded custom filters: ${content.length} bytes`);
                return content;
            }
        } catch (e) {
            console.warn('[FilterUpdater] Failed to load custom filters:', e);
        }
        return '';
    }

    /**
     * Fetch all enabled filter lists and combine them
     */
    async updateFilters(): Promise<string> {
        console.log('[FilterUpdater] Starting filter update...');
        
        // Check cache first
        if (this.isCacheValid() && this.cache) {
            console.log('[FilterUpdater] Using cached filters (valid until:', new Date(this.cache.expiresAt).toISOString(), ')');
            return this.cache.combinedFilters;
        }

        const filters: { [key: string]: string } = {};
        const fetchPromises: Promise<void>[] = [];

        // Fetch all enabled lists in parallel
        for (const listName of this.options.enabledLists) {
            const url = UBLOCK_FILTER_LISTS[listName];
            if (url) {
                fetchPromises.push(
                    this.fetchFilterList(listName, url).then(content => {
                        filters[listName] = content;
                    })
                );
            }
        }

        await Promise.all(fetchPromises);

        // Load custom filters
        const customFilters = this.loadCustomFilters();
        if (customFilters) {
            filters['custom'] = customFilters;
        }

        // Combine all filters
        const combinedFilters = this.combineFilters(filters);

        // Create cache
        const now = Date.now();
        const cache: FilterCache = {
            version: new Date().toISOString().split('T')[0],
            lastUpdated: now,
            expiresAt: now + this.options.cacheExpiry,
            filters,
            combinedFilters
        };

        this.cache = cache;
        this.saveCache(cache);

        console.log(`[FilterUpdater] Updated filters: ${combinedFilters.length} bytes total`);
        return combinedFilters;
    }

    /**
     * Combine multiple filter lists into one
     */
    private combineFilters(filters: { [key: string]: string }): string {
        const header = `! ==========================================
! Brave Real Browser - Combined Filter List
! Auto-generated by FilterUpdater
! Last updated: ${new Date().toISOString()}
! ==========================================

`;

        const sections: string[] = [header];

        for (const [name, content] of Object.entries(filters)) {
            if (content && content.trim()) {
                sections.push(`
! ------------------------------------------
! Source: ${name}
! ------------------------------------------
${content}
`);
            }
        }

        return sections.join('\n');
    }

    /**
     * Get combined filters (from cache or fetch new)
     */
    async getFilters(): Promise<string> {
        return this.updateFilters();
    }

    /**
     * Force refresh filters (ignore cache)
     */
    async forceRefresh(): Promise<string> {
        this.options.forceUpdate = true;
        const result = await this.updateFilters();
        this.options.forceUpdate = false;
        return result;
    }

    /**
     * Get cache info
     */
    getCacheInfo(): { valid: boolean; expiresAt: Date | null; lastUpdated: Date | null } {
        const cache = this.loadCache();
        if (!cache) {
            return { valid: false, expiresAt: null, lastUpdated: null };
        }
        
        return {
            valid: Date.now() < cache.expiresAt,
            expiresAt: new Date(cache.expiresAt),
            lastUpdated: new Date(cache.lastUpdated)
        };
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        try {
            if (fs.existsSync(this.cacheFilePath)) {
                fs.unlinkSync(this.cacheFilePath);
                console.log('[FilterUpdater] Cache cleared');
            }
        } catch (e) {
            console.error('[FilterUpdater] Failed to clear cache:', e);
        }
        this.cache = null;
    }
}

// Singleton instance for convenience
let defaultUpdater: FilterUpdater | null = null;

export function getFilterUpdater(options?: FilterUpdaterOptions): FilterUpdater {
    if (!defaultUpdater || options) {
        defaultUpdater = new FilterUpdater(options);
    }
    return defaultUpdater;
}

export async function fetchLatestFilters(options?: FilterUpdaterOptions): Promise<string> {
    const updater = getFilterUpdater(options);
    return updater.getFilters();
}
