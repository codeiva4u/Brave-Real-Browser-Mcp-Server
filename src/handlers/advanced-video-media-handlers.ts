// Advanced Video & Media Download Tools - OPTIMIZED
// Specialized tools for video link finding, download buttons, and media extraction
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling, sleep } from '../system-utils.js';
import { TOOL_OPTIMIZATION_CONFIG, globalCache, deduplicateResults, VIDEO_HOSTERS_DB, SELECTOR_UTILS, globalMetrics, createErrorHandler } from '../optimization-utils.js';

/**
 * Video Link Finder - Find all video links on page
 */
export async function handleVideoLinkFinder(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_link_finder', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const includeEmbedded = args.includeEmbedded !== false;
    const captureDuration = typeof args.captureDuration === 'number' ? args.captureDuration : 7000;

    // 1) Collect DOM-based links quickly
    const domLinks = await page.evaluate((includeEmbedded) => {
      const results: any[] = [];

      // Direct video links
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8', '.mpd'];
      const allLinks = document.querySelectorAll('a[href]');

      allLinks.forEach((link: any, idx) => {
        const href = (link.href || '').toLowerCase();
        videoExtensions.forEach(ext => {
          if (href.includes(ext)) {
            results.push({
              index: idx,
              url: link.href,
              text: link.textContent?.trim() || '',
              type: 'direct_video',
              extension: ext,
            });
          }
        });
      });

      // Video elements
      document.querySelectorAll('video').forEach((video: any, idx) => {
        const src = video.src || video.currentSrc;
        if (src) {
          results.push({
            index: idx,
            url: src,
            type: 'video_element',
            poster: video.poster || '',
          });
        }
      });

      // Embedded videos (iframes)
      if (includeEmbedded) {
        document.querySelectorAll('iframe').forEach((iframe: any, idx) => {
          if (iframe.src) {
            results.push({
              index: idx,
              url: iframe.src,
              type: 'embedded_video',
              title: iframe.title || '',
            });
          }
        });
      }

      return results;
    }, includeEmbedded);

    // 2) Network sniff for streaming links (.m3u8/.mpd/.ts/.vtt)
    const streamingLinks: any[] = [];
    const respHandler = (response: any) => {
      try {
        const url = response.url();
        const ct = (response.headers()['content-type'] || '').toLowerCase();
        const isStream = /\.m3u8(\?|$)|\.mpd(\?|$)|\.ts(\?|$)|\.vtt(\?|$)/i.test(url) ||
                         ct.includes('application/vnd.apple.mpegurl') || ct.includes('application/x-mpegurl');
        if (isStream) {
          streamingLinks.push({ url, contentType: ct, status: response.status() });
        }
      } catch {}
    };
    page.on('response', respHandler);

    // Try to "play" iframe/player so network requests fire
    try {
      const clickPoint = await page.evaluate(() => {
        const iframe = document.querySelector('iframe');
        if (!iframe) return null as any;
        const r = iframe.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (clickPoint && typeof clickPoint.x === 'number') {
        await page.mouse.click(clickPoint.x, clickPoint.y, { clickCount: 1 });
      }
    } catch {}

    await sleep(captureDuration);
    page.off('response', respHandler);

    // Dedupe by URL
    const uniqueStreams = Array.from(new Map(streamingLinks.map(i => [i.url, i])).values());
    const resultSummary = {
      domLinksCount: domLinks.length,
      networkStreamsCount: uniqueStreams.length,
      domLinks,
      streamingLinks: uniqueStreams,
    };

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video links (DOM + Network)\n\n${JSON.stringify(resultSummary, null, 2)}`,
      }],
    };
  }, 'Failed to find video links');
}

/**
 * Video Download Page - Detect video download pages
 */
export async function handleVideoDownloadPage(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_download_page', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const downloadPageInfo = await page.evaluate(() => {
      const indicators = {
        hasVideoElement: !!document.querySelector('video'),
        hasDownloadButton: !!document.querySelector('[download], button:contains("Download"), a:contains("Download")'),
        hasVideoPlayer: !!document.querySelector('[class*="player"], [id*="player"]'),
        videoSources: [] as any[],
        downloadLinks: [] as any[],
      };
      
      // Get video sources
      document.querySelectorAll('video').forEach((video: any) => {
        if (video.src) {
          indicators.videoSources.push({
            src: video.src,
            type: 'direct',
          });
        }
        
        video.querySelectorAll('source').forEach((source: any) => {
          indicators.videoSources.push({
            src: source.src,
            type: source.type,
            quality: source.dataset.quality || 'unknown',
          });
        });
      });
      
      // Find download buttons/links
      const downloadSelectors = [
        'a[download]',
        'button[download]',
        'a[href*=".mp4"]',
        'a[href*=".webm"]',
        'a[class*="download"]',
        'button[class*="download"]',
      ];
      
      downloadSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el: any) => {
          indicators.downloadLinks.push({
            href: el.href || el.getAttribute('href'),
            text: el.textContent?.trim() || '',
            tag: el.tagName.toLowerCase(),
          });
        });
      });
      
      return indicators;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video Download Page Analysis\n\n${JSON.stringify(downloadPageInfo, null, 2)}`,
      }],
    };
  }, 'Failed to analyze video download page');
}

