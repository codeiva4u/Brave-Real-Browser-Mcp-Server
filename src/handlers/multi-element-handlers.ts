// Multi-Element Extraction Handlers
// Batch element scraping, nested data extraction, attribute harvesting
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';

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



// Attribute Harvester Arguments
export interface AttributeHarvesterArgs {
  selector: string;
  attributes?: string[];
  maxElements?: number;
}

/**
 * सभी elements के attributes (href, src, data-*) collect करता है
 */
export async function handleAttributeHarvester(args: AttributeHarvesterArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('attribute_harvester', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const selector = args.selector;
    const attributes = args.attributes || [];
    const maxElements = args.maxElements || 100;

    const attributeData = await page.evaluate(
      ({ selector, attributes, maxElements }) => {
        const elements = document.querySelectorAll(selector);
        const result: AttributeData = {
          selector,
          count: Math.min(elements.length, maxElements),
          attributes: [],
        };

        let count = 0;
        elements.forEach((element, index) => {
          if (count >= maxElements) return;

          const attrs: Record<string, string> = {};

          if (attributes.length > 0) {
            // Extract specific attributes
            attributes.forEach((attr) => {
              const value = element.getAttribute(attr);
              if (value !== null) {
                attrs[attr] = value;
              }
            });
          } else {
            // Extract all attributes
            Array.from(element.attributes).forEach((attr) => {
              attrs[attr.name] = attr.value;
            });
          }

          if (Object.keys(attrs).length > 0) {
            result.attributes.push({
              element: index,
              attrs,
            });
            count++;
          }
        });

        return result;
      },
      { selector, attributes, maxElements }
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Harvested attributes from ${attributeData.count} elements\n\n${JSON.stringify(attributeData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to harvest attributes');
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
}

/**
 * Videos, audio files, और iframes के URLs और metadata extract करता है
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

    const mediaData = await page.evaluate(
      ({ types, includeEmbeds }) => {
        const results: any = {
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

            results.videos.push(videoInfo);
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

            results.audio.push(audioInfo);
          });
        }

        // Extract iframes
        if (types.includes('iframe')) {
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach((iframe: any, index) => {
            const iframeInfo: any = {
              index,
              src: iframe.src,
              title: iframe.title || '',
              width: iframe.width || '',
              height: iframe.height || '',
              sandbox: iframe.sandbox ? iframe.sandbox.toString() : '',
              allow: iframe.allow || '',
            };

            if (includeEmbeds) {
              // Detect common embed platforms
              const src = iframe.src.toLowerCase();
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
              }
            }

            results.iframes.push(iframeInfo);
          });
        }

        return results;
      },
      { types, includeEmbeds }
    );

    const totalMedia =
      mediaData.videos.length + mediaData.audio.length + mediaData.iframes.length;

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Extracted ${totalMedia} media elements\n\n${JSON.stringify(mediaData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to extract media');
}


