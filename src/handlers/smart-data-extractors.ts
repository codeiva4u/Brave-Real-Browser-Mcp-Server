// Smart Data Extractors Module - OPTIMIZED
// Advanced tools for HTML Elements, AJAX, XPath, Network Recording, Video sources extraction
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling, sleep } from '../system-utils.js';
import {
  TOOL_OPTIMIZATION_CONFIG,
  globalCache,
  deduplicateResults,
  VIDEO_HOSTERS_DB,
  SELECTOR_UTILS,
  globalMetrics,
  createErrorHandler,
} from '../optimization-utils.js';



/**
 * Tags Finder - Find specific HTML tags
 */
export async function handleTagsFinder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('tags_finder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const tags = args.tags || ['div', 'span', 'p', 'a', 'img'];

    const tagData = await page.evaluate((tags) => {
      const results: any = {};

      tags.forEach((tag: string) => {
        const elements = document.querySelectorAll(tag);
        results[tag] = {
          count: elements.length,
          samples: Array.from(elements).slice(0, 5).map((el: any) => ({
            text: el.textContent?.trim().substring(0, 100) || '',
            attributes: Array.from(el.attributes).reduce((acc: any, attr: any) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {})
          }))
        };
      });

      return results;
    }, tags);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Tags found:\n\n${JSON.stringify(tagData, null, 2)}`,
      }],
    };
  }, 'Failed to find tags');
}

/**
 * Links Finder - Extract all links from page
 */
export async function handleLinksFinder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('links_finder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const includeExternal = args.includeExternal !== false;
    const maxLinks = args.maxLinks || 200;

    const links = await page.evaluate(({ includeExternal, maxLinks }) => {
      const anchors = document.querySelectorAll('a[href]');
      const currentDomain = window.location.hostname;
      const results: any[] = [];

      let count = 0;
      anchors.forEach((a: any) => {
        if (count >= maxLinks) return;

        const href = a.href;
        try {
          const url = new URL(href);
          const isExternal = url.hostname !== currentDomain;

          if (!includeExternal && isExternal) return;

          results.push({
            href,
            text: a.textContent?.trim() || '',
            title: a.title || '',
            type: isExternal ? 'external' : 'internal',
            domain: url.hostname,
          });
          count++;
        } catch (e) {
          // Invalid URL
        }
      });

      return results;
    }, { includeExternal, maxLinks });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${links.length} links\n\n${JSON.stringify(links.slice(0, 20), null, 2)}${links.length > 20 ? '\n\n... (showing first 20)' : ''}`,
      }],
    };
  }, 'Failed to find links');
}

/**
 * XPath Links Finder - Use XPath to find links
 */
