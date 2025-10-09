// Data Processing & Transformation Utilities
import { parse as parseDate, format as formatDate } from 'date-fns';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import validator from 'validator';
import { convert as htmlToText } from 'html-to-text';

/**
 * Smart Text Cleaner - Remove extra whitespace and special characters
 */
export function cleanText(text: string, options?: {
  removeExtraSpaces?: boolean;
  removeLineBreaks?: boolean;
  removeSpecialChars?: boolean;
  trim?: boolean;
}): string {
  const opts = {
    removeExtraSpaces: true,
    removeLineBreaks: false,
    removeSpecialChars: false,
    trim: true,
    ...options
  };
  
  let cleaned = text;
  
  if (opts.trim) {
    cleaned = cleaned.trim();
  }
  
  if (opts.removeExtraSpaces) {
    cleaned = cleaned.replace(/\s+/g, ' ');
  }
  
  if (opts.removeLineBreaks) {
    cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  }
  
  if (opts.removeSpecialChars) {
    cleaned = cleaned.replace(/[^\w\s.,!?-]/g, '');
  }
  
  return cleaned;
}

/**
 * HTML to Clean Text - Intelligently convert HTML to plain text
 */
export function htmlToCleanText(html: string, options?: {
  preserveLinks?: boolean;
  preserveLineBreaks?: boolean;
  wordwrap?: number;
}): string {
  const opts = {
    preserveLinks: true,
    preserveLineBreaks: true,
    wordwrap: 80,
    ...options
  };
  
  return htmlToText(html, {
    wordwrap: opts.wordwrap || false,
    preserveNewlines: opts.preserveLineBreaks,
    selectors: [
      { selector: 'a', options: { ignoreHref: !opts.preserveLinks } },
      { selector: 'img', format: 'skip' },
    ]
  });
}

/**
 * Price Parser - Extract clean numeric values from price strings
 */
export function parsePrice(priceText: string, options?: {
  currency?: string;
  locale?: string;
}): {
  amount: number | null;
  currency: string | null;
  original: string;
} {
  const original = priceText;
  
  // Detect currency symbol
  let currency = options?.currency || null;
  const currencySymbols: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    '₽': 'RUB',
  };
  
  for (const [symbol, code] of Object.entries(currencySymbols)) {
    if (priceText.includes(symbol)) {
      currency = code;
      break;
    }
  }
  
  // Extract numeric value
  const cleaned = priceText.replace(/[^\d.,]/g, '');
  const parts = cleaned.split(/[.,]/);
  
  let amount: number | null = null;
  
  if (parts.length === 1) {
    amount = parseFloat(parts[0]);
  } else if (parts.length === 2) {
    // Determine if last part is decimal or thousands separator
    if (parts[1].length <= 2) {
      // Likely decimal
      amount = parseFloat(`${parts[0]}.${parts[1]}`);
    } else {
      // Likely thousands separator
      amount = parseFloat(parts.join(''));
    }
  } else {
    // Multiple separators, assume thousands
    const wholePart = parts.slice(0, -1).join('');
    const decimalPart = parts[parts.length - 1];
    amount = parseFloat(`${wholePart}.${decimalPart}`);
  }
  
  if (isNaN(amount)) {
    amount = null;
  }
  
  return { amount, currency, original };
}

/**
 * Date Normalizer - Convert various date formats to standard format
 */
export function normalizeDate(dateText: string, options?: {
  outputFormat?: string;
  timezone?: string;
}): {
  date: Date | null;
  formatted: string | null;
  original: string;
} {
  const original = dateText;
  const outputFormat = options?.outputFormat || 'yyyy-MM-dd';
  
  let parsedDate: Date | null = null;
  
  // Try common date formats
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'MMM dd, yyyy',
    'MMMM dd, yyyy',
    'dd-MM-yyyy',
    'yyyy/MM/dd',
  ];
  
  for (const fmt of formats) {
    try {
      const parsed = parseDate(dateText, fmt, new Date());
      if (!isNaN(parsed.getTime())) {
        parsedDate = parsed;
        break;
      }
    } catch (e) {
      // Continue trying other formats
    }
  }
  
  // If formats don't work, try native Date parsing
  if (!parsedDate) {
    try {
      const nativeDate = new Date(dateText);
      if (!isNaN(nativeDate.getTime())) {
        parsedDate = nativeDate;
      }
    } catch (e) {
      // Date parsing failed
    }
  }
  
  const formatted = parsedDate ? formatDate(parsedDate, outputFormat) : null;
  
  return { date: parsedDate, formatted, original };
}

