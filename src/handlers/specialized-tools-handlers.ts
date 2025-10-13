// Specialized Tools Handlers for Video Extraction, Links Finding, AJAX, and User Agent Tools

import { getBrowser, getPage } from '../browser-manager.js';
import { withWorkflowValidation } from './browser-handlers.js';
import { withErrorHandling } from '../system-utils.js';
import type { HTTPRequest, HTTPResponse } from 'puppeteer';

// Links Finders Handler
export async function handleLinksFinders(args: any) {
  return withWorkflowValidation('links_finders', args, async () => {
    return withErrorHandling(async () => {
      const browser = getBrowser();
      const page = getPage();
      
      if (!browser || !page) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const {
        includeExternal = true,
        includeInternal = true,
        includeMediaLinks = true,
        includeEmailPhone = false,
        filterDomains = []
      } = args;

      const links = await page.evaluate((options: any) => {
        const { includeExternal, includeInternal, includeMediaLinks, includeEmailPhone, filterDomains } = options;
        const results: any[] = [];
        const currentDomain = window.location.hostname;
        
        // Find all anchor links
        const anchors = document.querySelectorAll('a[href]');
        anchors.forEach((anchor: any) => {
          const href = anchor.href;
          const isExternal = !href.includes(currentDomain);
          
          if ((isExternal && includeExternal) || (!isExternal && includeInternal)) {
            if (filterDomains.length === 0 || filterDomains.some((domain: string) => href.includes(domain))) {
              results.push({
                type: 'anchor',
                url: href,
                text: anchor.textContent?.trim() || '',
                isExternal,
                title: anchor.title || ''
              });
            }
          }
        });

        // Find media links if requested
        if (includeMediaLinks) {
          const mediaElements = document.querySelectorAll('img[src], video[src], audio[src], source[src]');
          mediaElements.forEach((element: any) => {
            results.push({
              type: 'media',
              url: element.src,
              mediaType: element.tagName.toLowerCase(),
              alt: element.alt || '',
              title: element.title || ''
            });
          });
        }

        // Find email and phone links if requested
        if (includeEmailPhone) {
          const emailPhoneLinks = document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]');
          emailPhoneLinks.forEach((link: any) => {
            results.push({
              type: link.href.startsWith('mailto:') ? 'email' : 'phone',
              url: link.href,
              text: link.textContent?.trim() || ''
            });
          });
        }

        return results;
      }, { includeExternal, includeInternal, includeMediaLinks, includeEmailPhone, filterDomains });

      return {
        success: true,
        links,
        total: links.length,
        message: `Found ${links.length} links on the page`
      };
    }, 'Failed to find links');
  });
}

