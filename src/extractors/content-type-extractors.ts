// Content Type Specific Extractors
// Image Scraper, Link Harvester, Media Extractor, PDF Link Finder

// Using any type for Page compatibility with brave-real-browser
type Page = any;

/**
 * Image Scraper - सभी images URLs, alt text, dimensions के साथ
 */
export async function extractImages(page: Page, selector?: string): Promise<any[]> {
  return await page.evaluate((sel: any) => {
    const images = sel ? 
      Array.from(document.querySelectorAll(sel)) : 
      Array.from(document.querySelectorAll('img'));
    
    return images.map((img: any) => ({
      src: img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src'),
      alt: img.alt || '',
      title: img.title || '',
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      loading: img.loading,
      srcset: img.srcset || ''
    }));
  }, selector);
}

/**
 * Link Harvester - Internal/external links classification के साथ
 */
export async function extractLinks(page: Page, selector?: string): Promise<any> {
  const currentUrl = page.url();
  
  return await page.evaluate((sel: any, pageUrl: any) => {
    const links = sel ? 
      Array.from(document.querySelectorAll(sel)) : 
      Array.from(document.querySelectorAll('a[href]'));
    
    const internal: any[] = [];
    const external: any[] = [];
    
    const currentDomain = new URL(pageUrl).hostname;
    
    links.forEach((link: any) => {
      const href = link.href;
      if (!href) return;
      
      const linkData = {
        href,
        text: link.textContent?.trim() || '',
        title: link.title || '',
        rel: link.rel || '',
        target: link.target || ''
      };
      
      try {
        const linkDomain = new URL(href).hostname;
        if (linkDomain === currentDomain || href.startsWith('/') || href.startsWith('#')) {
          internal.push(linkData);
        } else {
          external.push(linkData);
        }
      } catch (e) {
        // Invalid URL, consider as internal relative link
        internal.push(linkData);
      }
    });
    
    return {
      internal,
      external,
      totalLinks: internal.length + external.length,
      internalCount: internal.length,
      externalCount: external.length
    };
  }, selector, currentUrl);
}

/**
 * Media Extractor - Videos, audio files के URLs और metadata
 */
export async function extractMedia(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const videos: any[] = [];
    const audios: any[] = [];
    const iframes: any[] = [];
    
    // Extract videos
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach((video: any) => {
      const sources = Array.from(video.querySelectorAll('source'));
      videos.push({
        src: video.src || '',
        poster: video.poster || '',
        width: video.width,
        height: video.height,
        duration: video.duration,
        sources: sources.map((s: any) => ({
          src: s.src,
          type: s.type
        })),
        controls: video.controls,
        autoplay: video.autoplay,
        loop: video.loop
      });
    });
    
    // Extract audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((audio: any) => {
      const sources = Array.from(audio.querySelectorAll('source'));
      audios.push({
        src: audio.src || '',
        duration: audio.duration,
        sources: sources.map((s: any) => ({
          src: s.src,
          type: s.type
        })),
        controls: audio.controls,
        autoplay: audio.autoplay,
        loop: audio.loop
      });
    });
    
    // Extract iframes (often used for embedded videos)
    const iframeElements = document.querySelectorAll('iframe');
    iframeElements.forEach((iframe: any) => {
      iframes.push({
        src: iframe.src || '',
        width: iframe.width,
        height: iframe.height,
        title: iframe.title || '',
        allow: iframe.allow || ''
      });
    });
    
    return {
      videos,
      audios,
      iframes,
      videoCount: videos.length,
      audioCount: audios.length,
      iframeCount: iframes.length
    };
  });
}

/**
 * PDF Link Finder - Downloadable files detect करना
 */
export async function extractDownloadableFiles(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const files: any = {
      pdfs: [],
      docs: [],
      images: [],
      archives: [],
      others: []
    };
    
    // Common file extensions
    const extensions: any = {
      pdf: ['pdf'],
      doc: ['doc', 'docx', 'txt', 'rtf', 'odt'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
      archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    };
    
    // Find all links
    const links = document.querySelectorAll('a[href]');
    links.forEach((link: any) => {
      const href = link.href;
      if (!href) return;
      
      const linkData = {
        href,
        text: link.textContent?.trim() || '',
        download: link.download || '',
        type: link.type || ''
      };
      
      // Check file extension
      const urlPath = href.split('?')[0]; // Remove query params
      const ext = urlPath.split('.').pop()?.toLowerCase();
      
      if (!ext) return;
      
      if (extensions.pdf.includes(ext)) {
        files.pdfs.push(linkData);
      } else if (extensions.doc.includes(ext)) {
        files.docs.push(linkData);
      } else if (extensions.image.includes(ext)) {
        files.images.push(linkData);
      } else if (extensions.archive.includes(ext)) {
        files.archives.push(linkData);
      } else if (link.download || link.type) {
        files.others.push(linkData);
      }
    });
    
    return {
      ...files,
      totalFiles: files.pdfs.length + files.docs.length + files.images.length + 
                  files.archives.length + files.others.length
    };
  });
}

/**
 * Social Media Links Extractor - Social media profiles निकालना
 */
export async function extractSocialMediaLinks(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const social: any = {
      facebook: [],
      twitter: [],
      instagram: [],
      linkedin: [],
      youtube: [],
      github: [],
      other: []
    };
    
    const links = document.querySelectorAll('a[href]');
    
    links.forEach((link: any) => {
      const href = link.href.toLowerCase();
      const linkData = {
        href: link.href,
        text: link.textContent?.trim() || ''
      };
      
      if (href.includes('facebook.com')) {
        social.facebook.push(linkData);
      } else if (href.includes('twitter.com') || href.includes('x.com')) {
        social.twitter.push(linkData);
      } else if (href.includes('instagram.com')) {
        social.instagram.push(linkData);
      } else if (href.includes('linkedin.com')) {
        social.linkedin.push(linkData);
      } else if (href.includes('youtube.com') || href.includes('youtu.be')) {
        social.youtube.push(linkData);
      } else if (href.includes('github.com')) {
        social.github.push(linkData);
      }
    });
    
    return social;
  });
}
