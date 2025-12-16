// Dynamic Content & Session Handling Module - OPTIMIZED
// Shadow DOM, Cookie Manager, Session Persistence, Form Auto Fill
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling, sleep } from '../system-utils.js';
import { TOOL_OPTIMIZATION_CONFIG, retryWithBackoff, globalMetrics, createErrorHandler } from '../optimization-utils.js';

/**
 * Shadow DOM Extractor - Extract content from Shadow DOM
 */
export async function handleShadowDOMExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('shadow_dom_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const selector = args.selector || '*';

    const shadowData = await page.evaluate((selector) => {
      const results: any[] = [];
      const elements = document.querySelectorAll(selector);

      elements.forEach((el: any, idx) => {
        if (el.shadowRoot) {
          const shadowContent = el.shadowRoot.innerHTML;
          const shadowElements = el.shadowRoot.querySelectorAll('*');

          results.push({
            index: idx,
            hostElement: el.tagName,
            hostId: el.id || null,
            hostClass: el.className || null,
            shadowHTML: shadowContent.substring(0, 500),
            shadowElementCount: shadowElements.length,
            shadowElements: Array.from(shadowElements).slice(0, 10).map((child: any) => ({
              tagName: child.tagName,
              text: child.textContent?.trim().substring(0, 100) || '',
            })),
          });
        }
      });

      return results;
    }, selector);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${shadowData.length} Shadow DOM elements\n\n${JSON.stringify(shadowData, null, 2)}`,
      }],
    };
  }, 'Failed to extract Shadow DOM');
}

/**
 * Cookie Manager - Manage cookies
 */


/**
 * Session Persistence - Save and restore browser session
 */


/**
 * Form Auto Fill - Automatically fill form fields
 */
export async function handleFormAutoFill(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('form_auto_fill', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const formData = args.formData || {};
    const submitAfterFill = args.submitAfterFill || false;

    const fillResults = await page.evaluate((data) => {
      const results: any[] = [];

      for (const [selector, value] of Object.entries(data)) {
        const element = document.querySelector(selector) as any;

        if (!element) {
          results.push({ selector, status: 'not_found' });
          continue;
        }

        const tagName = element.tagName.toLowerCase();

        if (tagName === 'input') {
          const inputType = element.type?.toLowerCase() || 'text';

          if (inputType === 'checkbox' || inputType === 'radio') {
            element.checked = Boolean(value);
          } else if (inputType === 'file') {
            results.push({ selector, status: 'file_input_not_supported' });
            continue;
          } else {
            element.value = value;
          }

          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));

          results.push({ selector, status: 'filled', value });
        } else if (tagName === 'select') {
          element.value = value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          results.push({ selector, status: 'selected', value });
        } else if (tagName === 'textarea') {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          results.push({ selector, status: 'filled', value });
        } else {
          results.push({ selector, status: 'unsupported_element', tagName });
        }
      }

      return results;
    }, formData);

    if (submitAfterFill) {
      const submitButton = args.submitButtonSelector || 'button[type="submit"], input[type="submit"]';

      try {
        await page.click(submitButton);
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Form filled and submitted\n\n${JSON.stringify(fillResults, null, 2)}`,
          }],
        };
      } catch (e) {
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Form filled but submit failed\n\n${JSON.stringify(fillResults, null, 2)}\n\nSubmit error: ${e}`,
          }],
        };
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Form filled\n\n${JSON.stringify(fillResults, null, 2)}`,
      }],
    };
  }, 'Failed to auto-fill form');
}

/**
 * AJAX Content Waiter - Wait for dynamic content to load
 */
export async function handleAjaxContentWaiter(args: any) {
  try {
    const validation = validateWorkflow('ajax_content_waiter', {
      requireBrowser: true,
      requirePage: true,
    });

    if (!validation.isValid) {
      return {
        content: [{
          type: 'text' as const,
          text: `⚠️ ${validation.errorMessage || 'Workflow validation failed'}`,
        }],
        isError: true,
      };
    }

    const page = getCurrentPage();
    const waitFor = args.waitFor || 'selector'; // selector, xhr, timeout
    const value = args.value;
    const timeout = args.timeout || 30000;

    if (waitFor === 'selector' && value) {
      try {
        await page.waitForSelector(value, { timeout });
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Element appeared: ${value}`,
          }],
        };
      } catch (e) {
        return {
          content: [{
            type: 'text' as const,
            text: `❌ Timeout waiting for selector: ${value}`,
          }],
        };
      }
    }

    if (waitFor === 'xhr') {
      const duration = parseInt(value) || 5000;
      let xhrCount = 0;

      const requestHandler = (request: any) => {
        if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
          xhrCount++;
        }
      };

      page.on('request', requestHandler);
      await sleep(duration);
      page.off('request', requestHandler);

      if (xhrCount === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `ℹ️ Waited ${duration}ms - No XHR/Fetch requests detected.\n\n💡 Note: Monitoring captures NEW requests made during wait period. Page already loaded before monitoring started.`,
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: `✅ Waited for AJAX requests (${xhrCount} XHR/Fetch detected)`,
        }],
      };
    }

    if (waitFor === 'timeout') {
      const duration = parseInt(value) || 3000;
      await sleep(duration);
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Waited ${duration}ms`,
        }],
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `❌ Unknown waitFor type: ${waitFor}. Valid types: 'selector', 'xhr', 'timeout'`,
      }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [{
        type: 'text' as const,
        text: `❌ AJAX content waiter failed: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

/**
 * Modal Popup Handler - Handle modal popups
 */


/**
 * Login Session Manager - Manage login sessions
 */

