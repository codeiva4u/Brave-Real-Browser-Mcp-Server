/**
 * Chrome Version Utility
 * Dynamically fetches the latest stable Chrome version from Google's API
 */

// Cache the version for 1 hour to avoid excessive API calls
let cachedVersion = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches the latest stable Chrome version from Chromium Dashboard API
 * @returns {Promise<string>} The latest stable Chrome version
 */
export async function getLatestChromeVersion() {
    // Return cached version if still valid
    if (cachedVersion && (Date.now() - cacheTimestamp) < CACHE_DURATION_MS) {
        return cachedVersion;
    }

    // Primary API
    try {
        const response = await fetch(
            'https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=1',
            { timeout: 10000 }
        );

        if (response.ok) {
            const data = await response.json();
            if (data && data[0] && data[0].version) {
                cachedVersion = data[0].version;
                cacheTimestamp = Date.now();
                console.log(`[chrome-version] Fetched latest stable version: ${cachedVersion}`);
                return cachedVersion;
            }
        }
    } catch (err) {
        console.log(`[chrome-version] Primary API failed: ${err.message}`);
    }

    // Fallback API - Chrome for Testing
    try {
        const fallbackResponse = await fetch(
            'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
            { timeout: 10000 }
        );

        if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            if (data && data.channels && data.channels.Stable && data.channels.Stable.version) {
                cachedVersion = data.channels.Stable.version;
                cacheTimestamp = Date.now();
                console.log(`[chrome-version] Fetched from fallback API: ${cachedVersion}`);
                return cachedVersion;
            }
        }
    } catch (err) {
        console.log(`[chrome-version] Fallback API failed: ${err.message}`);
    }

    throw new Error('[chrome-version] Failed to fetch Chrome version from all APIs');
}

/**
 * Gets the major version number from a full version string
 * @param {string} fullVersion - Full Chrome version string
 * @returns {string} Major version number
 */
export function getMajorVersion(fullVersion) {
    return fullVersion.split('.')[0];
}

/**
 * Generates userAgentMetadata object with dynamic Chrome version
 * @param {string} chromeVersion - Chrome version to use
 * @param {boolean} mobile - Whether this is a mobile browser
 * @returns {Object} UserAgentMetadata object
 */
export function generateUserAgentMetadata(chromeVersion, mobile = false) {
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
 * Generates a User-Agent string with dynamic Chrome version
 * @param {string} chromeVersion - Chrome version to use
 * @param {boolean} mobile - Whether this is a mobile browser
 * @returns {string} User-Agent string
 */
export function generateUserAgent(chromeVersion, mobile = false) {
    if (mobile) {
        return `Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`;
    }
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

// CJS compatibility
export default {
    getLatestChromeVersion,
    getMajorVersion,
    generateUserAgentMetadata,
    generateUserAgent
};
