// Data Transformation and Processing Tools
// Comprehensive data cleaning, parsing, and validation utilities

import { Page } from 'puppeteer-core';

/**
 * Smart Text Cleaner - Remove extra whitespace, special characters, normalize text
 */
export interface CleanTextOptions {
  removeExtraWhitespace?: boolean;
  removeSpecialChars?: boolean;
  normalizeUnicode?: boolean;
  toLowerCase?: boolean;
  trim?: boolean;
  removeEmojis?: boolean;
  removeUrls?: boolean;
  removeEmails?: boolean;
}

export async function cleanText(text: string, options: CleanTextOptions = {}): Promise<string> {
  const {
    removeExtraWhitespace = true,
    removeSpecialChars = false,
    normalizeUnicode = true,
    toLowerCase = false,
    trim = true,
    removeEmojis = false,
    removeUrls = false,
    removeEmails = false,
  } = options;

  let cleaned = text;

  // Normalize unicode
  if (normalizeUnicode) {
    cleaned = cleaned.normalize('NFKD');
  }

  // Remove URLs
  if (removeUrls) {
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  }

  // Remove emails
  if (removeEmails) {
    cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/g, '');
  }

  // Remove emojis
  if (removeEmojis) {
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }

  // Remove extra whitespace
  if (removeExtraWhitespace) {
    cleaned = cleaned.replace(/\s+/g, ' ');
  }

  // Remove special characters (keep alphanumeric and basic punctuation)
  if (removeSpecialChars) {
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s.,!?-]/g, '');
  }

  // Convert to lowercase
  if (toLowerCase) {
    cleaned = cleaned.toLowerCase();
  }

  // Trim
  if (trim) {
    cleaned = cleaned.trim();
  }

  return cleaned;
}

/**
 * HTML to Clean Text - Intelligently remove HTML tags and preserve structure
 */
export interface HtmlToTextOptions {
  preserveLineBreaks?: boolean;
  preserveLinks?: boolean;
  removeScripts?: boolean;
  removeStyles?: boolean;
  decodeEntities?: boolean;
}

export async function htmlToCleanText(html: string, options: HtmlToTextOptions = {}): Promise<string> {
  const {
    preserveLineBreaks = true,
    preserveLinks = false,
    removeScripts = true,
    removeStyles = true,
    decodeEntities = true,
  } = options;

  let text = html;

  // Remove script tags
  if (removeScripts) {
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  // Remove style tags
  if (removeStyles) {
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  }

  // Preserve links
  if (preserveLinks) {
    text = text.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)');
  }

  // Convert line breaks
  if (preserveLineBreaks) {
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  }

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  if (decodeEntities) {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };
    Object.entries(entities).forEach(([entity, char]) => {
      text = text.replace(new RegExp(entity, 'g'), char);
    });
  }

  // Clean up extra whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');

  return text.trim();
}

/**
 * Price Parser - Extract numeric price from various currency formats
 */
export interface ParsedPrice {
  amount: number;
  currency: string;
  original: string;
  formatted: string;
}

export async function parsePrice(priceText: string): Promise<ParsedPrice | null> {
  // Common currency symbols and codes
  const currencyPatterns = [
    { symbol: '$', code: 'USD' },
    { symbol: '€', code: 'EUR' },
    { symbol: '£', code: 'GBP' },
    { symbol: '¥', code: 'JPY' },
    { symbol: '₹', code: 'INR' },
    { symbol: '₽', code: 'RUB' },
    { symbol: 'Rs', code: 'INR' },
    { symbol: 'USD', code: 'USD' },
    { symbol: 'EUR', code: 'EUR' },
  ];

  // Find currency
  let currency = 'USD';
  for (const pattern of currencyPatterns) {
    if (priceText.includes(pattern.symbol)) {
      currency = pattern.code;
      break;
    }
  }

  // Extract numeric value
  // Remove currency symbols and keep only numbers, dots, and commas
  let numericText = priceText.replace(/[^\d.,]/g, '');

  // Handle different decimal separators
  // European format: 1.234,56 -> 1234.56
  // US format: 1,234.56 -> 1234.56
  if (numericText.includes(',') && numericText.includes('.')) {
    const lastComma = numericText.lastIndexOf(',');
    const lastDot = numericText.lastIndexOf('.');
    if (lastComma > lastDot) {
      // European format
      numericText = numericText.replace(/\./g, '').replace(',', '.');
    } else {
      // US format
      numericText = numericText.replace(/,/g, '');
    }
  } else if (numericText.includes(',')) {
    // Check if comma is thousands separator or decimal
    const parts = numericText.split(',');
    if (parts[parts.length - 1].length === 2) {
      // Likely decimal (e.g., 1,50)
      numericText = numericText.replace(',', '.');
    } else {
      // Likely thousands separator (e.g., 1,234)
      numericText = numericText.replace(/,/g, '');
    }
  }

  const amount = parseFloat(numericText);

  if (isNaN(amount)) {
    return null;
  }

  return {
    amount,
    currency,
    original: priceText,
    formatted: `${currency} ${amount.toFixed(2)}`,
  };
}

/**
 * Date Normalizer - Convert different date formats to ISO standard
 */
export interface ParsedDate {
  iso: string;
  timestamp: number;
  formatted: string;
  original: string;
}

