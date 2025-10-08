// Data Processing & Transformation Module
// Text Cleaner, HTML to Clean Text, Price Parser, Date Normalizer, Contact Extractors

/**
 * Smart Text Cleaner - Extra whitespace, special characters remove करना
 */
export function cleanText(text: string, options?: {
  removeExtraSpaces?: boolean;
  removeNewlines?: boolean;
  removeSpecialChars?: boolean;
  trim?: boolean;
}): string {
  let cleaned = text;
  
  const opts = {
    removeExtraSpaces: options?.removeExtraSpaces !== false,
    removeNewlines: options?.removeNewlines || false,
    removeSpecialChars: options?.removeSpecialChars || false,
    trim: options?.trim !== false
  };
  
  // Remove extra spaces
  if (opts.removeExtraSpaces) {
    cleaned = cleaned.replace(/\s+/g, ' ');
  }
  
  // Remove newlines
  if (opts.removeNewlines) {
    cleaned = cleaned.replace(/\n/g, ' ');
  }
  
  // Remove special characters
  if (opts.removeSpecialChars) {
    cleaned = cleaned.replace(/[^\w\s]/g, '');
  }
  
  // Trim
  if (opts.trim) {
    cleaned = cleaned.trim();
  }
  
  return cleaned;
}

/**
 * HTML to Clean Text - HTML tags intelligently remove करना
 */
export function htmlToText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Price Parser - Currency symbols, formatting से actual numbers निकालना
 */
export function parsePrice(priceText: string): {
  value: number | null;
  currency: string | null;
  original: string;
} {
  const original = priceText;
  
  // Common currency symbols
  const currencies: any = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    '₽': 'RUB',
    '₩': 'KRW'
  };
  
  let currency = null;
  
  // Find currency symbol
  for (const [symbol, code] of Object.entries(currencies)) {
    if (priceText.includes(symbol)) {
      currency = code as string;
      break;
    }
  }
  
  // Extract numbers
  const numberMatch = priceText.match(/[\d,]+\.?\d*/);
  let value = null;
  
  if (numberMatch) {
    const numberStr = numberMatch[0].replace(/,/g, '');
    value = parseFloat(numberStr);
  }
  
  return { value, currency, original };
}

/**
 * Date Normalizer - Different date formats को standard format में convert करना
 */
export function normalizeDate(dateText: string): {
  iso: string | null;
  timestamp: number | null;
  original: string;
  format: string | null;
} {
  const original = dateText;
  
  try {
    // Try to parse the date
    const date = new Date(dateText);
    
    if (!isNaN(date.getTime())) {
      return {
        iso: date.toISOString(),
        timestamp: date.getTime(),
        original,
        format: 'detected'
      };
    }
  } catch (e) {
    // Parse failed
  }
  
  // Try common date patterns
  const patterns = [
    // DD/MM/YYYY or MM/DD/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // DD-MM-YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/,
    // Month DD, YYYY
    /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/
  ];
  
  for (const pattern of patterns) {
    const match = dateText.match(pattern);
    if (match) {
      try {
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) {
          return {
            iso: date.toISOString(),
            timestamp: date.getTime(),
            original,
            format: 'pattern_matched'
          };
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return {
    iso: null,
    timestamp: null,
    original,
    format: null
  };
}

/**
 * Phone Extractor - Phone numbers detect करना
 */
export function extractPhoneNumbers(text: string): string[] {
  const phones: string[] = [];
  
  // Common phone number patterns
  const patterns = [
    // (123) 456-7890
    /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g,
    // 123-456-7890
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    // +1 123 456 7890
    /\+\d{1,3}\s*\d{3}\s*\d{3}\s*\d{4}/g,
    // International format
    /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      phones.push(...matches);
    }
  }
  
  // Remove duplicates
  return [...new Set(phones)];
}

/**
 * Email Extractor - Email addresses detect करना
 */
export function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailPattern);
  return matches ? [...new Set(matches)] : [];
}

/**
 * URL Extractor - URLs extract करना
 */
export function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const matches = text.match(urlPattern);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Data Validator - Basic data validation
 */
export function validateData(data: any, schema: {
  required?: string[];
  types?: { [key: string]: string };
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        errors.push(`Required field missing: ${field}`);
      }
    }
  }
  
  // Check types
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in data) {
        const actualType = typeof data[field];
        if (actualType !== expectedType) {
          errors.push(`Type mismatch for ${field}: expected ${expectedType}, got ${actualType}`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Remove Duplicates - Array से duplicates remove करना
 */
export function removeDuplicates<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Data Sanitizer - Potentially dangerous content remove करना
 */
export function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    // Remove potential XSS
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  
  return data;
}