/**
 * Video Download Button - Find and interact with download buttons
 */
export async function handleVideoDownloadButton(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_download_button', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const action = args.action || 'find'; // find, click
    const customSelector = args.selector;
    
    if (action === 'find') {
      const buttons = await page.evaluate(() => {
        const results: any[] = [];
        const selectors = [
          'a[download]',
          'button[download]',
          'a[class*="download"]',
          'button[class*="download"]',
          'a:contains("Download")',
          'button:contains("Download")',
          '[data-download]',
          '[onclick*="download"]',
        ];
        
        selectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach((el: any, idx) => {
              results.push({
                index: idx,
                selector: selector,
                text: el.textContent?.trim() || '',
                href: el.href || el.getAttribute('href'),
                hasDownloadAttr: el.hasAttribute('download'),
                isVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
              });
            });
          } catch (e) {
            // Selector not supported
          }
        });
        
        return results;
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Found ${buttons.length} download buttons\n\n${JSON.stringify(buttons, null, 2)}`,
        }],
      };
    }
    
    if (action === 'click') {
      const selector = customSelector || 'a[download], button[download]';
      
      try {
        await page.click(selector);
        await sleep(2000);
        
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Download button clicked: ${selector}`,
          }],
        };
      } catch (e) {
        return {
          content: [{
            type: 'text' as const,
            text: `❌ Failed to click download button: ${e}`,
          }],
        };
      }
    }

    throw new Error(`Unknown action: ${action}`);
  }, 'Failed video download button handler');
}

/**
 * Video Play Push Source - Find video sources from play button
 */
