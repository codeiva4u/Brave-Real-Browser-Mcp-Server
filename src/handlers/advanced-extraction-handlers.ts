// Advanced Video Extraction Handlers
// Ad-Protection Bypass, Obfuscation Detection, Hidden Video Source Extraction
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling, sleep } from '../system-utils.js';

/**
 * Advanced Video Source Extractor - Bypass ad-protection and extract all video sources
 */
export async function handleAdvancedVideoExtraction(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('advanced_video_extraction', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const waitTime = args.waitTime || 10000;
    
    // Collect all video-related data
    const videoData: any = {
      directVideoUrls: [],
      m3u8Streams: [],
      mpdStreams: [],
      iframeSources: [],
      obfuscatedUrls: [],
      redirectChains: [],
      hostingPlatforms: [],
      downloadLinks: [],
      timestamp: new Date().toISOString()
    };
    
    // Monitor network for video content
    const networkRequests: any[] = [];
    const requestHandler = (request: any) => {
      const url = request.url();
      const resourceType = request.resourceType();
      
      networkRequests.push({
        url,
        method: request.method(),
        resourceType,
        headers: request.headers()
      });
      
      // Detect video URLs
      if (resourceType === 'media' || 
          url.includes('.mp4') || 
          url.includes('.m3u8') || 
          url.includes('.mpd') ||
          url.includes('.webm') ||
          url.includes('video')) {
        videoData.directVideoUrls.push({
          url,
          type: resourceType,
          detected: 'network_monitor'
        });
      }
    };
    
    const responseHandler = async (response: any) => {
      try {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        // Check for video content
        if (contentType.includes('video') || contentType.includes('application/vnd.apple.mpegurl')) {
          videoData.directVideoUrls.push({
            url,
            contentType,
            status: response.status(),
            detected: 'response_monitor'
          });
        }
        
        // Check for m3u8 playlists
        if (url.includes('.m3u8')) {
          videoData.m3u8Streams.push({
            url,
            status: response.status(),
            type: 'HLS'
          });
        }
        
        // Check for DASH manifests
        if (url.includes('.mpd')) {
          videoData.mpdStreams.push({
            url,
            status: response.status(),
            type: 'DASH'
          });
        }
      } catch (e) {
        // Ignore errors
      }
    };
    
    page.on('request', requestHandler);
    page.on('response', responseHandler);
    
    // Extract page content
    const pageAnalysis = await page.evaluate(() => {
      const results: any = {
        iframes: [],
        videoElements: [],
        obfuscatedScripts: [],
        possibleHosts: [],
        downloadButtons: []
      };
      
      // 1. Extract all iframes
      document.querySelectorAll('iframe').forEach((iframe: any) => {
        results.iframes.push({
          src: iframe.src,
          dataSrc: iframe.getAttribute('data-src'),
          id: iframe.id,
          className: iframe.className
        });
      });
      
      // 2. Extract video elements
      document.querySelectorAll('video').forEach((video: any) => {
        const sources: any[] = [];
        
        if (video.src) sources.push({ src: video.src, type: 'direct' });
        
        video.querySelectorAll('source').forEach((source: any) => {
          sources.push({
            src: source.src,
            type: source.type,
            quality: source.dataset.quality
          });
        });
        
        results.videoElements.push({
          sources,
          poster: video.poster,
          currentSrc: video.currentSrc
        });
      });
      
      // 3. Detect obfuscated JavaScript
      document.querySelectorAll('script').forEach((script: any) => {
        const content = script.textContent || '';
        
        // Check for common obfuscation patterns
        if (content.includes('eval(') || 
            content.includes('atob(') ||
            content.includes('\\x') ||
            content.match(/0x[0-9a-f]{4}/gi) ||
            content.includes('_0x')) {
          
          // Try to extract URLs from obfuscated code
          const urlPatterns = [
            /https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi,
            /https?:\/\/[^\s"']+\.mp4[^\s"']*/gi,
            /https?:\/\/[^\s"']+\.mpd[^\s"']*/gi,
            /https?:\/\/[^\s"']+video[^\s"']*/gi
          ];
          
          const foundUrls: string[] = [];
          urlPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) foundUrls.push(...matches);
          });
          
          results.obfuscatedScripts.push({
            hasObfuscation: true,
            patterns: {
              hasEval: content.includes('eval('),
              hasAtob: content.includes('atob('),
              hasHexEncoding: content.includes('\\x'),
              hasObfuscatedVars: content.includes('_0x')
            },
            extractedUrls: foundUrls,
            snippet: content.substring(0, 200)
          });
        }
        
        // Extract video hosting domains
        const hostPatterns = [
          /streamtape/gi,
          /doodstream/gi,
          /filemoon/gi,
          /streamwish/gi,
          /mixdrop/gi,
          /upstream/gi,
          /voe\.sx/gi,
          /streamlare/gi,
          /upns\.online/gi
        ];
        
        hostPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            results.possibleHosts.push(pattern.source);
          }
        });
      });
      
      // 4. Find download buttons and links
      const downloadSelectors = [
        'a[download]',
        'a[href*="download"]',
        'button[data-download]',
        'a[href*=".mp4"]',
        'a[href*=".mkv"]',
        'a[class*="download"]'
      ];
      
      downloadSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el: any) => {
          results.downloadButtons.push({
            href: el.href || el.getAttribute('href'),
            text: el.textContent?.trim(),
            selector
          });
        });
      });
      
      return results;
    });
    
    // Merge page analysis into videoData
    videoData.iframeSources = pageAnalysis.iframes;
    videoData.obfuscatedUrls = pageAnalysis.obfuscatedScripts;
    videoData.hostingPlatforms = [...new Set(pageAnalysis.possibleHosts)];
    videoData.downloadLinks = pageAnalysis.downloadButtons;
    
    // Wait for dynamic content
    await sleep(waitTime);
    
    // Try to click play buttons to trigger video loading
    try {
      const playButton = await page.$('button[class*="play"], .play-button, [aria-label*="Play"]');
      if (playButton) {
        await playButton.click();
        await sleep(3000);
      }
    } catch (e) {
      // Play button not found or not clickable
    }
    
    page.off('request', requestHandler);
    page.off('response', responseHandler);
    
    // Deduplicate URLs
    videoData.directVideoUrls = [...new Map(videoData.directVideoUrls.map((item: any) => [item.url, item])).values()];
    videoData.m3u8Streams = [...new Map(videoData.m3u8Streams.map((item: any) => [item.url, item])).values()];
    
    // Create summary
    const summary = `
🎬 Advanced Video Extraction Results
════════════════════════════════════

📊 Summary:
  • Direct Video URLs: ${videoData.directVideoUrls.length}
  • HLS Streams (m3u8): ${videoData.m3u8Streams.length}
  • DASH Streams (mpd): ${videoData.mpdStreams.length}
  • IFrame Sources: ${videoData.iframeSources.length}
  • Obfuscated Scripts: ${videoData.obfuscatedUrls.length}
  • Download Links: ${videoData.downloadLinks.length}
  • Detected Platforms: ${videoData.hostingPlatforms.length}

${videoData.directVideoUrls.length > 0 ? `
🎥 Direct Video URLs:
${videoData.directVideoUrls.map((v: any, i: number) => `  ${i + 1}. ${v.url}\n     Type: ${v.type || 'unknown'}\n     Detected: ${v.detected}`).join('\n')}
` : ''}

${videoData.m3u8Streams.length > 0 ? `
📺 HLS Streams:
${videoData.m3u8Streams.map((s: any, i: number) => `  ${i + 1}. ${s.url}`).join('\n')}
` : ''}

${videoData.iframeSources.length > 0 ? `
🔗 IFrame Sources:
${videoData.iframeSources.map((f: any, i: number) => `  ${i + 1}. ${f.src || f.dataSrc}`).join('\n')}
` : ''}

${videoData.hostingPlatforms.length > 0 ? `
🌐 Detected Hosting Platforms:
${videoData.hostingPlatforms.map((h: any, i: number) => `  ${i + 1}. ${h}`).join('\n')}
` : ''}

${videoData.obfuscatedUrls.length > 0 ? `
🔐 Obfuscated Content Detected:
  • Scripts with obfuscation: ${videoData.obfuscatedUrls.length}
  • URLs extracted from obfuscated code: ${videoData.obfuscatedUrls.reduce((acc: number, s: any) => acc + (s.extractedUrls?.length || 0), 0)}
