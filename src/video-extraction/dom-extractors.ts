// HTML/DOM video extraction tools
import { Page } from 'brave-real-puppeteer-core';
import { VideoSource, VideoFormat, ExtractionStrategy, VIDEO_URL_PATTERNS, ExtractionContext } from './types.js';
import { withErrorHandling } from '../system-utils.js';
import { getBrowser } from '../browser-manager.js';

export class HtmlElementsFinder {
  private page: Page | null = null;
  
  async initialize(): Promise<void> {
    const browser = getBrowser();
    if (!browser) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }
    this.page = browser.pages()[0] || await browser.newPage();
  }

  async findVideoTags(): Promise<VideoSource[]> {
    if (!this.page) await this.initialize();
    
    return withErrorHandling(async () => {
      const videoElements = await this.page!.evaluate(() => {
        const videos: any[] = [];
        
        // Find all video tags
        const videoTags = document.querySelectorAll('video');
        videoTags.forEach((video: HTMLVideoElement, index) => {
          const sources: string[] = [];
          
          // Get src attribute
          if (video.src) {
            sources.push(video.src);
          }
          
          // Get source children
          const sourceTags = video.querySelectorAll('source');
          sourceTags.forEach((source: HTMLSourceElement) => {
            if (source.src) {
              sources.push(source.src);
            }
          });
          
          videos.push({
            tag: 'video',
            index,
            sources,
            attributes: {
              id: video.id,
              className: video.className,
              poster: video.poster,
              controls: video.controls,
              autoplay: video.autoplay,
              loop: video.loop,
              muted: video.muted,
              width: video.width,
              height: video.height,
              duration: video.duration || 0
            }
          });
        });
        
        return videos;
      });
      
      const sources: VideoSource[] = [];
      
      for (const video of videoElements) {
        for (const sourceUrl of video.sources) {
          if (sourceUrl && this.isValidVideoUrl(sourceUrl)) {
            sources.push({
              url: sourceUrl,
              format: this.detectFormat(sourceUrl),
              hoster: this.extractDomain(sourceUrl),
              extractorUsed: 'HtmlElementsFinder.findVideoTags',
              confidence: 0.9,
              duration: video.attributes.duration > 0 ? video.attributes.duration : undefined
            });
          }
        }
      }
      
      return sources;
    }, 'HtmlElementsFinder.findVideoTags');
  }

  async findIframeSources(): Promise<VideoSource[]> {
    if (!this.page) await this.initialize();
    
    return withErrorHandling(async () => {
      const iframeElements = await this.page!.evaluate(() => {
        const iframes: any[] = [];
        
        const iframeTags = document.querySelectorAll('iframe');
        iframeTags.forEach((iframe: HTMLIFrameElement, index) => {
          if (iframe.src) {
            iframes.push({
              tag: 'iframe',
              index,
              src: iframe.src,
              attributes: {
                id: iframe.id,
                className: iframe.className,
                width: iframe.width,
                height: iframe.height,
                title: iframe.title,
                name: iframe.name,
                sandbox: iframe.sandbox ? Array.from(iframe.sandbox) : [],
                allowFullscreen: iframe.allowFullscreen
              }
            });
          }
        });
        
        return iframes;
      });
      
      const sources: VideoSource[] = [];
      
      for (const iframe of iframeElements) {
        if (this.isVideoIframe(iframe.src)) {
          sources.push({
            url: iframe.src,
            format: VideoFormat.UNKNOWN,
            hoster: this.extractDomain(iframe.src),
            extractorUsed: 'HtmlElementsFinder.findIframeSources',
            confidence: 0.7,
            isPlaylist: true // Iframes often contain playlists
          });
        }
      }
      
      return sources;
    }, 'HtmlElementsFinder.findIframeSources');
  }

  async findEmbedSources(): Promise<VideoSource[]> {
    if (!this.page) await this.initialize();
    
    return withErrorHandling(async () => {
      const embedElements = await this.page!.evaluate(() => {
        const embeds: any[] = [];
        
        // Find embed tags
        const embedTags = document.querySelectorAll('embed');
        embedTags.forEach((embed: HTMLEmbedElement, index) => {
          if (embed.src) {
            embeds.push({
              tag: 'embed',
              index,
              src: embed.src,
              type: embed.type,
              attributes: {
                width: embed.width,
                height: embed.height,
                quality: embed.getAttribute('quality'),
                wmode: embed.getAttribute('wmode')
              }
            });
          }
        });
        
        // Find object tags
        const objectTags = document.querySelectorAll('object');
        objectTags.forEach((object: HTMLObjectElement, index) => {
          const params: Record<string, string> = {};
          const paramTags = object.querySelectorAll('param');
          paramTags.forEach((param: HTMLParamElement) => {
            if (param.name && param.value) {
              params[param.name] = param.value;
            }
          });
          
          embeds.push({
            tag: 'object',
            index,
            data: object.data,
            type: object.type,
            params
          });
        });
        
        return embeds;
      });
      
      const sources: VideoSource[] = [];
      
      for (const embed of embedElements) {
        const sourceUrl = embed.src || embed.data || embed.params?.movie || embed.params?.src;
        if (sourceUrl && this.isValidVideoUrl(sourceUrl)) {
          sources.push({
            url: sourceUrl,
            format: this.detectFormat(sourceUrl),
            hoster: this.extractDomain(sourceUrl),
            extractorUsed: 'HtmlElementsFinder.findEmbedSources',
            confidence: 0.6
          });
        }
      }
      
      return sources;
    }, 'HtmlElementsFinder.findEmbedSources');
  }

  async findMetaVideoSources(): Promise<VideoSource[]> {
    if (!this.page) await this.initialize();
    
    return withErrorHandling(async () => {
      const metaElements = await this.page!.evaluate(() => {
        const metas: any[] = [];
        
        // Open Graph video tags
        const ogVideoTags = document.querySelectorAll('meta[property^="og:video"]');
        ogVideoTags.forEach((element: Element) => {
          const meta = element as HTMLMetaElement;
          if (meta.content) {
            metas.push({
              type: 'og:video',
              property: meta.getAttribute('property'),
              content: meta.content
            });
          }
        });
        
        // Twitter card video tags
        const twitterVideoTags = document.querySelectorAll('meta[name^="twitter:player"]');
        twitterVideoTags.forEach((element: Element) => {
          const meta = element as HTMLMetaElement;
          if (meta.content) {
            metas.push({
              type: 'twitter:player',
              name: meta.getAttribute('name'),
              content: meta.content
            });
          }
        });
        
        return metas;
      });
      
      const sources: VideoSource[] = [];
      
      for (const meta of metaElements) {
        if (this.isValidVideoUrl(meta.content)) {
          sources.push({
            url: meta.content,
            format: this.detectFormat(meta.content),
            hoster: this.extractDomain(meta.content),
            extractorUsed: 'HtmlElementsFinder.findMetaVideoSources',
            confidence: 0.8
          });
        }
      }
      
      return sources;
    }, 'HtmlElementsFinder.findMetaVideoSources');
  }

  async findDataAttributesSources(): Promise<VideoSource[]> {
    if (!this.page) await this.initialize();
    
    return withErrorHandling(async () => {
      const dataElements = await this.page!.evaluate(() => {
        const elements: any[] = [];
        
        // Common data attributes for video URLs
        const dataAttributes = [
          'data-src', 'data-video', 'data-stream', 'data-url', 'data-file',
          'data-source', 'data-media', 'data-mp4', 'data-webm', 'data-hls',
          'data-dash', 'data-playlist', 'data-video-src', 'data-video-url'
        ];
        
        dataAttributes.forEach(attr => {
          const elementsWithAttr = document.querySelectorAll(`[${attr}]`);
          elementsWithAttr.forEach((element: Element, index) => {
            const value = element.getAttribute(attr);
            if (value) {
              elements.push({
                tag: element.tagName.toLowerCase(),
                attribute: attr,
                value: value,
                index,
                className: element.className,
                id: element.id
              });
            }
          });
        });
        
        return elements;
      });
      
      const sources: VideoSource[] = [];
      
      for (const element of dataElements) {
        if (this.isValidVideoUrl(element.value)) {
          sources.push({
            url: element.value,
            format: this.detectFormat(element.value),
            hoster: this.extractDomain(element.value),
            extractorUsed: 'HtmlElementsFinder.findDataAttributesSources',
            confidence: 0.7
          });
        }
      }
      
      return sources;
    }, 'HtmlElementsFinder.findDataAttributesSources');
  }

  private isValidVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    // Check for video file extensions
    if (Object.values(VIDEO_URL_PATTERNS).some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Check for video-related parameters
    if (VIDEO_URL_PATTERNS.VIDEO_PARAMS.test(url)) {
      return true;
    }
    
    // Check for CDN domains
    if (VIDEO_URL_PATTERNS.CDN_DOMAINS.test(url)) {
      return true;
    }
    
    return false;
  }

  private isVideoIframe(src: string): boolean {
    const videoHosts = [
      'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'wistia.com',
      'brightcove.com', 'jwplayer.com', 'videojs.com', 'player.vimeo.com',
      'embed.', 'player.', 'stream.', 'video.'
    ];
    
    return videoHosts.some(host => src.includes(host));
  }

  private detectFormat(url: string): VideoFormat {
    if (VIDEO_URL_PATTERNS.MP4.test(url)) return VideoFormat.MP4;
    if (VIDEO_URL_PATTERNS.WEBM.test(url)) return VideoFormat.WEBM;
    if (VIDEO_URL_PATTERNS.HLS.test(url)) return VideoFormat.HLS;
    if (VIDEO_URL_PATTERNS.DASH.test(url)) return VideoFormat.DASH;
    if (VIDEO_URL_PATTERNS.TS.test(url)) return VideoFormat.TS;
    if (VIDEO_URL_PATTERNS.FLV.test(url)) return VideoFormat.FLV;
    if (VIDEO_URL_PATTERNS.AVI.test(url)) return VideoFormat.AVI;
    if (VIDEO_URL_PATTERNS.MKV.test(url)) return VideoFormat.MKV;
    if (VIDEO_URL_PATTERNS.BLOB.test(url)) return VideoFormat.BLOB;
    
    return VideoFormat.UNKNOWN;
  }

  private extractDomain(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch {
      return 'unknown';
    }
  }
}

