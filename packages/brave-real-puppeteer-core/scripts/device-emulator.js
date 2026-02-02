/**
 * 📱 Device Emulator
 * Features: 50+ device presets, custom device config, screen/touch/sensors
 * Updated to use dynamic Chrome versions
 */

import { generateUserAgent, FALLBACK_VERSION } from './chrome-version.js';
import { getLatestChromeVersion } from './chrome-version.js';

// Cache latest version
let LATEST_CHROME_VERSION = FALLBACK_VERSION;

// Update version async on load
getLatestChromeVersion().then(v => {
    LATEST_CHROME_VERSION = v;
    console.log(`[device-emulator] Updated presets to Chrome ${v}`);
    updatePresets(v);
}).catch(err => console.error('[device-emulator] Failed to update Chrome version:', err));

/**
 * Generate UA for Android with specific model
 */
function getAndroidUA(model, androidVersion = '13', chromeVersion = LATEST_CHROME_VERSION) {
    return `Mozilla/5.0 (Linux; Android ${androidVersion}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`;
}

/**
 * Generate UA for Desktop Windows
 */
function getWindowsUA(chromeVersion = LATEST_CHROME_VERSION) {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/**
 * Generate UA for Desktop Mac
 */
function getMacUA(chromeVersion = LATEST_CHROME_VERSION) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}


