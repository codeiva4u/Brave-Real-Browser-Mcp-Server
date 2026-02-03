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
    
    while (Date.now() - start < timeout) {
      attempts++;
      
      const turnstileToken = await page.evaluate(() => {
        const input = document.querySelector('input[name="cf-turnstile-response"]');
        return input ? input.value : null;
      });
      
      if (turnstileToken) {
        notifyProgress('solve_captcha', 'completed', `Captcha solved after ${attempts} checks`, { type: 'turnstile', attempts });
        return { success: true, type: 'turnstile', solved: true };
      }
      
      if (attempts % 10 === 0) {
        notifyProgress('solve_captcha', 'progress', `Still solving... (${attempts} checks)`, { attempts });
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    notifyProgress('solve_captcha', 'error', 'Captcha solving timeout');
    return { success: false, error: 'Captcha solving timeout' };
  },

  // 9. Random Scroll
  async random_scroll(params = {}) {
    const { page } = requireBrowser();
    const { direction = 'down', amount = 0, smooth = true } = params;
    
    const scrollAmount = amount || Math.floor(Math.random() * 500) + 200;
    const scrollDirection = direction === 'random' 
      ? (Math.random() > 0.5 ? 'down' : 'up') 
      : direction;
    
    notifyProgress('random_scroll', 'started', `Scrolling ${scrollDirection} ${scrollAmount}px`);
    
    await page.evaluate(({ scrollAmount, scrollDirection, smooth }) => {
      const y = scrollDirection === 'down' ? scrollAmount : -scrollAmount;
      window.scrollBy({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    }, { scrollAmount, scrollDirection, smooth });
    
    notifyProgress('random_scroll', 'completed', `Scrolled ${scrollDirection} ${scrollAmount}px`, { direction: scrollDirection, amount: scrollAmount });
    
    return { success: true, direction: scrollDirection, amount: scrollAmount };
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

  // 22. File Downloader
  async file_downloader(params) {
    const { page } = requireBrowser();
    const { url, filename, directory = './downloads' } = params;
    
    notifyProgress('file_downloader', 'started', `Downloading: ${url}`);
    
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    const response = await page.goto(url, { waitUntil: 'networkidle2' });
    const buffer = await response.buffer();
    
    const outputFilename = filename || path.basename(new URL(url).pathname) || 'download';
    const outputPath = path.join(directory, outputFilename);
    
    fs.writeFileSync(outputPath, buffer);
    
    notifyProgress('file_downloader', 'completed', `Downloaded: ${outputFilename} (${buffer.length} bytes)`, { filename: outputPath, size: buffer.length });
    
    return { success: true, filename: outputPath, size: buffer.length };
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

  // 24. Stream Extractor
  async stream_extractor(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], quality = 'best' } = params;
    
    notifyProgress('stream_extractor', 'started', 'Extracting streams...');
    
    const streams = await page.evaluate(() => {
      const result = { video: [], audio: [], hls: [], dash: [] };
      
      document.querySelectorAll('video source, video').forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src) result.video.push({ src, type: el.type || 'video' });
      });
      
      document.querySelectorAll('audio source, audio').forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src) result.audio.push({ src, type: el.type || 'audio' });
      });
      
      const scripts = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n');
      const hlsMatches = scripts.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi) || [];
      const dashMatches = scripts.match(/https?:\/\/[^\s"']+\.mpd[^\s"']*/gi) || [];
      
      result.hls = hlsMatches.map(src => ({ src, type: 'hls' }));
      result.dash = dashMatches.map(src => ({ src, type: 'dash' }));
      
      return result;
    });
    
    const totalStreams = streams.video.length + streams.audio.length + streams.hls.length + streams.dash.length;
    notifyProgress('stream_extractor', 'completed', `Found ${totalStreams} streams`, { totalStreams });
    
    return { success: true, streams };
  },

  // 25. JS Scrape
  async js_scrape(params) {
    const { page } = requireBrowser();
    const { selector, waitForJS = true, timeout = 10000 } = params;
    
    notifyProgress('js_scrape', 'started', `Scraping: ${selector}`);
    
    if (waitForJS) {
      await page.waitForSelector(selector, { timeout });
      notifyProgress('js_scrape', 'progress', 'Element found, extracting content...');
    }
    
    const content = await page.$eval(selector, el => ({
      html: el.outerHTML,
      text: el.innerText,
      attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
    }));
    
    notifyProgress('js_scrape', 'completed', `Scraped ${content.text.length} characters`, { selector });
    
    return { success: true, selector, content };
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

  // 27. Player API Hook
  async player_api_hook(params = {}) {
    const { page } = requireBrowser();
    const { playerType = 'auto', action = 'info' } = params;
    
    notifyProgress('player_api_hook', 'started', `Player ${action}: ${playerType}`);
    
    const playerInfo = await page.evaluate(({ playerType, action }) => {
      if (window.player || window.videoPlayer || window.jwplayer) {
        const player = window.player || window.videoPlayer || (window.jwplayer && window.jwplayer());
        
        if (action === 'info' && player) {
          return {
            detected: true,
            type: window.jwplayer ? 'jwplayer' : 'generic',
            duration: player.getDuration?.() || player.duration,
            currentTime: player.getCurrentTime?.() || player.currentTime,
            volume: player.getVolume?.() || player.volume
          };
        }
        
        if (action === 'sources' && player) {
          return {
            detected: true,
            sources: player.getSources?.() || player.getPlaylist?.() || []
          };
        }
        
        if (action === 'play' && player) {
          player.play?.();
          return { detected: true, action: 'play', executed: true };
        }
        
        if (action === 'pause' && player) {
          player.pause?.();
          return { detected: true, action: 'pause', executed: true };
        }
      }
      
      const video = document.querySelector('video');
      if (video) {
        if (action === 'play') video.play();
        if (action === 'pause') video.pause();
        
        return {
          detected: true,
          type: 'html5',
          duration: video.duration,
          currentTime: video.currentTime,
          src: video.src || video.currentSrc,
          paused: video.paused
        };
      }
      
      return { detected: false };
    }, { playerType, action });
    
    notifyProgress('player_api_hook', 'completed', playerInfo.detected ? `Player detected: ${playerInfo.type}` : 'No player found', { detected: playerInfo.detected });
    
    return { success: true, ...playerInfo };
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
// 🤖 AI-POWERED CORE + SIMPLE SELF-HEALING
// Hindi message + Auto Training
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
      aiCore.configure({ 
        logLevel: 'info', 
        enableAutoHeal: true,
        enableSelfHealing: true
      });
      console.error('🤖 [AI] AI Core initialized');
      console.error('🔧 [AI] Self-Healing: Hindi messages + Auto Training ACTIVE');
    } catch (e) {
      console.error('⚠️ [AI] AI Core not available:', e.message);
      return null;
    }
  }
  return aiCore;
}

