// Advanced Scraping Utilities - Dynamic Content Handling
import { Page, Frame } from 'puppeteer-core';

/**
 * AJAX Content Waiter - Wait for dynamic content to load
 */
export async function waitForAjaxContent(
  page: Page,
  options?: {
    timeout?: number;
    waitForNetworkIdle?: boolean;
    customCheck?: () => Promise<boolean>;
  }
): Promise<{ success: boolean; loadTime: number }> {
  const opts = {
    timeout: 30000,
    waitForNetworkIdle: true,
    ...options
  };
  
  const startTime = Date.now();
  
  try {
    if (opts.waitForNetworkIdle) {
      await page.waitForNetworkIdle({ timeout: opts.timeout, idleTime: 500 });
    }
    
    // Wait for custom condition if provided
    if (opts.customCheck) {
      await page.waitForFunction(opts.customCheck, { timeout: opts.timeout });
    }
    
    const loadTime = Date.now() - startTime;
    return { success: true, loadTime };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    return { success: false, loadTime };
  }
}

/**
 * Shadow DOM Extractor - Access Shadow DOM elements
 */
export async function extractFromShadowDOM(
  page: Page,
  hostSelector: string,
  shadowSelector: string
): Promise<string | null> {
  return await page.evaluate((host, shadow) => {
    const hostElement = document.querySelector(host);
    if (!hostElement || !hostElement.shadowRoot) {
      return null;
    }
    
    const shadowElement = hostElement.shadowRoot.querySelector(shadow);
    return shadowElement ? (shadowElement as HTMLElement).innerText : null;
  }, hostSelector, shadowSelector);
}

/**
 * Get all Shadow DOM content
 */
export async function getAllShadowDOMContent(page: Page): Promise<Array<{
  host: string;
  content: string;
}>> {
  return await page.evaluate(() => {
    const results: Array<any> = [];
    
    const findShadowRoots = (element: Element) => {
      if (element.shadowRoot) {
        results.push({
          host: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
          content: element.shadowRoot.textContent || ''
        });
        
        // Recursively search shadow root
        element.shadowRoot.querySelectorAll('*').forEach(findShadowRoots);
      }
      
      // Search children
      element.querySelectorAll('*').forEach(findShadowRoots);
    };
    
    findShadowRoots(document.body);
    return results;
  });
}

/**
 * iFrame Scraper - Extract content from iframes
 */
export async function scrapeIframes(page: Page): Promise<Array<{
  src: string;
  content: string;
  title: string;
}>> {
  const frames = page.frames();
  const results: Array<any> = [];
  
  for (const frame of frames) {
    if (frame === page.mainFrame()) continue;
    
    try {
      const content = await frame.evaluate(() => document.body.innerText);
      const src = frame.url();
      const title = await frame.title();
      
      results.push({ src, content, title });
    } catch (error) {
      // Frame might be inaccessible due to CORS
      results.push({
        src: frame.url(),
        content: '[inaccessible due to CORS]',
        title: ''
      });
    }
  }
  
  return results;
}

/**
 * Execute function in specific iframe
 */
export async function executeInIframe<T>(
  page: Page,
  iframeSelector: string,
  fn: (frame: Frame) => Promise<T>
): Promise<T | null> {
  const elementHandle = await page.$(iframeSelector);
  if (!elementHandle) return null;
  
  const frame = await elementHandle.contentFrame();
  if (!frame) return null;
  
  return await fn(frame);
}

/**
 * Modal/Popup Handler - Detect and interact with modals
 */
export async function detectModal(page: Page): Promise<{
  hasModal: boolean;
  modalSelector: string | null;
  closeButtonSelector: string | null;
}> {
  return await page.evaluate(() => {
    // Common modal selectors
    const modalSelectors = [
      '.modal.show',
      '[role="dialog"]',
      '.popup',
      '.overlay',
      '#modal',
      '.lightbox'
    ];
    
    for (const selector of modalSelectors) {
      const modal = document.querySelector(selector);
      if (modal && window.getComputedStyle(modal).display !== 'none') {
        // Try to find close button
        const closeSelectors = [
          '.close',
          '.modal-close',
          '[aria-label="Close"]',
          'button[class*="close"]',
          '.dismiss'
        ];
        
        let closeButton = null;
        for (const closeSelector of closeSelectors) {
          const btn = modal.querySelector(closeSelector);
          if (btn) {
            closeButton = closeSelector;
            break;
          }
        }
        
        return {
          hasModal: true,
          modalSelector: selector,
          closeButtonSelector: closeButton
        };
      }
    }
    
    return { hasModal: false, modalSelector: null, closeButtonSelector: null };
  });
}

/**
 * Close modal if detected
 */
export async function closeModal(page: Page): Promise<boolean> {
  const modalInfo = await detectModal(page);
  
  if (!modalInfo.hasModal) return false;
  
  if (modalInfo.closeButtonSelector) {
    try {
      await page.click(modalInfo.closeButtonSelector);
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      // Try ESC key
      await page.keyboard.press('Escape');
      return true;
    }
  }
  
  // Try ESC key as fallback
  await page.keyboard.press('Escape');
  return true;
}

/**
 * Wait for element to be visible (handling dynamic content)
 */
export async function waitForVisibleElement(
  page: Page,
  selector: string,
  timeout: number = 30000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(
  page: Page,
  selector: string,
  timeout: number = 30000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { hidden: true, timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Detect lazy-loaded images and wait for them
 */
export async function waitForLazyImages(
  page: Page,
  timeout: number = 10000
): Promise<{ total: number; loaded: number }> {
  const startTime = Date.now();
  
  const result = await page.evaluate(async (maxTime) => {
    const images = Array.from(document.querySelectorAll('img[loading="lazy"], img[data-src]'));
    const total = images.length;
    let loaded = 0;
    
    const checkImage = (img: HTMLImageElement): Promise<void> => {
      return new Promise((resolve) => {
        if (img.complete) {
          loaded++;
          resolve();
        } else {
          img.addEventListener('load', () => {
            loaded++;
            resolve();
          });
          img.addEventListener('error', () => resolve());
          
          // Trigger lazy load
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
        }
      });
    };
    
    await Promise.race([
      Promise.all(images.map(img => checkImage(img as HTMLImageElement))),
      new Promise(resolve => setTimeout(resolve, maxTime))
    ]);
    
    return { total, loaded };
  }, timeout);
  
  return result;
}

/**
 * Handle cookie consent banners
 */
export async function handleCookieConsent(page: Page): Promise<boolean> {
  const consentSelectors = [
    'button[id*="accept"]',
    'button[class*="accept"]',
    'button:contains("Accept")',
    'button:contains("Agree")',
    '#onetrust-accept-btn-handler',
    '.cookie-consent button',
    '[aria-label*="Accept"]'
  ];
  
  for (const selector of consentSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  return false;
}
