// Smart Data Extractors Module
// Advanced tools for HTML Elements, AJAX, XPath, Network Recording, Video sources extraction
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';

/**
 * HTML Elements Extractor - Extract all HTML elements with complete details
 */
export async function handleHtmlElementsExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('html_elements_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const selector = args.selector || '*';
    const maxElements = args.maxElements || 100;
    const includeStyles = args.includeStyles || false;

    const elements = await page.evaluate(({ selector, maxElements, includeStyles }) => {
      const nodes = document.querySelectorAll(selector);
      const results: any[] = [];
      
      let count = 0;
      nodes.forEach((el: any, index) => {
        if (count >= maxElements) return;
        
        const elementData: any = {
          index,
          tagName: el.tagName,
          id: el.id || null,
          className: el.className || null,
          textContent: el.textContent?.trim().substring(0, 200) || '',
          innerHTML: el.innerHTML?.substring(0, 200) || '',
          attributes: {},
        };
        
        Array.from(el.attributes).forEach((attr: any) => {
          elementData.attributes[attr.name] = attr.value;
        });
        
        if (includeStyles && el.style) {
          elementData.styles = el.style.cssText;
        }
        
        results.push(elementData);
        count++;
      });
      
      return results;
    }, { selector, maxElements, includeStyles });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Extracted ${elements.length} HTML elements\n\n${JSON.stringify(elements, null, 2)}`,
      }],
    };
  }, 'Failed to extract HTML elements');
}

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
 * AJAX Extractor - Extract AJAX/XHR request data
 */
export async function handleAjaxExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('ajax_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const duration = args.duration || 5000;
    const url = args.url;
    
    const requests: any[] = [];
    
    const requestHandler = (request: any) => {
      const resourceType = request.resourceType();
      if (resourceType === 'xhr' || resourceType === 'fetch') {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType,
          headers: request.headers(),
          timestamp: new Date().toISOString(),
        });
      }
    };
    
    page.on('request', requestHandler);
    
    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2' });
    }
    
    await page.waitForTimeout(duration);
    page.off('request', requestHandler);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Captured ${requests.length} AJAX/XHR requests\n\n${JSON.stringify(requests, null, 2)}`,
      }],
    };
  }, 'Failed to extract AJAX requests');
}

/**
 * Fetch XHR - Capture fetch and XHR requests
 */
export async function handleFetchXHR(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('fetch_xhr', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const duration = args.duration || 5000;
    
    const xhrData: any[] = [];
    const responseHandler = async (response: any) => {
      const request = response.request();
      const resourceType = request.resourceType();
      
      if (resourceType === 'xhr' || resourceType === 'fetch') {
        try {
          const body = await response.text();
          xhrData.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            method: request.method(),
            body: body.substring(0, 1000), // First 1000 chars
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          // Response body not available
        }
      }
    };
    
    page.on('response', responseHandler);
    await page.waitForTimeout(duration);
    page.off('response', responseHandler);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Captured ${xhrData.length} Fetch/XHR responses\n\n${JSON.stringify(xhrData, null, 2)}`,
      }],
    };
  }, 'Failed to fetch XHR');
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
    const duration = args.duration || 10000;
    const filterTypes = args.filterTypes || ['all'];
    
    const networkActivity: any[] = [];
    
    const requestHandler = (request: any) => {
      const resourceType = request.resourceType();
      if (filterTypes.includes('all') || filterTypes.includes(resourceType)) {
        networkActivity.push({
          type: 'request',
          url: request.url(),
          method: request.method(),
          resourceType,
          timestamp: new Date().toISOString(),
        });
      }
    };
    
    const responseHandler = (response: any) => {
      const resourceType = response.request().resourceType();
      if (filterTypes.includes('all') || filterTypes.includes(resourceType)) {
        networkActivity.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          resourceType,
          timestamp: new Date().toISOString(),
        });
      }
    };
    
    page.on('request', requestHandler);
    page.on('response', responseHandler);
    
    await page.waitForTimeout(duration);
    
    page.off('request', requestHandler);
    page.off('response', responseHandler);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Recorded ${networkActivity.length} network events\n\n${JSON.stringify(networkActivity.slice(0, 50), null, 2)}${networkActivity.length > 50 ? '\n\n... (showing first 50)' : ''}`,
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
    
    const apis = await page.evaluate(() => {
      const results: any[] = [];
      const scripts = Array.from(document.querySelectorAll('script'));
      
      const apiPatterns = [
        /https?:\/\/[^"'\s]+\/api\/[^"'\s]*/gi,
        /https?:\/\/api\.[^"'\s]+/gi,
        /\/api\/v?\d*\/[^"'\s]*/gi,
      ];
      
      scripts.forEach(script => {
        const content = script.textContent || '';
        apiPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => results.push({
              url: match,
              source: 'script',
            }));
          }
        });
      });
      
      return [...new Set(results.map(r => r.url))].map(url => ({ url, source: 'script' }));
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${apis.length} API endpoints\n\n${JSON.stringify(apis, null, 2)}`,
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
      const html = document.body.innerHTML;
      const results = Array.from(html.matchAll(regex));
      
      return results.slice(0, 100).map((match, idx) => ({
        index: idx,
        match: match[0],
        groups: match.slice(1),
      }));
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
 * Video Source Extractor - Extract video sources
 */
export async function handleVideoSourceExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_source_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const videos = await page.evaluate(() => {
      const videoElements = document.querySelectorAll('video');
      const results: any[] = [];
      
      videoElements.forEach((video: any, idx) => {
        const sources: any[] = [];
        
        // Direct src
        if (video.src) {
          sources.push({ src: video.src, type: video.type || 'unknown' });
        }
        
        // Source elements
        video.querySelectorAll('source').forEach((source: any) => {
          sources.push({
            src: source.src,
            type: source.type || 'unknown',
          });
        });
        
        results.push({
          index: idx,
          poster: video.poster || '',
          sources,
          duration: video.duration || 0,
          width: video.videoWidth || video.width || 0,
          height: video.videoHeight || video.height || 0,
        });
      });
      
      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Extracted ${videos.length} video sources\n\n${JSON.stringify(videos, null, 2)}`,
      }],
    };
  }, 'Failed to extract video sources');
}