export async function handleVideoPlayPushSource(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_play_push_source', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    // Monitor network for video sources when play is clicked
    const videoSources: any[] = [];
    
    const responseHandler = async (response: any) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.includes('video') || 
          url.includes('.m3u8') || 
          url.includes('.mpd') ||
          url.includes('.mp4') ||
          url.includes('.webm')) {
        videoSources.push({
          url,
          contentType,
          status: response.status(),
        });
      }
    };
    
    page.on('response', responseHandler);
    
    // Try to find and click play button
    const playSelectors = [
      'button[class*="play"]',
      '[class*="play-button"]',
      '[aria-label*="Play"]',
      '.video-play',
      '#play-button',
    ];
    
    let clicked = false;
    for (const selector of playSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        clicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    // Wait for sources to load
    await sleep(3000);
    page.off('response', responseHandler);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video sources captured\n\nPlay button clicked: ${clicked}\nSources found: ${videoSources.length}\n\n${JSON.stringify(videoSources, null, 2)}`,
      }],
    };
  }, 'Failed to capture video play sources');
}

/**
 * Video Play Button Click - Click video play button
 */
export async function handleVideoPlayButtonClick(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_play_button_click', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const customSelector = args.selector;
    
    const playSelectors = customSelector ? [customSelector] : [
      'button[class*="play"]',
      '[class*="play-button"]',
      '[aria-label*="Play"]',
      'button[title*="Play"]',
      '.video-play',
      '#play-button',
      'video', // Direct video element
    ];
    
    for (const selector of playSelectors) {
      try {
        const element = await page.$(selector);
        
        if (element) {
          if (selector === 'video') {
            // For video element, use play() method
            await page.evaluate(() => {
              const video = document.querySelector('video') as any;
              if (video) video.play();
            });
          } else {
            await element.click();
          }
          
          return {
            content: [{
              type: 'text' as const,
              text: `✅ Play button clicked: ${selector}`,
            }],
          };
        }
      } catch (e) {
        // Try next selector
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `❌ No play button found`,
      }],
    };
  }, 'Failed to click play button');
}

/**
 * URL Redirect Trace Endpoints - Trace all redirect endpoints
 */
export async function handleUrlRedirectTraceEndpoints(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('url_redirect_trace_endpoints', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const url = args.url;
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    const redirectChain: any[] = [];
    const endpoints: any[] = [];
    
    const responseHandler = (response: any) => {
      const status = response.status();
      const respUrl = response.url();
      
      redirectChain.push({
        url: respUrl,
        status,
        statusText: response.statusText(),
        headers: response.headers(),
        isRedirect: status >= 300 && status < 400,
      });
      
      if (status >= 300 && status < 400) {
        const location = response.headers()['location'];
        if (location) {
          endpoints.push({
            from: respUrl,
            to: location,
            status,
          });
        }
      }
    };
    
    page.on('response', responseHandler);
    await page.goto(url, { waitUntil: 'networkidle2' });
    page.off('response', responseHandler);
    
    const finalUrl = page.url();

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Redirect Trace Complete\n\nOriginal: ${url}\nFinal: ${finalUrl}\n\nRedirect Endpoints:\n${JSON.stringify(endpoints, null, 2)}\n\nFull Chain:\n${JSON.stringify(redirectChain.filter(r => r.isRedirect), null, 2)}`,
      }],
    };
  }, 'Failed to trace redirect endpoints');
}

/**
 * Network Recording Finder - Find and analyze network recordings
 */