export async function handleXpathLinks(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('xpath_links', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const xpath = args.xpath || '//a[@href]';

    const links = await page.evaluate((xpath) => {
      const iterator = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
      );

      const results: any[] = [];
      let node = iterator.iterateNext();
      let count = 0;

      while (node && count < 100) {
        const element = node as HTMLElement;
        results.push({
          tagName: element.tagName,
          href: (element as any).href || element.getAttribute('href'),
          text: element.textContent?.trim() || '',
          xpath: xpath,
        });
        node = iterator.iterateNext();
        count++;
      }

      return results;
    }, xpath);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ XPath found ${links.length} matches\n\n${JSON.stringify(links, null, 2)}`,
      }],
    };
  }, 'Failed to find XPath links');
}

/**
 * AJAX Extractor - Extract AJAX/XHR request data with responses
 */
export async function handleAjaxExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('ajax_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const duration = args.duration || 15000;
    const url = args.url;
    const forceReload = args.forceReload !== false; // Force reload by default
    const includeResponses = args.includeResponses !== false;

    const requests: any[] = [];
    const responses: any[] = [];

    const requestHandler = (request: any) => {
      try {
        const resourceType = request.resourceType();
        if (resourceType === 'xhr' || resourceType === 'fetch') {
          requests.push({
            url: request.url(),
            method: request.method(),
            resourceType,
            headers: request.headers(),
            postData: request.postData(),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        // Ignore errors
      }
    };

    const responseHandler = async (response: any) => {
      try {
        const resourceType = response.request().resourceType();
        if (resourceType === 'xhr' || resourceType === 'fetch') {
          let body = null;
          if (includeResponses) {
            try {
              const text = await response.text();
              // Try to parse as JSON
              try {
                body = JSON.parse(text);
              } catch {
                body = text.substring(0, 500); // First 500 chars if not JSON
              }
            } catch { }
          }

          responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            body,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        // Ignore errors
      }
    };

    page.on('request', requestHandler);
    if (includeResponses) {
      page.on('response', responseHandler);
    }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } else if (forceReload && !url) {
      // Force reload current page to capture AJAX requests
      try {
        await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
      } catch { }
    }

    // Trigger interactions to generate AJAX requests
    try {
      await page.evaluate(() => {
        // Scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight / 2);
        window.scrollTo(0, document.body.scrollHeight);

        // Click visible buttons that might trigger AJAX
        const clickableElements = document.querySelectorAll('button, [role="button"], .btn, [onclick]');
        clickableElements.forEach((el: any) => {
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            const text = el.textContent?.toLowerCase() || '';
            // Click safe elements (avoid dangerous buttons like delete, remove, etc.)
            if (text.includes('load') || text.includes('more') || text.includes('show')) {
              try {
                el.click();
              } catch { }
            }
          }
        });
      });
    } catch { }

    await sleep(duration);

    page.off('request', requestHandler);
    if (includeResponses) {
      page.off('response', responseHandler);
    }

    const combined = {
      totalRequests: requests.length,
      totalResponses: responses.length,
      requests: requests.slice(0, 50), // First 50
      responses: responses.slice(0, 50), // First 50
    };

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Captured ${requests.length} AJAX/XHR requests and ${responses.length} responses\n\n${JSON.stringify(combined, null, 2)}${requests.length === 0 ? '\n\n💡 Tip: Page may not have AJAX requests, or use {"forceReload": true} to capture from page load' : ''}`,
      }],
    };
  }, 'Failed to extract AJAX requests');
}



/**
 * Network Recorder - Record all network activity
 */
