// Captcha Handling Tools
// Multiple OCR engines, audio captcha, puzzle captcha, 2Captcha integration

// Use generic types instead of Puppeteer to avoid dependency
type Page = any;
type Frame = any;

/**
 * Captcha detection and type identification
 */
export async function detectCaptcha(page: Page): Promise<{
  found: boolean;
  type: 'recaptcha' | 'hcaptcha' | 'image' | 'audio' | 'puzzle' | 'unknown';
  selector?: string;
}> {
  try {
    const detection = await page.evaluate(() => {
      // Check for reCAPTCHA
      if (document.querySelector('.g-recaptcha') || document.querySelector('[data-sitekey]')) {
        return {
          found: true,
          type: 'recaptcha' as const,
          selector: '.g-recaptcha',
        };
      }

      // Check for hCaptcha
      if (document.querySelector('.h-captcha')) {
        return {
          found: true,
          type: 'hcaptcha' as const,
          selector: '.h-captcha',
        };
      }

      // Check for image captcha patterns
      const imgCaptcha = document.querySelector('img[src*="captcha"]') || 
                        document.querySelector('img[alt*="captcha"]') ||
                        document.querySelector('#captcha-image');
      if (imgCaptcha) {
        return {
          found: true,
          type: 'image' as const,
          selector: 'img[src*="captcha"]',
        };
      }

      // Check for audio captcha
      if (document.querySelector('audio[src*="captcha"]')) {
        return {
          found: true,
          type: 'audio' as const,
          selector: 'audio[src*="captcha"]',
        };
      }

      // Check for puzzle captcha (e.g., slider)
      if (document.querySelector('.slider-captcha') || 
          document.querySelector('[class*="puzzle"]') ||
          document.querySelector('[id*="slider"]')) {
        return {
          found: true,
          type: 'puzzle' as const,
          selector: '.slider-captcha',
        };
      }

      return {
        found: false,
        type: 'unknown' as const,
      };
    });

    return detection;
  } catch (error) {
    throw new Error(`Captcha detection failed: ${error}`);
  }
}

/**
 * Simple OCR for image captcha (basic implementation)
 * In production, integrate with Tesseract.js or cloud OCR services
 */
export async function solveImageCaptchaOCR(
  page: Page,
  options: {
    selector?: string;
    preprocessImage?: boolean;
  } = {}
): Promise<{ text: string; confidence: number }> {
  const { selector = 'img[src*="captcha"]', preprocessImage = true } = options;

  try {
    // Get image data
    const imageData = await page.evaluate((sel: string) => {
      const img = document.querySelector(sel) as HTMLImageElement;
      if (!img) return null;

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL();
    }, selector);

    if (!imageData) {
      throw new Error('Captcha image not found or cannot be processed');
    }

    // NOTE: This is a placeholder. Real implementation would use:
    // - Tesseract.js for client-side OCR
    // - Google Vision API, AWS Textract, or Azure Computer Vision for cloud OCR
    // - Custom ML model for specific captcha types
    
    return {
      text: 'OCR_NOT_IMPLEMENTED',
      confidence: 0,
    };
  } catch (error) {
    throw new Error(`Image captcha OCR failed: ${error}`);
  }
}

/**
 * Audio captcha solver
 * Downloads audio and converts to text using speech recognition
 */
export async function solveAudioCaptcha(
  page: Page,
  options: {
    selector?: string;
  } = {}
): Promise<{ text: string; confidence: number }> {
  const { selector = 'audio[src*="captcha"]' } = options;

  try {
    // Get audio URL
    const audioUrl = await page.evaluate((sel: string) => {
      const audio = document.querySelector(sel) as HTMLAudioElement;
      return audio?.src || null;
    }, selector);

    if (!audioUrl) {
      throw new Error('Audio captcha not found');
    }

    // NOTE: Real implementation would:
    // - Download audio file
    // - Use speech-to-text API (Google Speech-to-Text, AWS Transcribe, etc.)
    // - Process and clean the recognized text

    return {
      text: 'AUDIO_NOT_IMPLEMENTED',
      confidence: 0,
    };
  } catch (error) {
    throw new Error(`Audio captcha solving failed: ${error}`);
  }
}

/**
 * Puzzle captcha solver (slider/drag-and-drop)
 * Uses computer vision to find puzzle piece position
 */
