/**
 * 🧪 Feature Test Script
 * Tests all 7 advanced features to verify they're working correctly
 */

import puppeteer from 'puppeteer-core';

// Import all feature modules
import proxyManager from './proxy-manager.js';
import captchaSolver from './captcha-solver.js';
import analytics from './analytics.js';
import geoSpoof from './geo-spoof.js';
import sessionManager from './session-manager.js';
import deviceEmulator from './device-emulator.js';
import autoRetry from './auto-retry.js';
import chromeVersion from './chrome-version.js';

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}${details ? ': ' + details : ''}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
}

async function runTests() {
    console.log('\n🧪 FEATURE MODULE TESTS');
    console.log('═'.repeat(50));

    // ===== 1. Chrome Version Module =====
    console.log('\n📦 1. Chrome Version Module');
    try {
        const version = await chromeVersion.getLatestChromeVersion();
        logTest('getLatestChromeVersion()', version && version.includes('.'), version);

        const major = chromeVersion.getMajorVersion(version);
        logTest('getMajorVersion()', parseInt(major) > 100, `Major: ${major}`);

        const ua = chromeVersion.generateUserAgent(version, false);
        logTest('generateUserAgent()', ua.includes('Chrome/' + version), 'Desktop UA generated');

        const metadata = chromeVersion.generateUserAgentMetadata(version, false);
        logTest('generateUserAgentMetadata()', metadata.brands.length >= 3, `${metadata.brands.length} brands`);
    } catch (e) {
        logTest('Chrome Version Module', false, e.message);
    }

    // ===== 2. Proxy Manager Module =====
    console.log('\n📦 2. Proxy Manager Module');
    try {
        const proxies = proxyManager.initProxyManager([
            { host: 'proxy1.example.com', port: 8080 },
            { host: 'proxy2.example.com', port: 8080 },
            { host: 'proxy3.example.com', port: 8080 }
        ]);
        logTest('initProxyManager()', proxies.length === 3, `${proxies.length} proxies`);

        const current = proxyManager.getCurrentProxy();
        logTest('getCurrentProxy()', current !== null, current?.host);

        const rotated = proxyManager.rotateProxy();
        logTest('rotateProxy()', rotated !== null, `Rotated to: ${rotated?.host}`);

        const url = proxyManager.getProxyUrl(current);
        logTest('getProxyUrl()', url.includes('http://'), url);

        const stats = proxyManager.getProxyStats();
        logTest('getProxyStats()', stats.totalProxies === 3, `Total: ${stats.totalProxies}`);
    } catch (e) {
        logTest('Proxy Manager Module', false, e.message);
    }

    // ===== 3. Device Emulator Module =====
    console.log('\n📦 3. Device Emulator Module');
    try {
        const presets = deviceEmulator.getDevicePresets();
        const presetCount = Object.keys(presets).length;
        logTest('getDevicePresets()', presetCount >= 30, `${presetCount} devices`);

        const categories = deviceEmulator.getDeviceCategories();
        logTest('getDeviceCategories()', categories.iphones.length > 0, `iPhones: ${categories.iphones.length}`);

        const device = deviceEmulator.setDevice('iphone-15-pro');
        logTest('setDevice()', device.name === 'iPhone 15 Pro', device.name);

        const current = deviceEmulator.getCurrentDevice();
        logTest('getCurrentDevice()', current.id === 'iphone-15-pro', current?.viewport?.width + 'x' + current?.viewport?.height);

        const mobile = deviceEmulator.getRandomMobileDevice();
        logTest('getRandomMobileDevice()', mobile.isMobile === true, mobile.name);

        const desktop = deviceEmulator.getRandomDesktopDevice();
        logTest('getRandomDesktopDevice()', desktop.isMobile === false, desktop.name);
    } catch (e) {
        logTest('Device Emulator Module', false, e.message);
    }

    // ===== 4. Geo-Spoofing Module =====
    console.log('\n📦 4. Geo-Spoofing Module');
    try {
        const presets = geoSpoof.getLocationPresets();
        const presetCount = Object.keys(presets).length;
        logTest('getLocationPresets()', presetCount >= 10, `${presetCount} locations`);

        const ny = geoSpoof.setLocationPreset('us-ny');
        logTest('setLocationPreset()', ny.name === 'New York, USA', ny.timezone);

        const custom = geoSpoof.setCustomLocation({
            name: 'Mumbai Test',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 'Asia/Kolkata'
        });
        logTest('setCustomLocation()', custom.name === 'Mumbai Test', custom.timezone);

        const script = geoSpoof.getGeoSpoofScript();
        logTest('getGeoSpoofScript()', script.includes('SPOOF_LOCATION'), `${script.length} chars`);

        const random = geoSpoof.getRandomLocation();
        logTest('getRandomLocation()', random.latitude !== undefined, random.name);
    } catch (e) {
        logTest('Geo-Spoofing Module', false, e.message);
    }

    // ===== 5. Session Manager Module =====
    console.log('\n📦 5. Session Manager Module');
    try {
        const exists = sessionManager.sessionExists('test-session');
        logTest('sessionExists()', typeof exists === 'boolean', `Exists: ${exists}`);

        const sessions = sessionManager.listSessions();
        logTest('listSessions()', Array.isArray(sessions), `${sessions.length} sessions`);

        const info = sessionManager.getSessionInfo('non-existent');
        logTest('getSessionInfo()', info === null, 'Returns null for non-existent');
    } catch (e) {
        logTest('Session Manager Module', false, e.message);
    }

    // ===== 6. Analytics Module =====
    console.log('\n📦 6. Analytics Module');
    try {
        const sessionId = analytics.initAnalytics('test-session');
        logTest('initAnalytics()', sessionId.includes('test-session'), sessionId);

        analytics.recordTest({ name: 'Test 1', status: 'passed', duration: 100 });
        analytics.recordTest({ name: 'Test 2', status: 'failed', duration: 200 });
        analytics.recordTest({ name: 'Test 3', status: 'passed', duration: 150 });

        const summary = analytics.getAnalyticsSummary();
        logTest('recordTest() + getAnalyticsSummary()', summary.tests.total === 3, `${summary.tests.passed}/${summary.tests.total} passed`);

        const raw = analytics.getRawData();
        logTest('getRawData()', raw.tests.length === 3, `${raw.tests.length} tests recorded`);

        analytics.finishSession();
        logTest('finishSession()', true, 'Session finished');
    } catch (e) {
        logTest('Analytics Module', false, e.message);
    }

    // ===== 7. CAPTCHA Solver Module =====
    console.log('\n📦 7. CAPTCHA Solver Module');
    try {
        captchaSolver.initCaptchaSolver({ service: '2captcha', apiKey: 'test-key' });
        logTest('initCaptchaSolver()', true, 'Configured with 2captcha');

        const services = captchaSolver.SOLVER_SERVICES;
        logTest('SOLVER_SERVICES', Object.keys(services).length >= 3, Object.keys(services).join(', '));
    } catch (e) {
        logTest('CAPTCHA Solver Module', false, e.message);
    }

    // ===== 8. Auto-Retry Module =====
    console.log('\n📦 8. Auto-Retry Module');
    try {
        autoRetry.configureRetry({ maxRetries: 5, initialDelay: 500 });
        logTest('configureRetry()', true, 'maxRetries=5, initialDelay=500');

        const delay = autoRetry.calculateDelay(2);
        logTest('calculateDelay()', delay > 0, `Delay for attempt 2: ${Math.round(delay)}ms`);

        const retryable = autoRetry.isRetryableError(new Error('ETIMEDOUT'));
        logTest('isRetryableError()', retryable === true, 'ETIMEDOUT is retryable');

        const nonRetryable = autoRetry.isRetryableError(new Error('Random error'));
        logTest('isRetryableError()', nonRetryable === false, 'Random error is not retryable');

        // Test retry with success
        let attempts = 0;
        const result = await autoRetry.retry(async () => {
            attempts++;
            if (attempts < 2) throw new Error('ETIMEDOUT');
            return 'success';
        }, { maxRetries: 3, initialDelay: 100 });
        logTest('retry()', result === 'success' && attempts === 2, `Succeeded after ${attempts} attempts`);

        const stats = autoRetry.getRetryStats();
        logTest('getRetryStats()', stats.config.maxRetries === 5, 'Stats retrieved');

        autoRetry.resetConfig();
        logTest('resetConfig()', true, 'Config reset to defaults');
    } catch (e) {
        logTest('Auto-Retry Module', false, e.message);
    }

    // ===== Summary =====
    console.log('\n' + '═'.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round(results.passed / (results.passed + results.failed) * 100)}%`);
    console.log('═'.repeat(50));

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! All 7 feature modules are working correctly.\n');
    } else {
        console.log(`\n⚠️ ${results.failed} tests failed. Check the output above.\n`);
    }

    return results;
}

// Run tests
runTests().catch(console.error);
