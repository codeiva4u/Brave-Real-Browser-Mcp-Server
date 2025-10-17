// Dynamic Content & Session Handling Module
// Shadow DOM, Cookie Manager, Session Persistence, Form Auto Fill
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';

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
export async function handleCookieManager(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('cookie_manager', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const action = args.action || 'get'; // get, set, delete, clear
    
    if (action === 'get') {
      const cookies = await page.cookies();
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Retrieved ${cookies.length} cookies\n\n${JSON.stringify(cookies, null, 2)}`,
        }],
      };
    }
    
    if (action === 'set') {
      const cookie = args.cookie;
      if (!cookie || !cookie.name || !cookie.value) {
        throw new Error('Cookie name and value are required');
      }
      
      await page.setCookie({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || new URL(page.url()).hostname,
        path: cookie.path || '/',
        expires: cookie.expires,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite || 'Lax',
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Cookie set: ${cookie.name} = ${cookie.value}`,
        }],
      };
    }
    
    if (action === 'delete') {
      const cookieName = args.cookieName;
      if (!cookieName) {
        throw new Error('Cookie name is required');
      }
      
      const cookies = await page.cookies();
      const cookieToDelete = cookies.find(c => c.name === cookieName);
      
      if (cookieToDelete) {
        await page.deleteCookie(cookieToDelete);
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Cookie deleted: ${cookieName}`,
          }],
        };
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: `⚠️ Cookie not found: ${cookieName}`,
        }],
      };
    }
    
    if (action === 'clear') {
      const cookies = await page.cookies();
      await Promise.all(cookies.map(cookie => page.deleteCookie(cookie)));
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Cleared all ${cookies.length} cookies`,
        }],
      };
    }

    throw new Error(`Unknown action: ${action}`);
  }, 'Failed to manage cookies');
}

/**
 * Session Persistence - Save and restore browser session
 */
export async function handleSessionPersistence(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('session_persistence', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const action = args.action || 'save'; // save, restore
    
    if (action === 'save') {
      const cookies = await page.cookies();
      const localStorage = await page.evaluate(() => {
        const items: any = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            items[key] = window.localStorage.getItem(key);
          }
        }
        return items;
      });
      
      const sessionStorage = await page.evaluate(() => {
        const items: any = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key) {
            items[key] = window.sessionStorage.getItem(key);
          }
        }
        return items;
      });
      
      const sessionData = {
        url: page.url(),
        cookies,
        localStorage,
        sessionStorage,
        timestamp: new Date().toISOString(),
      };
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Session saved\n\n${JSON.stringify(sessionData, null, 2)}`,
        }],
      };
    }
    
    if (action === 'restore') {
      const sessionData = args.sessionData;
      if (!sessionData) {
        throw new Error('Session data is required for restore');
      }
      
      // Restore cookies
      if (sessionData.cookies) {
        await Promise.all(sessionData.cookies.map((cookie: any) => page.setCookie(cookie)));
      }
      
      // Restore localStorage
      if (sessionData.localStorage) {
        await page.evaluate((items) => {
          for (const [key, value] of Object.entries(items)) {
            window.localStorage.setItem(key, value as string);
          }
        }, sessionData.localStorage);
      }
      
      // Restore sessionStorage
      if (sessionData.sessionStorage) {
        await page.evaluate((items) => {
          for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value as string);
          }
        }, sessionData.sessionStorage);
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Session restored from ${sessionData.timestamp}`,
        }],
      };
    }

    throw new Error(`Unknown action: ${action}`);
  }, 'Failed session persistence');
}

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
  return await withErrorHandling(async () => {
    validateWorkflow('ajax_content_waiter', {
      requireBrowser: true,
      requirePage: true,
    });

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
      const duration = value || 5000;
      let xhrCount = 0;
      
      const requestHandler = (request: any) => {
        if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
          xhrCount++;
        }
      };
      
      page.on('request', requestHandler);
      await page.waitForTimeout(duration);
      page.off('request', requestHandler);
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Waited for AJAX requests (${xhrCount} XHR/Fetch detected)`,
        }],
      };
    }
    
    if (waitFor === 'timeout') {
      const duration = value || 3000;
      await page.waitForTimeout(duration);
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Waited ${duration}ms`,
        }],
      };
    }

    throw new Error(`Unknown waitFor type: ${waitFor}`);
  }, 'Failed AJAX content waiter');
}