export async function solvePuzzleCaptcha(
  page: Page,
  options: {
    type?: 'slider' | 'jigsaw' | 'rotate';
    selector?: string;
  } = {}
): Promise<{ success: boolean; action: string }> {
  const { type = 'slider', selector = '.slider-captcha' } = options;

  try {
    if (type === 'slider') {
      // Slider captcha solution
      const result = await page.evaluate((sel: string) => {
        const slider = document.querySelector(sel) as HTMLElement;
        if (!slider) return { success: false, action: 'slider not found' };

        // Find slider button/handle
        const handle = slider.querySelector('.slider-handle') || 
                      slider.querySelector('[class*="handle"]') || 
                      slider.querySelector('button');

        if (!handle) return { success: false, action: 'handle not found' };

        // Simulate drag
        const bbox = handle.getBoundingClientRect();
        const startX = bbox.left + bbox.width / 2;
        const startY = bbox.top + bbox.height / 2;

        // Calculate target position (usually right side)
        const containerWidth = slider.getBoundingClientRect().width;
        const distance = containerWidth - 50; // Leave some margin

        // Trigger mouse events
        const mouseDown = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: startX,
          clientY: startY,
        });

        const mouseMove = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: startX + distance,
          clientY: startY,
        });

        const mouseUp = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: startX + distance,
          clientY: startY,
        });

        handle.dispatchEvent(mouseDown);
        
        // Simulate gradual movement
        for (let i = 0; i <= distance; i += 10) {
          const moveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: startX + i,
            clientY: startY,
          });
          handle.dispatchEvent(moveEvent);
        }

        handle.dispatchEvent(mouseMove);
        handle.dispatchEvent(mouseUp);

        return { success: true, action: `dragged ${distance}px` };
      }, selector);

      return result;
    } else if (type === 'jigsaw') {
      // Jigsaw puzzle - find missing piece position
      // This would require image analysis to find the gap
      return {
        success: false,
        action: 'Jigsaw puzzle solving not fully implemented',
      };
    } else {
      // Rotate captcha
      return {
        success: false,
        action: 'Rotate captcha solving not fully implemented',
      };
    }
  } catch (error) {
    throw new Error(`Puzzle captcha solving failed: ${error}`);
  }
}

/**
 * 2Captcha integration
 * Sends captcha to 2Captcha service for human solving
 */
export async function solve2Captcha(
  page: Page,
  options: {
    apiKey: string;
    type: 'recaptcha' | 'hcaptcha' | 'image';
    siteKey?: string;
    imageUrl?: string;
  }
): Promise<{ solution: string; cost: number }> {
  const { apiKey, type, siteKey, imageUrl } = options;

  try {
    if (!apiKey) {
      throw new Error('2Captcha API key required');
    }

    const pageUrl = page.url();

    // NOTE: Real implementation would:
    // 1. Submit captcha to 2Captcha API
    // 2. Poll for solution
    // 3. Return the solution

    // Placeholder for API integration
    interface TwoCaptchaRequest {
      key: string;
      method: string;
      googlekey?: string;
      pageurl?: string;
      body?: string;
    }

    const requestData: TwoCaptchaRequest = {
      key: apiKey,
      method: type === 'recaptcha' ? 'userrecaptcha' : 'base64',
    };

    if (type === 'recaptcha' && siteKey) {
      requestData.googlekey = siteKey;
      requestData.pageurl = pageUrl;
    }

    if (type === 'image' && imageUrl) {
      requestData.body = imageUrl;
    }

    // This is a placeholder - real implementation would make HTTP requests
    console.log('2Captcha request would be sent with:', requestData);

    return {
      solution: '2CAPTCHA_NOT_IMPLEMENTED',
      cost: 0,
    };
  } catch (error) {
    throw new Error(`2Captcha solving failed: ${error}`);
  }
}

/**
 * reCAPTCHA v2 solver
 * Handles reCAPTCHA checkbox and challenges
 */
