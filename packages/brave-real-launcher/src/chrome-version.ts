/**
 * @license Copyright 2024 Brave Real Launcher Contributors.
 * Licensed under the Apache License, Version 2.0
 * 
 * Chrome Version Utility
 * Dynamically fetches the latest stable Chrome version from Google's API
 */
'use strict';

// Cache the version for 1 hour to avoid excessive API calls
let cachedVersion: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Fallback version if all APIs fail (updated to latest known stable)
export const FALLBACK_VERSION = '144.0.7559.59';

/**
 * Fetches the latest stable Chrome version from Chromium Dashboard API
 * @returns The latest stable Chrome version
 */
export async function getLatestChromeVersion(): Promise<string> {
    // Return cached version if still valid
    if (cachedVersion && (Date.now() - cacheTimestamp) < CACHE_DURATION_MS) {
        return cachedVersion;
    }

    // Primary API - Chromium Dashboard
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
            'https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=1',
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json() as Array<{ version?: string }>;
            if (data?.[0]?.version) {
                cachedVersion = data[0].version;
                cacheTimestamp = Date.now();
                console.error(`[chrome-version] Fetched latest stable version: ${cachedVersion}`);
                return cachedVersion;
            }
        }
    } catch (err) {
        console.error(`[chrome-version] Primary API failed: ${(err as Error).message}`);
    }

    // Fallback API - Chrome for Testing
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const fallbackResponse = await fetch(
            'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (fallbackResponse.ok) {
            const data = await fallbackResponse.json() as { channels?: { Stable?: { version?: string } } };
            if (data?.channels?.Stable?.version) {
                cachedVersion = data.channels.Stable.version;
                cacheTimestamp = Date.now();
                console.error(`[chrome-version] Fetched from fallback API: ${cachedVersion}`);
                return cachedVersion;
            }
        }
    } catch (err) {
        console.error(`[chrome-version] Fallback API failed: ${(err as Error).message}`);
    }

    // Use cached version if available, else fallback
    console.error(`[chrome-version] Using fallback version: ${cachedVersion || FALLBACK_VERSION}`);
    return cachedVersion || FALLBACK_VERSION;
}

/**
 * Gets the major version number from a full version string
 * @param fullVersion - Full Chrome version string
 * @returns Major version number
 */
export function getMajorVersion(fullVersion: string): string {
    return fullVersion.split('.')[0];
}

/**
 * Generates a User-Agent string for Windows with dynamic Chrome version
 * @param chromeVersion - Chrome version to use
 * @param mobile - Whether this is a mobile browser
 * @returns User-Agent string
 */
export function generateUserAgent(chromeVersion: string, mobile: boolean = false): string {
    if (mobile) {
        return `Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`;
    }
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/**
 * Generates a User-Agent string for macOS with dynamic Chrome version
 * @param chromeVersion - Chrome version to use
 * @returns User-Agent string for macOS
 */
export function generateUserAgentMac(chromeVersion: string): string {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/**
 * Generates a User-Agent string for Linux with dynamic Chrome version
 * @param chromeVersion - Chrome version to use
 * @returns User-Agent string for Linux
 */
export function generateUserAgentLinux(chromeVersion: string): string {
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/**
 * UserAgentMetadata interface for Client Hints API
 */
export interface UserAgentMetadata {
    brands: Array<{ brand: string; version: string }>;
    fullVersionList: Array<{ brand: string; version: string }>;
    platform: string;
    platformVersion: string;
    architecture: string;
    model: string;
    mobile: boolean;
    bitness: string;
    wow64: boolean;
}

/**
 * Generates userAgentMetadata object with dynamic Chrome version
 * @param chromeVersion - Chrome version to use
 * @param mobile - Whether this is a mobile browser
 * @returns UserAgentMetadata object
 */
export function generateUserAgentMetadata(chromeVersion: string, mobile: boolean = false): UserAgentMetadata {
    const majorVersion = getMajorVersion(chromeVersion);

    return {
        brands: [
            { brand: 'Not_A Brand', version: '24' },
            { brand: 'Chromium', version: majorVersion },
            { brand: 'Google Chrome', version: majorVersion }
        ],
        fullVersionList: [
            { brand: 'Not_A Brand', version: '24.0.0.0' },
            { brand: 'Chromium', version: chromeVersion },
            { brand: 'Google Chrome', version: chromeVersion }
        ],
        platform: mobile ? 'Android' : 'Windows',
        platformVersion: mobile ? '13.0.0' : '10.0.0',
        architecture: mobile ? '' : 'x86',
        model: mobile ? 'Pixel 7' : '',
        mobile: mobile,
        bitness: mobile ? '' : '64',
        wow64: false
    };
}

/**
 * Gets user agent for current platform with dynamic Chrome version
 * @param chromeVersion - Chrome version to use
 * @returns User-Agent string for current platform
 */
export function getUserAgentForPlatform(chromeVersion: string): string {
    const platform = process.platform;
    switch (platform) {
        case 'win32': return generateUserAgent(chromeVersion, false);
        case 'darwin': return generateUserAgentMac(chromeVersion);
        default: return generateUserAgentLinux(chromeVersion);
    }
}

export default {
    getLatestChromeVersion,
    getMajorVersion,
    generateUserAgent,
    generateUserAgentMac,
    generateUserAgentLinux,
    generateUserAgentMetadata,
    getUserAgentForPlatform,
    FALLBACK_VERSION
};
