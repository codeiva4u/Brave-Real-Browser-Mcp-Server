/**
 * OCR Text Captcha Solver (Enhanced Version)
 * 
 * Simple text-based captcha solver using Tesseract.js OCR
 * Works with captchas like: CCA23E, actukd, hf4kvf (eCourts India style)
 * 
 * Features:
 * - Advanced image preprocessing (grayscale, threshold, denoise, remove lines)
 * - Multiple OCR attempts with different settings
 * - Auto-retry with captcha refresh
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
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[ocr-captcha]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[ocr-captcha]${colors.reset} ✅ ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[ocr-captcha]${colors.reset} ⚠️ ${msg}`),
    error: (msg) => console.log(`${colors.red}[ocr-captcha]${colors.reset} ❌ ${msg}`),
    debug: (msg) => console.log(`${colors.cyan}[ocr-captcha]${colors.reset} 🔍 ${msg}`)
};

// Common captcha character substitutions for correction
const CHAR_SUBSTITUTIONS = {
    '0': ['O', 'o', 'Q', 'D'],
    'O': ['0', 'o', 'Q', 'D'],
    '1': ['l', 'I', 'i', '|', '!'],
    'l': ['1', 'I', 'i', '|'],
    'I': ['1', 'l', 'i', '|'],
    '5': ['S', 's', '$'],
    'S': ['5', 's', '$'],
    '8': ['B', '&'],
    'B': ['8', '&'],
    '2': ['Z', 'z'],
    'Z': ['2', 'z'],
    '6': ['G', 'b'],
    'G': ['6', 'C'],
    '9': ['g', 'q'],
    'g': ['9', 'q'],
    'C': ['G', 'c', '('],
    'E': ['3', 'e'],
    '3': ['E', 'e'],
    'A': ['4', 'a'],
    '4': ['A', 'a'],
};

// Default OCR settings optimized for captchas
const DEFAULT_OCR_CONFIG = {
    lang: 'eng',
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    tessedit_pageseg_mode: '7', // Single line
    preserve_interword_spaces: '0',
};

// Preprocessing configurations for different captcha types
const PREPROCESS_CONFIGS = [
    { name: 'standard', threshold: 128, invert: false, removeLines: true },
    { name: 'high-contrast', threshold: 100, invert: false, removeLines: true },
    { name: 'low-contrast', threshold: 160, invert: false, removeLines: true },
    { name: 'inverted', threshold: 128, invert: true, removeLines: true },
    { name: 'no-line-removal', threshold: 128, invert: false, removeLines: false },
];

/**
 * Advanced image preprocessing in browser
 * Removes noise, lines, and enhances text
 */
async function preprocessImageAdvanced(page, selector, config = {}) {
    const { threshold = 128, invert = false, removeLines = true } = config;
    
    return await page.evaluate(({ sel, threshold, invert, removeLines }) => {
        const img = document.querySelector(sel);
        if (!img) return null;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use natural dimensions for better quality
        const width = img.naturalWidth || img.width || 200;
        const height = img.naturalHeight || img.height || 50;
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Step 1: Convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
        
        // Step 2: Remove diagonal lines (common in captchas)
        if (removeLines) {
            // Detect and remove thin lines
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4;
                    const pixel = data[idx];
                    
                    // Check if this is a dark pixel
                    if (pixel < threshold) {
                        // Get surrounding pixels
                        const top = data[((y - 1) * width + x) * 4];
                        const bottom = data[((y + 1) * width + x) * 4];
                        const left = data[(y * width + (x - 1)) * 4];
                        const right = data[(y * width + (x + 1)) * 4];
                        
                        // Count dark neighbors
                        let darkNeighbors = 0;
                        if (top < threshold) darkNeighbors++;
                        if (bottom < threshold) darkNeighbors++;
                        if (left < threshold) darkNeighbors++;
                        if (right < threshold) darkNeighbors++;
                        
                        // If isolated or thin line (≤2 dark neighbors), might be noise
                        if (darkNeighbors <= 1) {
                            // Make it white (remove noise)
                            data[idx] = 255;
                            data[idx + 1] = 255;
                            data[idx + 2] = 255;
                        }
                    }
                }
            }
        }
        
        // Step 3: Apply threshold (binarization)
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i];
            let bw = gray > threshold ? 255 : 0;
            
            // Invert if needed
            if (invert) bw = 255 - bw;
            
            data[i] = bw;
            data[i + 1] = bw;
            data[i + 2] = bw;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return canvas.toDataURL('image/png');
    }, { sel: selector, threshold, invert, removeLines });
}