export async function normalizeDate(dateText: string): Promise<ParsedDate | null> {
  // Try to parse the date
  let date: Date | null = null;

  // Common date patterns
  const patterns = [
    // ISO format: 2024-01-15
    /(\d{4})-(\d{2})-(\d{2})/,
    // US format: 01/15/2024 or 1/15/2024
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // EU format: 15.01.2024 or 15-01-2024
    /(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{4})/,
    // Written format: January 15, 2024
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = dateText.match(pattern);
    if (match) {
      try {
        date = new Date(dateText);
        if (!isNaN(date.getTime())) {
          break;
        }
      } catch {
        continue;
      }
    }
  }

  // Fallback: try native Date parsing
  if (!date) {
    try {
      date = new Date(dateText);
      if (isNaN(date.getTime())) {
        return null;
      }
    } catch {
      return null;
    }
  }

  return {
    iso: date.toISOString(),
    timestamp: date.getTime(),
    formatted: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    original: dateText,
  };
}

/**
 * Phone/Email Extractor - Automatically detect and extract contact information
 */
export interface ExtractedContacts {
  phones: string[];
  emails: string[];
  urls: string[];
}

export async function extractContactInfo(text: string): Promise<ExtractedContacts> {
  // Phone patterns (international format)
  const phonePattern = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  
  // Email pattern
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
  
  // URL pattern
  const urlPattern = /https?:\/\/[^\s]+/g;

  const phones = Array.from(new Set(text.match(phonePattern) || []));
  const emails = Array.from(new Set(text.match(emailPattern) || []));
  const urls = Array.from(new Set(text.match(urlPattern) || []));

  return {
    phones: phones.map(p => p.trim()),
    emails: emails.map(e => e.toLowerCase().trim()),
    urls: urls.map(u => u.trim()),
  };
}

/**
 * Schema Validator - Validate extracted data against schema
 */
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    items?: ValidationSchema;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data: any;
}

export async function validateSchema(data: any, schema: ValidationSchema): Promise<ValidationResult> {
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    // Check required
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Field "${key}" is required`);
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    // Check type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rules.type) {
      errors.push(`Field "${key}" should be ${rules.type}, got ${actualType}`);
      continue;
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Field "${key}" should be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Field "${key}" should be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`Field "${key}" does not match required pattern`);
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Field "${key}" should be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Field "${key}" should be at most ${rules.max}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data,
  };
}

/**
 * Required Fields Checker - Ensure all required fields are present
 */
export interface RequiredFieldsResult {
  allPresent: boolean;
  missingFields: string[];
  presentFields: string[];
}

export async function checkRequiredFields(data: any, requiredFields: string[]): Promise<RequiredFieldsResult> {
  const missingFields: string[] = [];
  const presentFields: string[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    } else {
      presentFields.push(field);
    }
  }

  return {
    allPresent: missingFields.length === 0,
    missingFields,
    presentFields,
  };
}

/**
 * Duplicate Remover - Remove duplicate entries from arrays
 */
export interface DeduplicationOptions {
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  compareBy?: string; // Key to compare for objects
}

export async function removeDuplicates<T>(
  items: T[],
  options: DeduplicationOptions = {}
): Promise<T[]> {
  const {
    caseSensitive = true,
    trimWhitespace = true,
    compareBy,
  } = options;

  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    let key: string;

    if (typeof item === 'string') {
      key = item;
      if (trimWhitespace) {
        key = key.trim();
      }
      if (!caseSensitive) {
        key = key.toLowerCase();
      }
    } else if (typeof item === 'object' && item !== null) {
      if (compareBy && compareBy in item) {
        key = String((item as any)[compareBy]);
      } else {
        key = JSON.stringify(item);
      }
    } else {
      key = String(item);
    }

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Batch processing with transformation pipeline
 */
export interface TransformationPipeline {
  cleanText?: CleanTextOptions;
  parsePrice?: boolean;
  normalizeDate?: boolean;
  extractContacts?: boolean;
  removeDuplicates?: DeduplicationOptions;
}

export async function batchTransform(
  items: string[],
  pipeline: TransformationPipeline
): Promise<any[]> {
  let results: any[] = items;

  // Apply transformations in sequence
  if (pipeline.cleanText) {
    results = await Promise.all(
      results.map(item => cleanText(String(item), pipeline.cleanText))
    );
  }

  if (pipeline.parsePrice) {
    results = await Promise.all(
      results.map(async item => {
        const parsed = await parsePrice(String(item));
        return parsed || item;
      })
    );
  }

  if (pipeline.normalizeDate) {
    results = await Promise.all(
      results.map(async item => {
        const parsed = await normalizeDate(String(item));
        return parsed || item;
      })
    );
  }

  if (pipeline.extractContacts) {
    results = await Promise.all(
      results.map(item => extractContactInfo(String(item)))
    );
  }

  if (pipeline.removeDuplicates) {
    results = await removeDuplicates(results, pipeline.removeDuplicates);
  }

  return results;
}

/**
 * Page-level data extraction with transformation
 */
export async function extractAndTransform(
  page: Page,
  selector: string,
  pipeline: TransformationPipeline
): Promise<any[]> {
  // Extract text from page
  const rawData = await page.$$eval(selector, elements =>
    elements.map(el => el.textContent || '')
  );

  // Apply transformations
  return batchTransform(rawData, pipeline);
}
