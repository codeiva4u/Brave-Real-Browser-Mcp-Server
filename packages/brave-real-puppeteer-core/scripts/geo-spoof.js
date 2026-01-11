/**
 * 🌍 Geo-Spoofing Module
 * Features: Timezone, geolocation, locale/language spoofing
 */

// Preset locations with all details
const LOCATION_PRESETS = {
    'us-ny': {
        name: 'New York, USA',
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 20,
        timezone: 'America/New_York',
        locale: 'en-US',
        language: 'en-US,en',
        currency: 'USD'
    },
    'us-la': {
        name: 'Los Angeles, USA',
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 20,
        timezone: 'America/Los_Angeles',
        locale: 'en-US',
        language: 'en-US,en',
        currency: 'USD'
    },
    'uk-london': {
        name: 'London, UK',
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 20,
        timezone: 'Europe/London',
        locale: 'en-GB',
        language: 'en-GB,en',
        currency: 'GBP'
    },
    'de-berlin': {
        name: 'Berlin, Germany',
        latitude: 52.5200,
        longitude: 13.4050,
        accuracy: 20,
        timezone: 'Europe/Berlin',
        locale: 'de-DE',
        language: 'de-DE,de,en',
        currency: 'EUR'
    },
    'fr-paris': {
        name: 'Paris, France',
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 20,
        timezone: 'Europe/Paris',
        locale: 'fr-FR',
        language: 'fr-FR,fr,en',
        currency: 'EUR'
    },
    'jp-tokyo': {
        name: 'Tokyo, Japan',
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 20,
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
        language: 'ja-JP,ja,en',
        currency: 'JPY'
    },
    'in-mumbai': {
        name: 'Mumbai, India',
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 20,
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        language: 'en-IN,hi-IN,en',
        currency: 'INR'
    },
    'au-sydney': {
        name: 'Sydney, Australia',
        latitude: -33.8688,
        longitude: 151.2093,
        accuracy: 20,
        timezone: 'Australia/Sydney',
        locale: 'en-AU',
        language: 'en-AU,en',
        currency: 'AUD'
    },
    'br-saopaulo': {
        name: 'São Paulo, Brazil',
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 20,
        timezone: 'America/Sao_Paulo',
        locale: 'pt-BR',
        language: 'pt-BR,pt,en',
        currency: 'BRL'
    },
    'sg-singapore': {
        name: 'Singapore',
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 20,
        timezone: 'Asia/Singapore',
        locale: 'en-SG',
        language: 'en-SG,zh-SG,en',
        currency: 'SGD'
    }
};

let currentLocation = null;

/**
 * Get available location presets
 * @returns {Object}
 */
export function getLocationPresets() {
    return LOCATION_PRESETS;
}

/**
 * Set current location by preset
 * @param {string} presetId
 * @returns {Object}
 */
export function setLocationPreset(presetId) {
    if (!LOCATION_PRESETS[presetId]) {
        throw new Error(`Unknown location preset: ${presetId}`);
    }
    currentLocation = { ...LOCATION_PRESETS[presetId], id: presetId };
    console.log(`[geo-spoof] Location set to: ${currentLocation.name}`);
    return currentLocation;
}

/**
 * Set custom location
 * @param {Object} location
 * @returns {Object}
 */
export function setCustomLocation(location) {
    currentLocation = {
        name: location.name || 'Custom Location',
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 20,
        timezone: location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: location.locale || 'en-US',
        language: location.language || 'en-US,en',
        currency: location.currency || 'USD',
        id: 'custom'
    };
    console.log(`[geo-spoof] Custom location set: ${currentLocation.name}`);
    return currentLocation;
}

/**
 * Get current location
 * @returns {Object|null}
 */
export function getCurrentLocation() {
    return currentLocation;
}

/**
 * Generate geo-spoofing script for injection
 * @param {Object} [location]
 * @returns {string}
 */
