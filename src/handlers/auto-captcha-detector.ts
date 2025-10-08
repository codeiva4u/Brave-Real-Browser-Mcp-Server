/**
 * AUTO CAPTCHA DETECTOR & SOLVER
 * Automatically detects and solves CAPTCHAs on any page
 */

import { handleSolveTextCaptcha } from './captcha-solver-handlers.js';

// Common CAPTCHA selectors across different websites
const COMMON_CAPTCHA_SELECTORS = {
  images: [
    '#captcha_image',
    '#captcha-image',
    '#captchaImage',
    '.captcha-image',
    '.captcha_image',
    'img[alt*="captcha" i]',
    'img[alt*="CAPTCHA" i]',
    'img[src*="captcha" i]',
    'img[id*="captcha" i]',
    'img[class*="captcha" i]',
    '#securityImage',
    '#verify-image',
    '.security-image',
  ],
  inputs: [
    '#fcaptcha_code',
    '#captcha_code',
    '#captchaCode',
    '#captcha-code',
    '#captcha',
    'input[name*="captcha" i]',
    'input[placeholder*="captcha" i]',
    'input[id*="captcha" i]',
    'input[class*="captcha" i]',
    '#securityCode',
    '#verifyCode',
  ]
};

export interface CaptchaDetectionResult {
  found: boolean;
  imageSelector?: string;
  inputSelector?: string;
  confidence: number;
}

/**
 * Detect CAPTCHA on current page
 */
export async function detectCaptcha(page: any): Promise<CaptchaDetectionResult> {
  if (!page) {
    return { found: false, confidence: 0 };
  }

  try {
    // Check for CAPTCHA elements on page
    const detection = await page.evaluate((selectors: typeof COMMON_CAPTCHA_SELECTORS) => {
      let foundImage: string | null = null;
      let foundInput: string | null = null;

      // Find CAPTCHA image
      for (const selector of selectors.images) {
        try {
          const element = document.querySelector(selector);
          if (element && (element as HTMLElement).offsetParent !== null) {
            // Element exists and is visible
            foundImage = selector;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Find CAPTCHA input
      for (const selector of selectors.inputs) {
        try {
          const element = document.querySelector(selector);
          if (element && (element as HTMLElement).offsetParent !== null) {
            foundInput = selector;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      return {
        imageSelector: foundImage,
        inputSelector: foundInput,
        found: !!(foundImage && foundInput)
      };
    }, COMMON_CAPTCHA_SELECTORS);

    if (detection.found) {
      console.log('✅ CAPTCHA detected on page!');
      console.log(`   Image: ${detection.imageSelector}`);
      console.log(`   Input: ${detection.inputSelector}`);
      
      return {
        found: true,
        imageSelector: detection.imageSelector!,
        inputSelector: detection.inputSelector!,
        confidence: 100
      };
    }

    return { found: false, confidence: 0 };

  } catch (error) {
    console.error('CAPTCHA detection error:', error);
    return { found: false, confidence: 0 };
  }
}

/**
 * AUTO-SOLVE: Detect and solve CAPTCHA automatically
 */
export async function autoSolveCaptcha(page: any, config?: any): Promise<{
  solved: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}> {
  try {
    console.log('🔍 Auto-detecting CAPTCHA on page...');
    
    const detection = await detectCaptcha(page);
    
    if (!detection.found) {
      console.log('ℹ️  No CAPTCHA detected on this page');
      return { solved: false };
    }

    console.log('🎯 CAPTCHA found! Auto-solving...');
    
    // Automatically solve the detected CAPTCHA
    const result = await handleSolveTextCaptcha(
      page,
      detection.imageSelector!,
      config || {
        preprocessImage: true,
        maxAttempts: 5,
        minConfidence: 90
      }
    );

    if (result.success) {
      // Auto-fill the input
      await page.waitForSelector(detection.inputSelector!, { timeout: 5000 });
      await page.click(detection.inputSelector!);
      await page.type(detection.inputSelector!, result.text, { delay: 100 });
      
      console.log(`✅ CAPTCHA auto-solved and filled: "${result.text}"`);
      console.log(`🎉 Confidence: ${result.confidence.toFixed(2)}%`);
      
      return {
        solved: true,
        text: result.text,
        confidence: result.confidence
      };
    }

    return {
      solved: false,
      error: result.error || 'Failed to solve CAPTCHA'
    };

  } catch (error: any) {
    console.error('Auto-solve CAPTCHA error:', error);
    return {
      solved: false,
      error: error.message || 'Auto-solve failed'
    };
  }
}

/**
 * Check if page has CAPTCHA (quick check)
 */
export async function hasCaptcha(page: any): Promise<boolean> {
  const result = await detectCaptcha(page);
  return result.found;
}
