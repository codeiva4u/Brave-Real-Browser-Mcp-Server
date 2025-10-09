// Advanced Features - Phases 9-15 Consolidated
import { Page } from 'puppeteer-core';
import Sentiment from 'sentiment';

// PHASE 9: Monitoring & Reporting
export class ProgressTracker {
  private total: number = 0;
  private completed: number = 0;
  private startTime: number = Date.now();
  
  setTotal(total: number) { this.total = total; }
  increment() { this.completed++; }
  getProgress() {
    return {
      completed: this.completed,
      total: this.total,
      percentage: this.total > 0 ? (this.completed / this.total) * 100 : 0,
      elapsedTime: Date.now() - this.startTime
    };
  }
}

export class ErrorLogger {
  private errors: Array<{ timestamp: number; error: string; context?: string }> = [];
  
  log(error: string, context?: string) {
    this.errors.push({ timestamp: Date.now(), error, context });
  }
  
  getErrors() { return this.errors; }
  clearErrors() { this.errors = []; }
}

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  record(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }
  
  getStats(operation: string) {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) return null;
    
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { avg, min, max, count: durations.length };
  }
}

// PHASE 10: AI-Powered Features
export async function analyzeSentiment(text: string): Promise<{
  score: number;
  comparative: number;
  positive: string[];
  negative: string[];
}> {
  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);
  return {
    score: result.score,
    comparative: result.comparative,
    positive: result.positive,
    negative: result.negative
  };
}

export function classifyContent(text: string): string[] {
  const categories: string[] = [];
  const keywords = {
    technology: ['software', 'computer', 'tech', 'digital', 'AI', 'code'],
    business: ['market', 'business', 'company', 'revenue', 'profit'],
    health: ['health', 'medical', 'doctor', 'patient', 'disease'],
    sports: ['game', 'team', 'player', 'score', 'match'],
    entertainment: ['movie', 'music', 'celebrity', 'show', 'entertainment']
  };
  
  const lowerText = text.toLowerCase();
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => lowerText.includes(word))) {
      categories.push(category);
    }
  }
  
  return categories.length > 0 ? categories : ['general'];
}

export function summarizeText(text: string, maxLength: number = 200): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let summary = '';
  
  for (const sentence of sentences) {
    if ((summary + sentence).length <= maxLength) {
      summary += sentence;
    } else {
      break;
    }
  }
  
  return summary || text.substring(0, maxLength) + '...';
}

// PHASE 11: Search & Filter Tools
export async function searchPage(page: Page, keyword: string): Promise<{
  found: boolean;
  occurrences: number;
  positions: Array<{ text: string; context: string }>;
}> {
  return await page.evaluate((search) => {
    const bodyText = document.body.innerText;
    const regex = new RegExp(search, 'gi');
    const matches = bodyText.match(regex) || [];
    
    const positions: Array<any> = [];
    const elements = document.querySelectorAll('*');
    
    elements.forEach((el) => {
      const text = (el as HTMLElement).innerText;
      if (text && regex.test(text)) {
        const context = text.substring(0, 100);
        positions.push({ text: (el as HTMLElement).tagName, context });
      }
    });
    
    return {
      found: matches.length > 0,
      occurrences: matches.length,
      positions: positions.slice(0, 10)
    };
  }, keyword);
}

export async function regexMatch(page: Page, pattern: string): Promise<string[]> {
  return await page.evaluate((pat) => {
    const regex = new RegExp(pat, 'g');
    const text = document.body.innerText;
    return text.match(regex) || [];
  }, pattern);
}

export async function xpathQuery(page: Page, xpath: string): Promise<string[]> {
  return await page.evaluate((xp) => {
    const results: string[] = [];
    const iterator = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let node = iterator.iterateNext();
    
    while (node) {
      results.push((node as HTMLElement).innerText || (node as HTMLElement).textContent || '');
      node = iterator.iterateNext();
    }
    
    return results;
  }, xpath);
}