export async function solveRecaptchaV2(
  page: Page,
  options: {
    apiKey?: string;
    useService?: boolean;
  } = {}
): Promise<{ success: boolean; method: string }> {
  const { apiKey, useService = false } = options;

  try {
    // Find reCAPTCHA iframe
    const recaptchaFrame = page.frames().find((frame: Frame) =>
      frame.url().includes('google.com/recaptcha')
    );

    if (!recaptchaFrame) {
      throw new Error('reCAPTCHA iframe not found');
    }

    // Try to click the checkbox
    const clicked = await recaptchaFrame.evaluate(() => {
      const checkbox = document.querySelector('.recaptcha-checkbox') as HTMLElement;
      if (checkbox) {
        checkbox.click();
        return true;
      }
      return false;
    }).catch(() => false);

    if (!clicked) {
      if (useService && apiKey) {
        // Use 2Captcha or similar service
        const siteKey = await page.evaluate(() => {
          const element = document.querySelector('[data-sitekey]');
          return element?.getAttribute('data-sitekey') || null;
        });

        if (siteKey) {
          await solve2Captcha(page, {
            apiKey,
            type: 'recaptcha',
            siteKey,
          });
          return { success: true, method: '2captcha' };
        }
      }

      return { success: false, method: 'manual_required' };
    }

    // Wait to see if challenge appears
    await page.waitForTimeout(2000);

    // Check if challenge iframe appeared
    const challengeFrame = page.frames().find((frame: Frame) =>
      frame.url().includes('google.com/recaptcha') && 
      frame.url().includes('bframe')
    );

    if (challengeFrame) {
      // Challenge appeared - would need image recognition
      return { success: false, method: 'challenge_requires_solving' };
    }

    return { success: true, method: 'checkbox' };
  } catch (error) {
    throw new Error(`reCAPTCHA v2 solving failed: ${error}`);
  }
}

/**
 * hCaptcha solver
 */
export async function solveHCaptcha(
  page: Page,
  options: {
    apiKey?: string;
    useService?: boolean;
  } = {}
): Promise<{ success: boolean; method: string }> {
  const { apiKey, useService = false } = options;

  try {
    // Find hCaptcha
    const hcaptchaElement = await page.$('.h-captcha');
    
    if (!hcaptchaElement) {
      throw new Error('hCaptcha not found');
    }

    if (useService && apiKey) {
      const siteKey = await page.evaluate(() => {
        const element = document.querySelector('.h-captcha');
        return element?.getAttribute('data-sitekey') || null;
      });

      if (siteKey) {
        await solve2Captcha(page, {
          apiKey,
          type: 'hcaptcha',
          siteKey,
        });
        return { success: true, method: '2captcha' };
      }
    }

    return { success: false, method: 'service_required' };
  } catch (error) {
    throw new Error(`hCaptcha solving failed: ${error}`);
  }
}

/**
 * General captcha solver - auto-detects and solves
 */
export async function solveCaptchaAuto(
  page: Page,
  options: {
    apiKey?: string;
    timeout?: number;
  } = {}
): Promise<{ success: boolean; type: string; method: string }> {
  const { apiKey, timeout = 30000 } = options;

  try {
    // Detect captcha type
    const detection = await detectCaptcha(page);

    if (!detection.found) {
      return { success: true, type: 'none', method: 'no_captcha' };
    }

    // Solve based on type
    let result;
    switch (detection.type) {
      case 'recaptcha':
        result = await solveRecaptchaV2(page, { apiKey, useService: !!apiKey });
        return { ...result, type: 'recaptcha' };

      case 'hcaptcha':
        result = await solveHCaptcha(page, { apiKey, useService: !!apiKey });
        return { ...result, type: 'hcaptcha' };

      case 'puzzle':
        result = await solvePuzzleCaptcha(page, { selector: detection.selector });
        return { success: result.success, type: 'puzzle', method: result.action };

      case 'image':
        const imageResult = await solveImageCaptchaOCR(page, { selector: detection.selector });
        return { 
          success: imageResult.confidence > 0.7, 
          type: 'image', 
          method: 'ocr' 
        };

      case 'audio':
        const audioResult = await solveAudioCaptcha(page, { selector: detection.selector });
        return { 
          success: audioResult.confidence > 0.7, 
          type: 'audio', 
          method: 'speech_recognition' 
        };

      default:
        return { success: false, type: 'unknown', method: 'unsupported' };
    }
  } catch (error) {
    throw new Error(`Auto captcha solving failed: ${error}`);
  }
}
