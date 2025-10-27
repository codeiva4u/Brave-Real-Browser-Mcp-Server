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
    
    // Enhanced play button selectors
    const playSelectors = [
      'button[class*="play"]',
      '[class*="play-button"]',
      '[class*="btn-play"]',
      '[aria-label*="Play"]',
      '[aria-label*="play"]',
      'button[title*="Play"]',
      'button[title*="play"]',
      '.video-play',
      '#play-button',
      '#playButton',
      '.play-btn',
      'video', // Direct video element
      // Icon-based play buttons
      '[class*="fa-play"]',
      '[class*="icon-play"]',
      'i[class*="play"]',
    ];
    
    let clicked = false;
    let clickMethod = 'none';
    
    // Try clicking play buttons
    for (const selector of playSelectors) {
      try {
        if (selector === 'video') {
          // Try to play video directly
          const played = await page.evaluate(() => {
            const videos = document.querySelectorAll('video');
            let success = false;
            videos.forEach((video: any) => {
              try {
                video.play();
                success = true;
              } catch (e) {}
            });
            return success;
          });
          if (played) {
            clicked = true;
            clickMethod = 'video.play()';
            break;
          }
        } else {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            clicked = true;
            clickMethod = selector;
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    // If no play button found, try clicking center of iframe
    if (!clicked) {
      try {
        const iframeClicked = await page.evaluate(() => {
          const iframe = document.querySelector('iframe');
          if (iframe) {
            const rect = iframe.getBoundingClientRect();
            const event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2
            });
            iframe.dispatchEvent(event);
            return true;
          }
          return false;
        });
        
        if (iframeClicked) {
          clicked = true;
          clickMethod = 'iframe-click';
        }
      } catch (e) {}
    }
    
    // Wait for sources to load (longer wait for iframe-based)
    await sleep(5000);
    page.off('response', responseHandler);

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Video sources captured\n\n📊 Status:\n  • Interaction attempted: ${clicked ? 'Yes' : 'No'}\n  • Method: ${clickMethod}\n  • Sources found: ${videoSources.length}\n\n${videoSources.length > 0 ? JSON.stringify(videoSources, null, 2) : '💡 Tip: This site may use iframe-embedded videos. Try navigating to the iframe URL and using advanced_video_extraction.'}`,
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
    
    // Enhanced play button selectors
    const defaultSelectors = [
      'button[class*="play"]',
      '[class*="play-button"]',
      '[class*="btn-play"]',
      '[aria-label*="Play"]',
      '[aria-label*="play"]',
      'button[title*="Play"]',
      'button[title*="play"]',
      '.video-play',
      '.play-btn',
      '#play-button',
      '#playButton',
      // Icon-based
      'button i[class*="play"]',
      'button i[class*="fa-play"]',
      '[class*="fa-play"]',
      '[class*="icon-play"]',
      // Video element
      'video',
    ];
    
    const playSelectors = customSelector ? [customSelector] : defaultSelectors;
    
    const results: any = {
      attempted: [],
      clicked: false,
      method: 'none',
      selector: null
    };
    
    for (const selector of playSelectors) {
      try {
        if (selector === 'video') {
          // For video element, use play() method
          const played = await page.evaluate(() => {
            const videos = document.querySelectorAll('video');
            let success = false;
            videos.forEach((video: any) => {
              try {
                video.play();
                success = true;
              } catch (e) {}
            });
            return success;
          });
          
          results.attempted.push({ selector, found: played });
          
          if (played) {
            results.clicked = true;
            results.method = 'video.play()';
            results.selector = selector;
            
            return {
              content: [{
                type: 'text' as const,
                text: `✅ Play button clicked\n\n📊 Details:\n  • Method: ${results.method}\n  • Selector: ${selector}\n  • Attempts: ${results.attempted.length}`,
              }],
            };
          }
        } else {
          const element = await page.$(selector);
          results.attempted.push({ selector, found: !!element });
          
          if (element) {
            await element.click();
            results.clicked = true;
            results.method = 'element.click()';
            results.selector = selector;
            
            return {
              content: [{
                type: 'text' as const,
                text: `✅ Play button clicked\n\n📊 Details:\n  • Method: ${results.method}\n  • Selector: ${selector}\n  • Attempts: ${results.attempted.length}`,
              }],
            };
          }
        }
      } catch (e) {
        results.attempted.push({ selector, error: String(e) });
      }
    }
    
    // Fallback: Try clicking iframe center
    try {
      const iframeInfo = await page.evaluate(() => {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          const rect = iframe.getBoundingClientRect();
          return {
            found: true,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            src: iframe.src
          };
        }
        return { found: false };
      });
      
      if (iframeInfo.found) {
        await page.mouse.click(iframeInfo.x, iframeInfo.y);
        results.clicked = true;
        results.method = 'iframe-click';
        results.selector = 'iframe (center)';
        
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Play action attempted\n\n📊 Details:\n  • Method: iframe center click\n  • Iframe src: ${iframeInfo.src}\n  • Position: (${Math.round(iframeInfo.x)}, ${Math.round(iframeInfo.y)})\n\n💡 Tip: For iframe-based videos, navigate to iframe URL first`,
          }],
        };
      }
    } catch (e) {
      results.attempted.push({ selector: 'iframe-fallback', error: String(e) });
    }

    return {
      content: [{
        type: 'text' as const,
        text: `⚠️ No direct play button found\n\n📊 Attempts: ${results.attempted.length}\n💡 Suggestions:\n  • This site uses iframe-embedded videos\n  • Use iframe_extractor to find video iframe\n  • Navigate to iframe URL\n  • Then use advanced_video_extraction\n\nAttempted selectors:\n${results.attempted.map((a: any) => `  • ${a.selector}: ${a.found ? '✓ found' : '✗ not found'}`).join('\n')}`,
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
        
        // Video API detection (like /api/v1/video, /stream, etc.)
        const isVideoAPI = urlLower.includes('/video') || 
                          urlLower.includes('/stream') ||
                          (contentType.includes('application/octet-stream') && urlLower.includes('video'));

        if (filterType === 'video' && (contentType.includes('video') || resourceType === 'media' || isStreamAsset || isVideoAPI)) {
          shouldRecord = true;
        } else if (filterType === 'audio' && contentType.includes('audio')) {
          shouldRecord = true;
        } else if (filterType === 'media' && (contentType.includes('video') || contentType.includes('audio') || isStreamAsset || isVideoAPI)) {
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
    
    const responseHandler = (response: any) => {
      try {
        totalResponses++;
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        // Video files (includes API video requests)
        const isVideoFile = contentType.includes('video') || 
                           url.includes('.mp4') || 
                           url.includes('.webm') ||
                           url.includes('.mov') ||
                           url.includes('.avi') ||
                           url.includes('.mkv');
        
        // Video API patterns (like cherry.upns.online/api/v1/video)
        const isVideoAPI = url.toLowerCase().includes('/video') || 
                          url.toLowerCase().includes('/stream') ||
                          url.toLowerCase().includes('/api') ||
                          (contentType.includes('application/octet-stream') && url.includes('video'));
        
        if (isVideoFile || isVideoAPI) {
          if (verbose) console.log(`[Extractor] 🎥 Video found: ${url.substring(0, 80)}`);
          extractedData.videos.push({
            url,
            contentType,
            size: response.headers()['content-length'],
            status: response.status(),
            type: isVideoAPI ? 'api' : 'direct',
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
        
        // Manifest files (HLS, DASH) - Don't try to read content in handler
        if (url.includes('.m3u8') || url.includes('.mpd')) {
          if (verbose) console.log(`[Extractor] 📜 Manifest found: ${url.substring(0, 80)}`);
          extractedData.manifests.push({
            url,
            type: url.includes('.m3u8') ? 'HLS' : 'DASH',
            contentType,
            status: response.status(),
          });
        }
        
        // API responses with video data - Don't try to parse in handler
        if (contentType.includes('json') && (url.includes('video') || url.includes('media') || url.includes('api') || url.includes('player'))) {
          if (verbose) console.log(`[Extractor] 📡 API found: ${url.substring(0, 80)}`);
          extractedData.apis.push({
            url,
            contentType,
            status: response.status(),
          });
        }
      } catch (e) {
        if (verbose) console.log(`[Extractor] ⚠️ Error processing response: ${e}`);
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
        iframeElements: [],
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
          type: 'direct_video'
        });
      });
      
      // Iframe elements (video sources)
      document.querySelectorAll('iframe').forEach((iframe: any, idx) => {
        const selector = iframe.id ? `#${iframe.id}` : 
                        iframe.className ? `.${iframe.className.split(' ')[0]}` :
                        `iframe:nth-of-type(${idx + 1})`;
        
        if (iframe.src) {
          results.iframeElements.push({
            selector,
            src: iframe.src,
            title: iframe.title || '',
            allow: iframe.getAttribute('allow') || '',
            type: 'iframe_video'
          });
        }
      });
      
      // Player containers (check for both video and iframe)
      ['[class*="player"]', '[id*="player"]', '[data-player]'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el: any) => {
          const hasVideo = !!el.querySelector('video');
          const hasIframe = !!el.querySelector('iframe');
          
          results.playerContainers.push({
            selector: sel,
            id: el.id,
            className: el.className,
            hasVideo,
            hasIframe,
            contentType: hasVideo ? 'video' : hasIframe ? 'iframe' : 'empty'
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
      const foundElements = new Set(); // Avoid duplicates
      
      // Enhanced patterns for download buttons
      const buttonPatterns = [
        // Direct download attributes
        'a[download]',
        'button[download]',
        '[data-download]',
        '[data-download-url]',
        '[data-file]',
        '[data-link]',
        
        // Class-based
        'a[class*="download"]',
        'button[class*="download"]',
        'a[class*="btn-download"]',
        '[class*="download-button"]',
        '[class*="download-link"]',
        '[class*="dlvideoLinks"]',
        '[class*="btn-info"]',
        '[class*="btn-primary"]',
        
        // ID-based
        '[id*="download"]',
        '[id*="btn-download"]',
        '[id*="downloadButton"]',
        '[id*="Download"]',
        
        // Href patterns
        'a[href*="download"]',
        'a[href*=".mp4"]',
        'a[href*=".webm"]',
        'a[href*=".mkv"]',
        'a[href*=".avi"]',
        'a[href*="/file/"]',
        'a[href*="/stream/"]',
        'a[href*="ddn."]',
        'a[href*="igx."]',
        
        // Onclick patterns
        '[onclick*="download"]',
        '[onclick*="Download"]',
        '[onclick*="window.open"]',
        
        // Icon-based (common patterns)
        'a i[class*="download"]',
        'button i[class*="download"]',
        '.fa-download',
        '.icon-download',
        
        // Form submit buttons
        'input[type="submit"][value*="Download"]',
        'input[type="submit"][value*="Stream"]',
        'button[type="submit"]',
      ];
      
      // Text-based search (case insensitive) - ENHANCED with GDL patterns
      const searchTexts = [
        'download', 'descargar', 'télécharger', 'baixar', 'скачать', 'save', 'get',
        'gdl', '5gdl', '4gdl', '3gdl', '2gdl', '1gdl', '⚡5gdl', // GDL variations with lightning
        'dl', 'down', 'grab', 'fetch', 'stream', 'watch', 'play', 'click'
      ];
      
      buttonPatterns.forEach(pattern => {
        try {
          document.querySelectorAll(pattern).forEach((btn: any) => {
            // Avoid duplicates
            if (foundElements.has(btn)) return;
            foundElements.add(btn);
            
            const isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0;
            const text = btn.textContent?.trim() || '';
            const href = btn.href || btn.getAttribute('href') || '';
            
            results.push({
              pattern,
              text,
              href,
              dataDownload: btn.dataset.download || btn.getAttribute('data-download'),
              isVisible,
              tag: btn.tagName.toLowerCase(),
              className: btn.className,
              id: btn.id,
              hasDownloadAttr: btn.hasAttribute('download'),
              onclick: btn.onclick ? 'present' : 'none'
            });
          });
        } catch (e) {
          // Pattern not supported or error
        }
      });
      
      // Additional: Search for buttons/links with download-related text
      document.querySelectorAll('a, button').forEach((el: any) => {
        if (foundElements.has(el)) return;
        
        const text = el.textContent?.toLowerCase() || '';
        const hasDownloadText = searchTexts.some(term => text.includes(term));
        
        if (hasDownloadText) {
          foundElements.add(el);
          const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
          
          results.push({
            pattern: 'text-based-search',
            text: el.textContent?.trim() || '',
            href: el.href || el.getAttribute('href') || '',
            dataDownload: el.dataset.download,
            isVisible,
            tag: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id,
            matchedText: searchTexts.find(term => text.includes(term))
          });
        }
      });
      
      return results;
    });

    // Include option to filter by visibility
    const includeHidden = args.includeHidden !== false; // Default: include hidden
    const filteredButtons = includeHidden ? downloadButtons : downloadButtons.filter((btn: any) => btn.isVisible);

    // If no buttons found, provide helpful context
    let additionalInfo = '';
    if (filteredButtons.length === 0) {
      const pageContext = await page.evaluate(() => {
        const allButtons = document.querySelectorAll('button, input[type="submit"], [role="button"]');
        const allLinks = document.querySelectorAll('a[href]');
        const allForms = document.querySelectorAll('form');
        
        return {
          totalButtons: allButtons.length,
          totalLinks: allLinks.length,
          totalForms: allForms.length,
          sampleButtons: Array.from(allButtons).slice(0, 5).map((b: any) => ({
            text: b.textContent?.trim().substring(0, 50) || '',
            id: b.id,
            className: b.className
          })),
          sampleLinks: Array.from(allLinks).slice(0, 5).map((l: any) => ({
            text: l.textContent?.trim().substring(0, 50) || '',
            href: l.href?.substring(0, 100) || ''
          }))
        };
      });
      
      additionalInfo = `\n\n💡 No download buttons found. Page has:\n  • ${pageContext.totalButtons} buttons\n  • ${pageContext.totalLinks} links\n  • ${pageContext.totalForms} forms\n\nSample elements:\n${JSON.stringify(pageContext, null, 2)}`;
    }

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Found ${filteredButtons.length} download buttons (${downloadButtons.length} total, ${downloadButtons.filter((b: any) => !b.isVisible).length} hidden)\n\n${JSON.stringify(filteredButtons, null, 2)}${additionalInfo}`,
      }],
    };
  }, 'Failed to find download buttons');
}
