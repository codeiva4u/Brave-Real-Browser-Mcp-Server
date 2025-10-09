// Content Type Specific Extractors Module
import { Page } from 'puppeteer-core';

/**
 * Image Scraper - Extract all images with metadata
 */
export async function scrapeImages(page: Page, selector?: string): Promise<Array<{
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  loading: string;
  srcset: string;
  sizes: string;
  isVisible: boolean;
}>> {
  return await page.evaluate((sel) => {
    const images = sel 
      ? document.querySelectorAll(sel)
      : document.querySelectorAll('img');
    
    const results: Array<any> = [];
    
    images.forEach((img) => {
      const imgEl = img as HTMLImageElement;
      const rect = imgEl.getBoundingClientRect();
      const styles = window.getComputedStyle(imgEl);
      
      results.push({
        src: imgEl.src || imgEl.getAttribute('src') || '',
        alt: imgEl.alt || '',
        title: imgEl.title || '',
        width: imgEl.width || rect.width,
        height: imgEl.height || rect.height,
        naturalWidth: imgEl.naturalWidth,
        naturalHeight: imgEl.naturalHeight,
        loading: imgEl.loading || 'auto',
        srcset: imgEl.srcset || '',
        sizes: imgEl.sizes || '',
        isVisible: styles.display !== 'none' && styles.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
      });
    });
    
    return results;
  }, selector || null);
}

/**
 * Link Harvester - Extract all links with classification
 */
export async function harvestLinks(page: Page, options?: {
  includeInternal?: boolean;
  includeExternal?: boolean;
  includeAnchors?: boolean;
}): Promise<{
  internal: Array<{ href: string; text: string; title: string }>;
  external: Array<{ href: string; text: string; title: string }>;
  anchors: Array<{ href: string; text: string; target: string }>;
  all: Array<{ href: string; text: string; type: string }>;
}> {
  const opts = {
    includeInternal: true,
    includeExternal: true,
    includeAnchors: true,
    ...options
  };
  
  return await page.evaluate((config) => {
    const currentDomain = window.location.hostname;
    const internal: Array<any> = [];
    const external: Array<any> = [];
    const anchors: Array<any> = [];
    const all: Array<any> = [];
    
    const links = document.querySelectorAll('a[href]');
    
    links.forEach((link) => {
      const href = (link as HTMLAnchorElement).href;
      const text = (link as HTMLElement).innerText.trim();
      const title = link.getAttribute('title') || '';
      const target = link.getAttribute('target') || '';
      
      if (!href) return;
      
      // Anchor links
      if (href.startsWith('#')) {
        if (config.includeAnchors) {
          anchors.push({ href, text, target });
          all.push({ href, text, type: 'anchor' });
        }
        return;
      }
      
      try {
        const url = new URL(href);
        
        // Internal vs External
        if (url.hostname === currentDomain || url.hostname === '') {
          if (config.includeInternal) {
            internal.push({ href, text, title });
            all.push({ href, text, type: 'internal' });
          }
        } else {
          if (config.includeExternal) {
            external.push({ href, text, title });
            all.push({ href, text, type: 'external' });
          }
        }
      } catch (e) {
        // Invalid URL, treat as internal
        if (config.includeInternal) {
          internal.push({ href, text, title });
          all.push({ href, text, type: 'internal' });
        }
      }
    });
    
    return { internal, external, anchors, all };
  }, opts);
}

/**
 * Media Extractor - Extract videos, audio files, and embedded media
 */
export async function extractMedia(page: Page): Promise<{
  videos: Array<Record<string, any>>;
  audio: Array<Record<string, any>>;
  iframes: Array<Record<string, any>>;
  embeds: Array<Record<string, any>>;
}> {
  return await page.evaluate(() => {
    const videos: Array<any> = [];
    const audio: Array<any> = [];
    const iframes: Array<any> = [];
    const embeds: Array<any> = [];
    
    // Extract video elements
    document.querySelectorAll('video').forEach((video) => {
      const sources: string[] = [];
      video.querySelectorAll('source').forEach((source) => {
        sources.push(source.src);
      });
      
      videos.push({
        src: video.src || sources[0] || '',
        sources: sources,
        poster: video.poster || '',
        width: video.width,
        height: video.height,
        controls: video.controls,
        autoplay: video.autoplay,
        loop: video.loop,
        muted: video.muted,
        duration: video.duration,
        currentTime: video.currentTime
      });
    });
    
    // Extract audio elements
    document.querySelectorAll('audio').forEach((audioEl) => {
      const sources: string[] = [];
      audioEl.querySelectorAll('source').forEach((source) => {
        sources.push(source.src);
      });
      
      audio.push({
        src: audioEl.src || sources[0] || '',
        sources: sources,
        controls: audioEl.controls,
        autoplay: audioEl.autoplay,
        loop: audioEl.loop,
        muted: audioEl.muted,
        duration: audioEl.duration
      });
    });
    
    // Extract iframes
    document.querySelectorAll('iframe').forEach((iframe) => {
      const src = iframe.src;
      let platform = 'unknown';
      
      // Detect common video platforms
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        platform = 'youtube';
      } else if (src.includes('vimeo.com')) {
        platform = 'vimeo';
      } else if (src.includes('dailymotion.com')) {
        platform = 'dailymotion';
      } else if (src.includes('facebook.com')) {
        platform = 'facebook';
      } else if (src.includes('twitter.com') || src.includes('x.com')) {
        platform = 'twitter';
      }
      
      iframes.push({
        src: src,
        title: iframe.title || '',
        width: iframe.width,
        height: iframe.height,
        platform: platform,
        allowFullscreen: iframe.allowFullscreen
      });
    });
    
    // Extract embed elements
    document.querySelectorAll('embed, object').forEach((embed) => {
      embeds.push({
        src: embed.getAttribute('src') || embed.getAttribute('data') || '',
        type: embed.getAttribute('type') || '',
        width: embed.getAttribute('width') || '',
        height: embed.getAttribute('height') || ''
      });
    });
    
    return { videos, audio, iframes, embeds };
  });
}

