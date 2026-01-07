// Data Extraction Handlers
// Data Extraction Handlers - OPTIMIZED
// Tables, Lists, JSON, Meta Tags, Schemas
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';
import { TOOL_OPTIMIZATION_CONFIG, globalCache, deduplicateResults, globalMetrics, createErrorHandler } from '../optimization-utils.js';
// Type definitions for extracted data
export interface TableData {
  headers: string[];
  rows: Array<Record<string, string | number>>;
  summary: {
    totalRows: number;
    totalColumns: number;
    extractedAt: string;
  };
}

export interface ListData {
  items: string[];
  type: 'ul' | 'ol' | 'mixed';
  nested: boolean;
  count: number;
}

export interface JSONData {
  data: any;
  source: 'script' | 'api' | 'attribute';
  path: string;
}

export interface MetaTagsData {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  ogTags: Record<string, string>;
  twitterCards: Record<string, string>;
  canonical?: string;
  robots?: string;
  viewport?: string;
  customTags: Record<string, string>;
}

export interface SchemaData {
  type: string;
  format: 'json-ld' | 'microdata' | 'rdfa';
  data: any;
}



// List Extractor Arguments


// JSON Extractor Arguments
export interface ExtractJSONArgs {
  source?: 'script' | 'all';
  selector?: string;
  filter?: string;
}

/**
 * Page में embedded JSON/API data खोजता और extract करता है
 */
