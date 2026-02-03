/**
 * Brave Real Browser MCP Server - Tool Handlers
 * 
 * Implementation of all 28 browser automation tools
 * 
 * Environment Variables:
 *   HEADLESS=true   - Run browser in headless mode
 *   HEADLESS=false  - Run browser in GUI mode (visible)
 */

const path = require('path');
const fs = require('fs');

// Browser state management
let browserInstance = null;
let pageInstance = null;
let blockerInstance = null;
let networkRecords = [];
let isRecordingNetwork = false;
let progressTasks = {};

// Progress notification callback (set by server)
let progressCallback = null;

/**
 * Set progress callback for real-time notifications
 */
function setProgressCallback(callback) {
  progressCallback = callback;
}

/**
 * Send real-time progress notification
 */
function notifyProgress(toolName, status, message, data = {}) {
  const notification = {
    tool: toolName,
    status, // 'started' | 'progress' | 'completed' | 'error'
    message,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // Log to stderr for visibility
  const emoji = {
    started: '🚀',
    progress: '⏳',
    completed: '✅',
    error: '❌'
  }[status] || '📌';
  
  console.error(`${emoji} [${toolName}] ${message}`);
  
  // Call progress callback if set
  if (progressCallback) {
    progressCallback(notification);
  }
  
  return notification;
}

/**
 * Get headless setting from environment
 */
function getHeadlessFromEnv() {
  const envHeadless = process.env.HEADLESS;
  
  if (envHeadless === undefined || envHeadless === null || envHeadless === '') {
    return false; // Default: GUI mode
  }
  
  // Parse string to boolean
  const value = envHeadless.toLowerCase().trim();
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get browser and page instances
 */
function getState() {
  return { browser: browserInstance, page: pageInstance, blocker: blockerInstance };
}

/**
 * Check if browser is initialized
 */
function requireBrowser() {
  if (!browserInstance || !pageInstance) {
    throw new Error('Browser not initialized. Call browser_init first.');
  }
  return { browser: browserInstance, page: pageInstance };
}

/**
 * Tool Handlers Object
 */
const handlers = {
  // 1. Browser Init
  async browser_init(params = {}) {
    notifyProgress('browser_init', 'started', 'Initializing browser...');
    
    const { connect } = require('../../lib/cjs/index.js');
    
    // Get headless from params OR environment variable
    const envHeadless = getHeadlessFromEnv();
    const headless = params.headless !== undefined ? params.headless : envHeadless;
    
    const { proxy = {}, turnstile = false, enableBlocker = true } = params;
    
    notifyProgress('browser_init', 'progress', `Mode: ${headless ? 'Headless' : 'GUI (Visible)'}`, { headless });
    
    const result = await connect({
      headless,
      proxy,
      turnstile,
      enableBlocker,
    });
    
    browserInstance = result.browser;
    pageInstance = result.page;
    blockerInstance = result.blocker;
    
    const pid = browserInstance.process()?.pid;
    
    notifyProgress('browser_init', 'completed', `Browser started (PID: ${pid})`, { 
      headless, 
      pid,
      blockerEnabled: enableBlocker 
    });
    
    return {
      success: true,
      message: `Browser initialized in ${headless ? 'headless' : 'GUI'} mode`,
      pid,
      headless,
      blockerEnabled: enableBlocker
    };
  },

  // 2. Navigate
  async navigate(params) {
    const { page } = requireBrowser();
    const { url, waitUntil = 'networkidle2', timeout = 30000 } = params;
    
    notifyProgress('navigate', 'started', `Navigating to: ${url}`);
    
    await page.goto(url, { waitUntil, timeout });
    
    const title = await page.title();
    
    notifyProgress('navigate', 'completed', `Loaded: ${title}`, { url: page.url(), title });
    
    return {
      success: true,
      url: page.url(),
      title
    };
  },

  // 3. Get Content
  async get_content(params = {}) {
    const { page } = requireBrowser();
    const { format = 'text', selector } = params;
    
    notifyProgress('get_content', 'started', `Extracting ${format} content${selector ? ` from ${selector}` : ''}`);
    
    let content;
    
    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        notifyProgress('get_content', 'error', `Element not found: ${selector}`);
        return { success: false, error: `Element not found: ${selector}` };
      }
      
      if (format === 'html') {
        content = await element.evaluate(el => el.outerHTML);
      } else {
        content = await element.evaluate(el => el.textContent);
      }
    } else {
      if (format === 'html') {
        content = await page.content();
      } else if (format === 'markdown') {
        content = await page.evaluate(() => {
          const body = document.body.innerText;
          return body;
        });
      } else {
        content = await page.evaluate(() => document.body.innerText);
      }
    }
    
    notifyProgress('get_content', 'completed', `Extracted ${content.length} characters`, { format, length: content.length });
    
    return {
      success: true,
      content,
      url: page.url(),
      format
    };
  },

  // 4. Wait
  async wait(params) {
    const { page } = requireBrowser();
    const { type = 'timeout', value, timeout = 30000 } = params;
    
    notifyProgress('wait', 'started', `Waiting for ${type}: ${value}`);
    
    switch (type) {
      case 'selector':
        await page.waitForSelector(value, { timeout });
        break;
      case 'navigation':
        await page.waitForNavigation({ timeout });
        break;
      case 'networkidle':
        await page.waitForNetworkIdle({ timeout });
        break;
      case 'timeout':
      default:
        await new Promise(r => setTimeout(r, parseInt(value) || 1000));
    }
    
    notifyProgress('wait', 'completed', `Wait completed: ${type}`, { type, value });
    
    return { success: true, type, value };
  },

  // 5. Click
  async click(params) {
    const { page } = requireBrowser();
    const { selector, humanLike = true, clickCount = 1, delay = 0 } = params;
    
    notifyProgress('click', 'started', `Clicking: ${selector}`);
    
    if (humanLike) {
      try {
        const { createCursor } = require('ghost-cursor');
        const cursor = createCursor(page);
        await cursor.click(selector);
        notifyProgress('click', 'progress', 'Used human-like cursor movement');
      } catch (e) {
        await page.click(selector, { clickCount, delay });
      }
    } else {
      await page.click(selector, { clickCount, delay });
    }
    
    notifyProgress('click', 'completed', `Clicked: ${selector}`, { selector, humanLike });
    
    return { success: true, selector, clicked: true };
  },

  // 6. Type
  async type(params) {
    const { page } = requireBrowser();
    const { selector, text, delay = 50, clear = false } = params;
    
    notifyProgress('type', 'started', `Typing ${text.length} characters into ${selector}`);
    
    if (clear) {
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      notifyProgress('type', 'progress', 'Cleared existing text');
    }
    
    await page.type(selector, text, { delay });
    
    notifyProgress('type', 'completed', `Typed ${text.length} characters`, { selector, textLength: text.length });
    
    return { success: true, selector, textLength: text.length };
  },

  // 7. Browser Close
  async browser_close(params = {}) {
    const { force = false } = params;
    
    notifyProgress('browser_close', 'started', 'Closing browser...');
    
    if (browserInstance) {
      try {
        await browserInstance.close();
        notifyProgress('browser_close', 'progress', 'Browser closed gracefully');
      } catch (e) {
        if (force) {
          browserInstance.process()?.kill('SIGKILL');
          notifyProgress('browser_close', 'progress', 'Browser force killed');
        }
      }
      browserInstance = null;
      pageInstance = null;
      blockerInstance = null;
    }
    
    notifyProgress('browser_close', 'completed', 'Browser closed');
    
    return { success: true, message: 'Browser closed' };
  },

  // 8. Solve Captcha
  async solve_captcha(params = {}) {
    const { page } = requireBrowser();
    const { type = 'auto', timeout = 30000 } = params;
    
    notifyProgress('solve_captcha', 'started', `Solving ${type} captcha...`);
    
    const start = Date.now();
    let attempts = 0;
    const captchaStatus = {
      turnstile: { detected: false, solved: false },
      recaptcha: { detected: false, solved: false },
      hcaptcha: { detected: false, solved: false }
    };
    
    while (Date.now() - start < timeout) {
      attempts++;
      
      const captchaCheck = await page.evaluate(() => {
        const result = {
          turnstile: { detected: false, token: null },
          recaptcha: { detected: false, token: null },
          hcaptcha: { detected: false, token: null }
        };
        
        // Check for Turnstile widget (not just input)
        const turnstileWidget = document.querySelector('.cf-turnstile, #cf-turnstile, [data-turnstile-sitekey]');
        const turnstileInput = document.querySelector('input[name="cf-turnstile-response"]');
        if (turnstileWidget || turnstileInput) {
          result.turnstile.detected = true;
          result.turnstile.token = turnstileInput?.value || null;
        }
        
        // Check for reCAPTCHA
        const recaptchaWidget = document.querySelector('.g-recaptcha, [data-sitekey], #recaptcha');
        const recaptchaResponse = document.querySelector('#g-recaptcha-response');
        if (recaptchaWidget || recaptchaResponse) {
          result.recaptcha.detected = true;
          result.recaptcha.token = recaptchaResponse?.value || null;
        }
        
        // Check for hCaptcha
        const hcaptchaWidget = document.querySelector('.h-captcha, [data-hcaptcha-sitekey]');
        const hcaptchaResponse = document.querySelector('[name="h-captcha-response"]');
        if (hcaptchaWidget || hcaptchaResponse) {
          result.hcaptcha.detected = true;
          result.hcaptcha.token = hcaptchaResponse?.value || null;
        }
        
        return result;
      });
      
      // Update status
      if (captchaCheck.turnstile.detected) captchaStatus.turnstile.detected = true;
      if (captchaCheck.recaptcha.detected) captchaStatus.recaptcha.detected = true;
      if (captchaCheck.hcaptcha.detected) captchaStatus.hcaptcha.detected = true;
      
      // Check if any captcha is solved
      if (captchaCheck.turnstile.token) {
        captchaStatus.turnstile.solved = true;
        notifyProgress('solve_captcha', 'completed', `Turnstile captcha solved after ${attempts} checks`, { type: 'turnstile', attempts, token: captchaCheck.turnstile.token.substring(0, 20) + '...' });
        return { success: true, type: 'turnstile', solved: true, token: captchaCheck.turnstile.token, status: captchaStatus };
      }
      
      if (captchaCheck.recaptcha.token && captchaCheck.recaptcha.token.length > 0) {
        captchaStatus.recaptcha.solved = true;
        notifyProgress('solve_captcha', 'completed', `reCAPTCHA solved after ${attempts} checks`, { type: 'recaptcha', attempts });
        return { success: true, type: 'recaptcha', solved: true, status: captchaStatus };
      }
      
      if (captchaCheck.hcaptcha.token && captchaCheck.hcaptcha.token.length > 0) {
        captchaStatus.hcaptcha.solved = true;
        notifyProgress('solve_captcha', 'completed', `hCaptcha solved after ${attempts} checks`, { type: 'hcaptcha', attempts });
        return { success: true, type: 'hcaptcha', solved: true, status: captchaStatus };
      }
      
      // Check page title for challenge indicators
      const title = await page.title().catch(() => '');
      if (title.toLowerCase().includes('challenge') || title.toLowerCase().includes('captcha') || title.toLowerCase().includes('verify')) {
        notifyProgress('solve_captcha', 'progress', `Challenge page detected: "${title}"`, { attempts, title });
      }
      
      if (attempts % 10 === 0) {
        notifyProgress('solve_captcha', 'progress', `Still solving... (${attempts} checks)`, { attempts, detected: captchaStatus });
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    notifyProgress('solve_captcha', 'error', 'Captcha solving timeout');
    return { success: false, error: 'Captcha solving timeout', status: captchaStatus, attempts };
  },

  // 9. Random Scroll - ADVANCED VERSION with Resilient Scrolling
  async random_scroll(params = {}) {
    const { page } = requireBrowser();
    const { direction = 'down', amount = 0, smooth = true, elementSelector, humanLike = true } = params;
    
    // Randomize scroll amount if not specified (200-700px for human-like behavior)
    const scrollAmount = amount || Math.floor(Math.random() * 500) + 200;
    const scrollDirection = direction === 'random' 
      ? (Math.random() > 0.5 ? 'down' : 'up') 
      : direction;
    
    notifyProgress('random_scroll', 'started', `Advanced scrolling ${scrollDirection} ${scrollAmount}px${elementSelector ? ` on ${elementSelector}` : ''}`);
    
    const maxRetries = 3;
    let lastError = null;
    let scrolled = false;
    let finalScrollY = 0;
    let finalScrollX = 0;
    let scrollLimitReached = false;
    
    // Pre-check: Wait for network idle before scrolling (prevents context destroyed errors)
    try {
      notifyProgress('random_scroll', 'progress', 'Waiting for network idle...');
      await page.waitForNetworkIdle({ timeout: 3000 }).catch(() => {});
    } catch (e) {}
    
    // Check if page is currently navigating
    const isNavigating = await page.evaluate(() => {
      return document.readyState !== 'complete' || window.__navigationInProgress === true;
    }).catch(() => false);
    
    if (isNavigating) {
      notifyProgress('random_scroll', 'progress', 'Page is navigating, waiting...');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    }
    
    // Helper: exponential backoff delay
    const backoff = (attempt) => new Promise(r => setTimeout(r, Math.min(500 * Math.pow(2, attempt - 1), 3000)));
    
    // Perform scroll with retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        notifyProgress('random_scroll', 'progress', `Scroll attempt ${attempt}/${maxRetries}...`);
        
        // Get current scroll position before scrolling
        const beforeScroll = await page.evaluate(() => ({
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: window.innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth
        }));
        
        // Calculate scroll limits
        const maxScrollY = beforeScroll.scrollHeight - beforeScroll.clientHeight;
        const maxScrollX = beforeScroll.scrollWidth - beforeScroll.clientWidth;
        
        // Check if we've reached scroll limits
        if (scrollDirection === 'down' && beforeScroll.scrollY >= maxScrollY - 50) {
          scrollLimitReached = true;
          notifyProgress('random_scroll', 'progress', 'Bottom of page reached');
          break;
        }
        if (scrollDirection === 'up' && beforeScroll.scrollY <= 0) {
          scrollLimitReached = true;
          notifyProgress('random_scroll', 'progress', 'Top of page reached');
          break;
        }
        
        // Perform scroll with human-like behavior
        if (elementSelector) {
          // Scroll specific element
          await page.evaluate(({ selector, scrollAmount, scrollDirection, smooth, humanLike }) => {
            const element = document.querySelector(selector);
            if (!element) throw new Error(`Element not found: ${selector}`);
            
            if (humanLike) {
              // Human-like scroll with acceleration/deceleration
              const isHorizontal = element.scrollWidth > element.clientWidth;
              const delta = scrollDirection === 'down' || scrollDirection === 'right' ? scrollAmount : -scrollAmount;
              
              // Use smooth scroll with requestAnimationFrame for human-like behavior
              if (smooth && window.requestAnimationFrame) {
                const start = element.scrollTop || element.scrollLeft || 0;
                const target = start + (isHorizontal ? delta : delta);
                const duration = 300 + Math.random() * 200; // 300-500ms
                const startTime = performance.now();
                
                const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
                
                const step = (currentTime) => {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  const easedProgress = easeOutCubic(progress);
                  
                  const current = start + (target - start) * easedProgress;
                  
                  if (isHorizontal) {
                    element.scrollLeft = current;
                  } else {
                    element.scrollTop = current;
                  }
                  
                  if (progress < 1) {
                    requestAnimationFrame(step);
                  }
                };
                
                requestAnimationFrame(step);
              } else {
                // Simple scroll
                if (isHorizontal) {
                  element.scrollLeft += delta;
                } else {
                  element.scrollTop += delta;
                }
              }
            } else {
              // Direct scroll
              const delta = scrollDirection === 'down' || scrollDirection === 'right' ? scrollAmount : -scrollAmount;
              element.scrollTop += delta;
            }
          }, { selector: elementSelector, scrollAmount, scrollDirection, smooth, humanLike });
        } else {
          // Scroll window
          if (humanLike && smooth) {
            // Human-like window scroll with smooth animation
            await page.evaluate(({ scrollAmount, scrollDirection, smooth }) => {
              return new Promise((resolve) => {
                const y = scrollDirection === 'down' ? scrollAmount : -scrollAmount;
                const startY = window.scrollY;
                const targetY = startY + y;
                const duration = 400 + Math.random() * 300; // 400-700ms for human-like timing
                const startTime = performance.now();
                
                // Easing function for human-like acceleration/deceleration
                const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
                
                const step = (currentTime) => {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  const easedProgress = easeOutQuart(progress);
                  
                  const currentY = startY + (targetY - startY) * easedProgress;
                  window.scrollTo(0, currentY);
                  
                  if (progress < 1) {
                    requestAnimationFrame(step);
                  } else {
                    resolve();
                  }
                };
                
                requestAnimationFrame(step);
              });
            }, { scrollAmount, scrollDirection, smooth });
          } else {
            // Simple window scroll
            await page.evaluate(({ scrollAmount, scrollDirection, smooth }) => {
              const y = scrollDirection === 'down' ? scrollAmount : -scrollAmount;
              window.scrollBy({ top: y, behavior: smooth ? 'smooth' : 'auto' });
            }, { scrollAmount, scrollDirection, smooth });
          }
        }
        
        // Wait for scroll to complete and get final position
        await new Promise(r => setTimeout(r, humanLike ? 500 : 200));
        
        const afterScroll = await page.evaluate(() => ({
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          scrollHeight: document.documentElement.scrollHeight
        }));
        
        finalScrollY = afterScroll.scrollY;
        finalScrollX = afterScroll.scrollX;
        
        scrolled = true;
        notifyProgress('random_scroll', 'progress', `Successfully scrolled to Y: ${finalScrollY}`);
        break;
        
      } catch (error) {
        lastError = error;
        
        // Check for "Execution context was destroyed" specifically
        if (error.message?.includes('Execution context was destroyed') || 
            error.message?.includes('context destroyed') ||
            error.message?.includes('Protocol error')) {
          notifyProgress('random_scroll', 'progress', `⚠️ Context destroyed on attempt ${attempt}, applying recovery...`);
          
          // Exponential backoff
          await backoff(attempt);
          
          // Try to re-initialize page reference
          try {
            const { page: refreshedPage } = getState();
            if (refreshedPage && refreshedPage !== page) {
              notifyProgress('random_scroll', 'progress', 'Recovered with refreshed page instance');
              // Note: We can't reassign 'page' in this scope, but we can continue with the existing reference
            }
          } catch (e) {
            // Ignore re-init errors
          }
        } else if (error.message?.includes('navigation')) {
          notifyProgress('random_scroll', 'progress', `Navigation detected, waiting for stability...`);
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
        } else {
          // Non-retryable error
          notifyProgress('random_scroll', 'error', `Non-retryable error: ${error.message}`);
          break;
        }
      }
    }
    
    // Get final scroll metrics
    let scrollMetrics = {};
    try {
      scrollMetrics = await page.evaluate(() => ({
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: window.innerHeight,
        clientWidth: window.innerWidth,
        percentScrolled: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
      }));
    } catch (e) {
      scrollMetrics = { error: e.message };
    }
    
    if (!scrolled && !scrollLimitReached && lastError) {
      notifyProgress('random_scroll', 'error', `Scroll failed after ${maxRetries} attempts: ${lastError.message}`);
      return { 
        success: true, 
        partial: true, 
        direction: scrollDirection, 
        amount: scrollAmount,
        error: lastError.message,
        retries: maxRetries,
        scrollLimitReached,
        ...scrollMetrics
      };
    }
    
    notifyProgress('random_scroll', 'completed', `Scrolled ${scrollDirection} ${scrollAmount}px${scrollLimitReached ? ' (limit reached)' : ''}`, { 
      direction: scrollDirection, 
      amount: scrollAmount,
      finalY: finalScrollY,
      finalX: finalScrollX,
      limitReached: scrollLimitReached,
      retries: maxRetries - 1
    });
    
    return { 
      success: true, 
      direction: scrollDirection, 
      amount: scrollAmount,
      finalY: finalScrollY,
      finalX: finalScrollX,
      limitReached: scrollLimitReached,
      retries: maxRetries - 1,
      ...scrollMetrics
    };
  },

  // 10. Find Element
  async find_element(params = {}) {
    const { page } = requireBrowser();
    const { selector, xpath, text, multiple = false } = params;
    
    notifyProgress('find_element', 'started', `Finding element: ${selector || xpath || text}`);
    
    let elements = [];
    
    if (selector) {
      if (multiple) {
        elements = await page.$$eval(selector, els => els.map(el => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 100),
          classes: el.className,
          id: el.id
        })));
      } else {
        const el = await page.$(selector);
        if (el) {
          elements = [await el.evaluate(el => ({
            tag: el.tagName,
            text: el.textContent?.substring(0, 100),
            classes: el.className,
            id: el.id
          }))];
        }
      }
    } else if (xpath) {
      const handles = await page.$x(xpath);
      elements = await Promise.all(handles.map(h => h.evaluate(el => ({
        tag: el.tagName,
        text: el.textContent?.substring(0, 100)
      }))));
    } else if (text) {
      elements = await page.$$eval('*', (els, text) => 
        els.filter(el => el.textContent?.includes(text))
          .slice(0, 10)
          .map(el => ({ tag: el.tagName, text: el.textContent?.substring(0, 100) })),
        text
      );
    }
    
    notifyProgress('find_element', 'completed', `Found ${elements.length} element(s)`, { found: elements.length });
    
    return { success: true, found: elements.length, elements };
  },

  // 11. Save Content as Markdown
  async save_content_as_markdown(params) {
    const { page } = requireBrowser();
    const { filename, selector, includeImages = true, includeMeta = true } = params;
    
    notifyProgress('save_content_as_markdown', 'started', `Saving to: ${filename}`);
    
    let markdown = '';
    
    if (includeMeta) {
      const title = await page.title();
      const url = page.url();
      markdown += `# ${title}\n\n`;
      markdown += `> Source: ${url}\n\n`;
    }
    
    const content = selector 
      ? await page.$eval(selector, el => el.innerText)
      : await page.evaluate(() => document.body.innerText);
    
    markdown += content;
    
    const outputPath = path.resolve(filename);
    fs.writeFileSync(outputPath, markdown);
    
    notifyProgress('save_content_as_markdown', 'completed', `Saved ${markdown.length} bytes to ${filename}`, { filename: outputPath, size: markdown.length });
    
    return { success: true, filename: outputPath, size: markdown.length };
  },

  // 12. Redirect Tracer
  async redirect_tracer(params) {
    const { page } = requireBrowser();
    const { url, maxRedirects = 10, includeHeaders = false } = params;
    
    notifyProgress('redirect_tracer', 'started', `Tracing redirects for: ${url}`);
    
    const redirects = [];
    
    const responseHandler = response => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirects.push({
          url: response.url(),
          status: response.status(),
          headers: includeHeaders ? response.headers() : undefined
        });
        notifyProgress('redirect_tracer', 'progress', `Redirect ${redirects.length}: ${response.status()}`, { status: response.status() });
      }
    };
    
    page.on('response', responseHandler);
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    page.off('response', responseHandler);
    
    notifyProgress('redirect_tracer', 'completed', `Found ${redirects.length} redirects`, { redirectCount: redirects.length, finalUrl: page.url() });
    
    return {
      success: true,
      originalUrl: url,
      finalUrl: page.url(),
      redirectCount: redirects.length,
      redirects
    };
  },

  // 13. Search Regex
  async search_regex(params) {
    const { page } = requireBrowser();
    const { pattern, flags = 'gi', source = 'html' } = params;
    
    notifyProgress('search_regex', 'started', `Searching pattern: ${pattern}`);
    
    let content;
    if (source === 'html') {
      content = await page.content();
    } else if (source === 'scripts') {
      content = await page.$$eval('script', scripts => scripts.map(s => s.textContent).join('\n'));
    } else {
      content = await page.evaluate(() => document.body.innerText);
    }
    
    const regex = new RegExp(pattern, flags);
    const matches = content.match(regex) || [];
    
    notifyProgress('search_regex', 'completed', `Found ${matches.length} matches`, { matchCount: matches.length });
    
    return { success: true, pattern, matchCount: matches.length, matches: matches.slice(0, 100) };
  },

  // 14. Extract JSON
  async extract_json(params = {}) {
    const { page } = requireBrowser();
    const { source = 'page', selector, jsonPath } = params;
    
    notifyProgress('extract_json', 'started', `Extracting JSON from: ${source}`);
    
    let jsonData = [];
    
    if (source === 'ld+json') {
      jsonData = await page.$$eval('script[type="application/ld+json"]', scripts => 
        scripts.map(s => {
          try { return JSON.parse(s.textContent); } catch { return null; }
        }).filter(Boolean)
      );
    } else if (source === 'scripts') {
      const content = await page.$$eval('script', scripts => scripts.map(s => s.textContent).join('\n'));
      const jsonRegex = /\{[^{}]*\}|\[[^\[\]]*\]/g;
      const matches = content.match(jsonRegex) || [];
      jsonData = matches.slice(0, 20).map(m => {
        try { return JSON.parse(m); } catch { return null; }
      }).filter(Boolean);
    } else if (selector) {
      const text = await page.$eval(selector, el => el.textContent);
      try { jsonData = [JSON.parse(text)]; } catch {}
    }
    
    notifyProgress('extract_json', 'completed', `Extracted ${jsonData.length} JSON objects`, { count: jsonData.length });
    
    return { success: true, source, count: jsonData.length, data: jsonData };
  },

  // 15. Scrape Meta Tags
  async scrape_meta_tags(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'] } = params;
    
    notifyProgress('scrape_meta_tags', 'started', 'Extracting meta tags...');
    
    const meta = await page.evaluate(() => {
      const result = { meta: {}, og: {}, twitter: {} };
      
      document.querySelectorAll('meta').forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (name && content) {
          if (name.startsWith('og:')) {
            result.og[name.replace('og:', '')] = content;
          } else if (name.startsWith('twitter:')) {
            result.twitter[name.replace('twitter:', '')] = content;
          } else {
            result.meta[name] = content;
          }
        }
      });
      
      result.title = document.title;
      result.canonical = document.querySelector('link[rel="canonical"]')?.href;
      
      return result;
    });
    
    const tagCount = Object.keys(meta.meta).length + Object.keys(meta.og).length + Object.keys(meta.twitter).length;
    notifyProgress('scrape_meta_tags', 'completed', `Extracted ${tagCount} meta tags`, { tagCount });
    
    return { success: true, ...meta };
  },

  // 16. Press Key
  async press_key(params) {
    const { page } = requireBrowser();
    const { key, modifiers = [], count = 1 } = params;
    
    notifyProgress('press_key', 'started', `Pressing: ${modifiers.length ? modifiers.join('+') + '+' : ''}${key} x${count}`);
    
    for (let i = 0; i < count; i++) {
      if (modifiers.length > 0) {
        const keyCombo = [...modifiers, key].join('+');
        await page.keyboard.press(keyCombo);
      } else {
        await page.keyboard.press(key);
      }
    }
    
    notifyProgress('press_key', 'completed', `Pressed ${key} ${count} time(s)`, { key, modifiers, count });
    
    return { success: true, key, modifiers, count };
  },

  // 17. Progress Tracker
  async progress_tracker(params = {}) {
    const { action = 'get', taskName, progress } = params;
    
    switch (action) {
      case 'start':
        progressTasks[taskName] = { progress: 0, startTime: Date.now() };
        notifyProgress('progress_tracker', 'started', `Task started: ${taskName}`);
        break;
      case 'update':
        if (progressTasks[taskName]) {
          progressTasks[taskName].progress = progress;
          notifyProgress('progress_tracker', 'progress', `${taskName}: ${progress}%`, { taskName, progress });
        }
        break;
      case 'complete':
        if (progressTasks[taskName]) {
          progressTasks[taskName].progress = 100;
          progressTasks[taskName].endTime = Date.now();
          const duration = progressTasks[taskName].endTime - progressTasks[taskName].startTime;
          notifyProgress('progress_tracker', 'completed', `${taskName} completed in ${duration}ms`, { taskName, duration });
        }
        break;
    }
    
    return { success: true, tasks: progressTasks };
  },

  // 18. Deep Analysis
  async deep_analysis(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], detailed = true } = params;
    
    notifyProgress('deep_analysis', 'started', 'Analyzing page...');
    
    const analysis = await page.evaluate(() => {
      const result = {
        seo: {
          title: document.title,
          titleLength: document.title.length,
          h1Count: document.querySelectorAll('h1').length,
          metaDescription: document.querySelector('meta[name="description"]')?.content,
          canonicalUrl: document.querySelector('link[rel="canonical"]')?.href,
          hasViewport: !!document.querySelector('meta[name="viewport"]')
        },
        performance: {
          domElements: document.querySelectorAll('*').length,
          scripts: document.querySelectorAll('script').length,
          stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
          images: document.querySelectorAll('img').length
        },
        accessibility: {
          imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
          linksCount: document.querySelectorAll('a').length,
          formsCount: document.querySelectorAll('form').length,
          inputsWithoutLabel: document.querySelectorAll('input:not([aria-label]):not([id])').length
        },
        security: {
          isHttps: location.protocol === 'https:',
          hasCSP: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
          externalScripts: [...document.querySelectorAll('script[src]')].filter(s => !s.src.includes(location.hostname)).length
        }
      };
      return result;
    });
    
    notifyProgress('deep_analysis', 'completed', `Analysis complete: ${analysis.performance.domElements} DOM elements`, { domElements: analysis.performance.domElements });
    
    return { success: true, url: page.url(), analysis };
  },

  // 19. Network Recorder
  async network_recorder(params = {}) {
    const { page } = requireBrowser();
    const { action = 'get', filter = {} } = params;
    
    switch (action) {
      case 'start':
        networkRecords = [];
        isRecordingNetwork = true;
        page.on('request', req => {
          if (isRecordingNetwork) {
            networkRecords.push({
              url: req.url(),
              method: req.method(),
              resourceType: req.resourceType(),
              timestamp: Date.now()
            });
          }
        });
        notifyProgress('network_recorder', 'started', 'Network recording started');
        break;
      case 'stop':
        isRecordingNetwork = false;
        notifyProgress('network_recorder', 'completed', `Recording stopped: ${networkRecords.length} requests captured`);
        break;
      case 'clear':
        networkRecords = [];
        notifyProgress('network_recorder', 'completed', 'Network records cleared');
        break;
    }
    
    let records = networkRecords;
    if (filter.resourceType) {
      records = records.filter(r => r.resourceType === filter.resourceType);
    }
    if (filter.urlPattern) {
      const regex = new RegExp(filter.urlPattern);
      records = records.filter(r => regex.test(r.url));
    }
    
    return { success: true, recording: isRecordingNetwork, count: records.length, records: records.slice(-100) };
  },

  // 20. Link Harvester
  async link_harvester(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], selector, includeText = true } = params;
    
    notifyProgress('link_harvester', 'started', 'Harvesting links...');
    
    const currentHost = new URL(page.url()).hostname;
    
    let links = await page.$$eval(selector ? `${selector} a` : 'a', (anchors, includeText) => 
      anchors.map(a => ({
        href: a.href,
        text: includeText ? a.textContent?.trim().substring(0, 100) : undefined,
        rel: a.rel
      })).filter(l => l.href && l.href.startsWith('http')),
      includeText
    );
    
    if (!types.includes('all')) {
      links = links.filter(link => {
        const isInternal = link.href.includes(currentHost);
        const isMedia = /\.(jpg|jpeg|png|gif|mp4|mp3|pdf|zip)/i.test(link.href);
        
        if (types.includes('internal') && isInternal) return true;
        if (types.includes('external') && !isInternal) return true;
        if (types.includes('media') && isMedia) return true;
        return false;
      });
    }
    
    notifyProgress('link_harvester', 'completed', `Found ${links.length} links`, { count: links.length });
    
    return { success: true, count: links.length, links };
  },

  // 21. Cookie Manager
  async cookie_manager(params = {}) {
    const { page } = requireBrowser();
    const { action = 'get', name, value, domain, expires } = params;
    
    notifyProgress('cookie_manager', 'started', `Cookie action: ${action}`);
    
    switch (action) {
      case 'get':
        const cookies = await page.cookies();
        notifyProgress('cookie_manager', 'completed', `Retrieved ${cookies.length} cookies`);
        return { success: true, cookies: name ? cookies.filter(c => c.name === name) : cookies };
      
      case 'set':
        await page.setCookie({ name, value, domain: domain || new URL(page.url()).hostname, expires });
        notifyProgress('cookie_manager', 'completed', `Cookie set: ${name}`);
        return { success: true, message: `Cookie ${name} set` };
      
      case 'delete':
        const toDelete = await page.cookies();
        const filtered = name ? toDelete.filter(c => c.name === name) : toDelete;
        await page.deleteCookie(...filtered);
        notifyProgress('cookie_manager', 'completed', `Deleted ${filtered.length} cookie(s)`);
        return { success: true, message: `Deleted ${filtered.length} cookie(s)` };
      
      case 'clear':
        const allCookies = await page.cookies();
        await page.deleteCookie(...allCookies);
        notifyProgress('cookie_manager', 'completed', `Cleared ${allCookies.length} cookies`);
        return { success: true, message: `Cleared ${allCookies.length} cookies` };
    }
    
    return { success: false, error: 'Invalid action' };
  },

  // 22. File Downloader - ADVANCED VERSION with Multi-Method Strategy
  async file_downloader(params) {
    const { page } = requireBrowser();
    const { 
      url, 
      filename, 
      directory = './downloads',
      headers = {},
      enableProgress = false,
      timeout = 120000,
      retryCount = 3,
      checksumVerify = false
    } = params;
    
    notifyProgress('file_downloader', 'started', `Advanced download: ${url}`);
    
    // Ensure download directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Smart filename detection with multiple strategies
    let outputFilename = filename;
    if (!outputFilename) {
      // Strategy 1: Extract from URL
      try {
        const urlPath = new URL(url).pathname;
        outputFilename = path.basename(urlPath) || 'download';
      } catch (e) {
        outputFilename = 'download';
      }
      
      // Strategy 2: Clean up filename
      outputFilename = outputFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Strategy 3: Add timestamp if no extension
      if (!outputFilename.includes('.')) {
        outputFilename += `_${Date.now()}.bin`;
      }
    }
    
    const outputPath = path.join(directory, outputFilename);
    
    let downloaded = false;
    let buffer = null;
    let methodUsed = '';
    let errorDetails = [];
    let downloadProgress = { loaded: 0, total: 0, percent: 0 };
    
    // Get current page context for headers
    const pageUrl = page.url();
    const defaultHeaders = {
      'Referer': pageUrl,
      'Origin': new URL(pageUrl).origin,
      'User-Agent': await page.evaluate(() => navigator.userAgent)
    };
    
    // Get cookies for authentication
    let cookies = [];
    try {
      cookies = await page.cookies(url);
      notifyProgress('file_downloader', 'progress', `Retrieved ${cookies.length} cookies for authentication`);
    } catch (e) {
      notifyProgress('file_downloader', 'progress', 'No cookies available');
    }
    
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // ═══════════════════════════════════════════════════════════════
    // METHOD 1: CDP Fetch Domain with Interception (Most Reliable)
    // ═══════════════════════════════════════════════════════════════
    if (!downloaded) {
      try {
        notifyProgress('file_downloader', 'progress', 'Method 1/5: CDP Fetch domain with interception...');
        
        const client = await page.target().createCDPSession();
        
        // Enable Fetch domain
        await client.send('Fetch.enable', {
          patterns: [{ urlPattern: '*', requestStage: 'Response' }]
        });
        
        // Enable Network domain for response body
        await client.send('Network.enable');
        
        // Set up request interception
        const requestPromise = new Promise(async (resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('CDP request timeout')), timeout);
          
          client.on('Fetch.requestPaused', async (event) => {
            try {
              // Check if this is our target URL
              if (event.request.url === url || 
                  event.request.url.includes(outputFilename) ||
                  (event.request.url.includes(new URL(url).hostname) && 
                   event.request.url.includes(path.basename(new URL(url).pathname)))) {
                
                clearTimeout(timeoutId);
                
                // Continue the request and get body
                await client.send('Fetch.continueRequest', {
                  requestId: event.requestId
                });
                
                // Wait for response
                const responseBody = await client.send('Fetch.getResponseBody', {
                  requestId: event.requestId
                });
                
                if (responseBody.body) {
                  const bodyBuffer = responseBody.base64Encoded 
                    ? Buffer.from(responseBody.body, 'base64')
                    : Buffer.from(responseBody.body);
                  
                  resolve(bodyBuffer);
                } else {
                  reject(new Error('Empty response body'));
                }
              } else {
                // Continue other requests
                await client.send('Fetch.continueRequest', {
                  requestId: event.requestId
                }).catch(() => {});
              }
            } catch (e) {
              reject(e);
            }
          });
          
          // Trigger the request
          await page.evaluate((downloadUrl) => {
            fetch(downloadUrl, { method: 'HEAD' }).catch(() => {});
          }, url);
        });
        
        buffer = await requestPromise;
        
        if (buffer && buffer.length > 0) {
          downloaded = true;
          methodUsed = 'cdp-fetch';
          notifyProgress('file_downloader', 'progress', `CDP Fetch successful: ${buffer.length} bytes`);
        }
        
        await client.detach().catch(() => {});
        
      } catch (cdpError) {
        errorDetails.push(`CDP Fetch failed: ${cdpError.message}`);
        notifyProgress('file_downloader', 'progress', `CDP Fetch failed: ${cdpError.message}`);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // METHOD 2: page.evaluate with fetch() + Cookie/Headers Support
    // ═══════════════════════════════════════════════════════════════
    if (!downloaded) {
      try {
        notifyProgress('file_downloader', 'progress', 'Method 2/5: Browser fetch with cookies and headers...');
        
        buffer = await page.evaluate(async (downloadUrl, cookieStr, customHeaders, defaultHeaders) => {
          const allHeaders = {
            ...defaultHeaders,
            ...(cookieStr ? { 'Cookie': cookieStr } : {}),
            ...customHeaders
          };
          
          const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: allHeaders,
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          return {
            data: Array.from(new Uint8Array(arrayBuffer)),
            size: blob.size,
            type: blob.type,
            headers: Object.fromEntries(response.headers.entries())
          };
        }, url, cookieHeader, headers, defaultHeaders);
        
        // Convert back to Buffer
        if (buffer && buffer.data) {
          buffer = Buffer.from(buffer.data);
          downloaded = true;
          methodUsed = 'fetch-with-auth';
          notifyProgress('file_downloader', 'progress', `Fetch with auth successful: ${buffer.length} bytes`);
        }
        
      } catch (fetchError) {
        errorDetails.push(`Fetch method failed: ${fetchError.message}`);
        notifyProgress('file_downloader', 'progress', `Fetch with auth failed: ${fetchError.message}`);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // METHOD 3: Direct page.goto() with Response Buffer
    // ═══════════════════════════════════════════════════════════════
    if (!downloaded) {
      try {
        notifyProgress('file_downloader', 'progress', 'Method 3/5: Direct navigation with response buffer...');
        
        // Store current URL to return to it
        const currentUrl = page.url();
        
        // Navigate to download URL
        const response = await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: timeout
        });
        
        if (response) {
          // Get content type and disposition for filename detection
          const contentType = response.headers()['content-type'];
          const contentDisposition = response.headers()['content-disposition'];
          
          // Try to extract filename from Content-Disposition
          if (contentDisposition && !filename) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match) {
              const extractedFilename = match[1].replace(/['"]/g, '');
              if (extractedFilename && extractedFilename !== outputFilename) {
                notifyProgress('file_downloader', 'progress', `Filename from header: ${extractedFilename}`);
                outputFilename = extractedFilename;
              }
            }
          }
          
          buffer = await response.buffer();
          
          if (buffer && buffer.length > 0) {
            downloaded = true;
            methodUsed = 'goto-response';
            notifyProgress('file_downloader', 'progress', `Goto response successful: ${buffer.length} bytes`);
          }
          
          // Navigate back to original page
          await page.goto(currentUrl, { waitUntil: 'networkidle2' }).catch(() => {});
        }
        
      } catch (gotoError) {
        errorDetails.push(`Goto method failed: ${gotoError.message}`);
        notifyProgress('file_downloader', 'progress', `Goto response failed: ${gotoError.message}`);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // METHOD 4: Programmatic Download Link Click
    // ═══════════════════════════════════════════════════════════════
    if (!downloaded) {
      try {
        notifyProgress('file_downloader', 'progress', 'Method 4/5: Programmatic download link...');
        
        // Create a download link and trigger it
        const downloadResult = await page.evaluate((downloadUrl, cookieStr) => {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Download timeout')), 30000);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = '';
            link.style.display = 'none';
            
            // Add to DOM and click
            document.body.appendChild(link);
            
            // Monitor for download start
            const checkDownload = () => {
              // Check if browser initiated download
              if (document.querySelector('a[download]')) {
                clearTimeout(timeout);
                document.body.removeChild(link);
                resolve({ initiated: true });
              }
            };
            
            // Click the link
            link.click();
            
            // Check after short delay
            setTimeout(checkDownload, 100);
          });
        }, url, cookieHeader);
        
        // This method doesn't return buffer, but indicates download was initiated
        if (downloadResult && downloadResult.initiated) {
          notifyProgress('file_downloader', 'progress', 'Download link clicked, file may be downloading to browser default location');
          // Note: This method doesn't give us the buffer, so we continue to next method
        }
        
      } catch (linkError) {
        errorDetails.push(`Download link method failed: ${linkError.message}`);
        notifyProgress('file_downloader', 'progress', `Download link failed: ${linkError.message}`);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // METHOD 5: Network.getResponseBody (Last Resort)
    // ═══════════════════════════════════════════════════════════════
    if (!downloaded) {
      try {
        notifyProgress('file_downloader', 'progress', 'Method 5/5: Network.getResponseBody...');
        
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');
        
        // Make request
        await page.evaluate((u) => fetch(u).then(r => r.blob()), url);
        
        // Wait a bit for network event
        await new Promise(r => setTimeout(r, 2000));
        
        // This method requires capturing the request ID from network events
        // which is complex without prior network recording
        notifyProgress('file_downloader', 'progress', 'Network.getResponseBody requires prior network recording');
        
        await client.detach().catch(() => {});
        
      } catch (networkError) {
        errorDetails.push(`Network.getResponseBody failed: ${networkError.message}`);
        notifyProgress('file_downloader', 'progress', `Network method failed: ${networkError.message}`);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // RETRY LOGIC
    // ═══════════════════════════════════════════════════════════════
    if (!downloaded && retryCount > 0) {
      notifyProgress('file_downloader', 'progress', `Retrying with ${retryCount} attempts remaining...`);
      
      for (let attempt = 1; attempt <= retryCount && !downloaded; attempt++) {
        try {
          notifyProgress('file_downloader', 'progress', `Retry attempt ${attempt}/${retryCount}...`);
          
          // Wait before retry with exponential backoff
          await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
          
          // Try simple fetch again
          buffer = await page.evaluate(async (downloadUrl) => {
            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            return Array.from(new Uint8Array(arrayBuffer));
          }, url);
          
          if (buffer && buffer.length > 0) {
            buffer = Buffer.from(buffer);
            downloaded = true;
            methodUsed = 'retry-fetch';
            notifyProgress('file_downloader', 'progress', `Retry fetch successful: ${buffer.length} bytes`);
            break;
          }
          
        } catch (retryError) {
          notifyProgress('file_downloader', 'progress', `Retry ${attempt} failed: ${retryError.message}`);
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // FINAL VALIDATION & FILE WRITING
    // ═══════════════════════════════════════════════════════════════
    if (!downloaded || !buffer || buffer.length === 0) {
      notifyProgress('file_downloader', 'error', `All download methods failed after ${retryCount + 1} attempts`);
      return { 
        success: false, 
        error: 'All download methods failed', 
        details: errorDetails.slice(-10),
        url,
        filename: outputFilename,
        methodsAttempted: 5
      };
    }
    
    // Write file
    try {
      fs.writeFileSync(outputPath, buffer);
      notifyProgress('file_downloader', 'progress', `File written: ${outputPath} (${buffer.length} bytes)`);
    } catch (writeError) {
      return {
        success: false,
        error: `Failed to write file: ${writeError.message}`,
        url,
        filename: outputFilename
      };
    }
    
    // Optional checksum verification
    let checksum = null;
    if (checksumVerify) {
      try {
        const crypto = require('crypto');
        checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        notifyProgress('file_downloader', 'progress', `SHA256 checksum: ${checksum.substring(0, 16)}...`);
      } catch (e) {
        notifyProgress('file_downloader', 'progress', 'Checksum calculation failed');
      }
    }
    
    notifyProgress('file_downloader', 'completed', `Downloaded: ${outputFilename} (${buffer.length} bytes) via ${methodUsed}`, { 
      filename: outputPath, 
      size: buffer.length,
      method: methodUsed,
      checksum: checksumVerify ? checksum : undefined,
      retriesUsed: retryCount - (retryCount > 0 ? 1 : 0)
    });
    
    return { 
      success: true, 
      filename: outputPath, 
      size: buffer.length, 
      method: methodUsed,
      checksum: checksumVerify ? checksum : undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined
    };
  },

  // 23. iFrame Handler
  async iframe_handler(params = {}) {
    const { page } = requireBrowser();
    const { action = 'list', selector, index } = params;
    
    notifyProgress('iframe_handler', 'started', `iFrame action: ${action}`);
    
    const frames = page.frames();
    
    switch (action) {
      case 'list':
        notifyProgress('iframe_handler', 'completed', `Found ${frames.length} frames`);
        return {
          success: true,
          count: frames.length,
          frames: frames.map((f, i) => ({ index: i, name: f.name(), url: f.url() }))
        };
      
      case 'switch':
        const targetFrame = selector 
          ? await page.$(selector).then(el => el?.contentFrame())
          : frames[index];
        
        if (targetFrame) {
          notifyProgress('iframe_handler', 'completed', `Switched to frame: ${targetFrame.url()}`);
          return { success: true, switched: true, url: targetFrame.url() };
        }
        notifyProgress('iframe_handler', 'error', 'Frame not found');
        return { success: false, error: 'Frame not found' };
      
      case 'content':
        const frame = selector 
          ? await page.$(selector).then(el => el?.contentFrame())
          : frames[index || 0];
        
        if (frame) {
          const content = await frame.content();
          notifyProgress('iframe_handler', 'completed', `Got frame content: ${content.length} chars`);
          return { success: true, content };
        }
        return { success: false, error: 'Frame not found' };
      
      case 'exit':
        notifyProgress('iframe_handler', 'completed', 'Returned to main frame');
        return { success: true, message: 'Returned to main frame' };
    }
    
    return { success: false, error: 'Invalid action' };
  },

  // 24. Stream Extractor - ADVANCED VERSION
  async stream_extractor(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], quality = 'best', enableNetworkCapture = true, scanIframes = true } = params;
    
    notifyProgress('stream_extractor', 'started', 'Extracting streams with advanced detection...');
    
    // Enable network interception BEFORE extracting
    if (enableNetworkCapture && !isRecordingNetwork) {
      notifyProgress('stream_extractor', 'progress', 'Enabling network capture for streams...');
      networkRecords = [];
      isRecordingNetwork = true;
      page.on('request', req => {
        if (isRecordingNetwork) {
          const url = req.url();
          if (url.match(/\.(m3u8|mpd|mp4|webm|ts|m4s|f4m|ism)(\?|$)/i) || 
              url.includes('manifest') || 
              url.includes('playlist') ||
              req.resourceType() === 'media' ||
              req.resourceType() === 'xhr') {
            networkRecords.push({
              url: url,
              method: req.method(),
              resourceType: req.resourceType(),
              timestamp: Date.now(),
              headers: req.headers()
            });
          }
        }
      });
      page.on('response', async res => {
        if (isRecordingNetwork) {
          const url = res.url();
          const contentType = res.headers()['content-type'];
          if (contentType?.includes('mpegurl') || 
              contentType?.includes('dash') || 
              contentType?.includes('mp4') ||
              contentType?.includes('webm') ||
              contentType?.includes('video')) {
            networkRecords.push({
              url: url,
              contentType: contentType,
              resourceType: 'response',
              timestamp: Date.now()
            });
          }
        }
      });
      // Wait a moment for network capture to start
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Get all frames including iframes
    const frames = scanIframes ? page.frames() : [page.mainFrame()];
    notifyProgress('stream_extractor', 'progress', `Checking ${frames.length} frame(s) for streams...`);
    
    const allStreams = { 
      video: [], audio: [], hls: [], dash: [], network: [], windowVars: [], 
      blobUrls: [], mediaSource: [], webrtc: [], serviceWorker: [], 
      shadowDOM: [], playerConfigs: []
    };
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      try {
        const frameStreams = await frame.evaluate((scanDeep) => {
          const result = { 
            video: [], audio: [], hls: [], dash: [], 
            windowVars: [],
            blobUrls: [],
            mediaSource: [],
            webrtc: [],
            shadowDOM: [],
            playerConfigs: {}
          };
          
          // Helper to check if URL is a stream
          const isStreamUrl = (url) => {
            if (!url) return false;
            return url.match(/\.(m3u8|mpd|mp4|webm|og[gv]|ts|m4s|f4m|ism)(\?|$)/i) ||
                   url.includes('manifest') ||
                   url.includes('playlist') ||
                   url.startsWith('blob:') ||
                   url.startsWith('mediasource:');
          };
          
          // Check video elements
          document.querySelectorAll('video').forEach(el => {
            const src = el.src || el.currentSrc || el.getAttribute('src');
            if (src && isStreamUrl(src)) {
              result.video.push({ 
                src, 
                type: el.type || 'video',
                poster: el.poster,
                width: el.videoWidth,
                height: el.videoHeight
              });
            }
            
            // Check source elements within video
            el.querySelectorAll('source').forEach(source => {
              if (source.src && isStreamUrl(source.src)) {
                result.video.push({ 
                  src: source.src, 
                  type: source.type || 'video' 
                });
              }
            });
          });
          
          // Check audio elements
          document.querySelectorAll('audio').forEach(el => {
            const src = el.src || el.currentSrc || el.getAttribute('src');
            if (src) result.audio.push({ src, type: el.type || 'audio' });
          });
          
          // Check for blob URLs in all media elements
          document.querySelectorAll('video, audio').forEach(el => {
            const src = el.src || el.currentSrc;
            if (src && src.startsWith('blob:')) {
              result.blobUrls.push({
                src: src,
                tag: el.tagName,
                paused: el.paused,
                duration: el.duration,
                currentTime: el.currentTime
              });
            }
          });
          
          // Extract blob URLs from MediaSource API
          if (window.MediaSource) {
            try {
              const mediaSources = [];
              // Check for active MediaSource instances
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                if (video.src && video.src.startsWith('blob:')) {
                  result.mediaSource.push({
                    blobUrl: video.src,
                    videoElement: true,
                    duration: video.duration,
                    buffered: Array.from(video.buffered).map((start, end) => ({ start, end }))
                  });
                }
              });
            } catch (e) {}
          }
          
          // Check window variables for common video sources
          const windowVars = [
            'videoSrc', 'streamUrl', 'source', 'videoUrl', 'hlsUrl', 'dashUrl',
            'manifestUrl', 'playlistUrl', 'cdnUrl', 'playbackUrl', 'contentUrl'
          ];
          windowVars.forEach(varName => {
            if (window[varName]) {
              result.windowVars.push({ name: varName, value: window[varName], type: typeof window[varName] });
            }
          });
          
          // Check window.sources array
          if (window.sources && Array.isArray(window.sources)) {
            result.windowVars.push({ name: 'sources', value: window.sources });
          }
          
          // Check various player configuration objects
          const playerConfigKeys = [
            'playerConfig', 'videoPlayerConfig', 'jwplayerConfig', 
            'videojsConfig', 'plyrConfig', 'clapprConfig',
            'flowplayerConfig', 'mediaelementConfig', 'dplayerConfig',
            'artplayerConfig', 'vidstackConfig'
          ];
          playerConfigKeys.forEach(key => {
            if (window[key] && typeof window[key] === 'object') {
              result.playerConfigs[key] = window[key];
              // Extract sources from player configs
              const config = window[key];
              if (config.sources && Array.isArray(config.sources)) {
                config.sources.forEach(s => {
                  if (s.file || s.src || s.url) {
                    result.video.push({ 
                      src: s.file || s.src || s.url, 
                      type: s.type || 'video',
                      label: s.label,
                      from: key
                    });
                  }
                });
              }
              if (config.source || config.url) {
                result.video.push({
                  src: config.source || config.url,
                  from: key
                });
              }
            }
          });
          
          // Check window.Hls (hls.js library)
          if (window.Hls) {
            try {
              const hlsInstances = [];
              // Try to find active HLS instances
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                if (video._hls || video.hls) {
                  const hls = video._hls || video.hls;
                  hlsInstances.push({
                    url: hls.url,
                    levels: hls.levels?.map(l => ({ height: l.height, bitrate: l.bitrate })),
                    currentLevel: hls.currentLevel,
                    autoLevelEnabled: hls.autoLevelEnabled
                  });
                }
              });
              if (hlsInstances.length > 0) {
                result.hls.push(...hlsInstances);
              }
            } catch (e) {}
          }
          
          // Check window.dashjs (dash.js library)
          if (window.dashjs) {
            try {
              const dashPlayers = [];
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                if (video._dash || video.dash) {
                  const dash = video._dash || video.dash;
                  dashPlayers.push({
                    url: dash.url || dash.getSource?.(),
                    isReady: dash.isReady?.()
                  });
                }
              });
              if (dashPlayers.length > 0) {
                result.dash.push(...dashPlayers);
              }
            } catch (e) {}
          }
          
          // Check for WebRTC streams
          if (window.RTCPeerConnection) {
            try {
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                if (video.srcObject && video.srcObject.getTracks) {
                  const tracks = video.srcObject.getTracks();
                  result.webrtc.push({
                    kind: tracks.map(t => t.kind),
                    streamId: video.srcObject.id,
                    active: video.srcObject.active
                  });
                }
              });
            } catch (e) {}
          }
          
          // Check Shadow DOM for video elements
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            if (el.shadowRoot) {
              const shadowVideos = el.shadowRoot.querySelectorAll('video');
              shadowVideos.forEach(video => {
                if (video.src) {
                  result.shadowDOM.push({
                    src: video.src,
                    shadowHost: el.tagName,
                    duration: video.duration
                  });
                }
              });
            }
          });
          
          // Advanced HLS/DASH detection in scripts
          const scripts = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n');
          
          // HLS detection - multiple patterns
          const hlsPatterns = [
            /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi,
            /["']([^"']*\.m3u8[^"]*)["']/gi,
            /hlsUrl\s*[=:]\s*["']([^"']+)["']/gi,
            /source\s*:\s*["']([^"']*\.m3u8[^"]*)["']/gi,
            /url\s*[=:]\s*["']([^"']*\.m3u8[^"]*)["']/gi
          ];
          hlsPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(scripts)) !== null) {
              const src = match[1] || match[0];
              if (src && !result.hls.find(h => h.src === src)) {
                result.hls.push({ src, type: 'hls', detectedBy: 'script-pattern' });
              }
            }
          });
          
          // DASH detection - multiple patterns
          const dashPatterns = [
            /https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/gi,
            /["']([^"']*\.mpd[^"]*)["']/gi,
            /dashUrl\s*[=:]\s*["']([^"']+)["']/gi,
            /manifest\s*[=:]\s*["']([^"']*\.mpd[^"]*)["']/gi
          ];
          dashPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(scripts)) !== null) {
              const src = match[1] || match[0];
              if (src && !result.dash.find(d => d.src === src)) {
                result.dash.push({ src, type: 'dash', detectedBy: 'script-pattern' });
              }
            }
          });
          
          // Check for jwplayer
          if (window.jwplayer) {
            try {
              const players = window.jwplayer.getAllPlayers ? window.jwplayer.getAllPlayers() : [window.jwplayer()];
              players.forEach(player => {
                if (player && player.getPlaylist) {
                  const playlist = player.getPlaylist();
                  if (playlist && playlist[0]) {
                    const sources = playlist[0].sources || [];
                    sources.forEach(s => {
                      if (s.file) result.video.push({ 
                        src: s.file, 
                        type: s.type || 'video',
                        label: s.label,
                        from: 'jwplayer'
                      });
                    });
                  }
                }
              });
            } catch (e) {}
          }
          
          // Check for fetch/XHR intercepted URLs (if available)
          if (window.__streamUrls && Array.isArray(window.__streamUrls)) {
            window.__streamUrls.forEach(url => {
              if (url.includes('.m3u8')) {
                result.hls.push({ src: url, type: 'hls', detectedBy: 'xhr-intercept' });
              } else if (url.includes('.mpd')) {
                result.dash.push({ src: url, type: 'dash', detectedBy: 'xhr-intercept' });
              } else if (url.match(/\.(mp4|webm)/i)) {
                result.video.push({ src: url, type: 'video', detectedBy: 'xhr-intercept' });
              }
            });
          }
          
          return result;
        }, scanIframes);
        
        // Merge results
        allStreams.video.push(...frameStreams.video.map(s => ({ ...s, frameIndex: i })));
        allStreams.audio.push(...frameStreams.audio.map(s => ({ ...s, frameIndex: i })));
        allStreams.hls.push(...frameStreams.hls.map(s => ({ ...s, frameIndex: i })));
        allStreams.dash.push(...frameStreams.dash.map(s => ({ ...s, frameIndex: i })));
        allStreams.windowVars.push(...frameStreams.windowVars.map(v => ({ ...v, frameIndex: i })));
        allStreams.blobUrls.push(...frameStreams.blobUrls.map(b => ({ ...b, frameIndex: i })));
        allStreams.mediaSource.push(...frameStreams.mediaSource.map(m => ({ ...m, frameIndex: i })));
        allStreams.webrtc.push(...frameStreams.webrtc.map(w => ({ ...w, frameIndex: i })));
        allStreams.shadowDOM.push(...frameStreams.shadowDOM.map(s => ({ ...s, frameIndex: i })));
        
        Object.assign(allStreams.playerConfigs, frameStreams.playerConfigs);
        
      } catch (e) {
        notifyProgress('stream_extractor', 'progress', `Frame ${i} evaluation failed: ${e.message}`);
      }
    }
    
    // Check service workers for cached video
    try {
      notifyProgress('stream_extractor', 'progress', 'Checking service workers...');
      const swClients = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          return true;
        }
        return false;
      });
      if (swClients) {
        notifyProgress('stream_extractor', 'progress', 'Service worker detected - may have cached streams');
      }
    } catch (e) {}
    
    // Process network records
    if (networkRecords.length > 0) {
      notifyProgress('stream_extractor', 'progress', `Processing ${networkRecords.length} network records...`);
      networkRecords.forEach(record => {
        const url = record.url;
        if (url?.includes('.m3u8') && !allStreams.hls.find(h => h.src === url)) {
          allStreams.network.push({ 
            src: url, 
            type: 'hls', 
            resourceType: record.resourceType,
            method: record.method,
            contentType: record.contentType
          });
        }
        if (url?.includes('.mpd') && !allStreams.dash.find(d => d.src === url)) {
          allStreams.network.push({ 
            src: url, 
            type: 'dash', 
            resourceType: record.resourceType,
            method: record.method,
            contentType: record.contentType
          });
        }
        if (url?.match(/\.(mp4|webm|ogg|ogv|ts|m4s)(\?|$)/i) && !allStreams.video.find(v => v.src === url)) {
          allStreams.network.push({ 
            src: url, 
            type: 'video', 
            resourceType: record.resourceType,
            method: record.method,
            contentType: record.contentType
          });
        }
      });
    }
    
    // Filter by quality if specified
    if (quality !== 'all' && quality !== 'best') {
      notifyProgress('stream_extractor', 'progress', `Filtering for quality: ${quality}`);
      // Filter logic based on quality parameter
      const qualityMap = { 'low': 480, 'medium': 720, 'high': 1080, 'best': Infinity };
      const maxHeight = qualityMap[quality] || 720;
      
      allStreams.hls = allStreams.hls.filter(s => {
        if (!s.levels) return true;
        return s.levels.some(l => l.height <= maxHeight);
      });
    }
    
    // Deduplicate streams
    const dedupeStreams = (streams) => {
      const seen = new Set();
      return streams.filter(s => {
        if (!s.src) return false;
        const key = s.src.split('?')[0]; // Remove query params for deduplication
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    
    allStreams.video = dedupeStreams(allStreams.video);
    allStreams.hls = dedupeStreams(allStreams.hls);
    allStreams.dash = dedupeStreams(allStreams.dash);
    allStreams.network = dedupeStreams(allStreams.network);
    
    const totalStreams = allStreams.video.length + allStreams.audio.length + allStreams.hls.length + allStreams.dash.length + allStreams.network.length + allStreams.blobUrls.length;
    notifyProgress('stream_extractor', 'completed', `Found ${totalStreams} streams across ${frames.length} frame(s)`, { 
      totalStreams, 
      frameCount: frames.length,
      blobUrls: allStreams.blobUrls.length,
      webrtc: allStreams.webrtc.length,
      shadowDOM: allStreams.shadowDOM.length
    });
    
    // Disable network recording if we enabled it
    if (enableNetworkCapture) {
      isRecordingNetwork = false;
    }
    
    return { 
      success: true, 
      streams: allStreams,
      summary: {
        video: allStreams.video.length,
        audio: allStreams.audio.length,
        hls: allStreams.hls.length,
        dash: allStreams.dash.length,
        network: allStreams.network.length,
        windowVars: allStreams.windowVars.length,
        blobUrls: allStreams.blobUrls.length,
        mediaSource: allStreams.mediaSource.length,
        webrtc: allStreams.webrtc.length,
        shadowDOM: allStreams.shadowDOM.length,
        framesChecked: frames.length
      }
    };
  },

  // 25. JS Scrape - ADVANCED VERSION with Smart Selector Strategies
  async js_scrape(params) {
    const { page } = requireBrowser();
    const { selector, waitForJS = true, timeout = 10000, strategy = 'smart', enableShadowDOM = true } = params;
    
    notifyProgress('js_scrape', 'started', `Advanced scraping: ${selector} (strategy: ${strategy})`);
    
    let content = null;
    let usedSelector = selector;
    let usedStrategy = 'exact';
    let errors = [];
    let attempts = 0;
    const maxAttempts = 5;
    
    // Helper: exponential backoff delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const backoff = (attempt) => delay(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
    
    // Strategy 1: Wait for network idle first (important for JS-heavy pages)
    if (waitForJS) {
      try {
        notifyProgress('js_scrape', 'progress', 'Waiting for network idle...');
        await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
      } catch (e) {}
    }
    
    // Strategy 2: Try exact selector with multiple attempts
    for (attempts = 1; attempts <= maxAttempts; attempts++) {
      try {
        notifyProgress('js_scrape', 'progress', `Attempt ${attempts}/${maxAttempts}: Exact selector match...`);
        
        // Wait for selector with decreasing timeout
        const waitTimeout = Math.max(timeout / maxAttempts * attempts, 2000);
        await page.waitForSelector(selector, { timeout: waitTimeout });
        
        // Scroll element into view
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, selector);
        
        // Extract content
        content = await page.$eval(selector, el => ({
          html: el.outerHTML,
          text: el.innerText,
          tagName: el.tagName,
          attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
        }));
        
        usedStrategy = 'exact';
        notifyProgress('js_scrape', 'progress', `Exact selector match successful`);
        break;
        
      } catch (exactError) {
        errors.push(`Attempt ${attempts} (exact): ${exactError.message}`);
        
        if (attempts < maxAttempts) {
          await backoff(attempts);
        }
      }
    }
    
    // Strategy 3: Try partial text match if exact fails
    if (!content && strategy === 'smart') {
      try {
        notifyProgress('js_scrape', 'progress', 'Trying partial selector match...');
        
        // Try contains selector
        const partialSelectors = [
          `[class*="${selector.replace(/[.#\[\]]/g, '')}"]`,
          `[id*="${selector.replace(/[.#\[\]]/g, '')}"]`,
          `[class*="${selector.replace(/[.#\[\]]/g, '').toLowerCase()}"]`,
          `[class*="${selector.replace(/[.#\[\]]/g, '').replace(/-/g, '')}"]`
        ];
        
        for (const partial of partialSelectors) {
          try {
            const el = await page.$(partial);
            if (el) {
              content = await el.evaluate(el => ({
                html: el.outerHTML,
                text: el.innerText,
                tagName: el.tagName,
                attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
              }));
              usedSelector = partial;
              usedStrategy = 'partial-match';
              notifyProgress('js_scrape', 'progress', `Partial match successful: ${partial}`);
              break;
            }
          } catch (e) {}
        }
      } catch (partialError) {
        errors.push(`Partial match: ${partialError.message}`);
      }
    }
    
    // Strategy 4: Try XPath alternatives
    if (!content && strategy === 'smart') {
      try {
        notifyProgress('js_scrape', 'progress', 'Trying XPath alternatives...');
        
        // Convert CSS selector to XPath variations
        const xpathVariations = [
          `//*[contains(@class, "${selector.replace(/[.#\[\]]/g, '')}")]`,
          `//*[contains(@id, "${selector.replace(/[.#\[\]]/g, '')}")]`,
          `//*[@*="${selector}"]`,
          `//*[text()[contains(., "${selector}")]]`,
          `//${selector.replace(/[.#]/g, '')}`
        ];
        
        for (const xpath of xpathVariations) {
          try {
            const elements = await page.$x(xpath);
            if (elements.length > 0) {
              content = await elements[0].evaluate(el => ({
                html: el.outerHTML,
                text: el.innerText,
                tagName: el.tagName,
                attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
              }));
              usedSelector = xpath;
              usedStrategy = 'xpath';
              notifyProgress('js_scrape', 'progress', `XPath match successful`);
              break;
            }
          } catch (e) {}
        }
      } catch (xpathError) {
        errors.push(`XPath: ${xpathError.message}`);
      }
    }
    
    // Strategy 5: Try text-based finding
    if (!content && strategy === 'smart') {
      try {
        notifyProgress('js_scrape', 'progress', 'Trying text-based finding...');
        
        const textSelectors = await page.evaluate((sel) => {
          const elements = [];
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent?.toLowerCase() || '';
            const className = node.className?.toLowerCase() || '';
            const id = node.id?.toLowerCase() || '';
            
            if (text.includes(sel.toLowerCase()) || 
                className.includes(sel.toLowerCase()) ||
                id.includes(sel.toLowerCase())) {
              elements.push({
                tag: node.tagName,
                class: node.className,
                id: node.id,
                text: node.textContent?.substring(0, 100)
              });
            }
          }
          return elements.slice(0, 5);
        }, selector.replace(/[.#\[\]]/g, ''));
        
        if (textSelectors.length > 0) {
          // Try to find and extract the best match
          const bestMatch = textSelectors[0];
          const targetSelector = bestMatch.id ? `#${bestMatch.id}` : 
                                bestMatch.class ? `.${bestMatch.class.split(' ')[0]}` : 
                                bestMatch.tag.toLowerCase();
          
          try {
            const el = await page.$(targetSelector);
            if (el) {
              content = await el.evaluate(el => ({
                html: el.outerHTML,
                text: el.innerText,
                tagName: el.tagName,
                attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
              }));
              usedSelector = targetSelector;
              usedStrategy = 'text-based';
              notifyProgress('js_scrape', 'progress', `Text-based match successful: ${targetSelector}`);
            }
          } catch (e) {}
        }
      } catch (textError) {
        errors.push(`Text-based: ${textError.message}`);
      }
    }
    
    // Strategy 6: Try accessibility attributes
    if (!content && strategy === 'smart') {
      try {
        notifyProgress('js_scrape', 'progress', 'Trying accessibility attributes...');
        
        const a11ySelectors = [
          `[aria-label*="${selector}"]`,
          `[aria-labelledby*="${selector}"]`,
          `[role="${selector}"]`,
          `[title*="${selector}"]`,
          `[data-testid*="${selector}"]`,
          `[data-test*="${selector}"]`
        ];
        
        for (const a11ySel of a11ySelectors) {
          try {
            const el = await page.$(a11ySel);
            if (el) {
              content = await el.evaluate(el => ({
                html: el.outerHTML,
                text: el.innerText,
                tagName: el.tagName,
                attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
              }));
              usedSelector = a11ySel;
              usedStrategy = 'accessibility';
              notifyProgress('js_scrape', 'progress', `Accessibility match successful: ${a11ySel}`);
              break;
            }
          } catch (e) {}
        }
      } catch (a11yError) {
        errors.push(`Accessibility: ${a11yError.message}`);
      }
    }
    
    // Strategy 7: Try Shadow DOM piercing
    if (!content && enableShadowDOM) {
      try {
        notifyProgress('js_scrape', 'progress', 'Piercing Shadow DOM...');
        
        const shadowContent = await page.evaluate((sel) => {
          // Deep search in all shadow roots
          const deepQuery = (root) => {
            const results = [];
            
            // Try direct match
            const direct = root.querySelector(sel);
            if (direct) {
              results.push({
                html: direct.outerHTML,
                text: direct.innerText,
                tagName: direct.tagName,
                attributes: Object.fromEntries([...direct.attributes].map(a => [a.name, a.value])),
                inShadowDOM: true
              });
            }
            
            // Search in shadow roots of children
            const allElements = root.querySelectorAll('*');
            for (const el of allElements) {
              if (el.shadowRoot) {
                const shadowResults = deepQuery(el.shadowRoot);
                results.push(...shadowResults);
              }
            }
            
            return results;
          };
          
          return deepQuery(document);
        }, selector);
        
        if (shadowContent.length > 0) {
          content = shadowContent[0];
          usedStrategy = 'shadow-dom';
          notifyProgress('js_scrape', 'progress', `Shadow DOM match successful`);
        }
      } catch (shadowError) {
        errors.push(`Shadow DOM: ${shadowError.message}`);
      }
    }
    
    // Strategy 8: Fallback to common selectors
    if (!content) {
      try {
        notifyProgress('js_scrape', 'progress', 'Trying fallback selectors...');
        
        const fallbackSelectors = [
          selector,
          `[class*="${selector.replace(/[.#\[\]]/g, '')}"]`,
          '[class*="player"]', '[class*="video"]', '[class*="content"]',
          '#player', '.player', 'video', 'iframe',
          '[data-player]', '[data-video]', '[data-stream]'
        ];
        
        for (const fallback of fallbackSelectors) {
          if (!fallback) continue;
          
          try {
            const el = await page.$(fallback);
            if (el) {
              content = await el.evaluate(el => ({
                html: el.outerHTML,
                text: el.innerText,
                tagName: el.tagName,
                attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
              }));
              usedSelector = fallback;
              usedStrategy = 'fallback';
              notifyProgress('js_scrape', 'progress', `Fallback selector successful: ${fallback}`);
              break;
            }
          } catch (e) {}
        }
      } catch (fallbackError) {
        errors.push(`Fallback: ${fallbackError.message}`);
      }
    }
    
    // Final result
    if (!content) {
      notifyProgress('js_scrape', 'error', `All strategies failed for: ${selector}`);
      return { 
        success: true,
        partial: true,
        selector: usedSelector,
        requestedSelector: selector,
        strategy: usedStrategy,
        content: null,
        errors: errors.slice(-10), // Last 10 errors
        message: 'No content found with any strategy',
        attempts: attempts
      };
    }
    
    notifyProgress('js_scrape', 'completed', `Scraped ${content.text?.length || content.html?.length || 0} characters via ${usedStrategy}`, { 
      selector: usedSelector,
      requestedSelector: selector,
      strategy: usedStrategy,
      attempts
    });
    
    return { 
      success: true, 
      selector: usedSelector,
      requestedSelector: selector,
      strategy: usedStrategy,
      content,
      attempts,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  // 26. Execute JS
  async execute_js(params) {
    const { page } = requireBrowser();
    const { code, returnValue = true } = params;
    
    notifyProgress('execute_js', 'started', 'Executing JavaScript...');
    
    const result = await page.evaluate(code);
    
    notifyProgress('execute_js', 'completed', 'JavaScript executed', { hasResult: result !== undefined });
    
    return { success: true, result: returnValue ? result : undefined };
  },

  // 27. Player API Hook - ADVANCED VERSION with 40+ Player Support
  async player_api_hook(params = {}) {
    const { page } = requireBrowser();
    const { playerType = 'auto', action = 'info', seekTime, iframeMode = true } = params;
    
    notifyProgress('player_api_hook', 'started', `Player ${action}: ${playerType} (Advanced Detection)`);
    
    // Get all frames including iframes
    const frames = iframeMode ? page.frames() : [page.mainFrame()];
    notifyProgress('player_api_hook', 'progress', `Checking ${frames.length} frame(s) for ${playerType === 'auto' ? 'all players' : playerType}...`);
    
    let playerInfo = null;
    let frameIndex = -1;
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      try {
        const frameInfo = await frame.evaluate(({ playerType, action, seekTime }) => {
          const result = {
            detected: false,
            type: null,
            detectedPlayers: [],
            allPlayers: [],
            frameInfo: {
              // Standard Players (6)
              hasJwplayer: !!window.jwplayer,
              hasVideojs: !!window.videojs,
              hasPlyr: !!(window.Plyr || window.plyr),
              hasClappr: !!(window.Clappr || window.clappr),
              hasFlowplayer: !!window.flowplayer,
              hasMediaelement: !!(window.MediaElementPlayer || window.mediaelement),
              
              // Asian Players (8)
              hasDplayer: !!(window.DPlayer || window.dplayer),
              hasCkplayer: !!window.ckplayer,
              hasArtplayer: !!(window.Artplayer || window.artplayer),
              hasVidstack: !!(window.VidstackPlayer || window.vidstack),
              hasPlyrV2: !!window.plyr,
              hasH5player: !!window.h5player,
              hasChplayer: !!window.chplayer,
              hasTcplayer: !!window.tcplayer,
              
              // Library Players (6)
              hasHls: !!window.Hls,
              hasHlsjs: !!window.hls,
              hasDashjs: !!(window.dashjs || window.Dash),
              hasShakaPlayer: !!window.shaka,
              hasVideojsVhs: !!(window.videojs && window.videojs.Vhs),
              hasP2pMediaLoader: !!window.p2pml,
              
              // Commercial Players (10)
              hasKalturaPlayer: !!window.kalturaPlayer,
              hasBcPlayer: !!window.bcPlayer,
              hasBrightcove: !!(window.videojs?.getPlayers && Object.keys(window.videojs.getPlayers()).some(k => k.includes('bc'))),
              hasWistiaPlayer: !!(window.wistia || window.Wistia),
              hasCloudinaryPlayer: !!(window.cloudinaryPlayer || window.cloudinary),
              hasBlueConicPlayer: !!window.blueConicPlayer,
              hasVdocipher: !!window.vdocipher,
              hasFrontlayer: !!window.frontlayer,
              hasCincopa: !!window.cincopa,
              hasSproutVideo: !!window.sproutVideo,
              hasVimeoPlayer: !!(window.Vimeo && window.Vimeo.Player),
              hasYoutubePlayer: !!window.YT,
              
              // WordPress/Custom Players (8)
              hasDooplay: !!window.dooplay,
              hasPsyplay: !!window.psyplay,
              hasVidsrc: !!window.vidsrc,
              hasVidsrcPro: !!window.vidsrcPro,
              hasVidsrcTo: !!window.vidsrcto,
              has2embed: !!window._2embed,
              hasSuperembed: !!window.superembed,
              hasAutoembed: !!window.autoembed,
              hasGoDrivePlayer: !!window.goDrivePlayer,
              hasGDrivePlayer: !!window.gdriveplayer,
              hasFembed: !!window.fembed,
              
              // Generic Players (8)
              hasPlayer: !!window.player,
              hasVideoPlayer: !!window.videoPlayer,
              hasMediaPlayer: !!window.mediaPlayer,
              hasPlayerInstance: !!window.playerInstance,
              hasVideo: !!window.video,
              hasEmbedPlayer: !!window['embed player'],
              hasIframePlayer: !!window.iframePlayer,
              hasCustomPlayer: !!window.customPlayer,
              hasVidPlayer: !!window.vidPlayer,
              
              // Video Elements
              videoElements: 0,
              audioElements: 0,
              
              // CSS Detection
              cssDetected: [],
              cssSelectorsMatched: []
            }
          };
          
          // ADVANCED: Helper to extract sources from ALL player types (40+ supported)
          const extractSources = (player, type, config = null) => {
            const sources = [];
            
            try {
              // ========== STANDARD PLAYERS ==========
              if (type === 'jwplayer') {
                const playlist = player.getPlaylist?.() || [];
                playlist.forEach(item => {
                  if (item.sources) {
                    item.sources.forEach(src => {
                      if (src.file) {
                        sources.push({ 
                          src: src.file, 
                          type: src.type, 
                          label: src.label,
                          height: src.height,
                          width: src.width,
                          bitrate: src.bitrate
                        });
                      }
                    });
                  } else if (item.file) {
                    sources.push({ src: item.file, type: item.type });
                  }
                });
              } else if (type === 'videojs') {
                // Try multiple methods for videojs
                const tech = player.tech?.();
                if (tech) {
                  const source = tech.currentSource_ || player.currentSource?.() || player.currentSrc?.();
                  if (source && source.src) {
                    sources.push({
                      src: source.src,
                      type: source.type,
                      label: source.label
                    });
                  }
                }
                // Try src() method
                try {
                  const src = player.src?.();
                  if (src && !sources.find(s => s.src === src)) {
                    sources.push({ src, type: player.currentType?.() });
                  }
                } catch (e) {}
                // Try currentSource
                if (player.currentSource) {
                  const cs = player.currentSource();
                  if (cs && !sources.find(s => s.src === cs.src)) {
                    sources.push(cs);
                  }
                }
              } else if (type === 'plyr') {
                const media = player.media || player.elements?.media || player.elements?.original;
                if (media) {
                  if (media.src) sources.push({ src: media.src });
                  if (media.querySelector) {
                    const sourceElements = media.querySelectorAll('source');
                    sourceElements.forEach(s => sources.push({ src: s.src, type: s.type, label: s.getAttribute('label') }));
                  }
                }
                // Try config
                if (player.config?.sources) {
                  player.config.sources.forEach(s => sources.push({ src: s.src || s, type: s.type }));
                }
              } else if (type === 'clappr') {
                const opts = player.options || player._options || {};
                if (opts.source) sources.push({ src: opts.source });
                if (opts.sources) {
                  opts.sources.forEach(s => {
                    sources.push(typeof s === 'string' ? { src: s } : { src: s.source || s.src, type: s.mimeType || s.type });
                  });
                }
                // Try actual media
                const container = player.el?.querySelector?.('video, source');
                if (container?.src) {
                  sources.push({ src: container.src, from: 'clappr-element' });
                }
              } else if (type === 'flowplayer') {
                const video = player.video || player.currentVideo;
                if (video) {
                  if (video.src) sources.push({ src: video.src });
                  if (video.sources) video.sources.forEach(s => sources.push(s));
                  if (video.url) sources.push({ src: video.url });
                }
                // Try conf
                if (player.conf?.clip?.sources) {
                  player.conf.clip.sources.forEach(s => sources.push({ src: s.src || s, type: s.type }));
                }
              } else if (type === 'mediaelement') {
                const media = player.media || player.node || player.$media?.[0];
                if (media) {
                  if (media.src) sources.push({ src: media.src });
                  if (media.currentSrc && media.currentSrc !== media.src) {
                    sources.push({ src: media.currentSrc, type: 'current' });
                  }
                }
              }
              
              // ========== ASIAN PLAYERS ==========
              else if (type === 'dplayer') {
                const video = player.video;
                if (video && video.src) sources.push({ src: video.src });
                if (player.options) {
                  if (player.options.video?.url) {
                    sources.push({ src: player.options.video.url, type: player.options.video.type, pic: player.options.video.pic });
                  }
                  if (player.options.url) sources.push({ src: player.options.url });
                }
                if (player._video?.src) sources.push({ src: player._video.src, from: '_video' });
              } else if (type === 'artplayer') {
                if (player.options) {
                  if (player.options.url) sources.push({ src: player.options.url, type: player.options.type });
                  if (player.options.video) sources.push({ src: player.options.video });
                }
                if (player.url) sources.push({ src: player.url });
                const video = player.video || player.template?.$video;
                if (video?.src) sources.push({ src: video.src, from: 'element' });
              } else if (type === 'vidstack') {
                const media = player.media || player.elements?.media;
                if (media && media.src) sources.push({ src: media.src });
                if (player.src) sources.push({ src: player.src });
                if (player.state?.source) sources.push(player.state.source);
              } else if (type === 'ckplayer') {
                if (player.getVideo) {
                  const videoSrc = player.getVideo();
                  if (videoSrc) sources.push({ src: videoSrc });
                }
                if (player.config?.video) sources.push({ src: player.config.video });
              }
              
              // ========== LIBRARY PLAYERS ==========
              else if (type === 'hls' || type === 'hls.js') {
                if (player.url) sources.push({ src: player.url, type: 'application/x-mpegURL' });
                if (player._url) sources.push({ src: player._url, type: 'application/x-mpegURL', from: '_url' });
                // Check attached media element
                if (player.media?.src) {
                  sources.push({ src: player.media.src, from: 'media' });
                }
              } else if (type === 'dashjs') {
                const dashPlayer = player.getPlayer ? player.getPlayer() : player;
                if (dashPlayer.getSource) sources.push({ src: dashPlayer.getSource(), type: 'application/dash+xml' });
                if (dashPlayer.getCurrentPlayingAdaptation) {
                  const adapt = dashPlayer.getCurrentPlayingAdaptation();
                  if (adapt?.Representation_asArray?.[0]?.BaseURL) {
                    sources.push({ src: adapt.Representation_asArray[0].BaseURL, from: 'adaptation' });
                  }
                }
              } else if (type === 'shaka-player') {
                if (player.getManifest) {
                  const manifest = player.getManifest();
                  if (manifest) {
                    sources.push({ src: manifest.presentationTimeline?.duration_, type: 'dash/shaka' });
                  }
                }
                if (player.getAssetUri) sources.push({ src: player.getAssetUri() });
              }
              
              // ========== COMMERCIAL PLAYERS ==========
              else if (type === 'kaltura') {
                if (player.src) sources.push({ src: player.src() });
                if (player.getSrc) sources.push({ src: player.getSrc() });
                if (player.config?.sources) {
                  player.config.sources.forEach(s => sources.push({ src: s.src || s.url, type: s.mimeType }));
                }
              } else if (type === 'brightcove') {
                if (player.mediainfo) {
                  const info = player.mediainfo;
                  if (info.sources) {
                    info.sources.forEach(s => sources.push({ src: s.src, type: s.type, height: s.height }));
                  }
                  if (info.src) sources.push({ src: info.src });
                }
                if (player.currentSrc) sources.push({ src: player.currentSrc() });
              } else if (type === 'wistia') {
                if (player.data?.media) {
                  const media = player.data.media;
                  if (media.assets) {
                    media.assets.forEach(a => sources.push({ src: a.url, type: a.contentType, width: a.width }));
                  }
                }
              } else if (type === 'vdocipher') {
                if (player.getCurrentTime) {
                  // Vdocipher typically uses video element
                  const video = document.querySelector('video');
                  if (video?.src) sources.push({ src: video.src, provider: 'vdocipher' });
                }
              } else if (type === 'vimeo') {
                if (player.getVideoId) {
                  const id = player.getVideoId();
                  sources.push({ src: `https://player.vimeo.com/video/${id}`, provider: 'vimeo', id });
                }
              } else if (type === 'youtube') {
                if (player.getVideoData) {
                  const data = player.getVideoData();
                  sources.push({ 
                    src: `https://www.youtube.com/watch?v=${data.video_id}`, 
                    provider: 'youtube', 
                    id: data.video_id,
                    title: data.title
                  });
                }
              }
              
              // ========== WORDPRESS/CUSTOM PLAYERS ==========
              else if (type === 'vidsrc' || type === 'vidsrc-pro' || type === 'vidsrcto') {
                // Vidsrc players usually embed iframe with video
                const video = document.querySelector('video');
                if (video?.src) sources.push({ src: video.src, provider: type });
                // Check for video inside iframe
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                  try {
                    const iframeVideo = iframe.contentDocument?.querySelector('video');
                    if (iframeVideo?.src) sources.push({ src: iframeVideo.src, provider: type, from: 'iframe' });
                  } catch (e) {}
                });
              } else if (type === 'dooplay' || type === 'psyplay') {
                const video = document.querySelector('video, #player video, .player video');
                if (video?.src) sources.push({ src: video.src, provider: type });
                // Check config
                if (config?.embedUrl) sources.push({ src: config.embedUrl, provider: type });
              } else if (type === 'fembed') {
                if (player.get) {
                  const src = player.get('video_url');
                  if (src) sources.push({ src, provider: 'fembed' });
                }
              }
              
              // ========== GENERIC/HTML5 ==========
              else if (type === 'html5' || type === 'window.player' || type === 'window.videoPlayer') {
                // For generic players, use the player as video element or find video
                const video = player.tagName === 'VIDEO' ? player : 
                             (player.media || player.video || document.querySelector('video'));
                if (video) {
                  if (video.src) sources.push({ src: video.src });
                  if (video.currentSrc && video.currentSrc !== video.src) {
                    sources.push({ src: video.currentSrc, type: 'currentSrc' });
                  }
                  // Check source children
                  if (video.querySelectorAll) {
                    video.querySelectorAll('source').forEach(s => {
                      sources.push({ src: s.src, type: s.type });
                    });
                  }
                }
              }
            } catch (e) {
              // Log error for debugging
              sources.push({ error: e.message, type });
            }
            
            // Remove duplicates
            const unique = [];
            const seen = new Set();
            sources.forEach(s => {
              if (s.src && !seen.has(s.src)) {
                seen.add(s.src);
                unique.push(s);
              }
            });
            
            return unique;
          };
          
          // ADVANCED: Helper to perform player actions for ALL 40+ player types
          const performAction = (player, type, action, time) => {
            try {
              // Get the actual video element for fallback
              const videoElement = player.tagName === 'VIDEO' ? player : 
                                   (player.media || player.video || player.elements?.media || player.elements?.original || 
                                    document.querySelector('video'));
              
              if (action === 'play') {
                // Standard Players
                if (type === 'jwplayer') player.play?.();
                else if (type === 'videojs') player.play?.();
                else if (type === 'plyr') player.play?.();
                else if (type === 'clappr') player.play?.();
                else if (type === 'flowplayer') player.play?.();
                else if (type === 'mediaelement') player.play?.();
                
                // Asian Players
                else if (type === 'dplayer') player.play?.();
                else if (type === 'artplayer') player.play?.();
                else if (type === 'vidstack') player.play?.();
                else if (type === 'ckplayer') player.play?.();
                else if (type === 'chplayer') player.play?.();
                else if (type === 'tcplayer') player.play?.();
                else if (type === 'h5player') player.play?.();
                
                // Library Players
                else if (type === 'hls.js') player.media?.play?.();
                else if (type === 'dashjs') player.play?.();
                else if (type === 'shaka-player') player.play?.();
                
                // Commercial Players
                else if (type === 'kaltura') player.play?.();
                else if (type === 'brightcove') player.play?.();
                else if (type === 'wistia') player.play?.();
                else if (type === 'vdocipher') player.play?.();
                else if (type === 'vimeo') player.play?.();
                else if (type === 'youtube') player.playVideo?.();
                
                // WordPress/Custom Players
                else if (type === 'vidsrc') player.play?.();
                else if (type === 'vidsrc-pro') player.play?.();
                else if (type === 'vidsrcto') player.play?.();
                else if (type === 'dooplay') player.play?.();
                else if (type === 'psyplay') player.play?.();
                else if (type === 'fembed') player.play?.();
                
                // Generic / HTML5
                else if (type === 'html5' || type === 'window.player' || type === 'window.videoPlayer' || type === 'window.playerInstance') {
                  if (videoElement && videoElement.play) videoElement.play();
                }
                else if (videoElement && videoElement.play) videoElement.play();
                
                return { executed: true, method: 'play' };
              }
              
              if (action === 'pause') {
                // Standard Players
                if (type === 'jwplayer') player.pause?.();
                else if (type === 'videojs') player.pause?.();
                else if (type === 'plyr') player.pause?.();
                else if (type === 'clappr') player.pause?.();
                else if (type === 'flowplayer') player.pause?.();
                else if (type === 'mediaelement') player.pause?.();
                
                // Asian Players
                else if (type === 'dplayer') player.pause?.();
                else if (type === 'artplayer') player.pause?.();
                else if (type === 'vidstack') player.pause?.();
                else if (type === 'ckplayer') player.pause?.();
                else if (type === 'chplayer') player.pause?.();
                else if (type === 'tcplayer') player.pause?.();
                else if (type === 'h5player') player.pause?.();
                
                // Library Players
                else if (type === 'hls.js') player.media?.pause?.();
                else if (type === 'dashjs') player.pause?.();
                else if (type === 'shaka-player') player.pause?.();
                
                // Commercial Players
                else if (type === 'kaltura') player.pause?.();
                else if (type === 'brightcove') player.pause?.();
                else if (type === 'wistia') player.pause?.();
                else if (type === 'vdocipher') player.pause?.();
                else if (type === 'vimeo') player.pause?.();
                else if (type === 'youtube') player.pauseVideo?.();
                
                // WordPress/Custom Players
                else if (type === 'vidsrc') player.pause?.();
                else if (type === 'vidsrc-pro') player.pause?.();
                else if (type === 'vidsrcto') player.pause?.();
                else if (type === 'dooplay') player.pause?.();
                else if (type === 'psyplay') player.pause?.();
                else if (type === 'fembed') player.pause?.();
                
                // Generic / HTML5
                else if (type === 'html5' || type === 'window.player' || type === 'window.videoPlayer' || type === 'window.playerInstance') {
                  if (videoElement && videoElement.pause) videoElement.pause();
                }
                else if (videoElement && videoElement.pause) videoElement.pause();
                
                return { executed: true, method: 'pause' };
              }
              
              if (action === 'seek' && time !== undefined) {
                // Standard Players
                if (type === 'jwplayer') player.seek?.(time);
                else if (type === 'videojs') player.currentTime?.(time);
                else if (type === 'plyr') player.currentTime = time;
                else if (type === 'clappr') player.seek?.(time);
                else if (type === 'flowplayer') player.seek?.(time);
                else if (type === 'mediaelement') player.setCurrentTime?.(time);
                
                // Asian Players
                else if (type === 'dplayer') player.seek?.(time);
                else if (type === 'artplayer') player.seek?.(time);
                else if (type === 'vidstack') player.currentTime = time;
                else if (type === 'ckplayer') player.seek?.(time);
                else if (type === 'chplayer') player.seek?.(time);
                else if (type === 'tcplayer') player.seek?.(time);
                else if (type === 'h5player') player.seek?.(time);
                
                // Library Players
                else if (type === 'dashjs') player.seek?.(time);
                else if (type === 'shaka-player') player.currentTime = time;
                
                // Commercial Players
                else if (type === 'kaltura') player.currentTime?.(time);
                else if (type === 'brightcove') player.currentTime?.(time);
                else if (type === 'wistia') player.time(time);
                else if (type === 'vdocipher') player.setCurrentTime?.(time);
                else if (type === 'vimeo') player.setCurrentTime?.(time);
                else if (type === 'youtube') player.seekTo?.(time, true);
                
                // WordPress/Custom Players
                else if (type === 'vidsrc' || type === 'vidsrc-pro' || type === 'vidsrcto') player.currentTime = time;
                else if (type === 'dooplay') player.currentTime = time;
                else if (type === 'psyplay') player.currentTime = time;
                else if (type === 'fembed') player.setCurrentTime?.(time);
                
                // Generic / HTML5
                else if (type === 'html5' || type === 'window.player' || type === 'window.videoPlayer' || type === 'window.playerInstance') {
                  if (videoElement) videoElement.currentTime = time;
                }
                else if (videoElement) videoElement.currentTime = time;
                
                return { executed: true, time, method: 'seek' };
              }
              
              // Additional actions
              if (action === 'getDuration') {
                let duration = null;
                if (type === 'jwplayer') duration = player.getDuration?.();
                else if (type === 'videojs') duration = player.duration?.();
                else if (type === 'plyr') duration = player.duration;
                else if (videoElement) duration = videoElement.duration;
                return { duration, executed: true };
              }
              
              if (action === 'getCurrentTime') {
                let currentTime = null;
                if (type === 'jwplayer') currentTime = player.getPosition?.() || player.getCurrentTime?.();
                else if (type === 'videojs') currentTime = player.currentTime?.();
                else if (type === 'plyr') currentTime = player.currentTime;
                else if (videoElement) currentTime = videoElement.currentTime;
                return { currentTime, executed: true };
              }
              
              if (action === 'getVolume') {
                let volume = null;
                if (type === 'jwplayer') volume = player.getVolume?.();
                else if (type === 'videojs') volume = player.volume?.();
                else if (type === 'plyr') volume = player.volume;
                else if (videoElement) volume = videoElement.volume;
                return { volume, executed: true };
              }
              
              if (action === 'getMuted') {
                let muted = null;
                if (type === 'jwplayer') muted = player.getMute?.();
                else if (type === 'videojs') muted = player.muted?.();
                else if (type === 'plyr') muted = player.muted;
                else if (videoElement) muted = videoElement.muted;
                return { muted, executed: true };
              }
            } catch (e) {
              return { executed: false, error: e.message, type, action };
            }
          };
          
          // =================== GLOBAL PLAYER DETECTION ===================
          
          // JW Player
          if (window.jwplayer) {
            result.detectedPlayers.push('jwplayer');
            try {
              const player = window.jwplayer();
              if (player && player.getConfig) {
                result.detected = true;
                result.type = 'jwplayer';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'jwplayer',
                    duration: player.getDuration?.() || null,
                    currentTime: player.getPosition?.() || player.getCurrentTime?.() || null,
                    volume: player.getVolume?.() || null,
                    muted: player.getMute?.() || null,
                    state: player.getState?.() || null,
                    playlist: player.getPlaylist?.() || [],
                    width: player.getWidth?.() || null,
                    height: player.getHeight?.() || null,
                    fullscreen: player.getFullscreen?.() || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'jwplayer', action, seekTime);
                  return { detected: true, type: 'jwplayer', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'jwplayer', sources: extractSources(player, 'jwplayer') };
                }
              }
            } catch (e) {}
          }
          
          // Video.js
          if (window.videojs) {
            result.detectedPlayers.push('videojs');
            try {
              const players = window.videojs.getAllPlayers ? window.videojs.getAllPlayers() : [];
              if (players.length > 0) {
                const player = players[0];
                result.detected = true;
                result.type = 'videojs';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'videojs',
                    duration: player.duration?.() || null,
                    currentTime: player.currentTime?.() || null,
                    volume: player.volume?.() || null,
                    muted: player.muted?.() || null,
                    paused: player.paused?.() || null,
                    playbackRate: player.playbackRate?.() || null,
                    readyState: player.readyState?.() || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'videojs', action, seekTime);
                  return { detected: true, type: 'videojs', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'videojs', sources: extractSources(player, 'videojs') };
                }
              }
            } catch (e) {}
          }
          
          // Plyr
          if (window.Plyr || window.plyr) {
            result.detectedPlayers.push('plyr');
            try {
              const Plyr = window.Plyr || window.plyr;
              const instances = Plyr.getAll ? Plyr.getAll() : (Plyr.setup ? Plyr.setup() : []);
              if (instances.length > 0) {
                const player = instances[0];
                result.detected = true;
                result.type = 'plyr';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'plyr',
                    duration: player.duration || null,
                    currentTime: player.currentTime || null,
                    volume: player.volume || null,
                    muted: player.muted || null,
                    paused: player.paused || null,
                    ended: player.ended || null,
                    ready: player.ready || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'plyr', action, seekTime);
                  return { detected: true, type: 'plyr', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'plyr', sources: extractSources(player, 'plyr') };
                }
              }
            } catch (e) {}
          }
          
          // Clappr
          if (window.Clappr || window.clappr) {
            result.detectedPlayers.push('clappr');
            try {
              const player = window.player || window.clappr;
              if (player && (player.play || player.options)) {
                result.detected = true;
                result.type = 'clappr';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'clappr',
                    isPlaying: player.isPlaying?.() || null,
                    duration: player.getDuration?.() || null,
                    currentTime: player.getCurrentTime?.() || null,
                    volume: player.getVolume?.() || null,
                    options: player.options || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'clappr', action, seekTime);
                  return { detected: true, type: 'clappr', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'clappr', sources: extractSources(player, 'clappr') };
                }
              }
            } catch (e) {}
          }
          
          // Flowplayer
          if (window.flowplayer) {
            result.detectedPlayers.push('flowplayer');
            try {
              const player = window.flowplayer();
              if (player) {
                result.detected = true;
                result.type = 'flowplayer';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'flowplayer',
                    playing: player.playing || null,
                    paused: player.paused || null,
                    ready: player.ready || null,
                    video: player.video || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'flowplayer', action, seekTime);
                  return { detected: true, type: 'flowplayer', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'flowplayer', sources: extractSources(player, 'flowplayer') };
                }
              }
            } catch (e) {}
          }
          
          // MediaElement.js
          if (window.MediaElementPlayer || window.mediaelement) {
            result.detectedPlayers.push('mediaelement');
            try {
              const player = window.mediaelement || document.querySelector('.mejs__player')?._player;
              if (player) {
                result.detected = true;
                result.type = 'mediaelement';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'mediaelement',
                    duration: player.duration || null,
                    currentTime: player.getCurrentTime?.() || null,
                    volume: player.getVolume?.() || null,
                    paused: player.paused || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'mediaelement', action, seekTime);
                  return { detected: true, type: 'mediaelement', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'mediaelement', sources: extractSources(player, 'mediaelement') };
                }
              }
            } catch (e) {}
          }
          
          // DPlayer
          if (window.DPlayer || window.dplayer) {
            result.detectedPlayers.push('dplayer');
            try {
              const player = window.dplayer || document.querySelector('.dplayer')?.dp;
              if (player) {
                result.detected = true;
                result.type = 'dplayer';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'dplayer',
                    paused: player.video?.paused || null,
                    video: player.video ? { src: player.video.src } : null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'dplayer', action, seekTime);
                  return { detected: true, type: 'dplayer', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'dplayer', sources: extractSources(player, 'dplayer') };
                }
              }
            } catch (e) {}
          }
          
          // ArtPlayer
          if (window.Artplayer || window.artplayer) {
            result.detectedPlayers.push('artplayer');
            try {
              const player = window.artplayer;
              if (player) {
                result.detected = true;
                result.type = 'artplayer';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'artplayer',
                    playing: player.playing || null,
                    paused: player.paused || null,
                    option: player.options || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'artplayer', action, seekTime);
                  return { detected: true, type: 'artplayer', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'artplayer', sources: extractSources(player, 'artplayer') };
                }
              }
            } catch (e) {}
          }
          
          // Vidstack
          if (window.VidstackPlayer || window.vidstack) {
            result.detectedPlayers.push('vidstack');
            try {
              const player = window.vidstack;
              if (player) {
                result.detected = true;
                result.type = 'vidstack';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'vidstack',
                    paused: player.paused || null,
                    media: player.media ? { src: player.media.src } : null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'vidstack', action, seekTime);
                  return { detected: true, type: 'vidstack', action, ...actionResult };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'vidstack', sources: extractSources(player, 'vidstack') };
                }
              }
            } catch (e) {}
          }
          
          // Hls.js
          if (window.Hls || window.hls) {
            result.detectedPlayers.push('hls.js');
            try {
              const hls = window.hls;
              if (hls && (hls.url || hls.levels)) {
                result.detected = true;
                result.type = 'hls.js';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'hls.js',
                    url: hls.url || null,
                    levels: hls.levels || [],
                    currentLevel: hls.currentLevel || null
                  };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'hls.js', sources: extractSources(hls, 'hls.js') };
                }
              }
            } catch (e) {}
          }
          
          // Dash.js
          if (window.dashjs || window.Dash) {
            result.detectedPlayers.push('dashjs');
            try {
              const player = window.dashjs?.getPlayer ? window.dashjs.getPlayer() : window.dashjs;
              if (player) {
                result.detected = true;
                result.type = 'dashjs';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'dashjs',
                    isReady: player.isReady?.() || null,
                    duration: player.duration?.() || null,
                    time: player.time?.() || null
                  };
                }
                if (action === 'sources') {
                  return { detected: true, type: 'dashjs', sources: extractSources(player, 'dashjs') };
                }
              }
            } catch (e) {}
          }
          
          // Generic window.player
          if (window.player && !result.detected) {
            try {
              const player = window.player;
              if (player.play || player.src || player.currentSrc) {
                result.detectedPlayers.push('window.player');
                result.detected = true;
                result.type = 'window.player';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'window.player',
                    duration: player.duration || null,
                    currentTime: player.currentTime || null,
                    paused: player.paused || null,
                    src: player.src || player.currentSrc || null
                  };
                }
                if (['play', 'pause', 'seek'].includes(action)) {
                  const actionResult = performAction(player, 'html5', action, seekTime);
                  return { detected: true, type: 'window.player', action, ...actionResult };
                }
              }
            } catch (e) {}
          }
          
          // window.videoPlayer
          if (window.videoPlayer && !result.detected) {
            try {
              const player = window.videoPlayer;
              if (player.play || player.src) {
                result.detectedPlayers.push('window.videoPlayer');
                result.detected = true;
                result.type = 'window.videoPlayer';
                if (action === 'info') {
                  return {
                    detected: true,
                    type: 'window.videoPlayer',
                    src: player.src || null
                  };
                }
              }
            } catch (e) {}
          }
          
          // Vidsrc
          if (window.vidsrc || document.querySelector('.vidsrc-player, .vidsrc-embed')) {
            result.detectedPlayers.push('vidsrc');
            if (!result.detected) {
              result.detected = true;
              result.type = 'vidsrc';
              const video = document.querySelector('video');
              if (action === 'info' && video) {
                return {
                  detected: true,
                  type: 'vidsrc',
                  src: video.src || video.currentSrc || null
                };
              }
              if (action === 'sources') {
                return { detected: true, type: 'vidsrc', sources: extractSources(null, 'vidsrc') };
              }
            }
          }
          
          // Kaltura Player
          if (window.kalturaPlayer) {
            result.detectedPlayers.push('kaltura');
            try {
              const player = window.kalturaPlayer;
              result.detected = true;
              result.type = 'kaltura';
              if (action === 'info') {
                return {
                  detected: true,
                  type: 'kaltura',
                  src: player.src?.() || null,
                  currentTime: player.currentTime?.() || null,
                  duration: player.duration?.() || null
                };
              }
            } catch (e) {}
          }
          
          // Brightcove
          if (window.bcPlayer || window.videojs?.getPlayers) {
            try {
              const bcPlayers = window.videojs?.getPlayers ? Object.values(window.videojs.getPlayers()) : [];
              if (bcPlayers.length > 0 || window.bcPlayer) {
                result.detectedPlayers.push('brightcove');
                if (!result.detected) {
                  result.detected = true;
                  result.type = 'brightcove';
                  const player = bcPlayers[0] || window.bcPlayer;
                  if (action === 'info') {
                    return {
                      detected: true,
                      type: 'brightcove',
                      src: player.src?.() || null,
                      currentTime: player.currentTime?.() || null
                    };
                  }
                }
              }
            } catch (e) {}
          }
          
          // =================== CSS CLASS DETECTION (Fallback) ===================
          
          if (!result.detected) {
            const cssSelectors = [
              { selector: '.video-js', type: 'videojs' },
              { selector: '.jwplayer', type: 'jwplayer' },
              { selector: '.plyr', type: 'plyr' },
              { selector: '.clappr-player', type: 'clappr' },
              { selector: '.clappr', type: 'clappr' },
              { selector: '.dplayer', type: 'dplayer' },
              { selector: '.artplayer', type: 'artplayer' },
              { selector: '.flowplayer', type: 'flowplayer' },
              { selector: '.mejs__player', type: 'mediaelement' },
              { selector: '.ckplayer', type: 'ckplayer' },
              { selector: '.vidstack', type: 'vidstack' },
              { selector: '.vidsrc-player', type: 'vidsrc' },
              { selector: '.vidsrc-embed', type: 'vidsrc' },
              { selector: '.dooplay-player', type: 'dooplay' },
              { selector: '.psyplay-player', type: 'psyplay' },
              { selector: '.custom-player', type: 'custom' }
            ];
            
            for (const { selector, type } of cssSelectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                result.frameInfo.cssDetected.push(type);
                if (!result.detected) {
                  result.detected = true;
                  result.type = `${type}-css`;
                  
                  // Try to get video info from CSS detected player
                  const video = elements[0].querySelector?.('video') || document.querySelector('video');
                  if (video && action === 'info') {
                    return {
                      detected: true,
                      type: `${type}-css`,
                      detectedBy: 'css-class',
                      cssClass: selector,
                      duration: video.duration || null,
                      currentTime: video.currentTime || null,
                      src: video.src || video.currentSrc || null,
                      paused: video.paused || null,
                      volume: video.volume || null
                    };
                  }
                  
                  if (video && action === 'sources') {
                    return {
                      detected: true,
                      type: `${type}-css`,
                      detectedBy: 'css-class',
                      sources: [{ src: video.src || video.currentSrc || null }]
                    };
                  }
                  
                  if (video && action === 'play') {
                    video.play().catch(() => {});
                    return { detected: true, type: `${type}-css`, action: 'play', executed: true };
                  }
                  
                  if (video && action === 'pause') {
                    video.pause();
                    return { detected: true, type: `${type}-css`, action: 'pause', executed: true };
                  }
                  
                  if (video && action === 'seek' && seekTime) {
                    video.currentTime = seekTime;
                    return { detected: true, type: `${type}-css`, action: 'seek', time: seekTime };
                  }
                }
              }
            }
          }
          
          // =================== HTML5 NATIVE VIDEO (Last Fallback) ===================
          
          const videos = document.querySelectorAll('video');
          result.frameInfo.videoElements = videos.length;
          
          if (videos.length > 0 && !result.detected) {
            const video = videos[0];
            result.detected = true;
            result.type = 'html5';
            
            if (action === 'play') {
              video.play().catch(e => ({ error: e.message }));
              return { detected: true, type: 'html5', action: 'play', executed: true };
            }
            if (action === 'pause') {
              video.pause();
              return { detected: true, type: 'html5', action: 'pause', executed: true };
            }
            if (action === 'sources') {
              const sources = [];
              if (video.src) sources.push({ src: video.src });
              if (video.currentSrc && video.currentSrc !== video.src) sources.push({ src: video.currentSrc });
              const sourceElements = video.querySelectorAll('source');
              sourceElements.forEach(s => sources.push({ src: s.src, type: s.type }));
              return { detected: true, type: 'html5', sources };
            }
            if (action === 'seek' && seekTime) {
              video.currentTime = seekTime;
              return { detected: true, type: 'html5', action: 'seek', time: seekTime };
            }
            
            return {
              detected: true,
              type: 'html5',
              duration: video.duration || null,
              currentTime: video.currentTime || null,
              src: video.src || video.currentSrc || null,
              paused: video.paused || null,
              volume: video.volume || null,
              playbackRate: video.playbackRate || null,
              readyState: video.readyState || null,
              networkState: video.networkState || null
            };
          }
          
          // Return detection summary if no specific action matched
          return result;
        }, { playerType, action, seekTime });
        
        if (frameInfo.detected) {
          playerInfo = frameInfo;
          frameIndex = i;
          break;
        }
        
      } catch (e) {
        // Frame evaluation failed, continue to next frame
      }
    }
    
    if (!playerInfo) {
      playerInfo = { detected: false, message: 'No player found in any frame' };
    }
    
    notifyProgress('player_api_hook', 'completed', playerInfo.detected ? `Player detected: ${playerInfo.type} (frame ${frameIndex})` : 'No player found', { 
      detected: playerInfo.detected,
      frameIndex 
    });
    
    return { success: true, ...playerInfo, frameIndex };
  },

  // 28. Form Automator
  async form_automator(params) {
    const { page } = requireBrowser();
    const { selector, data, submit = false, humanLike = true } = params;
    
    const formSelector = selector || 'form';
    const fields = Object.keys(data || {});
    
    notifyProgress('form_automator', 'started', `Filling form with ${fields.length} fields`);
    
    let filledCount = 0;
    
    for (const [field, value] of Object.entries(data || {})) {
      const inputSelector = `${formSelector} [name="${field}"], ${formSelector} #${field}, ${formSelector} [placeholder*="${field}" i]`;
      
      try {
        const input = await page.$(inputSelector);
        if (input) {
          const tagName = await input.evaluate(el => el.tagName.toLowerCase());
          const inputType = await input.evaluate(el => el.type);
          
          if (tagName === 'select') {
            await page.select(inputSelector, value);
          } else if (inputType === 'checkbox' || inputType === 'radio') {
            if (value) await input.click();
          } else {
            await input.click({ clickCount: 3 });
            if (humanLike) {
              await page.type(inputSelector, String(value), { delay: 50 + Math.random() * 50 });
            } else {
              await page.type(inputSelector, String(value));
            }
          }
          filledCount++;
          notifyProgress('form_automator', 'progress', `Filled: ${field}`, { field, filledCount });
        }
      } catch (e) {
        // Field not found, continue
      }
    }
    
    if (submit) {
      await page.click(`${formSelector} [type="submit"], ${formSelector} button`);
      notifyProgress('form_automator', 'progress', 'Form submitted');
    }
    
    notifyProgress('form_automator', 'completed', `Filled ${filledCount}/${fields.length} fields`, { filledCount, submitted: submit });
    
    return { success: true, formSelector, fieldsProcessed: filledCount, submitted: submit };
  }
};