/**
 * Modal Popup Handler - Handle modal popups
 */
export async function handleModalPopupHandler(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('modal_popup_handler', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const action = args.action || 'detect'; // detect, close, interact
    
    if (action === 'detect') {
      const modals = await page.evaluate(() => {
        const results: any[] = [];
        const modalSelectors = [
          '.modal',
          '[role="dialog"]',
          '[class*="popup"]',
          '[class*="overlay"]',
          '.dialog',
        ];
        
        modalSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el: any) => {
            const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
            if (isVisible) {
              results.push({
                selector,
                id: el.id || null,
                className: el.className,
                text: el.textContent?.trim().substring(0, 200) || '',
              });
            }
          });
        });
        
        return results;
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Found ${modals.length} visible modals\n\n${JSON.stringify(modals, null, 2)}`,
        }],
      };
    }
    
    if (action === 'close') {
      const closeSelector = args.closeSelector || '.close, [aria-label="Close"], button[class*="close"]';
      
      try {
        await page.click(closeSelector);
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Modal closed`,
          }],
        };
      } catch (e) {
        // Try pressing Escape
        await page.keyboard.press('Escape');
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Pressed Escape key to close modal`,
          }],
        };
      }
    }

    throw new Error(`Unknown action: ${action}`);
  }, 'Failed modal popup handler');
}

/**
 * Login Session Manager - Manage login sessions
 */
export async function handleLoginSessionManager(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('login_session_manager', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const action = args.action || 'check'; // check, login, logout
    
    if (action === 'check') {
      const isLoggedIn = await page.evaluate(() => {
        // Check common indicators of logged-in state
        const indicators = [
          document.querySelector('[class*="logout"]'),
          document.querySelector('[class*="profile"]'),
          document.querySelector('[class*="account"]'),
          document.cookie.includes('session') || document.cookie.includes('token'),
          localStorage.getItem('token') !== null,
        ];
        
        return indicators.some(indicator => Boolean(indicator));
      });
      
      const cookies = await page.cookies();
      const sessionCookies = cookies.filter(c => 
        c.name.toLowerCase().includes('session') || 
        c.name.toLowerCase().includes('token') ||
        c.name.toLowerCase().includes('auth')
      );
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Login Status Check\n\nLikely Logged In: ${isLoggedIn}\nSession Cookies: ${sessionCookies.length}\n\n${JSON.stringify(sessionCookies.map(c => ({ name: c.name, domain: c.domain })), null, 2)}`,
        }],
      };
    }
    
    if (action === 'login') {
      const username = args.username;
      const password = args.password;
      const usernameSelector = args.usernameSelector || 'input[type="email"], input[type="text"], input[name*="user"], input[name*="email"]';
      const passwordSelector = args.passwordSelector || 'input[type="password"]';
      const submitSelector = args.submitSelector || 'button[type="submit"], input[type="submit"]';
      
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      // Fill username
      await page.waitForSelector(usernameSelector, { timeout: 5000 });
      await page.type(usernameSelector, username);
      
      // Fill password
      await page.waitForSelector(passwordSelector, { timeout: 5000 });
      await page.type(passwordSelector, password);
      
      // Submit
      await page.click(submitSelector);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Login attempted\n\nUsername: ${username}\nCurrent URL: ${page.url()}`,
        }],
      };
    }

    throw new Error(`Unknown action: ${action}`);
  }, 'Failed login session manager');
}
