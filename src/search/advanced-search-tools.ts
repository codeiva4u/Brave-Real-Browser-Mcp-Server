// Advanced Search & Filter Tools
import { Page } from 'puppeteer-core';

export async function keywordSearch(page: Page, keyword: string): Promise<string[]> {
  return await page.evaluate((kw) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const results: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent?.toLowerCase().includes(kw.toLowerCase())) {
        results.push(node.textContent.trim());
      }
    }
    return results;
  }, keyword);
}

export async function regexSearch(page: Page, pattern: string): Promise<string[]> {
  return await page.evaluate((pat) => {
    const regex = new RegExp(pat, 'gi');
    const text = document.body.textContent || '';
    return Array.from(text.matchAll(regex)).map(m => m[0]);
  }, pattern);
}

export async function xpathQuery(page: Page, xpath: string): Promise<string[]> {
  return await page.evaluate((xp) => {
    const results: string[] = [];
    const iterator = document.evaluate(xp, document, null, XPathResult.ANY_TYPE, null);
    let node = iterator.iterateNext();
    while (node) {
      results.push(node.textContent || '');
      node = iterator.iterateNext();
    }
    return results;
  }, xpath);
}

export async function visualElementFinder(page: Page, x: number, y: number): Promise<string | null> {
  return await page.evaluate((coords) => {
    const element = document.elementFromPoint(coords.x, coords.y);
    if (!element) return null;
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = Array.from(element.classList).map(c => `.${c}`).join('');
    return `${tag}${id}${classes}`;
  }, { x, y });
}

export async function advancedFilter(data: any[], filters: Record<string, any>): Promise<any[]> {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (typeof value === 'function') return value(item[key]);
      return item[key] === value;
    });
  });
}
