// AI-Powered Features
import { Page } from 'puppeteer-core';

export interface SmartSelectorResult {
  selector: string;
  confidence: number;
  alternatives: string[];
}

export async function generateSmartSelector(page: Page, description: string): Promise<SmartSelectorResult> {
  const selectors = await page.evaluate((desc) => {
    const elements = Array.from(document.querySelectorAll('*'));
    const matches = elements.filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      return text.includes(desc.toLowerCase());
    });
    return matches.map(el => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const classes = Array.from(el.classList).map(c => `.${c}`).join('');
      return `${tag}${id}${classes}`;
    });
  }, description);
  return { selector: selectors[0] || '', confidence: selectors.length > 0 ? 0.8 : 0, alternatives: selectors.slice(1, 4) };
}

export async function classifyContent(text: string): Promise<{ category: string; confidence: number }> {
  const categories = [
    { name: 'product', keywords: ['price', 'buy', 'cart', 'product'] },
    { name: 'article', keywords: ['read', 'article', 'author', 'published'] },
    { name: 'contact', keywords: ['email', 'phone', 'contact', 'address'] },
  ];
  const lower = text.toLowerCase();
  for (const cat of categories) {
    const matches = cat.keywords.filter(kw => lower.includes(kw)).length;
    if (matches > 0) return { category: cat.name, confidence: matches / cat.keywords.length };
  }
  return { category: 'unknown', confidence: 0 };
}

export async function analyzeSentiment(text: string): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number }> {
  const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'best'];
  const negative = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor'];
  const lower = text.toLowerCase();
  const posCount = positive.filter(w => lower.includes(w)).length;
  const negCount = negative.filter(w => lower.includes(w)).length;
  if (posCount > negCount) return { sentiment: 'positive', score: posCount / (posCount + negCount) };
  if (negCount > posCount) return { sentiment: 'negative', score: negCount / (posCount + negCount) };
  return { sentiment: 'neutral', score: 0.5 };
}

export async function generateSummary(text: string, maxLength: number = 200): Promise<string> {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let summary = '';
  for (const sentence of sentences) {
    if ((summary + sentence).length > maxLength) break;
    summary += sentence.trim() + '. ';
  }
  return summary.trim();
}

export async function translateText(text: string, targetLang: string = 'en'): Promise<string> {
  // Placeholder for translation - would integrate with actual translation API
  return `[Translated to ${targetLang}]: ${text}`;
}