` : ''}

${videoData.downloadLinks.length > 0 ? `
⬇️ Download Links:
${videoData.downloadLinks.slice(0, 5).map((d: any, i: number) => `  ${i + 1}. ${d.text}: ${d.href}`).join('\n')}
${videoData.downloadLinks.length > 5 ? `  ... and ${videoData.downloadLinks.length - 5} more` : ''}
` : ''}

📋 Full Data (JSON):
${JSON.stringify(videoData, null, 2)}
`;

    return {
      content: [{
        type: 'text' as const,
        text: summary
      }]
    };
  }, 'Failed to extract advanced video sources');
}

/**
 * Deobfuscate JavaScript - Attempt to decode obfuscated JavaScript
 */
export async function handleDeobfuscateJS(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('deobfuscate_js', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const deobfuscationResults = await page.evaluate(() => {
      const results: any[] = [];
      
      document.querySelectorAll('script').forEach((script: any, index: number) => {
        const content = script.textContent || '';
        
        if (content.length < 100) return;
        
        const analysis: any = {
          scriptIndex: index,
          obfuscationType: [],
          extractedData: {
            urls: [],
            domains: [],
            apiKeys: [],
            base64Strings: []
          }
        };
        
        // Detect obfuscation types
        if (content.includes('eval(')) analysis.obfuscationType.push('eval');
        if (content.includes('atob(')) analysis.obfuscationType.push('base64');
        if (content.match(/0x[0-9a-f]{4}/gi)) analysis.obfuscationType.push('hex');
        if (content.match(/_0x[0-9a-f]+/gi)) analysis.obfuscationType.push('identifier_obfuscation');
        if (content.includes('\\x')) analysis.obfuscationType.push('hex_escape');
        
        if (analysis.obfuscationType.length === 0) return;
        
        // Extract URLs
        const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
        const urls = content.match(urlPattern);
        if (urls) {
          analysis.extractedData.urls = [...new Set(urls)];
        }
        
        // Extract base64 encoded strings
        const base64Pattern = /["']([A-Za-z0-9+/]{20,}={0,2})["']/g;
        let match;
        while ((match = base64Pattern.exec(content)) !== null) {
          try {
            const decoded = atob(match[1]);
            if (decoded.includes('http') || decoded.includes('video') || decoded.includes('.m3u8')) {
              analysis.extractedData.base64Strings.push({
                original: match[1].substring(0, 50) + '...',
                decoded: decoded.substring(0, 200)
              });
            }
          } catch (e) {
            // Not valid base64
          }
        }
        
        // Extract potential domains
        const domainPattern = /[a-z0-9][a-z0-9-]*\.(com|net|org|io|tv|online|xyz|cc)/gi;
        const domains = content.match(domainPattern);
        if (domains) {
          analysis.extractedData.domains = [...new Set(domains)];
        }
        
        results.push(analysis);
      });
      
      return results.filter(r => r.obfuscationType.length > 0);
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `🔓 Deobfuscation Results:\n\nFound ${deobfuscationResults.length} obfuscated scripts\n\n${JSON.stringify(deobfuscationResults, null, 2)}`
      }]
    };
  }, 'Failed to deobfuscate JavaScript');
}