export async function handleNetworkRecorder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('network_recorder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const duration = args.duration || 20000;
    const filterTypes = args.filterTypes || ['video', 'xhr', 'fetch', 'media'];
    const navigateUrl = args.navigateUrl; // Optional: Navigate to URL to capture from start
    const clearCache = args.clearCache || false;
    const forceReload = args.forceReload !== false; // Force reload by default to capture events

    const networkActivity: any[] = [];

    const requestHandler = (request: any) => {
      try {
        const resourceType = request.resourceType();
        if (filterTypes.includes('all') || filterTypes.includes(resourceType)) {
          networkActivity.push({
            type: 'request',
            url: request.url(),
            method: request.method(),
            resourceType,
            headers: request.headers(),
            postData: request.postData(),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        // Ignore request errors
      }
    };

    const responseHandler = async (response: any) => {
      try {
        const resourceType = response.request().resourceType();
        if (filterTypes.includes('all') || filterTypes.includes(resourceType)) {
          const headers = response.headers();
          networkActivity.push({
            type: 'response',
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            resourceType,
            contentType: headers['content-type'] || '',
            contentLength: headers['content-length'] || '',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        // Ignore response errors
      }
    };

    // Start monitoring FIRST
    page.on('request', requestHandler);
    page.on('response', responseHandler);

    // Optional: Clear cache for fresh load
    if (clearCache) {
      try {
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCache');
        await client.detach();
      } catch { }
    }

    // Optional: Navigate to URL (capturing from start)
    if (navigateUrl) {
      try {
        await page.goto(navigateUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (e) {
        // Continue monitoring even if navigation fails
      }
    } else if (forceReload && !navigateUrl) {
      // Force reload current page to capture network events
      const currentUrl = page.url();
      try {
        await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
      } catch (e) {
        // Continue monitoring even if reload fails
      }
    }

    // Also trigger any lazy-loaded content by scrolling
    try {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 0);
      });
    } catch { }

    await sleep(duration);

    page.off('request', requestHandler);
    page.off('response', responseHandler);

    const summary = {
      totalEvents: networkActivity.length,
      requests: networkActivity.filter(e => e.type === 'request').length,
      responses: networkActivity.filter(e => e.type === 'response').length,
      byResourceType: networkActivity.reduce((acc: any, e) => {
        acc[e.resourceType] = (acc[e.resourceType] || 0) + 1;
        return acc;
      }, {})
    };

    const tipMessage = networkActivity.length === 0 ?
      `\n\n💡 Tips:\n  • Page was already loaded. Use {"navigateUrl": "https://example.com"} to capture from start\n  • Use {"filterTypes": ["all"]} to capture all network activity\n  • Use {"clearCache": true} for fresh page load` :
      '';

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Recorded ${networkActivity.length} network events\n\n📊 Summary:\n${JSON.stringify(summary, null, 2)}\n\nEvents (first 50):\n${JSON.stringify(networkActivity.slice(0, 50), null, 2)}${networkActivity.length > 50 ? '\n\n... (showing first 50 of ' + networkActivity.length + ')' : ''}${tipMessage}`,
      }],
    };
  }, 'Failed to record network');
}

/**
 * API Finder - Discover API endpoints on page
 */
export async function handleApiFinder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('api_finder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const captureDuration = typeof args.duration === 'number' ? args.duration : 8000;

    // From inline scripts
    const scriptApis = await page.evaluate(() => {
      const results: any[] = [];
      const scripts = Array.from(document.querySelectorAll('script'));

      const apiPatterns = [
        /https?:\/\/[^"'\s]+\/api\/[^"'\s]*/gi,
        /https?:\/\/api\.[^"'\s]+/gi,
        /\/api\/v?\d*\/[^"'\s]*/gi,
        /graphql/gi,
        /rest\/v?\d*/gi,
      ];

      scripts.forEach(script => {
        const content = script.textContent || '';
        apiPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => results.push({ url: match, source: 'script' }));
          }
        });
      });

      return results;
    });

    // From network (XHR/fetch)
    const networkApis: any[] = [];
    const respHandler = async (response: any) => {
      try {
        const req = response.request();
        const rt = req.resourceType();
        const url = response.url();
        const ct = (response.headers()['content-type'] || '').toLowerCase();
        if ((rt === 'xhr' || rt === 'fetch') && (ct.includes('json') || /\/api\//.test(url))) {
          networkApis.push({ url, status: response.status(), method: req.method(), source: 'network' });
        }
      } catch { }
    };
    page.on('response', respHandler);
    await sleep(captureDuration);
    page.off('response', respHandler);

    const all = [...scriptApis, ...networkApis];
    const dedup = Array.from(new Map(all.map(i => [i.url, i])).values());

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${dedup.length} API endpoints\n\n${JSON.stringify(dedup, null, 2)}`,
      }],
    };
  }, 'Failed to find APIs');
}

/**
 * Regex Pattern Finder - Find patterns using regex
 */
export async function handleRegexPatternFinder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('regex_pattern_finder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const pattern = args.pattern;
    const flags = args.flags || 'gi';

    if (!pattern) {
      throw new Error('Pattern is required');
    }

    const matches = await page.evaluate(({ pattern, flags }) => {
      const regex = new RegExp(pattern, flags);
      const results: any[] = [];

      // 1. Search in body HTML
      const html = document.body.innerHTML;
      Array.from(html.matchAll(regex)).forEach(match => {
        results.push({
          source: 'html',
          match: match[0],
          groups: match.slice(1),
          index: match.index
        });
      });

      // 2. Search in script tags
      document.querySelectorAll('script').forEach((script: any, scriptIdx) => {
        const content = script.textContent || '';
        Array.from(content.matchAll(regex)).forEach(match => {
          results.push({
            source: `script[${scriptIdx}]`,
            match: match[0],
            groups: match.slice(1),
            index: match.index,
            scriptSrc: script.src || 'inline'
          });
        });
      });

      // 3. Search in element attributes (href, src, data-* etc.)
      document.querySelectorAll('*').forEach((el: any) => {
        ['href', 'src', 'data-video', 'data-src', 'data-url'].forEach(attr => {
          const value = el.getAttribute(attr);
          if (value) {
            Array.from(value.matchAll(regex)).forEach(match => {
              results.push({
                source: `attribute[${attr}]`,
                match: match[0],
                groups: match.slice(1),
                element: el.tagName.toLowerCase(),
                attribute: attr,
                fullValue: value
              });
            });
          }
        });
      });

      // Dedupe and limit
      const seen = new Set();
      const unique = results.filter(r => {
        const key = `${r.source}:${r.match}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return unique.slice(0, 100);
    }, { pattern, flags });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${matches.length} pattern matches\n\n${JSON.stringify(matches, null, 2)}`,
      }],
    };
  }, 'Failed to find regex patterns');
}

