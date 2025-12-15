// Data Processing & Transformation Handlers
// Text cleaning, validation, formatting utilities
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';
import { parsePhoneNumber } from 'libphonenumber-js';
import * as chrono from 'chrono-node';
import Ajv from 'ajv/dist/2020.js';

// Smart Text Cleaner Arguments
export interface SmartTextCleanerArgs {
  text: string;
  removeExtraWhitespace?: boolean;
  removeSpecialChars?: boolean;
  toLowerCase?: boolean;
  trim?: boolean;
}

/**
 * Extra whitespace और special characters remove करता है
 */
export async function handleSmartTextCleaner(args: SmartTextCleanerArgs) {
  return await withErrorHandling(async () => {
    let text = args.text;
    const removeExtraWhitespace = args.removeExtraWhitespace !== false;
    const removeSpecialChars = args.removeSpecialChars || false;
    const toLowerCase = args.toLowerCase || false;
    const trim = args.trim !== false;

    // Remove extra whitespace
    if (removeExtraWhitespace) {
      text = text.replace(/\s+/g, ' ');
    }

    // Remove special characters
    if (removeSpecialChars) {
      text = text.replace(/[^\w\s]/g, '');
    }

    // Convert to lowercase
    if (toLowerCase) {
      text = text.toLowerCase();
    }

    // Trim
    if (trim) {
      text = text.trim();
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Text cleaned\n\nOriginal length: ${args.text.length}\nCleaned length: ${text.length}\n\nCleaned text:\n${text}`,
        },
      ],
    };
  }, 'Failed to clean text');
}

// HTML to Clean Text Arguments
export interface HTMLToTextArgs {
  html: string;
  preserveLinks?: boolean;
  preserveFormatting?: boolean;
}

/**
 * HTML tags intelligently remove करता है
 */
export async function handleHTMLToText(args: HTMLToTextArgs) {
  return await withErrorHandling(async () => {
    const html = args.html;
    const preserveLinks = args.preserveLinks || false;
    const preserveFormatting = args.preserveFormatting || false;

    // Simple HTML to text conversion (can be enhanced with turndown)
    let text = html;

    // Preserve links if requested
    if (preserveLinks) {
      text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)');
    }

    // Preserve basic formatting
    if (preserveFormatting) {
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<\/p>/gi, '\n\n');
      text = text.replace(/<li>/gi, '• ');
      text = text.replace(/<\/li>/gi, '\n');
    }

    // Remove all other HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Clean up whitespace
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ HTML converted to text\n\n${text}`,
        },
      ],
    };
  }, 'Failed to convert HTML to text');
}





// Phone/Email Extractor Arguments
export interface ContactExtractorArgs {
  text: string;
  types?: ('phone' | 'email')[];
  defaultCountry?: string;
}

/**
 * Contact information automatically detect करता है
 */
export async function handleContactExtractor(args: ContactExtractorArgs) {
  return await withErrorHandling(async () => {
    const text = args.text;
    const types = args.types || ['phone', 'email'];
    const defaultCountry = args.defaultCountry || 'US';

    const results: any = {
      phones: [],
      emails: [],
    };

    // Extract emails
    if (types.includes('email')) {
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = text.match(emailPattern) || [];

      results.emails = [...new Set(emails)].map((email) => ({
        value: email,
        domain: email.split('@')[1],
        username: email.split('@')[0],
      }));
    }

    // Extract phone numbers
    if (types.includes('phone')) {
      // Common phone patterns
      const phonePatterns = [
        /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
        /\(\d{3}\)\s?\d{3}-?\d{4}/g,
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
      ];

      const potentialPhones: string[] = [];
      phonePatterns.forEach((pattern) => {
        const matches = text.match(pattern) || [];
        potentialPhones.push(...matches);
      });

      // Parse and validate phone numbers
      potentialPhones.forEach((phone) => {
        try {
          const parsed = parsePhoneNumber(phone, defaultCountry as any);
          if (parsed && parsed.isValid()) {
            results.phones.push({
              original: phone,
              international: parsed.formatInternational(),
              national: parsed.formatNational(),
              country: parsed.country,
              type: parsed.getType(),
            });
          }
        } catch (e) {
          // Invalid phone number, skip
          results.phones.push({
            original: phone,
            valid: false,
          });
        }
      });
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Extracted contact info\n\nEmails: ${results.emails.length}\nPhones: ${results.phones.length}\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }, 'Failed to extract contact info');
}

// Schema Validator Arguments
export interface SchemaValidatorArgs {
  data: any;
  schema: any;
}

/**
 * Extracted data की structure verify करता है
 */
export async function handleSchemaValidator(args: SchemaValidatorArgs) {
  return await withErrorHandling(async () => {
    const data = args.data;
    const schema = args.schema;

    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (valid) {
      return {
        content: [
          {
            type: 'text' as const,
            text: '✅ Data validation passed\n\nAll fields match the schema.',
          },
        ],
      };
    } else {
      const errors = validate.errors?.map((err) => ({
        field: err.instancePath,
        message: err.message,
        params: err.params,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ Data validation failed\n\n${JSON.stringify(errors, null, 2)}`,
          },
        ],
      };
    }
  }, 'Failed to validate schema');
}

// Required Fields Checker Arguments
export interface RequiredFieldsCheckerArgs {
  data: any;
  requiredFields: string[];
}

/**
 * Missing data detect करता है
 */
export async function handleRequiredFieldsChecker(args: RequiredFieldsCheckerArgs) {
  return await withErrorHandling(async () => {
    const data = args.data;
    const requiredFields = args.requiredFields;

    const missing: string[] = [];
    const present: string[] = [];

    requiredFields.forEach((field) => {
      // Support nested fields with dot notation
      const value = field.split('.').reduce((obj, key) => obj?.[key], data);

      if (value === undefined || value === null || value === '') {
        missing.push(field);
      } else {
        present.push(field);
      }
    });

    const isValid = missing.length === 0;

    return {
      content: [
        {
          type: 'text' as const,
          text: `${isValid ? '✅' : '❌'} Required fields check\n\nPresent: ${present.length}/${requiredFields.length}\nMissing: ${missing.join(', ') || 'None'}\n\n${isValid ? 'All required fields are present!' : 'Some required fields are missing.'}`,
        },
      ],
    };
  }, 'Failed to check required fields');
}

// Duplicate Remover Arguments
export interface DuplicateRemoverArgs {
  data: any[];
  uniqueKey?: string;
}

/**
 * Repeated data filter करता है
 */
export async function handleDuplicateRemover(args: DuplicateRemoverArgs) {
  return await withErrorHandling(async () => {
    const data = args.data;
    const uniqueKey = args.uniqueKey;

    let unique: any[];

    if (uniqueKey) {
      // Remove duplicates based on specific key
      const seen = new Set();
      unique = data.filter((item) => {
        const value = item[uniqueKey];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    } else {
      // Remove duplicates based on entire object
      const seen = new Set();
      unique = data.filter((item) => {
        const serialized = JSON.stringify(item);
        if (seen.has(serialized)) {
          return false;
        }
        seen.add(serialized);
        return true;
      });
    }

    const removed = data.length - unique.length;

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Duplicates removed\n\nOriginal: ${data.length} items\nUnique: ${unique.length} items\nRemoved: ${removed} duplicates\n\n${JSON.stringify(unique, null, 2)}`,
        },
      ],
    };
  }, 'Failed to remove duplicates');
}