export class VideoSelectors {
  private page: Page | null = null;
  
  async initialize(): Promise<void> {
    const browser = getBrowser();
    if (!browser) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }
    this.page = browser.pages()[0] || await browser.newPage();
  }

  async generateVideoSelectors(): Promise<Record<string, string[]>> {
    if (!this.page) await this.initialize();
    
    return withErrorHandling(async () => {
      const selectors = await this.page!.evaluate(() => {
        const result: Record<string, string[]> = {
          videoTags: [],
          sourceElements: [],
          embedElements: [],
          iframeElements: [],
          dataAttributes: [],
          playerContainers: [],
          downloadButtons: [],
          playButtons: []
        };
        
        // Video tag selectors
        const videos = document.querySelectorAll('video');
        videos.forEach((video, index) => {
          if (video.id) result.videoTags.push(`#${video.id}`);
          if (video.className) result.videoTags.push(`.${video.className.split(' ')[0]}`);
          result.videoTags.push(`video:nth-of-type(${index + 1})`);
        });
        
        // Source element selectors
        const sources = document.querySelectorAll('source');
        sources.forEach((source, index) => {
          result.sourceElements.push(`source:nth-of-type(${index + 1})`);
          if (source.type) result.sourceElements.push(`source[type="${source.type}"]`);
        });
        
        // Embed selectors
        const embeds = document.querySelectorAll('embed, object');
        embeds.forEach((embed, index) => {
          if (embed.id) result.embedElements.push(`#${embed.id}`);
          if (embed.className) result.embedElements.push(`.${embed.className.split(' ')[0]}`);
        });
        
        // Iframe selectors
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
          if (iframe.id) result.iframeElements.push(`#${iframe.id}`);
          if (iframe.className) result.iframeElements.push(`.${iframe.className.split(' ')[0]}`);
          if (iframe.title) result.iframeElements.push(`iframe[title*="${iframe.title}"]`);
        });
        
        // Common player container selectors
        const playerSelectors = [
          '.video-player', '.player', '.video-container', '.media-player',
          '.jwplayer', '.vjs-tech', '.plyr', '.fp-player', '.clappr-container',
          '[id*="player"]', '[class*="player"]', '[class*="video"]'
        ];
        
        playerSelectors.forEach(selector => {
          if (document.querySelector(selector)) {
            result.playerContainers.push(selector);
          }
        });
        
        // Download button selectors
        const downloadSelectors = [
          'a[href*="download"]', 'button[class*="download"]', '.download-btn',
          '[data-action="download"]', '[onclick*="download"]'
        ];
        
        downloadSelectors.forEach(selector => {
          if (document.querySelector(selector)) {
            result.downloadButtons.push(selector);
          }
        });
        
        // Play button selectors
        const playSelectors = [
          '.play-btn', '[class*="play"]', 'button[aria-label*="play"]',
          '.vjs-play-control', '.fp-play', '.plyr__control--play'
        ];
        
        playSelectors.forEach(selector => {
          if (document.querySelector(selector)) {
            result.playButtons.push(selector);
          }
        });
        
        return result;
      });
      
      return selectors;
    }, 'VideoSelectors.generateVideoSelectors');
  }
}

// Export initialized instances
export const htmlElementsFinder = new HtmlElementsFinder();
export const videoSelectors = new VideoSelectors();