/**
 * Iframe Extractor - Extract all iframes and their content
 */
export async function handleIframeExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('iframe_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();

    const iframes = await page.evaluate(() => {
      const frames = document.querySelectorAll('iframe');
      return Array.from(frames).map((iframe: any, idx) => ({
        index: idx,
        src: iframe.src || '',
        title: iframe.title || '',
        width: iframe.width || '',
        height: iframe.height || '',
        sandbox: iframe.sandbox?.toString() || '',
        allow: iframe.allow || '',
      }));
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${iframes.length} iframes\n\n${JSON.stringify(iframes, null, 2)}`,
      }],
    };
  }, 'Failed to extract iframes');
}

/**
 * Embed Page Extractor - Extract embedded content
 */
export async function handleEmbedPageExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('embed_page_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();

    const embeds = await page.evaluate(() => {
      const results: any = {
        iframes: [],
        objects: [],
        embeds: [],
      };

      document.querySelectorAll('iframe').forEach((el: any, idx) => {
        results.iframes.push({
          index: idx,
          src: el.src,
          title: el.title,
        });
      });

      document.querySelectorAll('object').forEach((el: any, idx) => {
        results.objects.push({
          index: idx,
          data: el.data,
          type: el.type,
        });
      });

      document.querySelectorAll('embed').forEach((el: any, idx) => {
        results.embeds.push({
          index: idx,
          src: el.src,
          type: el.type,
        });
      });

      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found embedded content\n\n${JSON.stringify(embeds, null, 2)}`,
      }],
    };
  }, 'Failed to extract embedded pages');
}

/**
 * Image Extractor - Extract all images
 */
export async function handleImageExtractorAdvanced(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('image_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const includeDataUrls = args.includeDataUrls || false;

    const images = await page.evaluate((includeDataUrls) => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).map((img: any, idx) => {
        const src = img.src || img.dataset.src || '';
        if (!includeDataUrls && src.startsWith('data:')) return null;

        return {
          index: idx,
          src,
          alt: img.alt || '',
          title: img.title || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
        };
      }).filter(Boolean);
    }, includeDataUrls);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Extracted ${images.length} images\n\n${JSON.stringify(images, null, 2)}`,
      }],
    };
  }, 'Failed to extract images');
}









/**
 * URL Redirect Tracer - Trace URL redirects
 */
export async function handleUrlRedirectTracer(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('url_redirect_tracer', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const url = args.url;

    if (!url) {
      throw new Error('URL is required');
    }

    const redirectChain: any[] = [];

    const responseHandler = (response: any) => {
      redirectChain.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        fromCache: response.fromCache(),
      });
    };

    page.on('response', responseHandler);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    page.off('response', responseHandler);

    const finalUrl = page.url();

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Redirect trace completed\n\nFinal URL: ${finalUrl}\n\nRedirect Chain:\n${JSON.stringify(redirectChain.filter(r => r.url === url || r.status >= 300 && r.status < 400), null, 2)}`,
      }],
    };
  }, 'Failed to trace redirects');
}

/**
 * User Agent Extractor - Extract user agent info
 */
export async function handleUserAgentExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('user_agent_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();

    const uaData = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory || 0,
      };
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ User Agent Information\n\n${JSON.stringify(uaData, null, 2)}`,
      }],
    };
  }, 'Failed to extract user agent');
}
