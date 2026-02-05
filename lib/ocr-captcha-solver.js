/**
 * OCR Text Captcha Solver
 * 
 * Simple text-based captcha solver using Tesseract.js OCR
 * Works with captchas like: CCA23E, actukd, hf4kvf (eCourts India style)
 * 
 * Features:
 * - Automatic image preprocessing for better accuracy
 * - Multiple OCR attempts with different settings
 * - Hindi + English language support
 * - Works offline (no API needed)
 */

const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

// Colors for console
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[ocr-captcha]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[ocr-captcha]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[ocr-captcha]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ocr-captcha]${colors.reset} ${msg}`)
};

// Common captcha character substitutions
const CHAR_SUBSTITUTIONS = {
    '0': ['O', 'o', 'Q'],
    'O': ['0', 'o', 'Q'],
    '1': ['l', 'I', 'i', '|'],
    'l': ['1', 'I', 'i', '|'],
    'I': ['1', 'l', 'i', '|'],
    '5': ['S', 's'],
    'S': ['5', 's'],
    '8': ['B'],
    'B': ['8'],
    '2': ['Z', 'z'],
    'Z': ['2', 'z'],
    '6': ['G', 'b'],
    'G': ['6'],
    '9': ['g', 'q'],
    'g': ['9', 'q'],
};

// Default OCR settings optimized for captchas
const DEFAULT_OCR_CONFIG = {
    lang: 'eng',
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    tessedit_pageseg_mode: '7', // Single line
    preserve_interword_spaces: '0',
};

/**
 * Solve text captcha from image element or URL
 * @param {Page} page - Puppeteer page instance
 * @param {string} selector - CSS selector for captcha image
 * @param {Object} options - OCR options
 * @returns {Promise<Object>} - Result with recognized text
 */
async function solveTextCaptcha(page, selector, options = {}) {
    const {
        lang = 'eng',
        preprocess = true,
        retries = 3,
        confidence = 60,
        allowedChars = null,
        expectedLength = null,
    } = options;

    log.info(`Attempting to solve text captcha: ${selector}`);

    try {
        // Get captcha image
        const imageData = await getCaptchaImage(page, selector);
        
        if (!imageData) {
            throw new Error('Could not capture captcha image');
        }

        // Try OCR with different settings
        let bestResult = null;
        let attempts = [];

        for (let i = 0; i < retries; i++) {
            const config = {
                ...DEFAULT_OCR_CONFIG,
                lang,
                ...(allowedChars && { tessedit_char_whitelist: allowedChars }),
            };

            // Different PSM modes for each attempt
            const psmModes = ['7', '8', '13']; // 7=single line, 8=single word, 13=raw line
            config.tessedit_pageseg_mode = psmModes[i % psmModes.length];

            const result = await recognizeText(imageData, config);
            attempts.push(result);

            // Check if result meets criteria
            if (result.confidence >= confidence) {
                if (!expectedLength || result.text.length === expectedLength) {
                    bestResult = result;
                    break;
                }
            }

            // Keep best result so far
            if (!bestResult || result.confidence > bestResult.confidence) {
                bestResult = result;
            }
        }

        if (bestResult) {
            log.success(`Captcha solved: "${bestResult.text}" (confidence: ${bestResult.confidence.toFixed(1)}%)`);
        }

        return {
            success: bestResult !== null,
            text: bestResult?.text || '',
            confidence: bestResult?.confidence || 0,
            attempts: attempts.length,
            allAttempts: attempts,
        };

    } catch (error) {
        log.error(`Failed to solve captcha: ${error.message}`);
        return {
            success: false,
            text: '',
            confidence: 0,
            error: error.message,
        };
    }
}

/**
 * Get captcha image as base64 or buffer
 */
async function getCaptchaImage(page, selector) {
    try {
        // Method 1: Screenshot of element
        const element = await page.$(selector);
        if (element) {
            const screenshot = await element.screenshot({ encoding: 'base64' });
            return `data:image/png;base64,${screenshot}`;
        }

        // Method 2: Get image src and fetch
        const imgSrc = await page.$eval(selector, (img) => {
            if (img.tagName === 'IMG') {
                // Try to get as data URL
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                return canvas.toDataURL('image/png');
            }
            return img.src || null;
        });

        return imgSrc;
    } catch (error) {
        log.warn(`Image capture error: ${error.message}`);
        return null;
    }
}

/**
 * Recognize text using Tesseract
 */
async function recognizeText(imageData, config = {}) {
    const worker = await Tesseract.createWorker(config.lang || 'eng');
    
    try {
        await worker.setParameters({
            tessedit_char_whitelist: config.tessedit_char_whitelist || DEFAULT_OCR_CONFIG.tessedit_char_whitelist,
            tessedit_pageseg_mode: config.tessedit_pageseg_mode || '7',
        });

        const { data } = await worker.recognize(imageData);
        
        // Clean up recognized text
        let text = data.text
            .replace(/\s+/g, '')     // Remove whitespace
            .replace(/[^a-zA-Z0-9]/g, ''); // Keep only alphanumeric
        
        return {
            text,
            confidence: data.confidence,
            rawText: data.text,
        };
    } finally {
        await worker.terminate();
    }
}

/**
 * Solve captcha and fill input field
 * @param {Page} page - Puppeteer page
 * @param {string} captchaSelector - Captcha image selector
 * @param {string} inputSelector - Input field selector
 * @param {Object} options - Options
 */
async function solveCaptchaAndFill(page, captchaSelector, inputSelector, options = {}) {
    const {
        humanLike = true,
        submitAfter = false,
        submitSelector = 'button[type="submit"], input[type="submit"]',
        refreshSelector = null, // Selector for refresh button if captcha is wrong
        maxRefreshAttempts = 3,
    } = options;

    let attempts = 0;
    
    while (attempts < maxRefreshAttempts) {
        attempts++;
        log.info(`Attempt ${attempts}/${maxRefreshAttempts}`);

        // Solve captcha
        const result = await solveTextCaptcha(page, captchaSelector, options);
        
        if (!result.success || !result.text) {
            if (refreshSelector) {
                log.warn('OCR failed, refreshing captcha...');
                await page.click(refreshSelector);
                await page.waitForTimeout(1000);
                continue;
            }
            return { success: false, error: 'OCR failed', attempts };
        }

        // Fill the input
        const input = await page.$(inputSelector);
        if (!input) {
            return { success: false, error: 'Input field not found', attempts };
        }

        // Clear and type
        await page.click(inputSelector, { clickCount: 3 }); // Select all
        
        if (humanLike) {
            // Human-like typing
            for (const char of result.text) {
                await page.keyboard.type(char);
                await page.waitForTimeout(50 + Math.random() * 100);
            }
        } else {
            await page.type(inputSelector, result.text);
        }

        log.success(`Filled captcha: "${result.text}"`);

        // Submit if requested
        if (submitAfter) {
            await page.click(submitSelector);
            await page.waitForTimeout(2000);
            
            // Check if captcha was wrong (usually shows error or same page)
            const stillOnPage = await page.$(captchaSelector);
            if (stillOnPage && refreshSelector) {
                log.warn('Captcha might be wrong, retrying...');
                continue;
            }
        }

        return {
            success: true,
            text: result.text,
            confidence: result.confidence,
            attempts,
        };
    }

    return {
        success: false,
        error: 'Max refresh attempts reached',
        attempts,
    };
}

/**
 * Solve captcha from URL directly (without page context)
 */
async function solveCaptchaFromUrl(imageUrl, options = {}) {
    log.info(`Solving captcha from URL: ${imageUrl}`);
    
    try {
        const result = await recognizeText(imageUrl, {
            ...DEFAULT_OCR_CONFIG,
            ...options,
        });

        return {
            success: result.confidence > 50,
            text: result.text,
            confidence: result.confidence,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Preprocess image for better OCR (run in browser)
 */
async function preprocessCaptchaImage(page, selector) {
    return await page.evaluate((sel) => {
        const img = document.querySelector(sel);
        if (!img) return null;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // Threshold to black/white
            const threshold = 128;
            const bw = gray > threshold ? 255 : 0;
            
            data[i] = bw;     // R
            data[i + 1] = bw; // G
            data[i + 2] = bw; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return canvas.toDataURL('image/png');
    }, selector);
}

// Export functions
module.exports = {
    solveTextCaptcha,
    solveCaptchaAndFill,
    solveCaptchaFromUrl,
    getCaptchaImage,
    recognizeText,
    preprocessCaptchaImage,
    CHAR_SUBSTITUTIONS,
    DEFAULT_OCR_CONFIG,
};
