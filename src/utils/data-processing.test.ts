// Tests for data processing utilities
import { describe, it, expect } from 'vitest';
import { 
  cleanText, 
  parsePrice, 
  normalizeDate, 
  removeDuplicates, 
  validateDataType,
  detectOutliers 
} from './data-processing.js';

describe('cleanText', () => {
  it('should remove extra spaces', () => {
    const result = cleanText('hello    world');
    expect(result).toBe('hello world');
  });
  
  it('should trim text', () => {
    const result = cleanText('  hello  ');
    expect(result).toBe('hello');
  });
});

describe('parsePrice', () => {
  it('should parse USD price', () => {
    const result = parsePrice('$19.99');
    expect(result.amount).toBe(19.99);
    expect(result.currency).toBe('USD');
  });
  
  it('should handle prices with commas', () => {
    const result = parsePrice('$1,234.56');
    expect(result.amount).toBe(1234.56);
  });
});

describe('removeDuplicates', () => {
  it('should remove duplicate primitives', () => {
    const result = removeDuplicates([1, 2, 2, 3, 3, 3]);
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('validateDataType', () => {
  it('should validate string type', () => {
    const result = validateDataType('hello', 'string');
    expect(result.isValid).toBe(true);
  });
  
  it('should validate number type', () => {
    const result = validateDataType(42, 'number');
    expect(result.isValid).toBe(true);
  });
  
  it('should reject invalid type', () => {
    const result = validateDataType('hello', 'number');
    expect(result.isValid).toBe(false);
  });
});

describe('detectOutliers', () => {
  it('should detect outliers using IQR method', () => {
    const numbers = [1, 2, 3, 4, 5, 100];
    const result = detectOutliers(numbers);
    expect(result.outliers).toContain(100);
    expect(result.clean).not.toContain(100);
  });
});
