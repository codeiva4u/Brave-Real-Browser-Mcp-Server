/**
 * 🧠 AI CAPTCHA Solver
 * Features: Cloudflare Turnstile, hCaptcha, reCAPTCHA detection and solving
 */

// CAPTCHA solving service configurations
const SOLVER_SERVICES = {
    '2captcha': {
        name: '2Captcha',
        apiUrl: 'https://2captcha.com/in.php',
        resultUrl: 'https://2captcha.com/res.php'
    },
    'anticaptcha': {
        name: 'Anti-Captcha',
        apiUrl: 'https://api.anti-captcha.com/createTask',
        resultUrl: 'https://api.anti-captcha.com/getTaskResult'
    },
    'capsolver': {
        name: 'CapSolver',
        apiUrl: 'https://api.capsolver.com/createTask',
        resultUrl: 'https://api.capsolver.com/getTaskResult'
    }
};

let solverConfig = {
    service: '2captcha',
    apiKey: null,
    timeout: 120000,
    pollInterval: 5000,
    autoRetry: true,
    maxRetries: 3
};

/**
 * Initialize CAPTCHA solver
 * @param {Object} config - Solver configuration
 */
export function initCaptchaSolver(config) {
    solverConfig = { ...solverConfig, ...config };
    console.log(`[captcha-solver] Initialized with ${SOLVER_SERVICES[solverConfig.service]?.name || 'Unknown'} service`);
}

/**
 * Detect CAPTCHA type on page
 * @param {Page} page - Puppeteer/Playwright page
 * @returns {Promise<Object>} CAPTCHA info
 */
export async function detectCaptcha(page) {
    return await page.evaluate(() => {
        const result = {
            type: null,
            siteKey: null,
            action: null,
            enterprise: false,
            found: false
        };

        // Cloudflare Turnstile
        const turnstileFrame = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
        const turnstileDiv = document.querySelector('.cf-turnstile, [data-sitekey]');
        if (turnstileFrame || turnstileDiv) {
            result.type = 'turnstile';
            result.siteKey = turnstileDiv?.getAttribute('data-sitekey');
            result.found = true;
            return result;
        }

        // reCAPTCHA v3
        const recaptchaV3 = document.querySelector('.grecaptcha-badge, script[src*="recaptcha/api.js?render="]');
        if (recaptchaV3) {
            result.type = 'recaptcha_v3';
            const script = document.querySelector('script[src*="recaptcha/api.js?render="]');
            if (script) {
                const match = script.src.match(/render=([^&]+)/);
                result.siteKey = match ? match[1] : null;
            }
            result.found = true;
            return result;
        }

        // reCAPTCHA v2
        const recaptchaV2 = document.querySelector('.g-recaptcha, iframe[src*="recaptcha/api2/anchor"]');
        if (recaptchaV2) {
            result.type = 'recaptcha_v2';
            result.siteKey = recaptchaV2.getAttribute?.('data-sitekey');
            result.found = true;
            return result;
        }

        // hCaptcha
        const hcaptcha = document.querySelector('.h-captcha, iframe[src*="hcaptcha.com"]');
        if (hcaptcha) {
            result.type = 'hcaptcha';
            result.siteKey = hcaptcha.getAttribute?.('data-sitekey');
            result.found = true;
            return result;
        }

        // FunCaptcha
        const funcaptcha = document.querySelector('#funcaptcha, iframe[src*="funcaptcha.com"]');
        if (funcaptcha) {
            result.type = 'funcaptcha';
            result.found = true;
            return result;
        }

        return result;
    });
}

/**
 * Solve Cloudflare Turnstile automatically
 * @param {Page} page
 * @returns {Promise<boolean>}
 */
export async function solveTurnstile(page) {
    console.log('[captcha-solver] Attempting Turnstile auto-solve...');

    try {
        // Wait for Turnstile challenge
        await page.waitForSelector('iframe[src*="challenges.cloudflare.com"]', { timeout: 10000 });

        // Most Turnstile challenges auto-solve with proper stealth
        // Wait for success indicator
        const success = await page.waitForFunction(() => {
            const input = document.querySelector('input[name="cf-turnstile-response"]');
            return input && input.value && input.value.length > 0;
        }, { timeout: 30000 }).catch(() => false);

        if (success) {
            console.log('[captcha-solver] ✅ Turnstile solved automatically');
            return true;
        }

        console.log('[captcha-solver] Turnstile may require manual interaction');
        return false;
    } catch (err) {
        console.log('[captcha-solver] Turnstile solve error:', err.message);
        return false;
    }
}

/**
 * Solve reCAPTCHA using API service
 * @param {Page} page
 * @param {string} siteKey
 * @param {string} [action] - For v3
 * @returns {Promise<string|null>} Token
 */