// Video Play Sources Finder Handler
export async function handleVideoPlaySourcesFinder(args: any) {
  return withWorkflowValidation('video_play_sources_finder', args, async () => {
    return withErrorHandling(async () => {
      const browser = getBrowser();
      const page = getPage();
      
      if (!browser || !page) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const {
        includeHLS = true,
        includeDASH = true,
        includeDirectMP4 = true,
        includeBlob = true,
        recordingDuration = 15000
      } = args;

      // Start network monitoring
      const networkSources: any[] = [];
      
      await page.setRequestInterception(true);
      page.on('request', (request: HTTPRequest) => {
        request.continue();
      });

      page.on('response', async (response: HTTPResponse) => {
        try {
          const url = response.url();
          const contentType = response.headers()['content-type'] || '';
          
          // Check for video sources
          const isVideoSource = (
            (includeHLS && (url.includes('.m3u8') || contentType.includes('application/x-mpegURL'))) ||
            (includeDASH && (url.includes('.mpd') || contentType.includes('application/dash+xml'))) ||
            (includeDirectMP4 && (url.includes('.mp4') || contentType.includes('video/mp4'))) ||
            (includeBlob && url.startsWith('blob:'))
          );

          if (isVideoSource) {
            networkSources.push({
              url,
              type: url.includes('.m3u8') ? 'HLS' : 
                    url.includes('.mpd') ? 'DASH' : 
                    url.includes('.mp4') ? 'MP4' : 
                    url.startsWith('blob:') ? 'BLOB' : 'UNKNOWN',
              contentType,
              size: response.headers()['content-length'] || 'unknown',
              status: response.status()
            });
          }
        } catch (error) {
          // Ignore response processing errors
        }
      });

      // Wait for network activity
      await new Promise(resolve => setTimeout(resolve, recordingDuration));
      await page.setRequestInterception(false);

      // Also search DOM for video sources
      const domSources = await page.evaluate((options: any) => {
        const { includeHLS, includeDASH, includeDirectMP4, includeBlob } = options;
        const sources: any[] = [];

        // Video elements
        const videos = document.querySelectorAll('video');
        videos.forEach((video: HTMLVideoElement) => {
          if (video.src) sources.push({ url: video.src, type: 'VIDEO_TAG', source: 'dom' });
          const sourceTags = video.querySelectorAll('source');
          sourceTags.forEach((source: HTMLSourceElement) => {
            if (source.src) sources.push({ url: source.src, type: source.type || 'VIDEO_SOURCE', source: 'dom' });
          });
        });

        // Search for sources in page text/scripts
        const scripts = document.querySelectorAll('script');
        scripts.forEach((script) => {
          const content = script.textContent || '';
          
          if (includeHLS) {
            const hlsMatches = content.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g);
            if (hlsMatches) {
              hlsMatches.forEach(url => sources.push({ url, type: 'HLS', source: 'script' }));
            }
          }
          
          if (includeDASH) {
            const dashMatches = content.match(/https?:\/\/[^\s"']+\.mpd[^\s"']*/g);
            if (dashMatches) {
              dashMatches.forEach(url => sources.push({ url, type: 'DASH', source: 'script' }));
            }
          }
          
          if (includeDirectMP4) {
            const mp4Matches = content.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/g);
            if (mp4Matches) {
              mp4Matches.forEach(url => sources.push({ url, type: 'MP4', source: 'script' }));
            }
          }
        });

        return sources;
      }, { includeHLS, includeDASH, includeDirectMP4, includeBlob });

      const allSources = [...networkSources, ...domSources];
      const uniqueSources = allSources.filter((source, index, array) => 
        array.findIndex(s => s.url === source.url) === index
      );

      return {
        success: true,
        sources: uniqueSources,
        networkSources: networkSources.length,
        domSources: domSources.length,
        total: uniqueSources.length,
        message: `Found ${uniqueSources.length} video play sources`
      };
    }, 'Failed to find video play sources');
  });
}