/**
 * Phone Number Parser - Extract and format phone numbers
 */
export function parsePhoneNumbers(text: string, defaultCountry?: string): Array<{
  raw: string;
  formatted: string | null;
  country: string | null;
  isValid: boolean;
}> {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex) || [];
  
  return matches.map((raw) => {
    try {
      if (isValidPhoneNumber(raw, defaultCountry as any)) {
        const parsed = parsePhoneNumber(raw, defaultCountry as any);
        return {
          raw,
          formatted: parsed.formatInternational(),
          country: parsed.country || null,
          isValid: true
        };
      }
    } catch (e) {
      // Invalid phone number
    }
    
    return {
      raw,
      formatted: null,
      country: null,
      isValid: false
    };
  });
}

/**
 * Email Validator - Extract and validate emails
 */
export function extractEmails(text: string): Array<{
  email: string;
  isValid: boolean;
  domain: string;
}> {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex) || [];
  
  return matches.map((email) => {
    const isValid = validator.isEmail(email);
    const domain = email.split('@')[1] || '';
    return { email, isValid, domain };
  });
}

/**
 * Remove Duplicates - Remove duplicate items from array
 */
export function removeDuplicates<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return Array.from(new Set(array));
  }
  
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Data Type Validator - Validate data types
 */
export function validateDataType(value: any, expectedType: string): {
  isValid: boolean;
  actualType: string;
  expectedType: string;
} {
  let actualType = typeof value;
  let isValid = false;
  
  switch (expectedType.toLowerCase()) {
    case 'string':
      isValid = typeof value === 'string';
      break;
    case 'number':
      isValid = typeof value === 'number' && !isNaN(value);
      break;
    case 'boolean':
      isValid = typeof value === 'boolean';
      break;
    case 'array':
      isValid = Array.isArray(value);
      actualType = 'object'; // TypeScript typeof returns 'object' for arrays
      break;
    case 'object':
      isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
      break;
    case 'email':
      isValid = typeof value === 'string' && validator.isEmail(value);
      break;
    case 'url':
      isValid = typeof value === 'string' && validator.isURL(value);
      break;
    case 'date':
      isValid = value instanceof Date || !isNaN(Date.parse(value));
      break;
    default:
      isValid = false;
  }
  
  return { isValid, actualType, expectedType };
}

/**
 * Schema Validator - Validate object against schema
 */
export function validateSchema(
  data: Record<string, any>,
  schema: Record<string, { type: string; required?: boolean }>
): {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
} {
  const errors: Array<{ field: string; message: string }> = [];
  
  // Check required fields
  for (const [field, rules] of Object.entries(schema)) {
    if (rules.required && !(field in data)) {
      errors.push({ field, message: `Field '${field}' is required but missing` });
      continue;
    }
    
    // Validate type if field exists
    if (field in data) {
      const validation = validateDataType(data[field], rules.type);
      if (!validation.isValid) {
        errors.push({
          field,
          message: `Field '${field}' should be ${rules.type} but got ${validation.actualType}`
        });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Detect Outliers - Find outliers in numeric array using IQR method
 */
export function detectOutliers(numbers: number[]): {
  outliers: number[];
  clean: number[];
  stats: {
    q1: number;
    q3: number;
    iqr: number;
    lowerBound: number;
    upperBound: number;
  };
} {
  if (numbers.length === 0) {
    return {
      outliers: [],
      clean: [],
      stats: { q1: 0, q3: 0, iqr: 0, lowerBound: 0, upperBound: 0 }
    };
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers: number[] = [];
  const clean: number[] = [];
  
  numbers.forEach((num) => {
    if (num < lowerBound || num > upperBound) {
      outliers.push(num);
    } else {
      clean.push(num);
    }
  });
  
  return {
    outliers,
    clean,
    stats: { q1, q3, iqr, lowerBound, upperBound }
  };
}
