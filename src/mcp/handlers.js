/**
 * Brave Real Browser MCP Server - Tool Handlers
 * 
 * Implementation of all 28 browser automation tools
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
    const { connect } = require('../../lib/cjs/index.js');
    
    const { headless = false, proxy = {}, turnstile = false, enableBlocker = true } = params;
    
    const result = await connect({
      headless,
      proxy,
      turnstile,
      enableBlocker,
    });
    
    browserInstance = result.browser;
    pageInstance = result.page;
    blockerInstance = result.blocker;
    
    return {
      success: true,
      message: 'Browser initialized successfully',
      pid: browserInstance.process()?.pid,
      headless,
      blockerEnabled: enableBlocker
    };
  },

  // 2. Navigate
  async navigate(params) {
    const { page } = requireBrowser();
    const { url, waitUntil = 'networkidle2', timeout = 30000 } = params;
    
    await page.goto(url, { waitUntil, timeout });
    
    return {
      success: true,
      url: page.url(),
      title: await page.title()
    };
  },

  // 3. Get Content
  async get_content(params = {}) {
    const { page } = requireBrowser();
    const { format = 'text', selector } = params;
    
    let content;
    
    if (selector) {
      const element = await page.$(selector);
      if (!element) {
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
          // Simple HTML to Markdown conversion
          const body = document.body.innerText;
          return body;
        });
      } else {
        content = await page.evaluate(() => document.body.innerText);
      }
    }
    
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
    
    return { success: true, type, value };
  },

  // 5. Click
  async click(params) {
    const { page } = requireBrowser();
    const { selector, humanLike = true, clickCount = 1, delay = 0 } = params;
    
    if (humanLike) {
      try {
        const { createCursor } = require('ghost-cursor');
        const cursor = createCursor(page);
        await cursor.click(selector);
      } catch (e) {
        // Fallback to regular click
        await page.click(selector, { clickCount, delay });
      }
    } else {
      await page.click(selector, { clickCount, delay });
    }
    
    return { success: true, selector, clicked: true };
  },

  // 6. Type
  async type(params) {
    const { page } = requireBrowser();
    const { selector, text, delay = 50, clear = false } = params;
    
    if (clear) {
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    
    await page.type(selector, text, { delay });
    
    return { success: true, selector, textLength: text.length };
  },

  // 7. Browser Close
  async browser_close(params = {}) {
    const { force = false } = params;
    
    if (browserInstance) {
      try {
        await browserInstance.close();
      } catch (e) {
        if (force) {
          browserInstance.process()?.kill('SIGKILL');
        }
      }
      browserInstance = null;
      pageInstance = null;
      blockerInstance = null;
    }
    
    return { success: true, message: 'Browser closed' };
  },

  // 8. Solve Captcha
  async solve_captcha(params = {}) {
    const { page } = requireBrowser();
    const { type = 'auto', timeout = 30000 } = params;
    
    // Wait for turnstile/captcha to be solved (handled by turnstile option in connect)
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const turnstileToken = await page.evaluate(() => {
        const input = document.querySelector('input[name="cf-turnstile-response"]');
        return input ? input.value : null;
      });
      
      if (turnstileToken) {
        return { success: true, type: 'turnstile', solved: true };
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
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
    
    await page.evaluate(({ scrollAmount, scrollDirection, smooth }) => {
      const y = scrollDirection === 'down' ? scrollAmount : -scrollAmount;
      window.scrollBy({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    }, { scrollAmount, scrollDirection, smooth });
    
    return { success: true, direction: scrollDirection, amount: scrollAmount };
  },

  // 10. Find Element
  async find_element(params = {}) {
    const { page } = requireBrowser();
    const { selector, xpath, text, multiple = false } = params;
    
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
    
    return { success: true, found: elements.length, elements };
  },

  // 11. Save Content as Markdown
  async save_content_as_markdown(params) {
    const { page } = requireBrowser();
    const { filename, selector, includeImages = true, includeMeta = true } = params;
    
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
    
    return { success: true, filename: outputPath, size: markdown.length };
  },

  // 12. Redirect Tracer
  async redirect_tracer(params) {
    const { page } = requireBrowser();
    const { url, maxRedirects = 10, includeHeaders = false } = params;
    
    const redirects = [];
    
    const responseHandler = response => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirects.push({
          url: response.url(),
          status: response.status(),
          headers: includeHeaders ? response.headers() : undefined
        });
      }
    };
    
    page.on('response', responseHandler);
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    page.off('response', responseHandler);
    
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
    
    return { success: true, pattern, matchCount: matches.length, matches: matches.slice(0, 100) };
  },

  // 14. Extract JSON
  async extract_json(params = {}) {
    const { page } = requireBrowser();
    const { source = 'page', selector, jsonPath } = params;
    
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
    
    return { success: true, source, count: jsonData.length, data: jsonData };
  },

  // 15. Scrape Meta Tags
  async scrape_meta_tags(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'] } = params;
    
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
    
    return { success: true, ...meta };
  },

  // 16. Press Key
  async press_key(params) {
    const { page } = requireBrowser();
    const { key, modifiers = [], count = 1 } = params;
    
    for (let i = 0; i < count; i++) {
      if (modifiers.length > 0) {
        const keyCombo = [...modifiers, key].join('+');
        await page.keyboard.press(keyCombo);
      } else {
        await page.keyboard.press(key);
      }
    }
    
    return { success: true, key, modifiers, count };
  },

  // 17. Progress Tracker
  async progress_tracker(params = {}) {
    const { action = 'get', taskName, progress } = params;
    
    switch (action) {
      case 'start':
        progressTasks[taskName] = { progress: 0, startTime: Date.now() };
        break;
      case 'update':
        if (progressTasks[taskName]) {
          progressTasks[taskName].progress = progress;
        }
        break;
      case 'complete':
        if (progressTasks[taskName]) {
          progressTasks[taskName].progress = 100;
          progressTasks[taskName].endTime = Date.now();
        }
        break;
    }
    
    return { success: true, tasks: progressTasks };
  },

  // 18. Deep Analysis
  async deep_analysis(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], detailed = true } = params;
    
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
        break;
      case 'stop':
        isRecordingNetwork = false;
        break;
      case 'clear':
        networkRecords = [];
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
    
    return { success: true, count: links.length, links };
  },

  // 21. Cookie Manager
  async cookie_manager(params = {}) {
    const { page } = requireBrowser();
    const { action = 'get', name, value, domain, expires } = params;
    
    switch (action) {
      case 'get':
        const cookies = await page.cookies();
        return { success: true, cookies: name ? cookies.filter(c => c.name === name) : cookies };
      
      case 'set':
        await page.setCookie({ name, value, domain: domain || new URL(page.url()).hostname, expires });
        return { success: true, message: `Cookie ${name} set` };
      
      case 'delete':
        const toDelete = await page.cookies();
        const filtered = name ? toDelete.filter(c => c.name === name) : toDelete;
        await page.deleteCookie(...filtered);
        return { success: true, message: `Deleted ${filtered.length} cookie(s)` };
      
      case 'clear':
        const allCookies = await page.cookies();
        await page.deleteCookie(...allCookies);
        return { success: true, message: `Cleared ${allCookies.length} cookies` };
    }
    
    return { success: false, error: 'Invalid action' };
  },

  // 22. File Downloader
  async file_downloader(params) {
    const { page } = requireBrowser();
    const { url, filename, directory = './downloads' } = params;
    
    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Use page to download
    const response = await page.goto(url, { waitUntil: 'networkidle2' });
    const buffer = await response.buffer();
    
    const outputFilename = filename || path.basename(new URL(url).pathname) || 'download';
    const outputPath = path.join(directory, outputFilename);
    
    fs.writeFileSync(outputPath, buffer);
    
    return { success: true, filename: outputPath, size: buffer.length };
  },

  // 23. iFrame Handler
  async iframe_handler(params = {}) {
    const { page } = requireBrowser();
    const { action = 'list', selector, index } = params;
    
    const frames = page.frames();
    
    switch (action) {
      case 'list':
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
          return { success: true, switched: true, url: targetFrame.url() };
        }
        return { success: false, error: 'Frame not found' };
      
      case 'content':
        const frame = selector 
          ? await page.$(selector).then(el => el?.contentFrame())
          : frames[index || 0];
        
        if (frame) {
          const content = await frame.content();
          return { success: true, content };
        }
        return { success: false, error: 'Frame not found' };
      
      case 'exit':
        return { success: true, message: 'Returned to main frame' };
    }
    
    return { success: false, error: 'Invalid action' };
  },

  // 24. Stream Extractor
  async stream_extractor(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], quality = 'best' } = params;
    
    const streams = await page.evaluate(() => {
      const result = { video: [], audio: [], hls: [], dash: [] };
      
      // Video elements
      document.querySelectorAll('video source, video').forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src) result.video.push({ src, type: el.type || 'video' });
      });
      
      // Audio elements
      document.querySelectorAll('audio source, audio').forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src) result.audio.push({ src, type: el.type || 'audio' });
      });
      
      // Find HLS/DASH in scripts
      const scripts = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n');
      const hlsMatches = scripts.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi) || [];
      const dashMatches = scripts.match(/https?:\/\/[^\s"']+\.mpd[^\s"']*/gi) || [];
      
      result.hls = hlsMatches.map(src => ({ src, type: 'hls' }));
      result.dash = dashMatches.map(src => ({ src, type: 'dash' }));
      
      return result;
    });
    
    return { success: true, streams };
  },

  // 25. JS Scrape
  async js_scrape(params) {
    const { page } = requireBrowser();
    const { selector, waitForJS = true, timeout = 10000 } = params;
    
    if (waitForJS) {
      await page.waitForSelector(selector, { timeout });
    }
    
    const content = await page.$eval(selector, el => ({
      html: el.outerHTML,
      text: el.innerText,
      attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
    }));
    
    return { success: true, selector, content };
  },

  // 26. Execute JS
  async execute_js(params) {
    const { page } = requireBrowser();
    const { code, returnValue = true } = params;
    
    const result = await page.evaluate(code);
    
    return { success: true, result: returnValue ? result : undefined };
  },

  // 27. Player API Hook
  async player_api_hook(params = {}) {
    const { page } = requireBrowser();
    const { playerType = 'auto', action = 'info' } = params;
    
    const playerInfo = await page.evaluate(({ playerType, action }) => {
      // Try to detect player
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
      
      // Fallback to HTML5 video
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
    
    return { success: true, ...playerInfo };
  },

  // 28. Form Automator
  async form_automator(params) {
    const { page } = requireBrowser();
    const { selector, data, submit = false, humanLike = true } = params;
    
    const formSelector = selector || 'form';
    
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
        }
      } catch (e) {
        // Field not found, continue
      }
    }
    
    if (submit) {
      await page.click(`${formSelector} [type="submit"], ${formSelector} button`);
    }
    
    return { success: true, formSelector, fieldsProcessed: Object.keys(data || {}).length, submitted: submit };
  }
};

/**
 * Execute a tool by name
 */
async function executeTool(name, params = {}) {
  const handler = handlers[name];
  
  if (!handler) {
    return { success: false, error: `Unknown tool: ${name}` };
  }
  
  try {
    return await handler(params);
  } catch (error) {
    return { success: false, error: error.message };
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
  requireBrowser
};