export function getGeoSpoofScript(location = null) {
    const loc = location || currentLocation;
    if (!loc) return '';

    return `
        (function() {
            'use strict';
            
            // 🌍 GEO-SPOOFING INJECTION
            const SPOOF_LOCATION = {
                latitude: ${loc.latitude},
                longitude: ${loc.longitude},
                accuracy: ${loc.accuracy},
                timezone: '${loc.timezone}',
                locale: '${loc.locale}',
                languages: '${loc.language}'.split(',')
            };
            
            // Override Geolocation API
            const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
            const originalWatchPosition = navigator.geolocation.watchPosition;
            
            navigator.geolocation.getCurrentPosition = function(success, error, options) {
                success({
                    coords: {
                        latitude: SPOOF_LOCATION.latitude,
                        longitude: SPOOF_LOCATION.longitude,
                        accuracy: SPOOF_LOCATION.accuracy,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null
                    },
                    timestamp: Date.now()
                });
            };
            
            navigator.geolocation.watchPosition = function(success, error, options) {
                const id = setInterval(() => {
                    success({
                        coords: {
                            latitude: SPOOF_LOCATION.latitude + (Math.random() - 0.5) * 0.0001,
                            longitude: SPOOF_LOCATION.longitude + (Math.random() - 0.5) * 0.0001,
                            accuracy: SPOOF_LOCATION.accuracy,
                            altitude: null,
                            altitudeAccuracy: null,
                            heading: null,
                            speed: null
                        },
                        timestamp: Date.now()
                    });
                }, 1000);
                return id;
            };
            
            // Override timezone via Intl.DateTimeFormat
            const originalDateTimeFormat = Intl.DateTimeFormat;
            Intl.DateTimeFormat = function(locales, options) {
                options = options || {};
                options.timeZone = options.timeZone || SPOOF_LOCATION.timezone;
                return new originalDateTimeFormat(locales || SPOOF_LOCATION.locale, options);
            };
            Intl.DateTimeFormat.prototype = originalDateTimeFormat.prototype;
            Object.assign(Intl.DateTimeFormat, originalDateTimeFormat);
            
            // Override navigator.language and languages
            Object.defineProperty(navigator, 'language', {
                get: () => SPOOF_LOCATION.languages[0],
                configurable: true
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => SPOOF_LOCATION.languages,
                configurable: true
            });
            
            // Override Date.prototype.getTimezoneOffset
            const tzOffset = {
                'America/New_York': 300,
                'America/Los_Angeles': 480,
                'Europe/London': 0,
                'Europe/Berlin': -60,
                'Europe/Paris': -60,
                'Asia/Tokyo': -540,
                'Asia/Kolkata': -330,
                'Australia/Sydney': -660,
                'America/Sao_Paulo': 180,
                'Asia/Singapore': -480
            };
            
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            Date.prototype.getTimezoneOffset = function() {
                return tzOffset[SPOOF_LOCATION.timezone] ?? originalGetTimezoneOffset.call(this);
            };
            
            console.log('[geo-spoof] 🌍 Location spoofed to: lat=${loc.latitude}, lng=${loc.longitude}, tz=${loc.timezone}');
        })();
    `;
}

/**
 * Apply geo-spoofing to page
 * @param {Page} page - Puppeteer/Playwright page
 * @param {Object|string} [location] - Location object or preset ID
 */
export async function applyGeoSpoof(page, location = null) {
    if (typeof location === 'string') {
        setLocationPreset(location);
    } else if (location) {
        setCustomLocation(location);
    }

    if (!currentLocation) {
        console.log('[geo-spoof] No location set, using default (New York)');
        setLocationPreset('us-ny');
    }

    // Set geolocation in browser context
    try {
        await page.context().setGeolocation({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy
        });
    } catch (e) {
        // Puppeteer doesn't have context().setGeolocation
        // Use CDP instead
        const client = await page.target?.().createCDPSession?.();
        if (client) {
            await client.send('Emulation.setGeolocationOverride', {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                accuracy: currentLocation.accuracy
            });
        }
    }

    // Set timezone
    try {
        await page.context().setTimezone(currentLocation.timezone);
    } catch (e) {
        const client = await page.target?.().createCDPSession?.();
        if (client) {
            await client.send('Emulation.setTimezoneOverride', {
                timezoneId: currentLocation.timezone
            });
        }
    }

    // Set locale
    try {
        await page.context().setLocale(currentLocation.locale);
    } catch (e) {
        // Handled by injection script
    }

    // Inject comprehensive spoofing script
    await page.evaluateOnNewDocument(getGeoSpoofScript());

    console.log(`[geo-spoof] Applied: ${currentLocation.name} (${currentLocation.timezone})`);
}

/**
 * Get random location from presets
 * @returns {Object}
 */
export function getRandomLocation() {
    const keys = Object.keys(LOCATION_PRESETS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return setLocationPreset(randomKey);
}

// Default export
export default {
    getLocationPresets,
    setLocationPreset,
    setCustomLocation,
    getCurrentLocation,
    getGeoSpoofScript,
    applyGeoSpoof,
    getRandomLocation,
    LOCATION_PRESETS
};