// PHASE 12: Data Quality & Validation  
export function deduplicateData<T>(data: T[], key?: keyof T): T[] {
  if (!key) return Array.from(new Set(data));
  
  const seen = new Set();
  return data.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function detectMissingData<T>(
  data: T[],
  requiredFields: Array<keyof T>
): Array<{ index: number; missingFields: Array<keyof T> }> {
  const issues: Array<any> = [];
  
  data.forEach((item, index) => {
    const missing = requiredFields.filter(field => !item[field]);
    if (missing.length > 0) {
      issues.push({ index, missingFields: missing });
    }
  });
  
  return issues;
}

export function validateDataQuality<T>(
  data: T[],
  validators: Record<keyof T, (value: any) => boolean>
): { valid: boolean; errors: Array<{ index: number; field: keyof T; value: any }> } {
  const errors: Array<any> = [];
  
  data.forEach((item, index) => {
    for (const [field, validator] of Object.entries(validators)) {
      const value = item[field as keyof T];
      const validatorFn = validator as (value: any) => boolean;
      if (!validatorFn(value)) {
        errors.push({ index, field, value });
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}

// PHASE 13: Advanced Captcha (Tesseract.js integration placeholder)
export async function solveCaptchaOCR(page: Page, imageSelector: string): Promise<string | null> {
  // Placeholder for OCR captcha solving
  // Requires tesseract.js full integration
  return null;
}

// PHASE 14: Screenshot & Visual Tools  
export async function takeFullPageScreenshot(page: Page, path: string): Promise<void> {
  await page.screenshot({ path: path as any, fullPage: true });
}

export async function takeElementScreenshot(page: Page, selector: string, path: string): Promise<boolean> {
  const element = await page.$(selector);
  if (!element) return false;
  await element.screenshot({ path: path as any });
  return true;
}

export async function compareScreenshots(image1Path: string, image2Path: string): Promise<number> {
  // Placeholder for image comparison using pixelmatch
  // Returns difference percentage
  return 0;
}

// PHASE 15: Website API Integration
export async function discoverAPIs(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const apis: string[] = [];
    const scripts = document.querySelectorAll('script[src]');
    
    scripts.forEach((script) => {
      const src = script.getAttribute('src') || '';
      if (src.includes('api') || src.includes('/v1/') || src.includes('/v2/')) {
        apis.push(src);
      }
    });
    
    // Check for fetch/XMLHttpRequest calls in inline scripts
    const inlineScripts = document.querySelectorAll('script:not([src])');
    inlineScripts.forEach((script) => {
      const content = script.textContent || '';
      const apiMatches = content.match(/https?:\/\/[^\s'"]+api[^\s'"]+/gi) || [];
      apis.push(...apiMatches);
    });
    
    return Array.from(new Set(apis));
  });
}

export async function interceptAPIRequests(
  page: Page,
  callback: (url: string, response: any) => void
): Promise<void> {
  await page.setRequestInterception(true);
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('/v1/') || url.includes('/v2/')) {
      try {
        const data = await response.json();
        callback(url, data);
      } catch (error) {
        // Not JSON response
      }
    }
  });
}

// Export all consolidated utilities
export const AdvancedFeatures = {
  // Phase 9
  ProgressTracker,
  ErrorLogger,
  PerformanceMonitor,
  
  // Phase 10
  analyzeSentiment,
  classifyContent,
  summarizeText,
  
  // Phase 11
  searchPage,
  regexMatch,
  xpathQuery,
  
  // Phase 12
  deduplicateData,
  detectMissingData,
  validateDataQuality,
  
  // Phase 13
  solveCaptchaOCR,
  
  // Phase 14
  takeFullPageScreenshot,
  takeElementScreenshot,
  compareScreenshots,
  
  // Phase 15
  discoverAPIs,
  interceptAPIRequests
};
