/**
 * Blocker Integration for brave-real-launcher
 * 
 * Ecosystem Chain:
 *   brave-real-browser-mcp-server (top level)
 *       └── brave-real-puppeteer-core
 *           └── brave-real-launcher
 *               └── brave-real-blocker (singleton, shared across ecosystem)
 * 
 * Auto-enabled on all pages via ecosystem chain
 * Uses singleton pattern to ensure one blocker instance across entire workspace
 */

import { 
    BraveBlocker, 
    BraveBlockerOptions,
    getBraveBlockerSingleton,
    initBraveBlockerSingleton,
    isBraveBlockerInitialized,
    getBraveBlockerInfo
} from 'brave-real-blocker';
import log from './logger.js';

export interface BlockerInstance {
    blocker: BraveBlocker;
    initialized: boolean;
    enableOnPage: (page: any) => Promise<void>;
}

// Global blocker instance wrapper for ecosystem chain
// Uses singleton from brave-real-blocker internally
let globalBlockerInstance: BlockerInstance | null = null;

/**
 * Initialize blocker at launcher level using singleton pattern
 * Called when browser is launched - blocker is ready for all pages
 * The singleton ensures only one blocker exists across entire workspace
 */
export async function initBlocker(options: BraveBlockerOptions = {}): Promise<BlockerInstance> {
    // Check if already initialized
    if (globalBlockerInstance && isBraveBlockerInitialized()) {
        log.verbose('BlockerIntegration', 'Returning existing blocker singleton');
        return globalBlockerInstance;
    }

    // Default options for ecosystem chain
    const defaultOptions: BraveBlockerOptions = {
        enableAdBlocking: true,
        enableStealth: true,
        enableCosmeticFiltering: true,
        enableRedirectBlocking: true,
        enableScriptlets: true,
        enableFilterAutoUpdate: true,
        ...options
    };

    try {
        // Use singleton initialization from brave-real-blocker
        const blocker = await initBraveBlockerSingleton(defaultOptions);
        log.verbose('BlockerIntegration', 'Blocker singleton initialized successfully');
        
        globalBlockerInstance = {
            blocker,
            initialized: true,
            enableOnPage: async (page: any) => {
                try {
                    await blocker.enable(page);
                    log.verbose('BlockerIntegration', 'Blocker enabled on page');
                } catch (err: any) {
                    log.warn('BlockerIntegration', `Failed to enable blocker on page: ${err.message}`);
                }
            }
        };
        
        return globalBlockerInstance;
    } catch (err: any) {
        log.error('BlockerIntegration', `Failed to initialize blocker: ${err.message}`);
        throw err;
    }
}

/**
 * Get the global blocker instance (singleton)
 * Used by puppeteer-core to get blocker from launcher
 */
export function getBlocker(): BlockerInstance | null {
    // If we have a wrapper, return it
    if (globalBlockerInstance) {
        return globalBlockerInstance;
    }
    
    // Check if singleton exists but wrapper wasn't created yet
    if (isBraveBlockerInitialized()) {
        const blocker = getBraveBlockerSingleton();
        globalBlockerInstance = {
            blocker,
            initialized: true,
            enableOnPage: async (page: any) => {
                try {
                    await blocker.enable(page);
                    log.verbose('BlockerIntegration', 'Blocker enabled on page');
                } catch (err: any) {
                    log.warn('BlockerIntegration', `Failed to enable blocker on page: ${err.message}`);
                }
            }
        };
        return globalBlockerInstance;
    }
    
    return null;
}

/**
 * Get blocker singleton status info
 */
export function getBlockerInfo(): {
    isCreated: boolean;
    isInitialized: boolean;
    options: BraveBlockerOptions | null;
} {
    return getBraveBlockerInfo();
}

/**
 * Create blocker factory for ecosystem chain
 * Returns a function that puppeteer-core can use to auto-enable on pages
 */
export function createBlockerFactory(options: BraveBlockerOptions = {}): () => Promise<BlockerInstance> {
    let blockerPromise: Promise<BlockerInstance> | null = null;
    
    return async () => {
        if (!blockerPromise) {
            blockerPromise = initBlocker(options);
        }
        return blockerPromise;
    };
}

/**
 * Auto-enable blocker on all pages
 * Designed to be called by puppeteer-core when new page is created
 */
export async function autoEnableOnPage(page: any, blockerInstance?: BlockerInstance): Promise<void> {
    const instance = blockerInstance || globalBlockerInstance;
    
    if (!instance) {
        log.warn('BlockerIntegration', 'No blocker instance available, initializing new one');
        const newInstance = await initBlocker();
        await newInstance.enableOnPage(page);
        return;
    }
    
    await instance.enableOnPage(page);
}

/**
 * Ecosystem chain helper
 * Creates a wrapper that auto-enables blocker on all new pages
 */
export function createEcosystemChain(browser: any, blockerInstance?: BlockerInstance): void {
    const instance = blockerInstance || globalBlockerInstance;
    
    if (!instance) {
        log.warn('BlockerIntegration', 'No blocker instance for ecosystem chain');
        return;
    }
    
    // Auto-enable on all new pages (targetcreated event)
    browser.on('targetcreated', async (target: any) => {
        if (target.type() === 'page') {
            try {
                const page = await target.page();
                if (page) {
                    await instance.enableOnPage(page);
                    log.verbose('BlockerIntegration', 'Auto-enabled blocker on new page');
                }
            } catch (err: any) {
                log.warn('BlockerIntegration', `Failed to auto-enable on new page: ${err.message}`);
            }
        }
    });
    
    log.verbose('BlockerIntegration', 'Ecosystem chain established - auto-enable on all pages');
}

export { BraveBlocker, BraveBlockerOptions };