/**
 * Video Player Extractor - Extract video player information
 */
export async function handleVideoPlayerExtractor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_player_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const players = await page.evaluate(() => {
      const results: any[] = [];
      
      // Common video player classes/IDs
      const playerSelectors = [
        '[class*="video-player"]',
        '[class*="player"]',
        '[id*="player"]',
        '[data-player]',
      ];
      
      playerSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el: any, idx) => {
          const videoEl = el.querySelector('video') || el.querySelector('iframe');
          if (videoEl) {
            results.push({
              selector,
              index: idx,
              hasVideo: !!el.querySelector('video'),
              hasIframe: !!el.querySelector('iframe'),
              src: videoEl.src || videoEl.currentSrc || '',
              className: el.className,
              id: el.id,
            });
          }
        });
      });
      
      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${players.length} video players\n\n${JSON.stringify(players, null, 2)}`,
      }],
    };
  }, 'Failed to extract video players');
}

/**
 * Video Player Hoster Finder - Detect video hosting platform
 */
export async function handleVideoPlayerHosterFinder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_player_hoster_finder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const hosters = await page.evaluate(() => {
      const results: any[] = [];
      const iframes = document.querySelectorAll('iframe');
      
      const platforms: any = {
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'vimeo.com': 'Vimeo',
        'dailymotion.com': 'Dailymotion',
        'facebook.com': 'Facebook',
        'twitter.com': 'Twitter',
        'twitch.tv': 'Twitch',
        'streamable.com': 'Streamable',
      };
      
      iframes.forEach((iframe: any, idx) => {
        const src = iframe.src.toLowerCase();
        
        for (const [domain, platform] of Object.entries(platforms)) {
          if (src.includes(domain)) {
            results.push({
              index: idx,
              platform,
              src: iframe.src,
              title: iframe.title || '',
            });
            break;
          }
        }
      });
      
      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${hosters.length} video hosting platforms\n\n${JSON.stringify(hosters, null, 2)}`,
      }],
    };
  }, 'Failed to find video hosters');
}

/**
 * Original Video Hoster Finder - Find original video source
 */
export async function handleOriginalVideoHosterFinder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('original_video_hoster_finder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const videoData = await page.evaluate(() => {
      const results: any = {
        directVideos: [],
        iframeVideos: [],
        possibleSources: [],
      };
      
      // Direct video elements
      document.querySelectorAll('video').forEach((video: any) => {
        const src = video.src || video.currentSrc;
        if (src) {
          results.directVideos.push({
            src,
            type: 'direct',
            poster: video.poster,
          });
        }
        
        video.querySelectorAll('source').forEach((source: any) => {
          results.directVideos.push({
            src: source.src,
            type: source.type,
            quality: source.dataset.quality || 'unknown',
          });
        });
      });
      
      // Iframe videos
      document.querySelectorAll('iframe[src*="video"], iframe[src*="player"]').forEach((iframe: any) => {
        results.iframeVideos.push({
          src: iframe.src,
          type: 'iframe',
        });
      });
      
      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video sources found\n\n${JSON.stringify(videoData, null, 2)}`,
      }],
    };
  }, 'Failed to find original video hoster');
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