// Video Player Hostars Sources Finder Handler
export async function handleVideoPlayerHostarsSourcesFinder(args: any) {
  return withWorkflowValidation('video_player_hostars_sources_finder', args, async () => {
    return withErrorHandling(async () => {
      const browser = getBrowser();
      const page = getPage();
      
      if (!browser || !page) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const {
        platforms = ['all'],
        extractEmbedCodes = true,
        extractAPIKeys = false
      } = args;

      const hostingSources = await page.evaluate((options: any) => {
        const { platforms, extractEmbedCodes, extractAPIKeys } = options;
        const sources: any[] = [];
        
        // Define hosting platform patterns
        const hostingPatterns = {
          youtube: [
            /(?:youtube\.com|youtu\.be)/i,
            /\/embed\/([a-zA-Z0-9_-]+)/,
            /watch\?v=([a-zA-Z0-9_-]+)/
          ],
          vimeo: [
            /vimeo\.com/i,
            /\/video\/(\d+)/,
            /player\.vimeo\.com\/video\/(\d+)/
          ],
          dailymotion: [
            /dailymotion\.com/i,
            /\/video\/([a-zA-Z0-9_-]+)/
          ],
          twitch: [
            /twitch\.tv/i,
            /\/videos\/(\d+)/,
            /\/embed\/([a-zA-Z0-9_-]+)/
          ],
          facebook: [
            /facebook\.com/i,
            /\/watch/,
            /\/videos/
          ],
          instagram: [
            /instagram\.com/i,
            /\/p\/([a-zA-Z0-9_-]+)/
          ],
          tiktok: [
            /tiktok\.com/i,
            /@[^\/]+\/video\/(\d+)/
          ]
        };

        // Search in iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe: HTMLIFrameElement) => {
          const src = iframe.src;
          if (!src) return;
          
          for (const [platform, patterns] of Object.entries(hostingPatterns)) {
            if (platforms.includes('all') || platforms.includes(platform)) {
              if (patterns[0].test(src)) {
                const videoId = src.match(patterns[1] || patterns[0]);
                sources.push({
                  platform,
                  url: src,
                  videoId: videoId ? videoId[1] : null,
                  type: 'iframe',
                  embedCode: extractEmbedCodes ? iframe.outerHTML : null
                });
              }
            }
          }
        });

        // Search in links
        const links = document.querySelectorAll('a[href]');
        links.forEach((link: any) => {
          const href = link.href;
          
          for (const [platform, patterns] of Object.entries(hostingPatterns)) {
            if (platforms.includes('all') || platforms.includes(platform)) {
              if (patterns[0].test(href)) {
                const videoId = href.match(patterns[1] || patterns[0]);
                sources.push({
                  platform,
                  url: href,
                  videoId: videoId ? videoId[1] : null,
                  type: 'link',
                  linkText: link.textContent?.trim() || ''
                });
              }
            }
          }
        });

        // Search in script content for API calls and video IDs
        const scripts = document.querySelectorAll('script');
        scripts.forEach((script) => {
          const content = script.textContent || '';
          
          for (const [platform, patterns] of Object.entries(hostingPatterns)) {
            if (platforms.includes('all') || platforms.includes(platform)) {
              const matches = content.match(patterns[1] || patterns[0]);
              if (matches) {
                matches.forEach(match => {
                  sources.push({
                    platform,
                    url: match,
                    type: 'script',
                    source: 'javascript'
                  });
                });
              }
            }
          }
        });

        return sources;
      }, { platforms, extractEmbedCodes, extractAPIKeys });

      return {
        success: true,
        sources: hostingSources,
        platforms: [...new Set(hostingSources.map((s: any) => s.platform))],
        total: hostingSources.length,
        message: `Found ${hostingSources.length} hosting platform sources`
      };
    }, 'Failed to find video hosting sources');
  });
}

// AJAX Finders Handler
export async function handleAjaxFinders(args: any) {
  return withWorkflowValidation('ajax_finders', args, async () => {
    return withErrorHandling(async () => {
      const browser = getBrowser();
      const page = getPage();
      
      if (!browser || !page) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const {
        interceptXHR = true,
        interceptFetch = true,
        recordResponses = true,
        filterByContentType = ['application/json', 'text/html', 'application/xml'],
        monitoringDuration = 10000
      } = args;

      const ajaxRequests: any[] = [];

      // Intercept network requests
      await page.setRequestInterception(true);
      
      page.on('request', (request: HTTPRequest) => {
        const resourceType = request.resourceType();
        if (resourceType === 'xhr' || resourceType === 'fetch') {
          ajaxRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData(),
            resourceType,
            timestamp: Date.now(),
            type: 'request'
          });
        }
        request.continue();
      });

      if (recordResponses) {
        page.on('response', async (response: HTTPResponse) => {
          try {
            const request = response.request();
            const resourceType = request.resourceType();
            
            if (resourceType === 'xhr' || resourceType === 'fetch') {
              const contentType = response.headers()['content-type'] || '';
              const shouldRecord = filterByContentType.length === 0 || 
                                 filterByContentType.some((type: any) => contentType.includes(type));
              
              if (shouldRecord) {
                let responseBody = '';
                try {
                  responseBody = await response.text();
                } catch (e) {
                  responseBody = '[Unable to read response body]';
                }

                ajaxRequests.push({
                  url: response.url(),
                  status: response.status(),
                  headers: response.headers(),
                  contentType,
                  body: responseBody.substring(0, 10000), // Limit body size
                  timestamp: Date.now(),
                  type: 'response'
                });
              }
            }
          } catch (error) {
            // Ignore response processing errors
          }
        });
      }

      // Wait for AJAX activity
      await new Promise(resolve => setTimeout(resolve, monitoringDuration));
      await page.setRequestInterception(false);

      // Group requests and responses
      const groupedRequests = ajaxRequests.reduce((acc: any, item) => {
        const key = item.url;
        if (!acc[key]) acc[key] = { requests: [], responses: [] };
        
        if (item.type === 'request') {
          acc[key].requests.push(item);
        } else {
          acc[key].responses.push(item);
        }
        
        return acc;
      }, {});

      return {
        success: true,
        ajaxRequests: groupedRequests,
        totalRequests: ajaxRequests.filter(r => r.type === 'request').length,
        totalResponses: ajaxRequests.filter(r => r.type === 'response').length,
        uniqueEndpoints: Object.keys(groupedRequests).length,
        message: `Monitored AJAX activity for ${monitoringDuration}ms`
      };
    }, 'Failed to monitor AJAX requests');
  });
}