export async function handleNetworkRecordingFinder(args: any) {
  try {
    const validation = validateWorkflow('network_recording_finder', {
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
    const duration = args.duration || 10000;
    const filterType = args.filterType || 'video'; // video, audio, media
    const navigateTo = args.navigateTo; // Optional URL to navigate to
    const verbose = args.verbose !== false; // Default true for detailed logging
    
    const recordings: any[] = [];
    let totalResponses = 0;
    let matchedResponses = 0;
    
    const responseHandler = async (response: any) => {
      try {
        totalResponses++;
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        const resourceType = response.request().resourceType();
        
        if (verbose && totalResponses % 10 === 0) {
          console.log(`[Network Recording] Processed ${totalResponses} responses, ${matchedResponses} matched`);
        }
        
        let shouldRecord = false;

        const urlLower = url.toLowerCase();
        const isStreamAsset = /\.m3u8(\?|$)|\.mpd(\?|$)|\.ts(\?|$)|\.vtt(\?|$)|\.mp4(\?|$)|\.webm(\?|$)/i.test(urlLower) ||
                              contentType.includes('application/vnd.apple.mpegurl') ||
                              contentType.includes('application/x-mpegurl');

        if (filterType === 'video' && (contentType.includes('video') || resourceType === 'media' || isStreamAsset)) {
          shouldRecord = true;
        } else if (filterType === 'audio' && contentType.includes('audio')) {
          shouldRecord = true;
        } else if (filterType === 'media' && (contentType.includes('video') || contentType.includes('audio') || isStreamAsset)) {
          shouldRecord = true;
        }

        if (shouldRecord) {
          matchedResponses++;
          if (verbose) {
            console.log(`[Network Recording] ✅ Matched ${filterType}: ${url.substring(0, 100)}`);
          }
          try {
            const buffer = await response.buffer();
            recordings.push({
              url,
              contentType,
              size: buffer.length,
              status: response.status(),
              timestamp: new Date().toISOString(),
            });
          } catch (e) {
            recordings.push({
              url,
              contentType,
              status: response.status(),
              error: 'Could not capture buffer',
            });
          }
        }
      } catch (e) {
        // Ignore individual response errors
      }
    };
    
    console.log(`[Network Recording] 🎬 Starting monitoring for ${filterType} (${duration}ms)${navigateTo ? ` + navigating to ${navigateTo}` : ''}`);
    page.on('response', responseHandler);
    
    // If navigateTo is provided, navigate first, then wait
    if (navigateTo) {
      try {
        await page.goto(navigateTo, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`[Network Recording] ✅ Navigation complete, continuing monitoring...`);
      } catch (e) {
        console.log(`[Network Recording] ⚠️ Navigation error (continuing anyway): ${e}`);
      }
    }
    
    await sleep(duration);
    page.off('response', responseHandler);
    console.log(`[Network Recording] 🛑 Monitoring stopped. Total: ${totalResponses}, Matched: ${matchedResponses}, Recorded: ${recordings.length}`);

    if (recordings.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: `ℹ️ No ${filterType} recordings found\n\n📊 Statistics:\n  • Total responses checked: ${totalResponses}\n  • Matched ${filterType} responses: ${matchedResponses}\n  • Duration: ${duration}ms\n  • Navigation: ${navigateTo || 'None'}\n\n💡 Suggestions:\n  ${navigateTo ? '• Try longer duration if page loads slowly\n  • Check if page actually has video/media content' : '• Use navigateTo parameter to capture requests during page load\n  • Example: {"navigateTo": "https://example.com", "duration": 15000}'}\n  • Consider 'advanced_video_extraction' for analyzing loaded content`,
        }],
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Network Recordings Found: ${recordings.length}\n\n📊 Statistics:\n  • Total responses: ${totalResponses}\n  • Matched: ${matchedResponses}\n  • Recorded: ${recordings.length}\n\n${JSON.stringify(recordings, null, 2)}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text' as const,
        text: `❌ Network recording finder failed: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

/**
 * Network Recording Extractors - Extract data from network recordings
 */
export async function handleNetworkRecordingExtractors(args: any) {
  try {
    const validation = validateWorkflow('network_recording_extractors', {
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
    const duration = args.duration || 10000;
    const navigateTo = args.navigateTo; // Optional URL to navigate to
    const verbose = args.verbose !== false; // Default true
    
    const extractedData: any = {
      videos: [],
      audio: [],
      manifests: [],
      apis: [],
    };
    let totalResponses = 0;
    
    const responseHandler = async (response: any) => {
      totalResponses++;
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      try {
        // Video files
        if (contentType.includes('video') || url.includes('.mp4') || url.includes('.webm')) {
          if (verbose) console.log(`[Extractor] 🎥 Video found: ${url.substring(0, 80)}`);
          extractedData.videos.push({
            url,
            contentType,
            size: response.headers()['content-length'],
          });
        }
        
        // Audio files
        if (contentType.includes('audio') || url.includes('.mp3') || url.includes('.m4a')) {
          if (verbose) console.log(`[Extractor] 🎵 Audio found: ${url.substring(0, 80)}`);
          extractedData.audio.push({
            url,
            contentType,
          });
        }
        
        // Manifest files (HLS, DASH)
        if (url.includes('.m3u8') || url.includes('.mpd')) {
          if (verbose) console.log(`[Extractor] 📜 Manifest found: ${url.substring(0, 80)}`);
          const text = await response.text();
          extractedData.manifests.push({
            url,
            type: url.includes('.m3u8') ? 'HLS' : 'DASH',
            content: text.substring(0, 500),
          });
        }
        
        // API responses with video data
        if (contentType.includes('json') && (url.includes('video') || url.includes('media'))) {
          if (verbose) console.log(`[Extractor] 📡 API found: ${url.substring(0, 80)}`);
          const json = await response.json();
          extractedData.apis.push({
            url,
            data: json,
          });
        }
      } catch (e) {
        // Response not available
      }
    };
    
    console.log(`[Extractor] 🎬 Starting extraction (${duration}ms)${navigateTo ? ` + navigating to ${navigateTo}` : ''}`);
    page.on('response', responseHandler);
    
    // If navigateTo is provided, navigate first, then wait
    if (navigateTo) {
      try {
        await page.goto(navigateTo, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`[Extractor] ✅ Navigation complete, continuing extraction...`);
      } catch (e) {
        console.log(`[Extractor] ⚠️ Navigation error (continuing): ${e}`);
      }
    }
    
    await sleep(duration);
    page.off('response', responseHandler);

    const totalFound = extractedData.videos.length + extractedData.audio.length + 
                       extractedData.manifests.length + extractedData.apis.length;
    console.log(`[Extractor] 🛑 Extraction complete. Total responses: ${totalResponses}, Extracted: ${totalFound}`);

    if (totalFound === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: `ℹ️ No media content extracted\n\n📊 Statistics:\n  • Total responses checked: ${totalResponses}\n  • Duration: ${duration}ms\n  • Navigation: ${navigateTo || 'None'}\n\n💡 Suggestions:\n  ${navigateTo ? '• Try longer duration (15000-20000ms)\n  • Verify page actually contains video/media' : '• Add navigateTo parameter: {"navigateTo": "https://example.com", "duration": 15000}'}\n  • Use 'advanced_video_extraction' for analyzing loaded content\n  • Check browser console logs for detailed monitoring`,
        }],
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Network Recording Extraction Complete\n\n📊 Results:\n  • Videos: ${extractedData.videos.length}\n  • Audio: ${extractedData.audio.length}\n  • Manifests: ${extractedData.manifests.length}\n  • APIs: ${extractedData.apis.length}\n  • Total responses: ${totalResponses}\n\n${JSON.stringify(extractedData, null, 2)}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text' as const,
        text: `❌ Network recording extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

/**
 * Video Links Finders - Advanced video link detection
 */
export async function handleVideoLinksFinders(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_links_finders', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const captureDuration = typeof args.captureDuration === 'number' ? args.captureDuration : 7000;

    // DOM discovery first
    const videoLinks = await page.evaluate(() => {
      const results: any = {
        directLinks: [],
        embeddedLinks: [],
        streamingLinks: [],
        playerLinks: [],
      };

      // Direct video links
      document.querySelectorAll('a[href]').forEach((link: any) => {
        const href = (link.href || '').toLowerCase();
        if (href.includes('.mp4') || href.includes('.webm') || href.includes('.mov')) {
          results.directLinks.push({
            url: link.href,
            text: link.textContent?.trim(),
          });
        }
      });

      // Embedded iframes
      document.querySelectorAll('iframe').forEach((iframe: any) => {
        if (iframe.src) {
          results.embeddedLinks.push({
            url: iframe.src,
            title: iframe.title,
          });
        }
      });

      // Streaming manifests present in inline scripts
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(script => {
        const content = script.textContent || '';
        const m3u8Match = content.match(/https?:\/\/[^\s"']+\.m3u8/g);
        const mpdMatch = content.match(/https?:\/\/[^\s"']+\.mpd/g);

        if (m3u8Match) {
          m3u8Match.forEach(url => results.streamingLinks.push({ url, type: 'HLS', source: 'inline' }));
        }
        if (mpdMatch) {
          mpdMatch.forEach(url => results.streamingLinks.push({ url, type: 'DASH', source: 'inline' }));
        }
      });

      // Video player links
      document.querySelectorAll('[class*="player"], [id*="player"]').forEach((player: any) => {
        const video = player.querySelector('video');
        if (video && video.src) {
          results.playerLinks.push({
            url: video.src,
            poster: video.poster,
          });
        }
      });

      return results;
    });

    // Network enrichment (m3u8/mpd/ts/vtt)
    const networkStreams: any[] = [];
    const respHandler = (response: any) => {
      try {
        const url = response.url();
        const ct = (response.headers()['content-type'] || '').toLowerCase();
        if (/\.m3u8(\?|$)|\.mpd(\?|$)|\.ts(\?|$)|\.vtt(\?|$)/i.test(url) ||
            ct.includes('application/vnd.apple.mpegurl') || ct.includes('application/x-mpegurl')) {
          const type = url.includes('.mpd') ? 'DASH' : url.includes('.m3u8') ? 'HLS' : 'segment';
          networkStreams.push({ url, type, contentType: ct, status: response.status(), source: 'network' });
        }
      } catch {}
    };
    page.on('response', respHandler);

    // Nudge the player by clicking the visible iframe center (if any)
    try {
      const clickPoint = await page.evaluate(() => {
        const iframe = document.querySelector('iframe');
        if (!iframe) return null as any;
        const r = iframe.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (clickPoint && typeof clickPoint.x === 'number') {
        await page.mouse.click(clickPoint.x, clickPoint.y, { clickCount: 1 });
      }
    } catch {}

    await sleep(captureDuration);
    page.off('response', respHandler);

    // Merge + dedupe
    const merged = {
      ...videoLinks,
      streamingLinks: Array.from(new Map([...videoLinks.streamingLinks, ...networkStreams].map((i: any) => [i.url, i])).values()),
    };

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video Links Found\n\n${JSON.stringify(merged, null, 2)}`,
      }],
    };
  }, 'Failed to find video links');
}

/**
 * Videos Selectors - Get all video-related selectors
 */
export async function handleVideosSelectors(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('videos_selectors', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const selectors = await page.evaluate(() => {
      const results: any = {
        videoElements: [],
        playerContainers: [],
        controlButtons: [],
        sources: [],
      };
      
      // Video elements
      document.querySelectorAll('video').forEach((video: any, idx) => {
        const selector = video.id ? `#${video.id}` : 
                        video.className ? `.${video.className.split(' ')[0]}` :
                        `video:nth-of-type(${idx + 1})`;
        
        results.videoElements.push({
          selector,
          src: video.src,
          hasControls: video.controls,
        });
      });
      
      // Player containers
      ['[class*="player"]', '[id*="player"]', '[data-player]'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el: any) => {
          results.playerContainers.push({
            selector: sel,
            id: el.id,
            className: el.className,
          });
        });
      });
      
      // Control buttons
      ['[class*="play"]', '[class*="pause"]', '[aria-label*="Play"]'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el: any) => {
          results.controlButtons.push({
            selector: sel,
            text: el.textContent?.trim(),
            ariaLabel: el.getAttribute('aria-label'),
          });
        });
      });
      
      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video Selectors Found\n\n${JSON.stringify(selectors, null, 2)}`,
      }],
    };
  }, 'Failed to get video selectors');
}

/**
 * Link Process Extracts - Process and extract links
 */
export async function handleLinkProcessExtracts(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('link_process_extracts', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const processType = args.processType || 'all'; // all, video, download, external
    
    const processedLinks = await page.evaluate((type) => {
      const results: any = {
        processed: [],
        categorized: {
          video: [],
          download: [],
          external: [],
          internal: [],
        },
      };
      
      const currentDomain = window.location.hostname;
      
      document.querySelectorAll('a[href]').forEach((link: any, idx) => {
        const href = link.href;
        const text = link.textContent?.trim() || '';
        
        const linkData: any = {
          index: idx,
          url: href,
          text,
          processed: true,
        };
        
        // Categorize
        if (href.includes('.mp4') || href.includes('.webm') || href.includes('video')) {
          linkData.category = 'video';
          results.categorized.video.push(linkData);
        } else if (link.hasAttribute('download') || href.includes('download')) {
          linkData.category = 'download';
          results.categorized.download.push(linkData);
        } else {
          try {
            const url = new URL(href);
            if (url.hostname === currentDomain) {
              linkData.category = 'internal';
              results.categorized.internal.push(linkData);
            } else {
              linkData.category = 'external';
              results.categorized.external.push(linkData);
            }
          } catch (e) {
            linkData.category = 'invalid';
          }
        }
        
        results.processed.push(linkData);
      });
      
      return results;
    }, processType);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Links Processed\n\nTotal: ${processedLinks.processed.length}\nVideo: ${processedLinks.categorized.video.length}\nDownload: ${processedLinks.categorized.download.length}\n\n${JSON.stringify(processedLinks, null, 2)}`,
      }],
    };
  }, 'Failed to process links');
}

