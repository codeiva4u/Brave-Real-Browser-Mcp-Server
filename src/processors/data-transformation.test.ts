// Test suite for Data Transformation and Processing Tools

import { describe, it, expect } from 'vitest';
import {
  cleanText,
  htmlToCleanText,
  parsePrice,
  normalizeDate,
  extractContactInfo,
  validateSchema,
  checkRequiredFields,
  removeDuplicates,
  batchTransform,
} from './data-transformation.js';

describe('Data Transformation Tools', () => {
  describe('cleanText', () => {
    it('should remove extra whitespace', async () => {
      const result = await cleanText('Hello    World   !');
      expect(result).toBe('Hello World !');
    });

    it('should remove special characters when option is set', async () => {
      const result = await cleanText('Hello@#$World!', { removeSpecialChars: true });
      expect(result).toBe('HelloWorld!');
    });

    it('should convert to lowercase when option is set', async () => {
      const result = await cleanText('Hello World', { toLowerCase: true });
      expect(result).toBe('hello world');
    });

    it('should remove URLs when option is set', async () => {
      const result = await cleanText('Visit https://example.com now', { removeUrls: true });
      expect(result).toBe('Visit now');
    });

    it('should remove emails when option is set', async () => {
      const result = await cleanText('Contact me@example.com here', { removeEmails: true });
      expect(result).toBe('Contact here');
    });

    it('should trim whitespace', async () => {
      const result = await cleanText('  Hello World  ');
      expect(result).toBe('Hello World');
    });
  });

  describe('htmlToCleanText', () => {
    it('should remove HTML tags', async () => {
      const result = await htmlToCleanText('<div>Hello <b>World</b></div>');
      expect(result).toBe('Hello World');
    });

    it('should remove script tags', async () => {
      const result = await htmlToCleanText('<div>Hello</div><script>alert("test")</script>');
      expect(result).toBe('Hello');
    });

    it('should preserve line breaks when option is set', async () => {
      const result = await htmlToCleanText('<p>Line 1</p><p>Line 2</p>', { preserveLineBreaks: true });
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });

    it('should preserve links when option is set', async () => {
      const result = await htmlToCleanText(
        '<a href="https://example.com">Click here</a>',
        { preserveLinks: true }
      );
      expect(result).toContain('Click here');
      expect(result).toContain('https://example.com');
    });

    it('should decode HTML entities', async () => {
      const result = await htmlToCleanText('Hello &amp; World &lt;test&gt;');
      expect(result).toBe('Hello & World <test>');
    });
  });

  describe('parsePrice', () => {
    it('should parse USD price with $ symbol', async () => {
      const result = await parsePrice('$99.99');
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(99.99);
      expect(result?.currency).toBe('USD');
    });

    it('should parse EUR price with € symbol', async () => {
      const result = await parsePrice('€50.00');
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(50.00);
      expect(result?.currency).toBe('EUR');
    });

    it('should parse price with thousands separator', async () => {
      const result = await parsePrice('$1,234.56');
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1234.56);
    });

    it('should parse Indian Rupee price', async () => {
      const result = await parsePrice('₹999');
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(999);
      expect(result?.currency).toBe('INR');
    });

    it('should handle European decimal format', async () => {
      const result = await parsePrice('€1.234,56');
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1234.56);
    });

    it('should return null for invalid price', async () => {
      const result = await parsePrice('Not a price');
      expect(result).toBeNull();
    });
  });

  describe('normalizeDate', () => {
    it('should parse ISO format date', async () => {
      const result = await normalizeDate('2024-01-15');
      expect(result).not.toBeNull();
      expect(result?.iso).toContain('2024-01-15');
    });

    it('should parse US format date', async () => {
      const result = await normalizeDate('01/15/2024');
      expect(result).not.toBeNull();
      expect(result?.timestamp).toBeGreaterThan(0);
    });

    it('should parse written format date', async () => {
      const result = await normalizeDate('January 15, 2024');
      expect(result).not.toBeNull();
      expect(result?.formatted).toContain('January');
    });

    it('should return null for invalid date', async () => {
      const result = await normalizeDate('Not a date');
      expect(result).toBeNull();
    });

    it('should include original date string', async () => {
      const original = '2024-01-15';
      const result = await normalizeDate(original);
      expect(result?.original).toBe(original);
    });
  });

  describe('extractContactInfo', () => {
    it('should extract phone numbers', async () => {
      const result = await extractContactInfo('Call me at 555-123-4567 or (555) 987-6543');
      expect(result.phones.length).toBeGreaterThan(0);
    });

    it('should extract email addresses', async () => {
      const result = await extractContactInfo('Email: test@example.com and admin@test.org');
      expect(result.emails).toContain('test@example.com');
      expect(result.emails).toContain('admin@test.org');
    });

    it('should extract URLs', async () => {
      const result = await extractContactInfo('Visit https://example.com and http://test.org');
      expect(result.urls).toContain('https://example.com');
      expect(result.urls).toContain('http://test.org');
    });

    it('should remove duplicate contacts', async () => {
      const result = await extractContactInfo('test@example.com and test@example.com again');
      expect(result.emails.length).toBe(1);
    });

    it('should normalize emails to lowercase', async () => {
      const result = await extractContactInfo('TEST@EXAMPLE.COM');
      expect(result.emails[0]).toBe('test@example.com');
    });
  });

  describe('validateSchema', () => {
    it('should validate required fields', async () => {
      const data = { name: 'John', age: 30 };
      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: true },
      };
      const result = await validateSchema(data, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required fields', async () => {
      const data = { name: 'John' };
      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: true },
      };
      const result = await validateSchema(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate string length', async () => {
      const data = { name: 'Jo' };
      const schema = {
        name: { type: 'string' as const, minLength: 3 },
      };
      const result = await validateSchema(data, schema);
      expect(result.valid).toBe(false);
    });

    it('should validate number range', async () => {
      const data = { age: 5 };
      const schema = {
        age: { type: 'number' as const, min: 18 },
      };
      const result = await validateSchema(data, schema);
      expect(result.valid).toBe(false);
    });

    it('should validate with regex pattern', async () => {
      const data = { email: 'invalid-email' };
      const schema = {
        email: { type: 'string' as const, pattern: /^[\w.-]+@[\w.-]+\.\w+$/ },
      };
      const result = await validateSchema(data, schema);
      expect(result.valid).toBe(false);
    });
  });

  describe('checkRequiredFields', () => {
    it('should identify all present fields', async () => {
      const data = { name: 'John', age: 30, email: 'john@example.com' };
      const required = ['name', 'age', 'email'];
      const result = await checkRequiredFields(data, required);
      expect(result.allPresent).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should identify missing fields', async () => {
      const data = { name: 'John' };
      const required = ['name', 'age', 'email'];
      const result = await checkRequiredFields(data, required);
      expect(result.allPresent).toBe(false);
      expect(result.missingFields).toContain('age');
      expect(result.missingFields).toContain('email');
    });

    it('should treat empty strings as missing', async () => {
      const data = { name: '', age: 30 };
      const required = ['name', 'age'];
      const result = await checkRequiredFields(data, required);
      expect(result.allPresent).toBe(false);
      expect(result.missingFields).toContain('name');
    });
  });

  describe('removeDuplicates', () => {
    it('should remove duplicate strings', async () => {
      const items = ['apple', 'banana', 'apple', 'cherry', 'banana'];
      const result = await removeDuplicates(items);
      expect(result).toHaveLength(3);
      expect(result).toContain('apple');
      expect(result).toContain('banana');
      expect(result).toContain('cherry');
    });

    it('should handle case-insensitive deduplication', async () => {
      const items = ['Apple', 'apple', 'APPLE'];
      const result = await removeDuplicates(items, { caseSensitive: false });
      expect(result).toHaveLength(1);
    });

    it('should remove duplicates from object arrays by key', async () => {
      const items = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John' },
      ];
      const result = await removeDuplicates(items, { compareBy: 'id' });
      expect(result).toHaveLength(2);
    });

    it('should trim whitespace before comparison', async () => {
      const items = ['  apple  ', 'apple', 'banana  '];
      const result = await removeDuplicates(items, { trimWhitespace: true });
      expect(result).toHaveLength(2);
    });
  });

  describe('batchTransform', () => {
    it('should apply clean text transformation', async () => {
      const items = ['  Hello  ', '  World  '];
      const result = await batchTransform(items, {
        cleanText: { trim: true },
      });
      expect(result).toEqual(['Hello', 'World']);
    });

    it('should parse prices in batch', async () => {
      const items = ['$99.99', '€50.00', '$19.99'];
      const result = await batchTransform(items, { parsePrice: true });
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('currency');
    });

    it('should remove duplicates in batch', async () => {
      const items = ['apple', 'banana', 'apple', 'cherry'];
      const result = await batchTransform(items, {
        removeDuplicates: { caseSensitive: true },
      });
      expect(result).toHaveLength(3);
    });

    it('should apply multiple transformations in sequence', async () => {
      const items = ['  $99.99  ', '  $99.99  ', '  $50.00  '];
      const result = await batchTransform(items, {
        cleanText: { trim: true },
        removeDuplicates: { caseSensitive: true },
      });
      expect(result.length).toBeLessThan(items.length);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty strings', async () => {
      const result = await cleanText('');
      expect(result).toBe('');
    });

    it('should handle null-like values gracefully', async () => {
      const result = await parsePrice('null');
      expect(result).toBeNull();
    });

    it('should handle empty arrays', async () => {
      const result = await removeDuplicates([]);
      expect(result).toEqual([]);
    });

    it('should handle complex nested HTML', async () => {
      const html = '<div><p><span><b>Nested</b> content</span></p></div>';
      const result = await htmlToCleanText(html);
      expect(result).toContain('Nested');
      expect(result).toContain('content');
    });
  });
});