/**
 * Get training statistics
 */
function getTrainingStats() {
  const ai = getAICore();
  if (ai) {
    return ai.getTrainingStats();
  }
  return null;
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
 * Execute a tool by name - WITH SELF-HEALING + AUTO TRAINING
 * 
 * Every tool use = Training
 * - Success patterns stored
 * - Failure patterns stored  
 * - System gets smarter over time
 */
async function executeTool(name, params = {}) {
  const handler = handlers[name];
  
  if (!handler) {
    notifyProgress(name, 'error', `Unknown tool: ${name}`);
    return { success: false, error: `Unknown tool: ${name}` };
  }
  
  // Initialize AI Core (lazy)
  const ai = getAICore();
  
  const startTime = Date.now();
  
  try {
    // Execute the handler
    const result = await handler(params);
    const duration = Date.now() - startTime;
    
    // Add AI metadata
    result._ai = { 
      enabled: !!ai, 
      duration
    };
    
    // Get page info for context
    const { page } = getState();
    const context = {
      duration,
      url: page?.url?.(),
      params
    };
    
    // ═══════════════════════════════════════════════════════════════
    // CASE 1: Tool SUCCESS - Validate result for 100% accuracy
    // ═══════════════════════════════════════════════════════════════
    if (result.success) {
      if (ai) {
        // ⭐ ADVANCED VALIDATION: Check if result is 100% as expected
        const validation = ai.validateResult(name, result, params, context);
        
        // Add validation score to result
        result._validation = {
          score: validation.score,
          isValid: validation.isValid,
          issueCount: validation.issues.length
        };
        
        // If not 100%, add Hindi warning message
        if (validation.score < 100 && validation.hindiMessage) {
          result.hindiMessage = validation.hindiMessage;
          result._issues = validation.issues;
          notifyProgress(name, 'progress', `⚠️ Result validation: ${validation.score}%`);
        }
        
        // Also check for legacy issues (performance, healed selectors)
        const issues = ai.detectIssues(name, result, context);
        if (issues.length > 0 && !result.hindiMessage) {
          result.hindiMessage = ai.buildIssueMessage(name, issues);
          result._issues = issues;
        }
        
        // 🧠 TRAIN: Learn from this execution (success or with issues)
        ai.learnFromExecution(name, params, result, context);
      }
      
      return result;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CASE 2: Tool FAILED (success: false) - try healing first
    // ═══════════════════════════════════════════════════════════════
    if (result.error?.includes('not found') && params.selector && ai) {
      notifyProgress(name, 'progress', '🤖 AI attempting recovery...');
      
      if (page) {
        const healed = await aiEnhancedSelector(page, params.selector, name);
        
        if (healed.element) {
          const retryParams = { ...params, selector: healed.selector };
          const retryResult = await handler(retryParams);
          
          retryResult._ai = {
            enabled: true,
            healed: true,
            originalSelector: params.selector,
            healedSelector: healed.selector,
            duration: Date.now() - startTime
          };
          
          // Healed = there was an issue in source code
          retryResult.hindiMessage = `\n⚠️ चेतावनी: Selector समस्या थी\n\n` +
            `🔸 Original selector "${params.selector}" काम नहीं किया\n` +
            `🔸 AI ने "${healed.selector}" से fix किया\n\n` +
            `💡 सुझाव: Source code में selector update करें:\n` +
            `   पहले: "${params.selector}"\n` +
            `   बाद:  "${healed.selector}"\n\n` +
            `⚠️ कृपया source code में यह fix करें!`;
          
          // 🧠 TRAIN: Learn the selector correction
          ai.learnFromExecution(name, params, retryResult, context);
          
          return retryResult;
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CASE 3: Tool FAILED completely - Hindi error message
    // ═══════════════════════════════════════════════════════════════
    if (result.error) {
      if (ai) {
        try {
          const selfHealResult = await ai.selfHeal(name, result.error, context);
          
          if (selfHealResult) {
            result.hindiMessage = selfHealResult.hindiMessage;
          }
          
          // 🧠 TRAIN: Learn from failure
          ai.learnFromExecution(name, params, result, context);
        } catch (aiError) {
          console.error('⚠️ [AI] Self-heal failed:', aiError.message);
          result.hindiMessage = `🔴 समस्या: ${result.error}\n\n💡 AI recovery failed.`;
        }
      } else {
        // No AI - simple fallback message
        result.hindiMessage = `🔴 Error: ${result.error}`;
      }
    }
    
    return result;
    
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════
    // CASE 4: Tool EXCEPTION (threw error)
    // ═══════════════════════════════════════════════════════════════
    notifyProgress(name, 'error', error.message);
    
    const duration = Date.now() - startTime;
    const { page } = getState();
    const context = { duration, url: page?.url?.(), params };
    
    // Try AI recovery for selector-based errors
    if (error.message?.includes('selector') && params.selector && aiCore) {
      try {
        if (page) {
          const healed = await aiEnhancedSelector(page, params.selector, name);
          
          if (healed.element) {
            const retryParams = { ...params, selector: healed.selector };
            const retryResult = await handler(retryParams);
            
            retryResult._ai = {
              enabled: true,
              healed: true,
              recoveredFromError: true,
              originalSelector: params.selector,
              healedSelector: healed.selector,
              duration: Date.now() - startTime
            };
            
            retryResult.hindiMessage = `\n⚠️ चेतावनी: Error recover हुआ लेकिन fix जरूरी है\n\n` +
              `🔸 Error आया था: ${error.message}\n` +
              `🔸 AI ने selector "${healed.selector}" से recover किया\n\n` +
              `💡 सुझाव: Source code में selector update करें\n\n` +
              `⚠️ कृपया source code में यह fix करें!`;
            
            // 🧠 TRAIN: Learn recovery pattern
            aiCore.learnFromExecution(name, params, retryResult, context);
            
            return retryResult;
          }
        }
      } catch (retryError) {
        // Recovery failed
      }
    }
    
    // Hindi message for exception
    const result = { 
      success: false, 
      error: error.message,
      _ai: { enabled: !!aiCore, duration }
    };
    
    if (aiCore) {
      try {
        const selfHealResult = await aiCore.selfHeal(name, error, context);
        
        if (selfHealResult) {
          result.hindiMessage = selfHealResult.hindiMessage;
        }
        
        // 🧠 TRAIN: Learn from exception
        aiCore.learnFromExecution(name, params, result, context);
      } catch (aiError) {
        // AI failed, but still return the error with fallback Hindi message
        console.error('⚠️ [AI] Self-heal failed:', aiError.message);
        result.hindiMessage = `🔴 समस्या: ${error.message}\n\n💡 AI recovery failed, please check manually.`;
      }
    } else {
      // No AI available - simple Hindi fallback
      result.hindiMessage = `🔴 Error: ${error.message}`;
    }
    
    return result;
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
  // AI exports
  getAICore,
  aiEnhancedSelector,
  getTrainingStats
};