export async function handleExtractJSON(args: ExtractJSONArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('extract_json', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const source = args.source || 'all';
    const selector = args.selector;
    const filter = args.filter;

    const jsonData = await page.evaluate(
      ({ source, selector, filter }) => {
        const results: JSONData[] = [];

        // Extract JSON from script tags
        if (source === 'script' || source === 'all') {
          const defaultSelector = selector || 'script[type="application/json"], script[type="application/ld+json"], script';
          const scripts = document.querySelectorAll(defaultSelector);

          scripts.forEach((script, index) => {
            const content = script.textContent || '';
            try {
              // 1. Try direct parsing first
              const data = JSON.parse(content);

              if (filter) {
                const filterLower = filter.toLowerCase();
                const dataStr = JSON.stringify(data).toLowerCase();
                if (!dataStr.includes(filterLower)) return;
              }

              results.push({
                data,
                source: 'script' as const,
                path: `script[${index}]`,
              });
            } catch (e) {
              // 2. Fallback: Try to find JSON objects using regex
              // Matches { "key": ... } or [ ... ] structures
              const jsonRegex = /({[\s\S]*?}|\[[\s\S]*?\])/g;
              let match;
              while ((match = jsonRegex.exec(content)) !== null) {
                const potentialJson = match[0];
                // Basic heuristic to avoid trying to parse tiny fragments
                if (potentialJson.length < 20) continue;

                try {
                  const data = JSON.parse(potentialJson);
                  // Check filter
                  if (filter) {
                    const filterLower = filter.toLowerCase();
                    const dataStr = JSON.stringify(data).toLowerCase();
                    if (!dataStr.includes(filterLower)) continue;
                  }
                  // Basic check to ensure it's a nontrivial object/array
                  if ((Array.isArray(data) && data.length > 0) || (typeof data === 'object' && data !== null && Object.keys(data).length > 0)) {
                    results.push({
                      data,
                      source: 'script' as const,
                      path: `script[${index}]_regex_match`,
                    });
                  }
                } catch (e2) {
                  // Not valid JSON
                }
              }
            }
          });
        }

        // Extract JSON from data attributes
        if (source === 'all' && selector) {
          const elements = document.querySelectorAll(selector);

          elements.forEach((element, index) => {
            // Check all data-* attributes
            Array.from(element.attributes).forEach((attr) => {
              if (attr.name.startsWith('data-')) {
                try {
                  const data = JSON.parse(attr.value);
                  results.push({
                    data,
                    source: 'attribute' as const,
                    path: `${selector}[${index}]@${attr.name}`,
                  });
                } catch (e) {
                  // Not JSON, skip
                }
              }
            });
          });
        }

        return results;
      },
      { source, selector, filter }
    );

    if (jsonData.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: '❌ No JSON data found on page',
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Extracted ${jsonData.length} JSON object(s)\n\n${JSON.stringify(jsonData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to extract JSON');
}

// Meta Tags Scraper Arguments
export interface ScrapeMetaTagsArgs {
  includeOgTags?: boolean;
  includeTwitterCards?: boolean;
  includeCustomTags?: boolean;
}

/**
 * SEO meta tags और Open Graph data extract करता है
 */
export async function handleScrapeMetaTags(args: ScrapeMetaTagsArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('scrape_meta_tags', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const includeOgTags = args.includeOgTags !== false;
    const includeTwitterCards = args.includeTwitterCards !== false;
    const includeCustomTags = args.includeCustomTags !== false;

    const metaData = await page.evaluate(
      ({ includeOgTags, includeTwitterCards, includeCustomTags }) => {
        const result: MetaTagsData = {
          ogTags: {},
          twitterCards: {},
          customTags: {},
        };

        // Standard meta tags
        result.title = document.title;

        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach((meta) => {
          const name = meta.getAttribute('name') || meta.getAttribute('property');
          const content = meta.getAttribute('content') || '';

          if (!name) return;

          // Open Graph tags
          if (includeOgTags && name.startsWith('og:')) {
            result.ogTags[name] = content;
          }
          // Twitter Cards
          else if (includeTwitterCards && name.startsWith('twitter:')) {
            result.twitterCards[name] = content;
          }
          // Standard meta tags
          else if (name === 'description') {
            result.description = content;
          } else if (name === 'keywords') {
            result.keywords = content;
          } else if (name === 'author') {
            result.author = content;
          } else if (name === 'robots') {
            result.robots = content;
          } else if (name === 'viewport') {
            result.viewport = content;
          }
          // Custom tags
          else if (includeCustomTags) {
            result.customTags[name] = content;
          }
        });

        // Canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
          result.canonical = canonical.getAttribute('href') || undefined;
        }

        return result;
      },
      { includeOgTags, includeTwitterCards, includeCustomTags }
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Meta Tags Extracted\n\n${JSON.stringify(metaData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to scrape meta tags');
}

// Schema.org Data Extractor Arguments
export interface ExtractSchemaArgs {
  format?: 'json-ld' | 'microdata' | 'all';
  schemaType?: string;
}

/**
 * Structured data (JSON-LD, Microdata) निकालता है
 */
export async function handleExtractSchema(args: ExtractSchemaArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('extract_schema', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const format = args.format || 'all';
    const schemaType = args.schemaType || ['WebPage', 'Organization', 'Product', 'BreadcrumbList'];

    const schemaData = await page.evaluate(
      ({ format, schemaType }) => {
        const results: SchemaData[] = [];

        // Extract JSON-LD
        if (format === 'json-ld' || format === 'all') {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');

          scripts.forEach((script) => {
            try {
              const data = JSON.parse(script.textContent || '');

              // Filter by schema type if specified
              if (schemaType) {
                const type = data['@type'] || '';
                const types = Array.isArray(schemaType) ? schemaType : [schemaType];
                const typeMatch = types.some(t => type.toLowerCase().includes(t.toLowerCase()));
                if (!typeMatch) {
                  return;
                }
              }

              results.push({
                type: data['@type'] || 'Unknown',
                format: 'json-ld',
                data,
              });
            } catch (e) {
              // Invalid JSON-LD
            }
          });
        }

        // Extract Microdata (basic implementation)
        if (format === 'microdata' || format === 'all') {
          const items = document.querySelectorAll('[itemscope]');

          items.forEach((item) => {
            const itemType = item.getAttribute('itemtype') || '';

            if (schemaType) {
              const types = Array.isArray(schemaType) ? schemaType : [schemaType];
              const typeMatch = types.some(t => itemType.toLowerCase().includes(t.toLowerCase()));
              if (!typeMatch) {
                return;
              }
            }

            const properties: Record<string, any> = {};
            const props = item.querySelectorAll('[itemprop]');

            props.forEach((prop) => {
              const name = prop.getAttribute('itemprop') || '';
              const content = prop.getAttribute('content') || prop.textContent?.trim() || '';
              properties[name] = content;
            });

            if (Object.keys(properties).length > 0) {
              results.push({
                type: itemType.split('/').pop() || 'Unknown',
                format: 'microdata',
                data: properties,
              });
            }
          });
        }

        return results;
      },
      { format, schemaType }
    );

    if (schemaData.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: '❌ No schema data found on page',
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Extracted ${schemaData.length} schema object(s)\n\n${JSON.stringify(schemaData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to extract schema data');
}
