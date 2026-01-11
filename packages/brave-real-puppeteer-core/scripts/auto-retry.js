/**
 * 🔄 Auto-Retry Logic
 * Features: Exponential backoff, configurable retries, smart error handling
 */

// Default retry configuration
const DEFAULT_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'ENOTFOUND',
        'TimeoutError',
        'net::ERR_',
        'Navigation timeout',
        'Execution context was destroyed',
        'Protocol error'
    ],
    onRetry: null,
    shouldRetry: null
};

let config = { ...DEFAULT_CONFIG };

/**
 * Configure retry behavior
 * @param {Object} options
 */
export function configureRetry(options) {
    config = { ...config, ...options };
    console.log(`[auto-retry] Configured: maxRetries=${config.maxRetries}, initialDelay=${config.initialDelay}ms`);
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
    config = { ...DEFAULT_CONFIG };
}

/**
 * Check if error is retryable
 * @param {Error} error
 * @returns {boolean}
 */
export function isRetryableError(error) {
    if (config.shouldRetry) {
        return config.shouldRetry(error);
    }

    const errorString = error.toString() + (error.message || '');
    return config.retryableErrors.some(pattern =>
        errorString.includes(pattern)
    );
}

/**
 * Calculate delay for attempt using exponential backoff
 * @param {number} attempt - Current attempt number (0-based)
 * @returns {number} Delay in ms
 */
export function calculateDelay(attempt) {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Sleep for specified duration
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async functions
 * @param {Function} fn - Async function to retry
 * @param {Object} [options] - Override default config for this call
 * @returns {Promise<any>}
 */
export async function retry(fn, options = {}) {
    const opts = { ...config, ...options };
    let lastError;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            const isLastAttempt = attempt === opts.maxRetries;
            const shouldRetry = isRetryableError(error) && !isLastAttempt;

            if (!shouldRetry) {
                throw error;
            }

            const delay = calculateDelay(attempt);
            console.log(`[auto-retry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed: ${error.message}`);
            console.log(`[auto-retry] Retrying in ${Math.round(delay)}ms...`);

            if (opts.onRetry) {
                await opts.onRetry(error, attempt + 1, delay);
            }

            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Retry page navigation
 * @param {Page} page
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<Response>}
 */
export async function retryNavigation(page, url, options = {}) {
    const { navigationOptions = {}, ...retryOptions } = options;

    return retry(async () => {
        console.log(`[auto-retry] Navigating to: ${url}`);
        return await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000,
            ...navigationOptions
        });
    }, {
        maxRetries: 3,
        ...retryOptions,
        onRetry: async (error, attempt) => {
            console.log(`[auto-retry] Navigation failed, clearing page state...`);
            try {
                await page.goto('about:blank', { timeout: 5000 });
            } catch (e) {
                // Ignore cleanup errors
            }
            if (retryOptions.onRetry) {
                await retryOptions.onRetry(error, attempt);
            }
        }
    });
}

/**
 * Retry element action (click, type, etc)
 * @param {Page} page
 * @param {string} selector
 * @param {string} action - 'click', 'type', 'hover', 'focus'
 * @param {any} [value] - Value for type action
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
export async function retryAction(page, selector, action, value = null, options = {}) {
    return retry(async () => {
        // Wait for element
        await page.waitForSelector(selector, {
            visible: true,
            timeout: options.timeout || 10000
        });

        const element = await page.$(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }

        switch (action) {
            case 'click':
                await element.click();
                break;
            case 'type':
                await element.type(value, { delay: options.typeDelay || 50 });
                break;
            case 'hover':
                await element.hover();
                break;
            case 'focus':
                await element.focus();
                break;
            case 'clear':
                await element.click({ clickCount: 3 });
                await page.keyboard.press('Backspace');
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return element;
    }, {
        maxRetries: 2,
        initialDelay: 500,
        ...options
    });
}

/**
 * Retry evaluate function
 * @param {Page} page
 * @param {Function} fn
 * @param {...any} args
 * @returns {Promise<any>}
 */
export async function retryEvaluate(page, fn, ...args) {
    return retry(async () => {
        return await page.evaluate(fn, ...args);
    }, {
        maxRetries: 2,
        initialDelay: 500,
        retryableErrors: [
            ...config.retryableErrors,
            'Execution context was destroyed',
            'Cannot find context'
        ]
    });
}

/**
 * Retry wait for selector
 * @param {Page} page
 * @param {string} selector
 * @param {Object} [options]
 * @returns {Promise<ElementHandle>}
 */
export async function retryWaitForSelector(page, selector, options = {}) {
    return retry(async () => {
        return await page.waitForSelector(selector, {
            visible: true,
            timeout: options.timeout || 10000,
            ...options
        });
    }, {
        maxRetries: 2,
        initialDelay: 1000,
        ...options.retryOptions
    });
}

/**
 * Create a retryable wrapper for any function
 * @param {Function} fn
 * @param {Object} [options]
 * @returns {Function}
 */
export function createRetryable(fn, options = {}) {
    return async (...args) => {
        return retry(() => fn(...args), options);
    };
}

/**
 * Retry with circuit breaker pattern
 * @param {Function} fn
 * @param {Object} options
 * @returns {Promise<any>}
 */
let circuitState = {
    failures: 0,
    lastFailure: null,
    isOpen: false
};

export async function retryWithCircuitBreaker(fn, options = {}) {
    const {
        failureThreshold = 5,
        resetTimeout = 60000,
        ...retryOptions
    } = options;

    // Check if circuit is open
    if (circuitState.isOpen) {
        const timeSinceFailure = Date.now() - circuitState.lastFailure;
        if (timeSinceFailure < resetTimeout) {
            throw new Error('Circuit breaker is open');
        }
        // Half-open state - try one request
        circuitState.isOpen = false;
    }

    try {
        const result = await retry(fn, retryOptions);
        // Success - reset failures
        circuitState.failures = 0;
        return result;
    } catch (error) {
        circuitState.failures++;
        circuitState.lastFailure = Date.now();

        if (circuitState.failures >= failureThreshold) {
            circuitState.isOpen = true;
            console.log('[auto-retry] Circuit breaker opened due to repeated failures');
        }

        throw error;
    }
}

/**
 * Reset circuit breaker state
 */
export function resetCircuitBreaker() {
    circuitState = {
        failures: 0,
        lastFailure: null,
        isOpen: false
    };
}

/**
 * Get retry statistics
 * @returns {Object}
 */
export function getRetryStats() {
    return {
        config: { ...config },
        circuitBreaker: { ...circuitState }
    };
}

// Default export
export default {
    configureRetry,
    resetConfig,
    isRetryableError,
    calculateDelay,
    retry,
    retryNavigation,
    retryAction,
    retryEvaluate,
    retryWaitForSelector,
    createRetryable,
    retryWithCircuitBreaker,
    resetCircuitBreaker,
    getRetryStats
};
