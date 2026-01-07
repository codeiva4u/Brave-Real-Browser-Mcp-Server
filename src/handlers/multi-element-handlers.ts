// Multi-Element Extraction Handlers
// Batch element scraping, nested data extraction, attribute harvesting
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling, sleep } from '../system-utils.js';

// Type definitions
export interface BatchElementData {
  selector: string;
  count: number;
  elements: Array<{
    index: number;
    text: string;
    html?: string;
    attributes: Record<string, string>;
  }>;
}

export interface NestedData {
  parent: {
    selector: string;
    text: string;
    attributes: Record<string, string>;
  };
  children: Array<{
    selector: string;
    text: string;
    attributes: Record<string, string>;
  }>;
}

export interface AttributeData {
  selector: string;
  count: number;
  attributes: Array<{
    element: number;
    attrs: Record<string, string>;
  }>;
}

// Batch Element Scraper Arguments
export interface BatchElementScraperArgs {
  selector: string;
  includeHtml?: boolean;
  maxElements?: number;
  attributes?: string[];
}

/**
 * Multiple similar elements (products, articles) को एक साथ scrape करता है
 */
export async function handleBatchElementScraper(args: BatchElementScraperArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('batch_element_scraper', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const selector = args.selector;
    const includeHtml = args.includeHtml || false;
    const maxElements = args.maxElements || 100;
    const attributes = args.attributes || [];

    const batchData = await page.evaluate(
      ({ selector, includeHtml, maxElements, attributes }) => {
        const elements = document.querySelectorAll(selector);
        const result: BatchElementData = {
          selector,
          count: Math.min(elements.length, maxElements),
          elements: [],
        };

        let count = 0;
        elements.forEach((element, index) => {
          if (count >= maxElements) return;

          const elementData: any = {
            index,
            text: element.textContent?.trim() || '',
            attributes: {},
          };

          if (includeHtml) {
            elementData.html = element.innerHTML;
          }

          // Extract all attributes or specific ones
          if (attributes.length > 0) {
            attributes.forEach((attr) => {
              const value = element.getAttribute(attr);
              if (value) {
                elementData.attributes[attr] = value;
              }
            });
          } else {
            // Get all attributes
            Array.from(element.attributes).forEach((attr) => {
              elementData.attributes[attr.name] = attr.value;
            });
          }

          result.elements.push(elementData);
          count++;
        });

        return result;
      },
      { selector, includeHtml, maxElements, attributes }
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Batch scraped ${batchData.count} elements\n\n${JSON.stringify(batchData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to batch scrape elements');
}







// Link Harvester Arguments
export interface LinkHarvesterArgs {
  selector?: string;
  classifyLinks?: boolean;
  includeAnchors?: boolean;
}

/**
 * Internal/external links classification के साथ collect करता है
 */
export async function handleLinkHarvester(args: LinkHarvesterArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('link_harvester', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const selector = args.selector || 'a[href]';
    const classifyLinks = args.classifyLinks !== false;
    const includeAnchors = args.includeAnchors || false;

    const linkData = await page.evaluate(
      ({ selector, classifyLinks, includeAnchors }) => {
        const links = document.querySelectorAll(selector);
        const currentDomain = window.location.hostname;
        const results: any[] = [];

        links.forEach((link: any, index) => {
          const href = (link as any).href;

          // Skip if no href (e.g. button without href)
          if (!href) {
            return;
          }

          // Skip anchors if not included
          if (!includeAnchors && href.startsWith('#')) {
            return;
          }

          const linkInfo: any = {
            index,
            href,
            text: link.textContent?.trim() || '',
            title: link.title || '',
          };

          if (classifyLinks) {
            try {
              const url = new URL(href, window.location.href);
              const isInternal = url.hostname === currentDomain;
              const isAnchor = href.startsWith('#');
              const isMailto = href.startsWith('mailto:');
              const isTel = href.startsWith('tel:');

              linkInfo.type = isAnchor
                ? 'anchor'
                : isMailto
                  ? 'email'
                  : isTel
                    ? 'phone'
                    : isInternal
                      ? 'internal'
                      : 'external';

              linkInfo.domain = url.hostname;
              linkInfo.protocol = url.protocol;
            } catch (e) {
              linkInfo.type = 'invalid';
              linkInfo.domain = 'unknown'; // Ensure domain exists even if invalid
            }
          }

          // Additional attributes
          const target = link.target;
          if (target) {
            linkInfo.target = target;
          }

          const rel = link.rel;
          if (rel) {
            linkInfo.rel = rel;
          }

          results.push(linkInfo);
        });

        return results;
      },
      { selector, classifyLinks, includeAnchors }
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Harvested ${linkData.length} links\n\n${JSON.stringify(linkData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to harvest links');
}

// Media Extractor Arguments
export interface MediaExtractorArgs {
  types?: ('video' | 'audio' | 'iframe')[];
  includeEmbeds?: boolean;
  waitTime?: number;        // Time to wait for dynamic content (default: 10000ms)
  clickPlay?: boolean;      // Click play button to trigger video loading (default: true)
  monitorNetwork?: boolean; // Monitor network for video URLs (default: true)
}

/**
 * Videos, audio files, और iframes के URLs और metadata extract करता है
 * Enhanced with dynamic content support: network monitoring, play button click, and wait time
 */
export async function handleMediaExtractor(args: MediaExtractorArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('media_extractor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const types = args.types || ['video', 'audio', 'iframe'];
    const includeEmbeds = args.includeEmbeds !== false;
    const waitTime = args.waitTime ?? 10000;    // Default 10 seconds for dynamic content
    const clickPlay = args.clickPlay !== false;  // Default true
    const monitorNetwork = args.monitorNetwork !== false; // Default true

    const results: any = {
      videos: [],
      audio: [],
      iframes: [],
      networkDetected: [], // New: URLs detected from network traffic
    };

    // Network monitoring for video URLs (if enabled)
    const networkVideos: any[] = [];
    let requestHandler: any = null;
    let responseHandler: any = null;

    if (monitorNetwork) {
      requestHandler = (request: any) => {
        try {
          const url = request.url();
          const resourceType = request.resourceType();

          // Detect video URLs from network requests
          if (resourceType === 'media' ||
            url.includes('.mp4') ||
            url.includes('.m3u8') ||
            url.includes('.mpd') ||
            url.includes('.webm') ||
            url.includes('.mkv') ||
            url.includes('/video/') ||
            url.includes('video.') ||
            url.includes('stream')) {
            networkVideos.push({
              url,
              type: resourceType,
              detected: 'network_request'
            });
          }
        } catch (e) {
          // Ignore errors
        }
      };

      responseHandler = async (response: any) => {
        try {
          const url = response.url();
          const contentType = response.headers()['content-type'] || '';

          // Check for video content type
          if (contentType.includes('video') ||
            contentType.includes('application/vnd.apple.mpegurl') ||
            contentType.includes('application/x-mpegurl') ||
            contentType.includes('application/dash+xml')) {
            networkVideos.push({
              url,
              contentType,
              status: response.status(),
              detected: 'network_response'
            });
          }
        } catch (e) {
          // Ignore errors
        }
      };

      page.on('request', requestHandler);
      page.on('response', responseHandler);
    }

    // First DOM scan - get initial state
    const scanDOM = async () => {
      return await page.evaluate(
        ({ types, includeEmbeds }) => {
          const scanResults: any = {
            videos: [],
            audio: [],
            iframes: [],
          };

          // Extract videos
          if (types.includes('video')) {
            const videos = document.querySelectorAll('video');
            videos.forEach((video: any, index) => {
              const videoInfo: any = {
                index,
                src: video.src || video.currentSrc || '',
                poster: video.poster || '',
                duration: video.duration || 0,
                width: video.videoWidth || video.width || 0,
                height: video.videoHeight || video.height || 0,
                controls: video.controls,
                autoplay: video.autoplay,
                loop: video.loop,
                muted: video.muted,
              };

              // Get source elements
              const sources = video.querySelectorAll('source');
              if (sources.length > 0) {
                videoInfo.sources = Array.from(sources).map((source: any) => ({
                  src: source.src,
                  type: source.type,
                }));
              }

              scanResults.videos.push(videoInfo);
            });
          }

          // Extract audio
          if (types.includes('audio')) {
            const audios = document.querySelectorAll('audio');
            audios.forEach((audio: any, index) => {
              const audioInfo: any = {
                index,
                src: audio.src || audio.currentSrc || '',
                duration: audio.duration || 0,
                controls: audio.controls,
                autoplay: audio.autoplay,
                loop: audio.loop,
                muted: audio.muted,
              };

              // Get source elements
              const sources = audio.querySelectorAll('source');
              if (sources.length > 0) {
                audioInfo.sources = Array.from(sources).map((source: any) => ({
                  src: source.src,
                  type: source.type,
                }));
              }

              scanResults.audio.push(audioInfo);
            });
          }

          // Extract iframes
          if (types.includes('iframe')) {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((iframe: any, index) => {
              const iframeInfo: any = {
                index,
                src: iframe.src,
                dataSrc: iframe.getAttribute('data-src') || '',
                title: iframe.title || '',
                width: iframe.width || '',
                height: iframe.height || '',
                sandbox: iframe.sandbox ? iframe.sandbox.toString() : '',
                allow: iframe.allow || '',
              };

              if (includeEmbeds) {
                // Detect common embed platforms
                const src = (iframe.src || '').toLowerCase();
                if (src.includes('youtube.com') || src.includes('youtu.be')) {
                  iframeInfo.platform = 'YouTube';
                } else if (src.includes('vimeo.com')) {
                  iframeInfo.platform = 'Vimeo';
                } else if (src.includes('dailymotion.com')) {
                  iframeInfo.platform = 'Dailymotion';
                } else if (src.includes('facebook.com')) {
                  iframeInfo.platform = 'Facebook';
                } else if (src.includes('twitter.com') || src.includes('x.com')) {
                  iframeInfo.platform = 'Twitter/X';
                } else if (src.includes('streamtape') || src.includes('doodstream') ||
                  src.includes('filemoon') || src.includes('streamwish') ||
                  src.includes('mixdrop') || src.includes('voe.sx')) {
                  iframeInfo.platform = 'Video Hosting';
                }
              }

              scanResults.iframes.push(iframeInfo);
            });
          }

          return scanResults;
        },
        { types, includeEmbeds }
      );
    };

    // Initial scan
    let initialData = await scanDOM();

    // Smart Interaction Loop (supports multi-step download/streaming flows)
    // Runs up to 3 iterations to handle chains like: Server -> Play OR Verify -> Get Link -> Download
    if (clickPlay) {
      const maxInteractions = 3;

      for (let i = 0; i < maxInteractions; i++) {
        let clicked = false;

        // 1. Universal Selectors (High Priority)
        const universalSelectors = [
          'li[data-nume="1"]',
          '.dooplay_player_option[data-nume="1"]',
          '.server-item', '.server-btn', '[class*="server-option"]',
          'button[class*="play"]', '.play-button', '.play-btn',
          '[aria-label*="Play"]', '[title*="Play"]',
          '.jw-icon-playback', '.vjs-big-play-button',
          '.plyr__control--overlaid', '[data-plyr="play"]',
          '.video-js .vjs-play-control',
          'div[role="button"][class*="play"]',
          'svg[class*="play"]',
          // Download specific selectors
          'a[href*="download"]', 'button[class*="download"]',
          '.download-btn', '#download-btn',
          '.get-link', '#get-link'
        ];

        // Try generic selectors
        for (const selector of universalSelectors) {
          try {
            const elements = await page.$$(selector);
            for (const el of elements) {
              // Relaxed visibility check
              const isInteractable = await page.evaluate((e: any) => {
                const style = window.getComputedStyle(e);
                return style.display !== 'none' && style.visibility !== 'hidden';
              }, el); // Fixed: Pass el as second argument

              if (isInteractable) {
                try {
                  await el.evaluate((e: any) => e.scrollIntoView({ block: 'center', inline: 'center' }));
                  await sleep(500);

                  // Force click
                  try {
                    await el.click();
                  } catch (standardClickErr) {
                    await page.evaluate((e: any) => e.click(), el);
                  }

                  await sleep(3000); // Wait for reaction
                  clicked = true;
                  break;
                } catch (e) { }
              }
            }
            if (clicked) break;
          } catch (e) { }
        }

        // 2. Text-Based Heuristics (Fallback & Download Support)
        if (!clicked) {
          clicked = await page.evaluate(async () => {
            const keywords = [
              // Streaming
              'server', 'play', 'watch movie', 'load video', 'stream',
              // Downloading / Link Generation
              'download', 'get link', 'generate link', 'start verification',
              'click here to', 'continue', 'verify', 'dual audio', 'watch online'
            ];

            // Helper to check visibility
            const isVisible = (el: any) => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            };

            const candidates = Array.from(document.querySelectorAll('button, a, div[role="button"], li, span, input[type="button"], input[type="submit"]'));

            for (const el of candidates) {
              const text = (el.textContent || '').toLowerCase().trim();
              const value = (el as any).value ? (el as any).value.toLowerCase() : '';
              const content = text || value;

              if (keywords.some(k => content === k || (content.includes(k) && content.length < 30))) {
                if (isVisible(el)) {
                  (el as HTMLElement).click();
                  return true;
                }
              }
            }
            return false;
          });

          if (clicked) {
            await sleep(4000); // Wait for potential page load or dynamic content
          }
        }

        // If we didn't find anything to click in this pass, breaks the loop
        if (!clicked) break;

        // Brief pause before next interaction scan
        await sleep(1000);
      }
    }

    // Wait for dynamic content to load
    if (waitTime > 0) {
      await sleep(waitTime);
    }

    // Second DOM scan - get updated state after interactions
    const finalData = await scanDOM();

    // Remove network listeners
    if (monitorNetwork && requestHandler && responseHandler) {
      page.off('request', requestHandler);
      page.off('response', responseHandler);
    }

    // Merge results, prioritizing final scan
    results.videos = finalData.videos;
    results.audio = finalData.audio;
    results.iframes = finalData.iframes;

    // Deduplicate and add network-detected videos
    const seenUrls = new Set<string>();

    // Add URLs from DOM videos
    results.videos.forEach((v: any) => {
      if (v.src) seenUrls.add(v.src);
      if (v.sources) v.sources.forEach((s: any) => { if (s.src) seenUrls.add(s.src); });
    });

    // Add unique network-detected videos
    networkVideos.forEach((nv: any) => {
      if (nv.url && !seenUrls.has(nv.url)) {
        seenUrls.add(nv.url);
        results.networkDetected.push(nv);
      }
    });

    const totalMedia =
      results.videos.length + results.audio.length + results.iframes.length + results.networkDetected.length;

    // Build summary
    let summary = `✅ Extracted ${totalMedia} media elements\n\n`;

    if (results.networkDetected.length > 0) {
      summary += `🎬 Network-detected video URLs: ${results.networkDetected.length}\n`;
      results.networkDetected.slice(0, 5).forEach((v: any, i: number) => {
        summary += `  ${i + 1}. ${v.url.substring(0, 100)}${v.url.length > 100 ? '...' : ''}\n`;
      });
      if (results.networkDetected.length > 5) {
        summary += `  ... and ${results.networkDetected.length - 5} more\n`;
      }
      summary += '\n';
    }

    summary += JSON.stringify(results, null, 2);

    return {
      content: [
        {
          type: 'text' as const,
          text: summary,
        },
      ],
    };
  }, 'Failed to extract media');
}


