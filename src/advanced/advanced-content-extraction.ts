// Advanced Content Extraction Tools
// AJAX waiter, Shadow DOM extraction, iFrame scraping, Modal handling

import { Page, ElementHandle } from 'puppeteer-core';

/**
 * AJAX Content Waiter - Wait for dynamic content to load
 */
export interface AjaxWaitOptions {
  timeout?: number;
  checkInterval?: number;
  selector?: string;
  waitForNetworkIdle?: boolean;
  waitForSpecificRequest?: string; // URL pattern to wait for
}

export async function waitForAjaxContent(
  page: Page,
  options: AjaxWaitOptions = {}
): Promise<{ success: boolean; duration: number; message: string }> {
  const {
    timeout = 30000,
    checkInterval = 500,
    selector,
    waitForNetworkIdle = true,
    waitForSpecificRequest,
  } = options;

  const startTime = Date.now();

  try {
    // Wait for network idle if requested
    if (waitForNetworkIdle) {
      await page.waitForNetworkIdle({ timeout, idleTime: 500 });
    }

    // Wait for specific request if pattern provided
    if (waitForSpecificRequest) {
      await page.waitForResponse(
        response => response.url().includes(waitForSpecificRequest),
        { timeout }
      );
    }

    // Wait for specific selector if provided
    if (selector) {
      await page.waitForSelector(selector, { timeout });
    }

    // Additional wait for any ongoing animations or transitions
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        if (document.readyState === 'complete') {
          // Check if any animations are running
          const checkAnimations = () => {
            const animations = document.getAnimations();
            if (animations.length === 0) {
              resolve();
            } else {
              setTimeout(checkAnimations, 100);
            }
          };
          checkAnimations();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      duration,
      message: `AJAX content loaded successfully in ${duration}ms`,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      duration,
      message: `Failed to wait for AJAX content: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Shadow DOM Extractor - Access and extract content from Shadow DOM elements
 */
export interface ShadowDomContent {
  found: boolean;
  content: string;
  html: string;
  elements: Array<{ tag: string; text: string; attributes: Record<string, string> }>;
}

export async function extractFromShadowDom(
  page: Page,
  hostSelector: string
): Promise<ShadowDomContent> {
  try {
    const result = await page.evaluate((selector) => {
      const host = document.querySelector(selector);
      if (!host || !host.shadowRoot) {
        return {
          found: false,
          content: '',
          html: '',
          elements: [],
        };
      }

      const shadowRoot = host.shadowRoot;
      const content = shadowRoot.textContent || '';
      const html = shadowRoot.innerHTML;

      // Extract all elements from shadow DOM
      const elements = Array.from(shadowRoot.querySelectorAll('*')).map(el => {
        const attributes: Record<string, string> = {};
        for (const attr of el.attributes) {
          attributes[attr.name] = attr.value;
        }
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent || '',
          attributes,
        };
      });

      return {
        found: true,
        content,
        html,
        elements,
      };
    }, hostSelector);

    return result;
  } catch (error) {
    return {
      found: false,
      content: '',
      html: '',
      elements: [],
    };
  }
}

/**
 * Query selector that works with Shadow DOM
 */
export async function querySelectorDeep(
  page: Page,
  selector: string
): Promise<ElementHandle | null> {
  return await page.evaluateHandle((sel) => {
    // Helper function to find element in shadow DOM recursively
    function findInShadowDom(root: Document | ShadowRoot, selector: string): Element | null {
      // Try normal querySelector first
      let element = root.querySelector(selector);
      if (element) return element;

      // Search in shadow roots
      const allElements = root.querySelectorAll('*');
      for (const el of allElements) {
        if (el.shadowRoot) {
          element = findInShadowDom(el.shadowRoot, selector);
          if (element) return element;
        }
      }

      return null;
    }

    return findInShadowDom(document, sel);
  }, selector).then(handle => handle.asElement());
}

/**
 * iFrame Scraper - Extract content from iframes
 */
export interface IFrameContent {
  found: boolean;
  url: string;
  content: string;
  html: string;
  title: string;
  links: string[];
  images: string[];
}

export async function extractFromIFrame(
  page: Page,
  iframeSelector: string
): Promise<IFrameContent> {
  try {
    // Find the iframe
    const frameHandle = await page.$(iframeSelector);
    if (!frameHandle) {
      return {
        found: false,
        url: '',
        content: '',
        html: '',
        title: '',
        links: [],
        images: [],
      };
    }

    // Get frame from handle
    const frame = await frameHandle.contentFrame();
    if (!frame) {
      return {
        found: false,
        url: '',
        content: '',
        html: '',
        title: '',
        links: [],
        images: [],
      };
    }

    // Wait for frame to load
    await frame.waitForSelector('body', { timeout: 10000 }).catch(() => {});

    // Extract content from iframe
    const url = frame.url();
    const content = await frame.evaluate(() => document.body?.textContent || '');
    const html = await frame.evaluate(() => document.body?.innerHTML || '');
    const title = await frame.evaluate(() => document.title);

    // Extract links
    const links = await frame.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => (a as HTMLAnchorElement).href);
    });

    // Extract images
    const images = await frame.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src]')).map(img => (img as HTMLImageElement).src);
    });

    return {
      found: true,
      url,
      content,
      html,
      title,
      links,
      images,
    };
  } catch (error) {
    return {
      found: false,
      url: '',
      content: '',
      html: '',
      title: '',
      links: [],
      images: [],
    };
  }
}

/**
 * Extract from all iframes on page
 */
export async function extractFromAllIFrames(page: Page): Promise<IFrameContent[]> {
  try {
    // Get all iframe selectors
    const iframeSelectors = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      return Array.from(iframes).map((_, index) => `iframe:nth-of-type(${index + 1})`);
    });

    // Extract from each iframe
    const results: IFrameContent[] = [];
    for (const selector of iframeSelectors) {
      const content = await extractFromIFrame(page, selector);
      if (content.found) {
        results.push(content);
      }
    }

    return results;
  } catch (error) {
    return [];
  }
}

/**
 * Modal/Popup Handler - Detect and interact with modals
 */
export interface ModalInfo {
  detected: boolean;
  type: 'modal' | 'popup' | 'overlay' | 'dialog' | 'unknown';
  selector: string;
  content: string;
  closeButtonSelector?: string;
  isVisible: boolean;
}

export async function detectModal(page: Page): Promise<ModalInfo | null> {
  try {
    const modalInfo = await page.evaluate(() => {
      // Common modal patterns
      const patterns = [
        { selector: '[role="dialog"]', type: 'dialog' as const },
        { selector: '.modal', type: 'modal' as const },
        { selector: '#modal', type: 'modal' as const },
        { selector: '[class*="modal"]', type: 'modal' as const },
        { selector: '.popup', type: 'popup' as const },
        { selector: '[class*="popup"]', type: 'popup' as const },
        { selector: '.overlay', type: 'overlay' as const },
        { selector: '[class*="overlay"]', type: 'overlay' as const },
      ];

      for (const pattern of patterns) {
        const element = document.querySelector(pattern.selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible =
            rect.width > 0 &&
            rect.height > 0 &&
            window.getComputedStyle(element).display !== 'none' &&
            window.getComputedStyle(element).visibility !== 'hidden';

          if (isVisible) {
            // Find close button
            const closeSelectors = [
              '.close',
              '[aria-label="Close"]',
              '[class*="close"]',
              'button[class*="close"]',
              '.modal-close',
              'button:has(> svg)',
            ];

            let closeButtonSelector = '';
            for (const closeSelector of closeSelectors) {
              if (element.querySelector(closeSelector)) {
                closeButtonSelector = `${pattern.selector} ${closeSelector}`;
                break;
              }
            }

            return {
              detected: true,
              type: pattern.type,
              selector: pattern.selector,
              content: element.textContent || '',
              closeButtonSelector: closeButtonSelector || undefined,
              isVisible: true,
            };
          }
        }
      }

      return null;
    });

    return modalInfo;
  } catch (error) {
    return null;
  }
}

/**
 * Close modal by clicking close button or pressing escape
 */
export async function closeModal(
  page: Page,
  modalInfo?: ModalInfo
): Promise<{ success: boolean; method: string }> {
  try {
    // If modal info provided, try to click close button
    if (modalInfo?.closeButtonSelector) {
      try {
        await page.click(modalInfo.closeButtonSelector);
        await page.waitForTimeout(500);
        return { success: true, method: 'close_button' };
      } catch {
        // Close button didn't work, try other methods
      }
    }

    // Try pressing Escape key
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Check if modal is still visible
      const stillVisible = modalInfo
        ? await page.evaluate(
            selector => {
              const el = document.querySelector(selector);
              if (!el) return false;
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            },
            modalInfo.selector
          )
        : false;

      if (!stillVisible) {
        return { success: true, method: 'escape_key' };
      }
    } catch {
      // Escape didn't work
    }

    // Try clicking overlay/backdrop
    if (modalInfo?.selector) {
      try {
        const backdrop = await page.$(`${modalInfo.selector} ~ .modal-backdrop, ${modalInfo.selector} ~ [class*="backdrop"]`);
        if (backdrop) {
          await backdrop.click();
          await page.waitForTimeout(500);
          return { success: true, method: 'backdrop_click' };
        }
      } catch {
        // Backdrop click didn't work
      }
    }

    return { success: false, method: 'none' };
  } catch (error) {
    return { success: false, method: 'error' };
  }
}

/**
 * Extract content from modal and then close it
 */
export async function extractAndCloseModal(
  page: Page
): Promise<{ content: ModalInfo | null; closed: boolean; method: string }> {
  const modalInfo = await detectModal(page);

  if (!modalInfo) {
    return {
      content: null,
      closed: false,
      method: 'no_modal_found',
    };
  }

  const closeResult = await closeModal(page, modalInfo);

  return {
    content: modalInfo,
    closed: closeResult.success,
    method: closeResult.method,
  };
}

/**
 * Wait for modal to appear and then handle it
 */
export async function waitForModal(
  page: Page,
  options: { timeout?: number; autoClose?: boolean } = {}
): Promise<{ appeared: boolean; info: ModalInfo | null; closed: boolean }> {
  const { timeout = 10000, autoClose = false } = options;

  try {
    // Wait for modal to appear
    await page.waitForFunction(
      () => {
        const patterns = [
          '[role="dialog"]',
          '.modal',
          '#modal',
          '[class*="modal"]',
          '.popup',
          '[class*="popup"]',
        ];

        for (const pattern of patterns) {
          const element = document.querySelector(pattern);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return true;
            }
          }
        }
        return false;
      },
      { timeout }
    );

    const info = await detectModal(page);

    if (autoClose && info) {
      const closeResult = await closeModal(page, info);
      return {
        appeared: true,
        info,
        closed: closeResult.success,
      };
    }

    return {
      appeared: true,
      info,
      closed: false,
    };
  } catch (error) {
    return {
      appeared: false,
      info: null,
      closed: false,
    };
  }
}

/**
 * Comprehensive content extraction with all advanced features
 */
export interface AdvancedExtractionResult {
  mainContent: string;
  shadowDomContent: ShadowDomContent[];
  iframeContent: IFrameContent[];
  modalContent: ModalInfo | null;
  ajaxStatus: { success: boolean; duration: number };
}

export async function performAdvancedExtraction(
  page: Page,
  options: {
    waitForAjax?: boolean;
    extractShadowDom?: boolean;
    extractIframes?: boolean;
    handleModals?: boolean;
    shadowDomSelectors?: string[];
  } = {}
): Promise<AdvancedExtractionResult> {
  const {
    waitForAjax = true,
    extractShadowDom = true,
    extractIframes = true,
    handleModals = true,
    shadowDomSelectors = [],
  } = options;

  // Wait for AJAX if requested
  const ajaxStatus = waitForAjax
    ? await waitForAjaxContent(page)
    : { success: true, duration: 0, message: 'Skipped' };

  // Handle modals first
  let modalContent: ModalInfo | null = null;
  if (handleModals) {
    const modalResult = await extractAndCloseModal(page);
    modalContent = modalResult.content;
  }

  // Extract from Shadow DOM
  const shadowDomContent: ShadowDomContent[] = [];
  if (extractShadowDom && shadowDomSelectors.length > 0) {
    for (const selector of shadowDomSelectors) {
      const content = await extractFromShadowDom(page, selector);
      if (content.found) {
        shadowDomContent.push(content);
      }
    }
  }

  // Extract from iframes
  const iframeContent = extractIframes ? await extractFromAllIFrames(page) : [];

  // Get main content
  const mainContent = await page.evaluate(() => document.body?.textContent || '');

  return {
    mainContent,
    shadowDomContent,
    iframeContent,
    modalContent,
    ajaxStatus,
  };
}
