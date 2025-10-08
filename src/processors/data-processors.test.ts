// Test Suite for Data Processors
import { describe, it, expect } from 'vitest';
import {
  cleanText,
  htmlToText,
  parsePrice,
  normalizeDate,
  extractPhoneNumbers,
  extractEmails,
  extractUrls,
  validateData,
  removeDuplicates,
  sanitizeData
} from './data-processors.js';

describe('Data Processors', () => {
  describe('cleanText', () => {
    it('should remove extra spaces', () => {
      const result = cleanText('Hello    World');
      expect(result).toBe('Hello World');
    });

    it('should trim text', () => {
      const result = cleanText('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    it('should remove newlines when specified', () => {
      const result = cleanText('Hello\nWorld', { removeNewlines: true });
      expect(result).toBe('Hello World');
    });

    it('should remove special characters when specified', () => {
      const result = cleanText('Hello! World?', { removeSpecialChars: true });
      expect(result).toBe('Hello World');
    });
  });

  describe('htmlToText', () => {
    it('should remove HTML tags', () => {
      const result = htmlToText('<p>Hello <strong>World</strong></p>');
      expect(result).toBe('Hello World');
    });

    it('should remove script tags', () => {
      const result = htmlToText('<script>alert("hi")</script>Hello');
      expect(result).toBe('Hello');
    });

    it('should decode HTML entities', () => {
      const result = htmlToText('Hello&nbsp;World&amp;Test');
      expect(result).toBe('Hello World&Test');
    });
  });

  describe('parsePrice', () => {
    it('should parse USD price', () => {
      const result = parsePrice('$99.99');
      expect(result.value).toBe(99.99);
      expect(result.currency).toBe('USD');
    });

    it('should parse EUR price', () => {
      const result = parsePrice('€50.00');
      expect(result.value).toBe(50.00);
      expect(result.currency).toBe('EUR');
    });

    it('should parse INR price', () => {
      const result = parsePrice('₹1,299');
      expect(result.value).toBe(1299);
      expect(result.currency).toBe('INR');
    });

    it('should handle prices without currency', () => {
      const result = parsePrice('123.45');
      expect(result.value).toBe(123.45);
      expect(result.currency).toBeNull();
    });
  });

  describe('normalizeDate', () => {
    it('should normalize ISO date', () => {
      const result = normalizeDate('2024-01-15');
      expect(result.iso).not.toBeNull();
      expect(result.timestamp).not.toBeNull();
    });

    it('should handle invalid date', () => {
      const result = normalizeDate('not a date');
      expect(result.iso).toBeNull();
    });
  });

  describe('extractPhoneNumbers', () => {
    it('should extract US phone numbers', () => {
      const text = 'Call us at 123-456-7890 or (555) 123-4567';
      const result = extractPhoneNumbers(text);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('123-456-7890');
    });

    it('should handle text without phone numbers', () => {
      const result = extractPhoneNumbers('No phone here');
      expect(result).toHaveLength(0);
    });
  });

  describe('extractEmails', () => {
    it('should extract email addresses', () => {
      const text = 'Contact us at test@example.com or admin@test.org';
      const result = extractEmails(text);
      expect(result).toContain('test@example.com');
      expect(result).toContain('admin@test.org');
    });

    it('should remove duplicate emails', () => {
      const text = 'test@example.com and test@example.com again';
      const result = extractEmails(text);
      expect(result).toHaveLength(1);
    });
  });

  describe('extractUrls', () => {
    it('should extract URLs', () => {
      const text = 'Visit https://example.com or http://test.org';
      const result = extractUrls(text);
      expect(result).toContain('https://example.com');
      expect(result).toContain('http://test.org');
    });
  });

  describe('validateData', () => {
    it('should validate required fields', () => {
      const data = { name: 'John' };
      const schema = { required: ['name', 'email'] };
      const result = validateData(data, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should pass validation when all fields present', () => {
      const data = { name: 'John', email: 'john@test.com' };
      const schema = { required: ['name', 'email'] };
      const result = validateData(data, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate types', () => {
      const data = { name: 'John', age: '30' };
      const schema = { types: { age: 'number' } };
      const result = validateData(data, schema);
      expect(result.valid).toBe(false);
    });
  });

  describe('removeDuplicates', () => {
    it('should remove duplicate primitives', () => {
      const array = [1, 2, 2, 3, 3, 3];
      const result = removeDuplicates(array);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should remove duplicates by key', () => {
      const array = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'C' }
      ];
      const result = removeDuplicates(array, 'id');
      expect(result).toHaveLength(2);
    });
  });

  describe('sanitizeData', () => {
    it('should remove script tags from strings', () => {
      const data = '<script>alert("xss")</script>Hello';
      const result = sanitizeData(data);
      expect(result).not.toContain('<script>');
    });

    it('should sanitize nested objects', () => {
      const data = {
        text: '<script>bad</script>good',
        nested: {
          text: 'javascript:alert(1)'
        }
      };
      const result = sanitizeData(data);
      expect(result.text).not.toContain('<script>');
      expect(result.nested.text).not.toContain('javascript:');
    });

    it('should handle arrays', () => {
      const data = ['<script>bad</script>', 'good'];
      const result = sanitizeData(data);
      expect(result[0]).not.toContain('<script>');
    });
  });
});