/**
 * PDF Link Finder - Find all downloadable file links
 */
export async function findDownloadableFiles(page: Page): Promise<{
  pdfs: Array<{ href: string; text: string; size?: string }>;
  documents: Array<{ href: string; text: string; type: string }>;
  archives: Array<{ href: string; text: string; type: string }>;
  images: Array<{ href: string; text: string; type: string }>;
  other: Array<{ href: string; text: string; type: string }>;
}> {
  return await page.evaluate(() => {
    const pdfs: Array<any> = [];
    const documents: Array<any> = [];
    const archives: Array<any> = [];
    const images: Array<any> = [];
    const other: Array<any> = [];
    
    const links = document.querySelectorAll('a[href]');
    
    links.forEach((link) => {
      const href = (link as HTMLAnchorElement).href;
      const text = (link as HTMLElement).innerText.trim();
      const download = link.getAttribute('download');
      
      if (!href) return;
      
      const url = href.toLowerCase();
      const fileInfo = { href, text, size: link.getAttribute('data-size') || undefined };
      
      // PDF files
      if (url.endsWith('.pdf') || url.includes('.pdf?') || download?.endsWith('.pdf')) {
        pdfs.push(fileInfo);
      }
      // Document files
      else if (url.match(/\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)($|\?)/)) {
        const match = url.match(/\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)($|\?)/);
        documents.push({ ...fileInfo, type: match ? match[1] : 'unknown' });
      }
      // Archive files
      else if (url.match(/\.(zip|rar|7z|tar|gz|bz2)($|\?)/)) {
        const match = url.match(/\.(zip|rar|7z|tar|gz|bz2)($|\?)/);
        archives.push({ ...fileInfo, type: match ? match[1] : 'unknown' });
      }
      // Image files (downloadable)
      else if (url.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp|ico)($|\?)/) && download) {
        const match = url.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp|ico)($|\?)/);
        images.push({ ...fileInfo, type: match ? match[1] : 'unknown' });
      }
      // Other downloadable files
      else if (download || url.match(/\.(exe|dmg|apk|deb|rpm|msi|iso)($|\?)/)) {
        const match = url.match(/\.([a-z0-9]+)($|\?)/);
        other.push({ ...fileInfo, type: match ? match[1] : 'unknown' });
      }
    });
    
    return { pdfs, documents, archives, images, other };
  });
}

/**
 * Social Media Links Extractor - Extract social media profile links
 */
export async function extractSocialLinks(page: Page): Promise<Record<string, string[]>> {
  return await page.evaluate(() => {
    const socialLinks: Record<string, string[]> = {
      facebook: [],
      twitter: [],
      instagram: [],
      linkedin: [],
      youtube: [],
      github: [],
      pinterest: [],
      tiktok: [],
      other: []
    };
    
    const links = document.querySelectorAll('a[href]');
    
    links.forEach((link) => {
      const href = (link as HTMLAnchorElement).href.toLowerCase();
      
      if (href.includes('facebook.com')) {
        socialLinks.facebook.push((link as HTMLAnchorElement).href);
      } else if (href.includes('twitter.com') || href.includes('x.com')) {
        socialLinks.twitter.push((link as HTMLAnchorElement).href);
      } else if (href.includes('instagram.com')) {
        socialLinks.instagram.push((link as HTMLAnchorElement).href);
      } else if (href.includes('linkedin.com')) {
        socialLinks.linkedin.push((link as HTMLAnchorElement).href);
      } else if (href.includes('youtube.com') || href.includes('youtu.be')) {
        socialLinks.youtube.push((link as HTMLAnchorElement).href);
      } else if (href.includes('github.com')) {
        socialLinks.github.push((link as HTMLAnchorElement).href);
      } else if (href.includes('pinterest.com')) {
        socialLinks.pinterest.push((link as HTMLAnchorElement).href);
      } else if (href.includes('tiktok.com')) {
        socialLinks.tiktok.push((link as HTMLAnchorElement).href);
      }
    });
    
    // Remove duplicates
    Object.keys(socialLinks).forEach((key) => {
      socialLinks[key] = Array.from(new Set(socialLinks[key]));
    });
    
    return socialLinks;
  });
}

/**
 * Email and Phone Extractor - Extract contact information from page
 */
export async function extractContactInfo(page: Page): Promise<{
  emails: string[];
  phones: string[];
  addresses: string[];
}> {
  return await page.evaluate(() => {
    const text = document.body.innerText;
    const emails: string[] = [];
    const phones: string[] = [];
    const addresses: string[] = [];
    
    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = text.match(emailRegex);
    if (emailMatches) {
      emails.push(...emailMatches);
    }
    
    // Also check mailto links
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      const email = (link as HTMLAnchorElement).href.replace('mailto:', '').split('?')[0];
      if (email) emails.push(email);
    });
    
    // Extract phone numbers (various formats)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneMatches = text.match(phoneRegex);
    if (phoneMatches) {
      phones.push(...phoneMatches);
    }
    
    // Also check tel links
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      const phone = (link as HTMLAnchorElement).href.replace('tel:', '');
      if (phone) phones.push(phone);
    });
    
    // Remove duplicates
    return {
      emails: Array.from(new Set(emails)),
      phones: Array.from(new Set(phones)),
      addresses: addresses
    };
  });
}