export async function solveRecaptcha(page, siteKey, action = 'verify') {
    if (!solverConfig.apiKey) {
        console.log('[captcha-solver] No API key configured');
        return null;
    }

    console.log('[captcha-solver] Solving reCAPTCHA via API...');

    const pageUrl = page.url();

    try {
        // Submit task to 2Captcha
        const submitResponse = await fetch(
            `${SOLVER_SERVICES['2captcha'].apiUrl}?key=${solverConfig.apiKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}&action=${action}&json=1`
        );
        const submitData = await submitResponse.json();

        if (submitData.status !== 1) {
            throw new Error(submitData.request);
        }

        const taskId = submitData.request;
        console.log(`[captcha-solver] Task submitted: ${taskId}`);

        // Poll for result
        const startTime = Date.now();
        while (Date.now() - startTime < solverConfig.timeout) {
            await new Promise(r => setTimeout(r, solverConfig.pollInterval));

            const resultResponse = await fetch(
                `${SOLVER_SERVICES['2captcha'].resultUrl}?key=${solverConfig.apiKey}&action=get&id=${taskId}&json=1`
            );
            const resultData = await resultResponse.json();

            if (resultData.status === 1) {
                console.log('[captcha-solver] ✅ reCAPTCHA solved');
                return resultData.request;
            }

            if (resultData.request !== 'CAPCHA_NOT_READY') {
                throw new Error(resultData.request);
            }
        }

        throw new Error('Timeout waiting for solution');
    } catch (err) {
        console.log('[captcha-solver] reCAPTCHA solve error:', err.message);
        return null;
    }
}

/**
 * Inject CAPTCHA solution token into page
 * @param {Page} page
 * @param {string} token
 * @param {string} type
 */
export async function injectCaptchaToken(page, token, type = 'recaptcha') {
    await page.evaluate(({ token, type }) => {
        if (type === 'recaptcha' || type === 'recaptcha_v2' || type === 'recaptcha_v3') {
            // Find and fill reCAPTCHA response
            const textarea = document.getElementById('g-recaptcha-response') ||
                document.querySelector('[name="g-recaptcha-response"]');
            if (textarea) {
                textarea.value = token;
                textarea.style.display = 'none';
            }

            // Trigger callback if exists
            if (window.___grecaptcha_cfg?.clients) {
                Object.keys(window.___grecaptcha_cfg.clients).forEach(key => {
                    const client = window.___grecaptcha_cfg.clients[key];
                    if (client?.callback) {
                        client.callback(token);
                    }
                });
            }
        } else if (type === 'hcaptcha') {
            const textarea = document.querySelector('[name="h-captcha-response"]');
            if (textarea) {
                textarea.value = token;
            }
        } else if (type === 'turnstile') {
            const input = document.querySelector('input[name="cf-turnstile-response"]');
            if (input) {
                input.value = token;
            }
        }
    }, { token, type });

    console.log(`[captcha-solver] Token injected for ${type}`);
}

/**
 * Auto-detect and solve CAPTCHA
 * @param {Page} page
 * @returns {Promise<Object>}
 */
export async function autoSolveCaptcha(page) {
    const detected = await detectCaptcha(page);

    if (!detected.found) {
        return { success: true, message: 'No CAPTCHA found' };
    }

    console.log(`[captcha-solver] Detected ${detected.type} CAPTCHA`);

    switch (detected.type) {
        case 'turnstile':
            const turnstileResult = await solveTurnstile(page);
            return { success: turnstileResult, type: 'turnstile' };

        case 'recaptcha_v2':
        case 'recaptcha_v3':
            if (detected.siteKey) {
                const token = await solveRecaptcha(page, detected.siteKey);
                if (token) {
                    await injectCaptchaToken(page, token, detected.type);
                    return { success: true, type: detected.type, token };
                }
            }
            return { success: false, type: detected.type, message: 'Failed to solve' };

        case 'hcaptcha':
            console.log('[captcha-solver] hCaptcha requires API solving');
            return { success: false, type: 'hcaptcha', message: 'API solving required' };

        default:
            return { success: false, message: 'Unknown CAPTCHA type' };
    }
}

/**
 * Wait for CAPTCHA to be solved (manual or auto)
 * @param {Page} page
 * @param {number} timeout
 * @returns {Promise<boolean>}
 */
export async function waitForCaptchaSolved(page, timeout = 60000) {
    console.log('[captcha-solver] Waiting for CAPTCHA to be solved...');

    try {
        await page.waitForFunction(() => {
            // Check for various success indicators
            const recaptchaToken = document.querySelector('#g-recaptcha-response, [name="g-recaptcha-response"]');
            const hcaptchaToken = document.querySelector('[name="h-captcha-response"]');
            const turnstileToken = document.querySelector('input[name="cf-turnstile-response"]');

            return (recaptchaToken?.value?.length > 0) ||
                (hcaptchaToken?.value?.length > 0) ||
                (turnstileToken?.value?.length > 0);
        }, { timeout });

        console.log('[captcha-solver] ✅ CAPTCHA solved');
        return true;
    } catch {
        console.log('[captcha-solver] ⏰ Timeout waiting for CAPTCHA');
        return false;
    }
}

// Default export
export default {
    initCaptchaSolver,
    detectCaptcha,
    solveTurnstile,
    solveRecaptcha,
    injectCaptchaToken,
    autoSolveCaptcha,
    waitForCaptchaSolved,
    SOLVER_SERVICES
};