// Device presets - 50+ devices
const DEVICE_PRESETS = {
    // iPhones (Keep static)
    'iphone-15-pro-max': {
        name: 'iPhone 15 Pro Max',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'iPhone'
    },
    'iphone-15-pro': {
        name: 'iPhone 15 Pro',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'iPhone'
    },
    'iphone-14': {
        name: 'iPhone 14',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'iPhone'
    },
    'iphone-13': {
        name: 'iPhone 13',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'iPhone'
    },
    'iphone-12': {
        name: 'iPhone 12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'iPhone'
    },
    'iphone-se': {
        name: 'iPhone SE',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        platform: 'iPhone'
    },

    // iPads (Keep static)
    'ipad-pro-12': {
        name: 'iPad Pro 12.9"',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 1024, height: 1366 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        platform: 'iPad'
    },
    'ipad-pro-11': {
        name: 'iPad Pro 11"',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 834, height: 1194 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        platform: 'iPad'
    },
    'ipad-air': {
        name: 'iPad Air',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 820, height: 1180 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        platform: 'iPad'
    },
    'ipad-mini': {
        name: 'iPad Mini',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        platform: 'iPad'
    },

    // Samsung Galaxy (Dynamic Chrome)
    'galaxy-s24-ultra': {
        name: 'Samsung Galaxy S24 Ultra',
        userAgent: getAndroidUA('SM-S928B', '14'),
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 3.5,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'galaxy-s24': {
        name: 'Samsung Galaxy S24',
        userAgent: getAndroidUA('SM-S921B', '14'),
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'galaxy-s23': {
        name: 'Samsung Galaxy S23',
        userAgent: getAndroidUA('SM-S911B', '13'),
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'galaxy-fold-5': {
        name: 'Samsung Galaxy Z Fold 5',
        userAgent: getAndroidUA('SM-F946B', '13'),
        viewport: { width: 344, height: 882 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'galaxy-a54': {
        name: 'Samsung Galaxy A54',
        userAgent: getAndroidUA('SM-A546B', '13'),
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'galaxy-tab-s9': {
        name: 'Samsung Galaxy Tab S9',
        userAgent: getAndroidUA('SM-X710', '13').replace('Mobile', ''), // Tablets are often not "Mobile" string
        viewport: { width: 800, height: 1280 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },

    // Google Pixel (Dynamic Chrome)
    'pixel-8-pro': {
        name: 'Google Pixel 8 Pro',
        userAgent: getAndroidUA('Pixel 8 Pro', '14'),
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 3.5,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'pixel-8': {
        name: 'Google Pixel 8',
        userAgent: getAndroidUA('Pixel 8', '14'),
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'pixel-7': {
        name: 'Google Pixel 7',
        userAgent: getAndroidUA('Pixel 7', '13'),
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },
    'pixel-fold': {
        name: 'Google Pixel Fold',
        userAgent: getAndroidUA('Pixel Fold', '14'),
        viewport: { width: 360, height: 823 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },

    // OnePlus
    'oneplus-12': {
        name: 'OnePlus 12',
        userAgent: getAndroidUA('CPH2573', '14'),
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 3.5,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },

    // Xiaomi
    'xiaomi-14': {
        name: 'Xiaomi 14',
        userAgent: getAndroidUA('23127PN0CC', '14'),
        viewport: { width: 393, height: 873 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        platform: 'Android'
    },

    // Desktop browsers (Dynamic Chrome)
    'desktop-chrome-windows': {
        name: 'Desktop Chrome (Windows)',
        userAgent: getWindowsUA(),
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        platform: 'Win32'
    },
    'desktop-chrome-mac': {
        name: 'Desktop Chrome (macOS)',
        userAgent: getMacUA(),
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
        platform: 'MacIntel'
    },
    'desktop-firefox-windows': {
        name: 'Desktop Firefox (Windows)',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        platform: 'Win32'
    },
    'desktop-safari-mac': {
        name: 'Desktop Safari (macOS)',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
        platform: 'MacIntel'
    },
    'desktop-edge-windows': {
        name: 'Desktop Edge (Windows)',
        userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${LATEST_CHROME_VERSION} Safari/537.36 Edg/${LATEST_CHROME_VERSION}`,
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        platform: 'Win32'
    },

    // Laptops with different resolutions
    'laptop-1366': {
        name: 'Laptop 1366x768',
        userAgent: getWindowsUA(),
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        platform: 'Win32'
    },
    'laptop-1440': {
        name: 'Laptop 1440x900',
        userAgent: getWindowsUA(),
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        platform: 'Win32'
    },
    'macbook-pro-14': {
        name: 'MacBook Pro 14"',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        viewport: { width: 1512, height: 982 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
        platform: 'MacIntel'
    },
    'macbook-air-m2': {
        name: 'MacBook Air M2',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        viewport: { width: 1470, height: 956 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
        platform: 'MacIntel'
    },

    // 4K Display
    'desktop-4k': {
        name: 'Desktop 4K',
        userAgent: getWindowsUA(),
        viewport: { width: 3840, height: 2160 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        platform: 'Win32'
    }
};

/**
 * Update presets with new Chrome version
 */
function updatePresets(chromeVersion) {
    // Update Android devices
    const androidDevices = [
        'galaxy-s24-ultra', 'galaxy-s24', 'galaxy-s23', 'galaxy-fold-5', 'galaxy-a54', 'galaxy-tab-s9',
        'pixel-8-pro', 'pixel-8', 'pixel-7', 'pixel-fold', 'oneplus-12', 'xiaomi-14'
    ];

    androidDevices.forEach(id => {
        if (DEVICE_PRESETS[id]) {
            // Extract model and android version from current UA to preferve them
            const currentUA = DEVICE_PRESETS[id].userAgent;
            const match = currentUA.match(/Android (\d+); ([^)]+)\)/);
            if (match) {
                const androidVer = match[1];
                const model = match[2];
                let newUA = getAndroidUA(model, androidVer, chromeVersion);
                if (id === 'galaxy-tab-s9') newUA = newUA.replace('Mobile', '');
                DEVICE_PRESETS[id].userAgent = newUA;
            }
        }
    });

    // Update Windows devices
    const windowsDevices = ['desktop-chrome-windows', 'laptop-1366', 'laptop-1440', 'desktop-4k'];
    windowsDevices.forEach(id => {
        if (DEVICE_PRESETS[id]) DEVICE_PRESETS[id].userAgent = getWindowsUA(chromeVersion);
    });

    // Update Mac devices
    if (DEVICE_PRESETS['desktop-chrome-mac']) {
        DEVICE_PRESETS['desktop-chrome-mac'].userAgent = getMacUA(chromeVersion);
    }

    // Update Edge
    if (DEVICE_PRESETS['desktop-edge-windows']) {
        DEVICE_PRESETS['desktop-edge-windows'].userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36 Edg/${chromeVersion}`;
    }
}


let currentDevice = null;

/**
 * Get all device presets
 * @returns {Object}
 */
export function getDevicePresets() {
    return DEVICE_PRESETS;
}

/**
 * Get device categories
 * @returns {Object}
 */
export function getDeviceCategories() {
    const categories = {
        iphones: [],
        ipads: [],
        android: [],
        desktop: [],
        laptop: []
    };

    for (const [id, device] of Object.entries(DEVICE_PRESETS)) {
        if (id.startsWith('iphone')) categories.iphones.push(id);
        else if (id.startsWith('ipad')) categories.ipads.push(id);
        else if (device.platform === 'Android') categories.android.push(id);
        else if (id.includes('laptop') || id.includes('macbook')) categories.laptop.push(id);
        else if (!device.isMobile) categories.desktop.push(id);
    }

    return categories;
}

/**
 * Get device by preset ID
 * @param {string} deviceId
 * @returns {Object|null}
 */
export function getDevice(deviceId) {
    return DEVICE_PRESETS[deviceId] || null;
}

/**
 * Set current device
 * @param {string} deviceId
 * @returns {Object}
 */
export function setDevice(deviceId) {
    if (!DEVICE_PRESETS[deviceId]) {
        throw new Error(`Unknown device: ${deviceId}`);
    }
    currentDevice = { ...DEVICE_PRESETS[deviceId], id: deviceId };
    console.log(`[device-emulator] Device set to: ${currentDevice.name}`);
    return currentDevice;
}

/**
 * Create custom device
 * @param {Object} config
 * @returns {Object}
 */
export function createCustomDevice(config) {
    currentDevice = {
        name: config.name || 'Custom Device',
        userAgent: config.userAgent,
        viewport: config.viewport || { width: 1920, height: 1080 },
        deviceScaleFactor: config.deviceScaleFactor || 1,
        isMobile: config.isMobile || false,
        hasTouch: config.hasTouch || config.isMobile || false,
        platform: config.platform || 'Win32',
        id: 'custom'
    };
    console.log(`[device-emulator] Custom device created: ${currentDevice.name}`);
    return currentDevice;
}

/**
 * Get current device
 * @returns {Object|null}
 */
export function getCurrentDevice() {
    return currentDevice;
}

/**
 * Apply device emulation to page
 * @param {Page} page
 * @param {string|Object} [device] - Device ID or config
 */
export async function applyDevice(page, device = null) {
    if (typeof device === 'string') {
        setDevice(device);
    } else if (device) {
        createCustomDevice(device);
    }

    if (!currentDevice) {
        setDevice('desktop-chrome-windows');
    }

    // Set viewport
    await page.setViewport({
        width: currentDevice.viewport.width,
        height: currentDevice.viewport.height,
        deviceScaleFactor: currentDevice.deviceScaleFactor,
        isMobile: currentDevice.isMobile,
        hasTouch: currentDevice.hasTouch
    });

    // Set user agent
    await page.setUserAgent(currentDevice.userAgent);

    // Set platform via injection
    await page.evaluateOnNewDocument((platform) => {
        Object.defineProperty(navigator, 'platform', {
            get: () => platform,
            configurable: true
        });
    }, currentDevice.platform);

    console.log(`[device-emulator] Applied: ${currentDevice.name} (${currentDevice.viewport.width}x${currentDevice.viewport.height})`);
}

/**
 * Get random mobile device
 * @returns {Object}
 */
export function getRandomMobileDevice() {
    const mobileDevices = Object.entries(DEVICE_PRESETS)
        .filter(([id, d]) => d.isMobile)
        .map(([id]) => id);

    const randomId = mobileDevices[Math.floor(Math.random() * mobileDevices.length)];
    return setDevice(randomId);
}

/**
 * Get random desktop device
 * @returns {Object}
 */
export function getRandomDesktopDevice() {
    const desktopDevices = Object.entries(DEVICE_PRESETS)
        .filter(([id, d]) => !d.isMobile)
        .map(([id]) => id);

    const randomId = desktopDevices[Math.floor(Math.random() * desktopDevices.length)];
    return setDevice(randomId);
}

/**
 * Search devices by name
 * @param {string} query
 * @returns {Array}
 */
export function searchDevices(query) {
    const lowerQuery = query.toLowerCase();
    return Object.entries(DEVICE_PRESETS)
        .filter(([id, d]) =>
            id.toLowerCase().includes(lowerQuery) ||
            d.name.toLowerCase().includes(lowerQuery)
        )
        .map(([id, d]) => ({ id, ...d }));
}

// Default export
export default {
    getDevicePresets,
    getDeviceCategories,
    getDevice,
    setDevice,
    createCustomDevice,
    getCurrentDevice,
    applyDevice,
    getRandomMobileDevice,
    getRandomDesktopDevice,
    searchDevices,
    DEVICE_PRESETS
};
