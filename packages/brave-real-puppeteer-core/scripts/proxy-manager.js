/**
 * 🔐 Proxy Manager - Automatic Proxy Rotation
 * Features: HTTP/HTTPS/SOCKS5 support, health checking, auto-failover
 */

// Proxy list storage
let proxyList = [];
let currentProxyIndex = 0;
let proxyStats = new Map();

/**
 * Proxy configuration object
 * @typedef {Object} ProxyConfig
 * @property {string} host - Proxy hostname
 * @property {number} port - Proxy port
 * @property {string} [protocol] - http, https, socks4, socks5
 * @property {string} [username] - Auth username
 * @property {string} [password] - Auth password
 * @property {string} [country] - Country code
 */

/**
 * Initialize proxy manager with proxy list
 * @param {ProxyConfig[]} proxies - Array of proxy configurations
 */
export function initProxyManager(proxies) {
    proxyList = proxies.map(p => ({
        ...p,
        protocol: p.protocol || 'http',
        failures: 0,
        lastUsed: null,
        lastChecked: null,
        isHealthy: true
    }));

    // Initialize stats
    proxyList.forEach((proxy, index) => {
        proxyStats.set(index, {
            requests: 0,
            successes: 0,
            failures: 0,
            avgResponseTime: 0
        });
    });

    console.log(`[proxy-manager] Initialized with ${proxyList.length} proxies`);
    return proxyList;
}

/**
 * Get current proxy
 * @returns {ProxyConfig|null}
 */
export function getCurrentProxy() {
    if (proxyList.length === 0) return null;
    return proxyList[currentProxyIndex];
}

/**
 * Rotate to next proxy
 * @param {boolean} skipUnhealthy - Skip unhealthy proxies
 * @returns {ProxyConfig|null}
 */
export function rotateProxy(skipUnhealthy = true) {
    if (proxyList.length === 0) return null;

    const startIndex = currentProxyIndex;
    do {
        currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;

        if (!skipUnhealthy || proxyList[currentProxyIndex].isHealthy) {
            proxyList[currentProxyIndex].lastUsed = Date.now();
            console.log(`[proxy-manager] Rotated to proxy ${currentProxyIndex + 1}/${proxyList.length}`);
            return proxyList[currentProxyIndex];
        }
    } while (currentProxyIndex !== startIndex);

    console.log('[proxy-manager] No healthy proxies available');
    return null;
}

/**
 * Get proxy URL string for Puppeteer/Playwright
 * @param {ProxyConfig} proxy
 * @returns {string}
 */
export function getProxyUrl(proxy) {
    if (!proxy) return null;

    let url = `${proxy.protocol}://`;
    if (proxy.username && proxy.password) {
        url += `${proxy.username}:${proxy.password}@`;
    }
    url += `${proxy.host}:${proxy.port}`;
    return url;
}

/**
 * Apply proxy to browser launch options
 * @param {Object} launchOptions - Puppeteer/Playwright launch options
 * @param {ProxyConfig} [proxy] - Specific proxy or current
 * @returns {Object} Modified launch options
 */
export function applyProxyToLaunch(launchOptions, proxy = null) {
    const activeProxy = proxy || getCurrentProxy();
    if (!activeProxy) return launchOptions;

    const proxyUrl = getProxyUrl(activeProxy);

    launchOptions.args = launchOptions.args || [];
    launchOptions.args.push(`--proxy-server=${proxyUrl}`);

    console.log(`[proxy-manager] Applied proxy: ${activeProxy.host}:${activeProxy.port}`);
    return launchOptions;
}

/**
 * Mark proxy as failed and rotate
 * @param {number} [index] - Proxy index, defaults to current
 */
export function markProxyFailed(index = currentProxyIndex) {
    if (proxyList[index]) {
        proxyList[index].failures++;
        proxyList[index].isHealthy = proxyList[index].failures < 3;

        const stats = proxyStats.get(index);
        stats.failures++;

        console.log(`[proxy-manager] Proxy ${index + 1} marked failed (${proxyList[index].failures} failures)`);

        if (!proxyList[index].isHealthy) {
            rotateProxy();
        }
    }
}

/**
 * Mark proxy as successful
 * @param {number} [index] - Proxy index
 * @param {number} responseTime - Response time in ms
 */
export function markProxySuccess(index = currentProxyIndex, responseTime = 0) {
    if (proxyList[index]) {
        proxyList[index].failures = 0;
        proxyList[index].isHealthy = true;

        const stats = proxyStats.get(index);
        stats.requests++;
        stats.successes++;
        stats.avgResponseTime = (stats.avgResponseTime * (stats.successes - 1) + responseTime) / stats.successes;
    }
}

/**
 * Check proxy health
 * @param {ProxyConfig} proxy
 * @returns {Promise<boolean>}
 */
export async function checkProxyHealth(proxy) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://httpbin.org/ip', {
            signal: controller.signal,
            // Note: In real implementation, you'd need proxy-agent
        });

        clearTimeout(timeout);
        proxy.lastChecked = Date.now();
        proxy.isHealthy = response.ok;

        return response.ok;
    } catch (err) {
        proxy.isHealthy = false;
        return false;
    }
}

/**
 * Check all proxies health
 * @returns {Promise<Object>} Health report
 */
export async function checkAllProxiesHealth() {
    console.log('[proxy-manager] Checking all proxies health...');

    const results = await Promise.all(
        proxyList.map(async (proxy, index) => ({
            index,
            host: proxy.host,
            healthy: await checkProxyHealth(proxy)
        }))
    );

    const healthy = results.filter(r => r.healthy).length;
    console.log(`[proxy-manager] Health check: ${healthy}/${proxyList.length} healthy`);

    return {
        total: proxyList.length,
        healthy,
        unhealthy: proxyList.length - healthy,
        results
    };
}

/**
 * Get proxy statistics
 * @returns {Object}
 */
export function getProxyStats() {
    return {
        totalProxies: proxyList.length,
        currentIndex: currentProxyIndex,
        currentProxy: getCurrentProxy(),
        stats: Object.fromEntries(proxyStats),
        proxies: proxyList.map((p, i) => ({
            index: i,
            host: p.host,
            port: p.port,
            isHealthy: p.isHealthy,
            failures: p.failures
        }))
    };
}

/**
 * Auto-rotate proxy every N requests
 * @param {number} requestCount - Rotate after this many requests
 */
let requestCounter = 0;
export function autoRotateAfterRequests(requestCount = 10) {
    requestCounter++;
    if (requestCounter >= requestCount) {
        requestCounter = 0;
        rotateProxy();
    }
}

/**
 * Parse proxy string to ProxyConfig
 * @param {string} proxyString - Format: protocol://user:pass@host:port
 * @returns {ProxyConfig}
 */
export function parseProxyString(proxyString) {
    const regex = /^(https?|socks[45]?):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
    const match = proxyString.match(regex);

    if (!match) {
        throw new Error(`Invalid proxy string: ${proxyString}`);
    }

    return {
        protocol: match[1],
        username: match[2] || null,
        password: match[3] || null,
        host: match[4],
        port: parseInt(match[5])
    };
}

// Default export
export default {
    initProxyManager,
    getCurrentProxy,
    rotateProxy,
    getProxyUrl,
    applyProxyToLaunch,
    markProxyFailed,
    markProxySuccess,
    checkProxyHealth,
    checkAllProxiesHealth,
    getProxyStats,
    autoRotateAfterRequests,
    parseProxyString
};
