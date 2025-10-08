// Test Suite for Advanced Scraping Handlers
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as handlers from './advanced-scraping-handlers.js';

// Mock browser-manager
vi.mock('../browser-manager', () => ({
  getBrowserPage: vi.fn(() => mockPage)
}));

let mockPage: any;

describe('Advanced Scraping Handlers', () => {
  beforeEach(() => {
    mockPage = {
      evaluate: vi.fn(),
      url: vi.fn(() => 'https://example.com'),
      goto: vi.fn(),
      waitForTimeout: vi.fn(),
      click: vi.fn()
    };
  });

  describe('handleExtractTables', () => {
    it('should extract tables successfully', async () => {
      mockPage.evaluate.mockResolvedValue([
        {
          headers: ['Col1', 'Col2'],
          rows: [{ Col1: 'Val1', Col2: 'Val2' }],
          rowCount: 1,
          columnCount: 2
        }
      ]);

      const result = await handlers.handleExtractTables({});
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Extracted 1 table(s)');
    });
  });

  describe('handleExtractLists', () => {
    it('should extract lists successfully', async () => {
      mockPage.evaluate.mockResolvedValue([
        { type: 'ul', itemCount: 2, items: ['Item 1', 'Item 2'] }
      ]);

      const result = await handlers.handleExtractLists({});
      expect(result.content[0].text).toContain('Extracted 1 list(s)');
    });
  });

  describe('handleExtractJSON', () => {
    it('should extract JSON data', async () => {
      mockPage.evaluate.mockResolvedValue([
        { type: 'script_tag', data: { test: 'value' } }
      ]);

      const result = await handlers.handleExtractJSON();
      expect(result.content[0].text).toContain('Found 1 JSON data source(s)');
    });
  });

  describe('handleExtractMetaTags', () => {
    it('should extract meta tags', async () => {
      mockPage.evaluate.mockResolvedValue({
        basic: { title: 'Test', description: 'Desc' },
        openGraph: {},
        twitter: {}
      });

      const result = await handlers.handleExtractMetaTags();
      expect(result.content[0].text).toContain('Meta Tags Extracted');
    });
  });

  describe('handleExtractSchemaOrg', () => {
    it('should extract schema.org data', async () => {
      mockPage.evaluate.mockResolvedValue([
        { format: 'json-ld', data: { '@type': 'Article' } }
      ]);

      const result = await handlers.handleExtractSchemaOrg();
      expect(result.content[0].text).toContain('Found 1 schema(s)');
    });
  });

  describe('handleBatchExtractElements', () => {
    it('should batch extract elements', async () => {
      mockPage.evaluate.mockResolvedValue([
        { title: 'Title 1', price: '$10' },
        { title: 'Title 2', price: '$20' }
      ]);

      const result = await handlers.handleBatchExtractElements({
        selector: '.product',
        fields: { title: '.title', price: '.price' }
      });

      expect(result.content[0].text).toContain('Extracted 2 element(s)');
    });
  });

  describe('handleExtractProducts', () => {
    it('should extract product data', async () => {
      mockPage.evaluate.mockResolvedValue([
        { name: 'Product 1', price: '$10', image: 'img1.jpg' }
      ]);

      const result = await handlers.handleExtractProducts({
        containerSelector: '.product',
        productConfig: { name: '.name', price: '.price', image: '.img' }
      });

      expect(result.content[0].text).toContain('Extracted 1 product(s)');
    });
  });

  describe('handleExtractArticles', () => {
    it('should extract articles', async () => {
      mockPage.evaluate.mockResolvedValue([
        { title: 'Article 1', author: 'Author 1' }
      ]);

      const result = await handlers.handleExtractArticles({
        articleSelector: '.article',
        config: { title: '.title', author: '.author' }
      });

      expect(result.content[0].text).toContain('Extracted 1 article(s)');
    });
  });

  describe('handleExtractImages', () => {
    it('should extract images', async () => {
      mockPage.evaluate.mockResolvedValue([
        { src: 'img1.jpg', alt: 'Image 1', width: 100, height: 100 }
      ]);

      const result = await handlers.handleExtractImages({});
      expect(result.content[0].text).toContain('Extracted 1 image(s)');
    });
  });

  describe('handleExtractLinks', () => {
    it('should extract and classify links', async () => {
      mockPage.evaluate.mockResolvedValue({
        internal: [{ href: '/page1', text: 'Page 1' }],
        external: [{ href: 'https://external.com', text: 'External' }],
        totalLinks: 2,
        internalCount: 1,
        externalCount: 1
      });

      const result = await handlers.handleExtractLinks({});
      expect(result.content[0].text).toContain('Total Links: 2');
      expect(result.content[0].text).toContain('Internal: 1');
      expect(result.content[0].text).toContain('External: 1');
    });
  });

  describe('handleExtractMedia', () => {
    it('should extract media elements', async () => {
      mockPage.evaluate.mockResolvedValue({
        videos: [{ src: 'video.mp4' }],
        audios: [],
        iframes: [],
        videoCount: 1,
        audioCount: 0,
        iframeCount: 0
      });

      const result = await handlers.handleExtractMedia();
      expect(result.content[0].text).toContain('Videos: 1');
    });
  });

  describe('handleExtractDownloadableFiles', () => {
    it('should extract downloadable files', async () => {
      mockPage.evaluate.mockResolvedValue({
        pdfs: [{ href: 'doc.pdf', text: 'Document' }],
        docs: [],
        images: [],
        archives: [],
        others: [],
        totalFiles: 1
      });

      const result = await handlers.handleExtractDownloadableFiles();
      expect(result.content[0].text).toContain('Total: 1');
      expect(result.content[0].text).toContain('PDFs: 1');
    });
  });

  describe('handleExtractSocialMedia', () => {
    it('should extract social media links', async () => {
      mockPage.evaluate.mockResolvedValue({
        facebook: [{ href: 'https://facebook.com/page', text: 'FB' }],
        twitter: [],
        instagram: [],
        linkedin: [],
        youtube: [],
        github: []
      });

      const result = await handlers.handleExtractSocialMedia();
      expect(result.content[0].text).toContain('Social Media Links');
    });
  });

  describe('handleExtractBreadcrumbs', () => {
    it('should extract breadcrumbs', async () => {
      mockPage.evaluate.mockResolvedValue([
        { position: 1, text: 'Home', href: '/' },
        { position: 2, text: 'Category', href: '/category' }
      ]);

      const result = await handlers.handleExtractBreadcrumbs();
      expect(result.content[0].text).toContain('Extracted 2 breadcrumb(s)');
    });
  });

  describe('handleExtractPaginationInfo', () => {
    it('should extract pagination info', async () => {
      mockPage.evaluate.mockResolvedValue({
        currentPage: 1,
        totalPages: 10,
        hasNext: true,
        hasPrevious: false,
        pages: []
      });

      const result = await handlers.handleExtractPaginationInfo();
      expect(result.content[0].text).toContain('Pagination Info');
    });
  });

  describe('handleExtractContactInfo', () => {
    it('should extract contact information', async () => {
      mockPage.evaluate.mockResolvedValue(
        'Contact: test@example.com or call 123-456-7890'
      );

      const result = await handlers.handleExtractContactInfo();
      expect(result.content[0].text).toContain('Contact Information');
    });
  });

  describe('handleHarvestAttributes', () => {
    it('should harvest attributes', async () => {
      mockPage.evaluate.mockResolvedValue([
        { tagName: 'a', text: 'Link', href: '/page', class: 'link' }
      ]);

      const result = await handlers.handleHarvestAttributes({
        selector: 'a',
        attributes: ['href', 'class']
      });

      expect(result.content[0].text).toContain('Harvested attributes from 1 element(s)');
    });
  });
});
