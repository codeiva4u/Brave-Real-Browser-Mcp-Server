// Test Suite for Smart Data Extractors
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  extractTables,
  extractLists,
  extractJSON,
  extractMetaTags,
  extractSchemaOrg
} from './smart-data-extractors.js';

describe('Smart Data Extractors', () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      evaluate: vi.fn(),
      url: vi.fn(() => 'https://example.com')
    };
  });

  describe('extractTables', () => {
    it('should extract table data correctly', async () => {
      mockPage.evaluate.mockResolvedValue([
        {
          headers: ['Name', 'Age'],
          rows: [{ Name: 'John', Age: '30' }],
          rowCount: 1,
          columnCount: 2
        }
      ]);

      const result = await extractTables(mockPage);
      expect(result).toHaveLength(1);
      expect(result[0].headers).toContain('Name');
      expect(result[0].rowCount).toBe(1);
    });

    it('should handle empty tables', async () => {
      mockPage.evaluate.mockResolvedValue([]);
      const result = await extractTables(mockPage);
      expect(result).toHaveLength(0);
    });
  });

  describe('extractLists', () => {
    it('should extract list items', async () => {
      mockPage.evaluate.mockResolvedValue([
        {
          type: 'ul',
          itemCount: 3,
          items: ['Item 1', 'Item 2', 'Item 3']
        }
      ]);

      const result = await extractLists(mockPage);
      expect(result).toHaveLength(1);
      expect(result[0].itemCount).toBe(3);
      expect(result[0].items).toContain('Item 1');
    });
  });

  describe('extractJSON', () => {
    it('should extract JSON from script tags', async () => {
      mockPage.evaluate.mockResolvedValue([
        {
          type: 'script_tag',
          dataType: 'application/json',
          data: { key: 'value' }
        }
      ]);

      const result = await extractJSON(mockPage);
      expect(result).toHaveLength(1);
      expect(result[0].data).toHaveProperty('key', 'value');
    });
  });

  describe('extractMetaTags', () => {
    it('should extract meta tags', async () => {
      mockPage.evaluate.mockResolvedValue({
        basic: {
          title: 'Test Page',
          description: 'Test Description'
        },
        openGraph: {},
        twitter: {},
        other: {}
      });

      const result = await extractMetaTags(mockPage);
      expect(result.basic.title).toBe('Test Page');
      expect(result.basic.description).toBe('Test Description');
    });
  });

  describe('extractSchemaOrg', () => {
    it('should extract schema.org data', async () => {
      mockPage.evaluate.mockResolvedValue([
        {
          format: 'json-ld',
          data: { '@type': 'Article' }
        }
      ]);

      const result = await extractSchemaOrg(mockPage);
      expect(result).toHaveLength(1);
      expect(result[0].format).toBe('json-ld');
    });
  });
});