// User Agent Finders Handler
export async function handleUserAgentFinders(args: any) {
  return withWorkflowValidation('user_agent_finders', args, async () => {
    return withErrorHandling(async () => {
      const browser = getBrowser();
      const page = getPage();
      
      if (!browser || !page) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const {
        detectFingerprinting = true,
        analyzeHeaders = true,
        findCustomUA = true,
        trackingDetection = true
      } = args;

      const userAgentInfo = await page.evaluate((options: any) => {
        const { detectFingerprinting, analyzeHeaders, findCustomUA, trackingDetection } = options;
        const info: any = {};
        
        // Get current user agent
        info.currentUserAgent = navigator.userAgent;
        info.platform = navigator.platform;
        info.language = navigator.language;
        info.languages = navigator.languages;
        
        // Detect fingerprinting attempts
        if (detectFingerprinting) {
          info.fingerprinting = {
            canvas: !!document.createElement('canvas').getContext,
            webgl: !!document.createElement('canvas').getContext('webgl'),
            audioContext: !!(window as any).AudioContext || !!(window as any).webkitAudioContext,
            webrtc: !!((window as any).RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection),
            deviceMemory: (navigator as any).deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            maxTouchPoints: navigator.maxTouchPoints || 0
          };
        }
        
        // Check for custom UA requirements in scripts
        if (findCustomUA) {
          const scripts = document.querySelectorAll('script');
          const uaRequirements: string[] = [];
          
          scripts.forEach(script => {
            const content = script.textContent || '';
            // Look for User-Agent checks
            const uaPatterns = [
              /userAgent\s*[=!]==?\s*['"]([^'"]+)['"]/gi,
              /navigator\.userAgent\.indexOf\(['"]([^'"]+)['"]\)/gi,
              /User-Agent:\s*['"]([^'"]+)['"]/gi
            ];
            
            uaPatterns.forEach(pattern => {
              const matches = content.match(pattern);
              if (matches) {
                uaRequirements.push(...matches);
              }
            });
          });
          
          info.customUARequirements = [...new Set(uaRequirements)];
        }
        
        return info;
      }, { detectFingerprinting, analyzeHeaders, findCustomUA, trackingDetection });

      // Get actual request headers from network
      const requestHeaders: any = {};
      if (analyzeHeaders) {
        await page.setRequestInterception(true);
        
        const headerPromise = new Promise((resolve) => {
          page.once('request', (request: HTTPRequest) => {
            resolve(request.headers());
            request.continue();
          });
        });
        
        // Trigger a request to capture headers
        await page.reload({ waitUntil: 'domcontentloaded' });
        const headers = await headerPromise;
        requestHeaders.actual = headers;
        
        await page.setRequestInterception(false);
      }

      return {
        success: true,
        userAgentInfo,
        requestHeaders,
        message: 'User-Agent analysis completed'
      };
    }, 'Failed to analyze User-Agent');
  });
}

// Export handlers for all specialized tools
export const specializedToolsHandlers = {
  links_finders: handleLinksFinders,
  video_play_sources_finder: handleVideoPlaySourcesFinder,
  video_player_hostars_sources_finder: handleVideoPlayerHostarsSourcesFinder,
  ajax_finders: handleAjaxFinders,
  user_agent_finders: handleUserAgentFinders,
  // Add more handlers as needed...
};