/**
 * Video Link Finders Extracts - Extract video links with metadata
 */
export async function handleVideoLinkFindersExtracts(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_link_finders_extracts', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const extracted = await page.evaluate(() => {
      const results: any[] = [];
      
      // Method 1: Direct video links
      document.querySelectorAll('a[href]').forEach((link: any) => {
        const href = link.href.toLowerCase();
        if (href.includes('.mp4') || href.includes('.webm')) {
          results.push({
            method: 'direct_link',
            url: link.href,
            text: link.textContent?.trim(),
            quality: link.dataset.quality || 'unknown',
          });
        }
      });
      
      // Method 2: Video elements
      document.querySelectorAll('video').forEach((video: any) => {
        if (video.src) {
          results.push({
            method: 'video_element',
            url: video.src,
            poster: video.poster,
            duration: video.duration,
          });
        }
        
        video.querySelectorAll('source').forEach((source: any) => {
          results.push({
            method: 'source_element',
            url: source.src,
            type: source.type,
            quality: source.dataset.quality || source.dataset.res || 'unknown',
          });
        });
      });
      
      // Method 3: Data attributes
      document.querySelectorAll('[data-video], [data-src]').forEach((el: any) => {
        const videoUrl = el.dataset.video || el.dataset.src;
        if (videoUrl) {
          results.push({
            method: 'data_attribute',
            url: videoUrl,
            element: el.tagName,
          });
        }
      });
      
      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video Links Extracted: ${extracted.length}\n\n${JSON.stringify(extracted, null, 2)}`,
      }],
    };
  }, 'Failed to extract video links');
}

/**
 * Video Download Button Finders - Find all video download buttons
 */
export async function handleVideoDownloadButtonFinders(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('video_download_button_finders', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const downloadButtons = await page.evaluate(() => {
      const results: any[] = [];
      
      const buttonPatterns = [
        'button[class*="download"]',
        'a[class*="download"]',
        '[data-download]',
        'button:contains("Download")',
        'a:contains("Download")',
        'button:contains("Save")',
        '[onclick*="download"]',
        '[href*="download"]',
      ];
      
      buttonPatterns.forEach(pattern => {
        try {
          document.querySelectorAll(pattern).forEach((btn: any, idx) => {
            const isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0;
            
            results.push({
              pattern,
              index: idx,
              text: btn.textContent?.trim() || '',
              href: btn.href || btn.getAttribute('href'),
              dataDownload: btn.dataset.download,
              isVisible,
              tag: btn.tagName.toLowerCase(),
              className: btn.className,
              id: btn.id,
            });
          });
        } catch (e) {
          // Pattern not supported
        }
      });
      
      return results;
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${downloadButtons.length} download buttons\n\n${JSON.stringify(downloadButtons, null, 2)}`,
      }],
    };
  }, 'Failed to find download buttons');
}