/**
 * Get captcha image with optional preprocessing
 */
async function getCaptchaImage(page, selector, preprocess = true, preprocessConfig = {}) {
    try {
        if (preprocess) {
            // Try preprocessing first
            const processed = await preprocessImageAdvanced(page, selector, preprocessConfig);
            if (processed) {
                log.debug('Image preprocessed successfully');
                return processed;
            }
        }
        
        // Fallback: Screenshot of element
        const element = await page.$(selector);
        if (element) {
            const screenshot = await element.screenshot({ encoding: 'base64' });
            return `data:image/png;base64,${screenshot}`;
        }

        // Fallback 2: Get image src
        const imgSrc = await page.$eval(selector, (img) => {
            if (img.tagName === 'IMG') {
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
 * Recognize text using Tesseract with multiple attempts
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
            .replace(/\s+/g, '')           // Remove whitespace
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
 * Solve text captcha with multiple preprocessing attempts
 */
async function solveTextCaptcha(page, selector, options = {}) {
    const {
        lang = 'eng',
        retries = 3,
        confidence = 50,        // Lowered for better success rate
        allowedChars = null,
        expectedLength = null,
        tryAllPreprocess = true,  // Try all preprocessing configs
    } = options;

    log.info(`Solving text captcha: ${selector}`);

    try {
        let bestResult = null;
        let allAttempts = [];

        // Determine which preprocessing configs to try
        const configsToTry = tryAllPreprocess ? PREPROCESS_CONFIGS : [PREPROCESS_CONFIGS[0]];

        for (const preprocessConfig of configsToTry) {
            log.debug(`Trying preprocess config: ${preprocessConfig.name}`);
            
            // Get preprocessed image
            const imageData = await getCaptchaImage(page, selector, true, preprocessConfig);
            
            if (!imageData) {
                continue;
            }

            // Try different PSM modes
            const psmModes = ['7', '8', '13', '6']; // 7=single line, 8=word, 13=raw, 6=block
            
            for (let i = 0; i < Math.min(retries, psmModes.length); i++) {
                const config = {
                    ...DEFAULT_OCR_CONFIG,
                    lang,
                    tessedit_pageseg_mode: psmModes[i],
                    ...(allowedChars && { tessedit_char_whitelist: allowedChars }),
                };

                try {
                    const result = await recognizeText(imageData, config);
                    result.preprocessConfig = preprocessConfig.name;
                    result.psmMode = psmModes[i];
                    allAttempts.push(result);

                    log.debug(`  PSM ${psmModes[i]}: "${result.text}" (${result.confidence.toFixed(1)}%)`);

                    // Check if result meets criteria
                    const meetsConfidence = result.confidence >= confidence;
                    const meetsLength = !expectedLength || result.text.length === expectedLength;
                    const hasText = result.text.length > 0;

                    if (meetsConfidence && meetsLength && hasText) {
                        bestResult = result;
                        break;
                    }

                    // Keep best result so far (prioritize correct length)
                    if (hasText) {
                        if (!bestResult) {
                            bestResult = result;
                        } else if (expectedLength) {
                            // Prefer correct length
                            if (result.text.length === expectedLength && bestResult.text.length !== expectedLength) {
                                bestResult = result;
                            } else if (result.confidence > bestResult.confidence) {
                                bestResult = result;
                            }
                        } else if (result.confidence > bestResult.confidence) {
                            bestResult = result;
                        }
                    }
                } catch (err) {
                    log.debug(`  OCR error: ${err.message}`);
                }
            }

            // Stop if we found a good result
            if (bestResult && bestResult.confidence >= confidence) {
                break;
            }
        }

        if (bestResult && bestResult.text) {
            log.success(`Solved: "${bestResult.text}" (confidence: ${bestResult.confidence.toFixed(1)}%, config: ${bestResult.preprocessConfig})`);
            return {
                success: true,
                text: bestResult.text,
                confidence: bestResult.confidence,
                attempts: allAttempts.length,
                allAttempts,
            };
        }

        log.warn('OCR could not recognize text');
        return {
            success: false,
            text: bestResult?.text || '',
            confidence: bestResult?.confidence || 0,
            attempts: allAttempts.length,
            allAttempts,
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
 * Solve captcha and fill input field with auto-retry
 */
async function solveCaptchaAndFill(page, captchaSelector, inputSelector, options = {}) {
    const {
        humanLike = true,
        submitAfter = false,
        submitSelector = 'button[type="submit"], input[type="submit"], button.btn-primary, input.btn',
        refreshSelector = null,
        maxRefreshAttempts = 5,       // Increased retries
        minConfidence = 40,           // Minimum confidence to try
        expectedLength = null,
        lang = 'eng',
        allowedChars = null,
        waitAfterRefresh = 1500,      // Wait after refresh
        waitBeforeType = 500,         // Wait before typing
    } = options;

    let attempts = 0;
    let lastResult = null;
    
    log.info(`Starting captcha solve with ${maxRefreshAttempts} max attempts`);

    while (attempts < maxRefreshAttempts) {
        attempts++;
        log.info(`Attempt ${attempts}/${maxRefreshAttempts}`);

        // Wait for image to load properly
        await new Promise(r => setTimeout(r, waitBeforeType));

        // Solve captcha
        const result = await solveTextCaptcha(page, captchaSelector, {
            lang,
            expectedLength,
            allowedChars,
            confidence: minConfidence,
            tryAllPreprocess: attempts <= 2, // Only try all configs on first 2 attempts
        });
        
        lastResult = result;

        // Check if we got a usable result
        if (!result.text || result.text.length === 0) {
            log.warn('No text recognized');
            if (refreshSelector) {
                log.info('Refreshing captcha...');
                try {
                    await page.click(refreshSelector);
                    await new Promise(r => setTimeout(r, waitAfterRefresh));
                } catch (e) {
                    log.warn(`Refresh failed: ${e.message}`);
                }
            }
            continue;
        }

        // If expected length specified and doesn't match, refresh
        if (expectedLength && result.text.length !== expectedLength) {
            log.warn(`Length mismatch: got ${result.text.length}, expected ${expectedLength}`);
            if (refreshSelector && attempts < maxRefreshAttempts) {
                log.info('Refreshing captcha for better result...');
                await page.click(refreshSelector);
                await new Promise(r => setTimeout(r, waitAfterRefresh));
                continue;
            }
        }

        // Fill the input
        const input = await page.$(inputSelector);
        if (!input) {
            return { success: false, error: 'Input field not found', attempts };
        }

        // Clear field
        await page.click(inputSelector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await new Promise(r => setTimeout(r, 100));

        // Type the captcha
        if (humanLike) {
            for (const char of result.text) {
                await page.keyboard.type(char);
                await new Promise(r => setTimeout(r, 30 + Math.random() * 80));
            }
        } else {
            await page.type(inputSelector, result.text);
        }

        log.success(`Filled captcha: "${result.text}"`);

        // Submit if requested
        if (submitAfter) {
            try {
                await page.click(submitSelector);
                await new Promise(r => setTimeout(r, 2000));
                
                // Check if captcha was wrong
                const stillOnPage = await page.$(captchaSelector);
                const errorVisible = await page.evaluate(() => {
                    const errorSelectors = ['.error', '.alert-danger', '.captcha-error', '#captchaError'];
                    return errorSelectors.some(sel => {
                        const el = document.querySelector(sel);
                        return el && el.offsetParent !== null;
                    });
                });

                if ((stillOnPage || errorVisible) && refreshSelector) {
                    log.warn('Captcha might be wrong, retrying...');
                    await page.click(refreshSelector);
                    await new Promise(r => setTimeout(r, waitAfterRefresh));
                    continue;
                }
            } catch (e) {
                log.warn(`Submit error: ${e.message}`);
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
        error: 'Max attempts reached',
        attempts,
        lastResult,
    };
}

/**
 * Solve captcha from URL directly
 */
async function solveCaptchaFromUrl(imageUrl, options = {}) {
    log.info(`Solving captcha from URL: ${imageUrl}`);
    
    try {
        const result = await recognizeText(imageUrl, {
            ...DEFAULT_OCR_CONFIG,
            ...options,
        });

        return {
            success: result.confidence > 40 && result.text.length > 0,
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

// Export functions
module.exports = {
    solveTextCaptcha,
    solveCaptchaAndFill,
    solveCaptchaFromUrl,
    getCaptchaImage,
    recognizeText,
    preprocessImageAdvanced,
    CHAR_SUBSTITUTIONS,
    DEFAULT_OCR_CONFIG,
    PREPROCESS_CONFIGS,
};