// ═══════════════════════════════════════════════════════════════
// 🤖 AI-POWERED CORE INTEGRATION
// All tools automatically get AI features (auto-healing, smart find)
// ═══════════════════════════════════════════════════════════════

let aiCore = null;

/**
 * Get or initialize AI Core (lazy loading)
 */
function getAICore() {
  if (!aiCore) {
    try {
      const ai = require('../ai');
      aiCore = ai.aiCore;
      aiCore.configure({ logLevel: 'info', enableAutoHeal: true });
      console.error('🤖 [AI] AI Core initialized - all tools now AI-enhanced');
    } catch (e) {
      console.error('⚠️ [AI] AI Core not available:', e.message);
      return null;
    }
  }
  return aiCore;
}

/**
 * AI-Enhanced selector operation
 * Automatically heals broken selectors
 */
async function aiEnhancedSelector(page, selector, operation, options = {}) {
  const ai = getAICore();
  
  // Try original selector first
  try {
    const element = await page.$(selector);
    if (element) {
      return { element, selector, healed: false };
    }
  } catch (e) {
    // Selector failed
  }
  
  // If AI available, try to heal
  if (ai && ai.config.enableAutoHeal) {
    console.error(`🩹 [AI] Selector "${selector}" not found, attempting heal...`);
    
    try {
      const alternatives = await ai.selectorHealer.heal(page, selector, {
        maxAlternatives: 3
      });
      
      for (const alt of alternatives) {
        try {
          const element = await page.$(alt.selector);
          if (element) {
            console.error(`✅ [AI] Healed: "${selector}" → "${alt.selector}" (${Math.round(alt.confidence * 100)}% confidence)`);
            return { element, selector: alt.selector, healed: true, originalSelector: selector };
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.error(`⚠️ [AI] Heal failed:`, e.message);
    }
  }
  
  return { element: null, selector, healed: false };
}

/**
 * Execute a tool by name - NOW WITH AI INTEGRATION
 * 
 * AI Features automatically applied:
 * - Auto-healing: If selector fails, AI tries to find alternatives
 * - Smart retry: Failed operations are retried with AI assistance
 * - All 28 tools benefit from AI without any changes
 */
async function executeTool(name, params = {}) {
  const handler = handlers[name];
  
  if (!handler) {
    notifyProgress(name, 'error', `Unknown tool: ${name}`);
    return { success: false, error: `Unknown tool: ${name}` };
  }
  
  // Initialize AI Core (lazy)
  getAICore();
  
  const startTime = Date.now();
  
  try {
    // Execute the handler
    const result = await handler(params);
    
    // If successful, return with AI metadata
    if (result.success) {
      return {
        ...result,
        _ai: { 
          enabled: !!aiCore, 
          healed: false,
          duration: Date.now() - startTime 
        }
      };
    }
    
    // If failed with "not found" error and has selector, try AI healing
    if (result.error?.includes('not found') && params.selector && aiCore) {
      notifyProgress(name, 'progress', '🤖 AI attempting recovery...');
      
      const { page } = getState();
      if (page) {
        const healed = await aiEnhancedSelector(page, params.selector, name);
        
        if (healed.element) {
          // Retry with healed selector
          const retryParams = { ...params, selector: healed.selector };
          const retryResult = await handler(retryParams);
          
          return {
            ...retryResult,
            _ai: {
              enabled: true,
              healed: true,
              originalSelector: params.selector,
              healedSelector: healed.selector,
              duration: Date.now() - startTime
            }
          };
        }
      }
    }
    
    return {
      ...result,
      _ai: { enabled: !!aiCore, healed: false, duration: Date.now() - startTime }
    };
    
  } catch (error) {
    notifyProgress(name, 'error', error.message);
    
    // Try AI recovery for selector-based errors
    if (error.message?.includes('selector') && params.selector && aiCore) {
      notifyProgress(name, 'progress', '🤖 AI attempting error recovery...');
      
      try {
        const { page } = getState();
        if (page) {
          const healed = await aiEnhancedSelector(page, params.selector, name);
          
          if (healed.element) {
            const retryParams = { ...params, selector: healed.selector };
            const retryResult = await handler(retryParams);
            
            return {
              ...retryResult,
              _ai: {
                enabled: true,
                healed: true,
                recoveredFromError: true,
                originalSelector: params.selector,
                healedSelector: healed.selector,
                duration: Date.now() - startTime
              }
            };
          }
        }
      } catch (retryError) {
        // Recovery failed
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      _ai: { enabled: !!aiCore, healed: false, duration: Date.now() - startTime }
    };
  }
}

/**
 * Cleanup - close browser if open
 */
async function cleanup() {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (e) {
      browserInstance.process()?.kill('SIGKILL');
    }
    browserInstance = null;
    pageInstance = null;
    blockerInstance = null;
  }
}

module.exports = {
  handlers,
  executeTool,
  cleanup,
  getState,
  requireBrowser,
  setProgressCallback,
  notifyProgress,
  getHeadlessFromEnv,
  // AI Core exports
  getAICore,
  aiEnhancedSelector
};
