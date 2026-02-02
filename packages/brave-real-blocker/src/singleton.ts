/**
 * Singleton Manager for BraveBlocker
 * 
 * Ensures only one instance of BraveBlocker is created across the entire
 * workspace ecosystem. This prevents duplicate initialization, reduces
 * memory usage, and maintains consistent blocking rules.
 */

import { BraveBlocker, BraveBlockerOptions } from './brave-blocker';

// Global singleton storage using Symbol for unique key
const SINGLETON_KEY = Symbol.for('brave-real-blocker.singleton');

interface GlobalWithSingleton {
    [key: symbol]: {
        instance: BraveBlocker | null;
        initialized: boolean;
        options: BraveBlockerOptions | null;
    };
}

// Get global object (works in Node.js, browser, and workers)
const globalObj = (typeof globalThis !== 'undefined' ? globalThis : global) as unknown as GlobalWithSingleton;

// Initialize singleton storage if not exists
if (!globalObj[SINGLETON_KEY]) {
    globalObj[SINGLETON_KEY] = {
        instance: null,
        initialized: false,
        options: null
    };
}

/**
 * Get or create the singleton BraveBlocker instance
 * @param options - Configuration options (only used on first call)
 * @returns The singleton BraveBlocker instance
 */
export function getBraveBlockerSingleton(options: BraveBlockerOptions = {}): BraveBlocker {
    const storage = globalObj[SINGLETON_KEY];
    
    if (!storage.instance) {
        storage.instance = new BraveBlocker(options);
        storage.options = options;
        console.log('[BraveBlocker] Created singleton instance');
    } else if (Object.keys(options).length > 0 && !storage.initialized) {
        // Allow updating options before initialization
        console.log('[BraveBlocker] Using existing singleton (options ignored after first creation)');
    }
    
    return storage.instance;
}

/**
 * Initialize the singleton BraveBlocker instance
 * This should be called once during application startup
 * @param options - Configuration options
 * @returns Promise<BraveBlocker> - The initialized singleton instance
 */
export async function initBraveBlockerSingleton(options: BraveBlockerOptions = {}): Promise<BraveBlocker> {
    const storage = globalObj[SINGLETON_KEY];
    const blocker = getBraveBlockerSingleton(options);
    
    if (!storage.initialized) {
        await blocker.init();
        storage.initialized = true;
        console.log('[BraveBlocker] Singleton initialized successfully');
    }
    
    return blocker;
}

/**
 * Check if singleton is already initialized
 * @returns boolean - True if singleton is initialized
 */
export function isBraveBlockerInitialized(): boolean {
    return globalObj[SINGLETON_KEY]?.initialized ?? false;
}

/**
 * Reset the singleton instance (mainly for testing)
 * WARNING: Use with caution in production!
 */
export function resetBraveBlockerSingleton(): void {
    const storage = globalObj[SINGLETON_KEY];
    storage.instance = null;
    storage.initialized = false;
    storage.options = null;
    console.log('[BraveBlocker] Singleton reset');
}

/**
 * Get singleton configuration info
 * @returns Object with singleton status and options
 */
export function getBraveBlockerInfo(): {
    isCreated: boolean;
    isInitialized: boolean;
    options: BraveBlockerOptions | null;
} {
    const storage = globalObj[SINGLETON_KEY];
    return {
        isCreated: storage.instance !== null,
        isInitialized: storage.initialized,
        options: storage.options
    };
}