/**
 * Multi-Layer Redirect Tracer - Follow multiple redirect layers to find final video source
 */
export async function handleMultiLayerRedirectTrace(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('multi_layer_redirect_trace', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const startUrl = args.url;
    const maxDepth = args.maxDepth || 5;
    
    if (!startUrl) {
      throw new Error('URL is required');
    }
    
    const redirectChain: any[] = [];
    let currentDepth = 0;
    let currentUrl = startUrl;
    
    while (currentDepth < maxDepth) {
      try {
        const allRequests: any[] = [];
        const responseHandler = (response: any) => {
          allRequests.push({
            url: response.url(),
            status: response.status(),
            redirected: response.request().redirectChain().length > 0,
            finalUrl: response.url()
          });
        };
        
        page.on('response', responseHandler);
        
        await page.goto(currentUrl, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        await sleep(2000);
        
        page.off('response', responseHandler);
        
        const finalUrl = page.url();
        
        // Check for iframe redirects
        const iframes = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('iframe')).map((f: any) => f.src);
        });
        
        redirectChain.push({
          depth: currentDepth,
          startUrl: currentUrl,
          finalUrl,
          iframes,
          requests: allRequests.length
        });
        
        // If we found an iframe, follow it
        if (iframes.length > 0 && iframes[0] !== currentUrl) {
          currentUrl = iframes[0];
          currentDepth++;
        } else {
          break;
        }
      } catch (e) {
        redirectChain.push({
          depth: currentDepth,
          error: e.message
        });
        break;
      }
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: `🔄 Multi-Layer Redirect Trace:\n\nTotal Layers: ${redirectChain.length}\nMax Depth Reached: ${currentDepth >= maxDepth}\n\n${JSON.stringify(redirectChain, null, 2)}`
      }]
    };
  }, 'Failed to trace multi-layer redirects');
}

/**
 * Ad Blocker Detector - Detect and report ad-protection mechanisms
 */
export async function handleAdProtectionDetector(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('ad_protection_detector', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const adProtection = await page.evaluate(() => {
      const results: any = {
        adBlockDetection: false,
        antiDebugger: false,
        obfuscatedCode: false,
        popupLayers: 0,
        hiddenElements: 0,
        suspiciousScripts: []
      };
      
      // Check for common ad-block detection
      const adBlockIndicators = [
        'adblock',
        'ublock',
        'adguard',
        'please disable',
        'turn off ad blocker'
      ];
      
      const bodyText = document.body.textContent?.toLowerCase() || '';
      results.adBlockDetection = adBlockIndicators.some(indicator => bodyText.includes(indicator));
      
      // Check for anti-debugger code
      document.querySelectorAll('script').forEach((script: any) => {
        const content = script.textContent || '';
        if (content.includes('debugger') || content.includes('devtools')) {
          results.antiDebugger = true;
        }
      });
      
      // Count popup layers
      const overlays = document.querySelectorAll('[style*="position: fixed"], [style*="z-index"]');
      results.popupLayers = overlays.length;
      
      // Check for hidden elements
      const hidden = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
      results.hiddenElements = hidden.length;
      
      return results;
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `🛡️ Ad Protection Analysis:\n\n${JSON.stringify(adProtection, null, 2)}`
      }]
    };
  }, 'Failed to detect ad protection');
}
