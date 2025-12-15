
import { getPageInstance } from '../browser-manager.js';

export interface SmartSelectorGeneratorArgs {
  url?: string;
  description: string;
  context?: string;
}

export interface ContentClassificationArgs {
  url?: string;
  categories?: { name: string; keywords: string[] }[];
}

export interface SentimentAnalysisArgs {
  text?: string;
  url?: string;
  selector?: string;
}

export interface SummaryGeneratorArgs {
  text?: string;
  url?: string;
  selector?: string;
  maxLength?: number;
}

export interface TranslationSupportArgs {
  text?: string;
  url?: string;
  targetLanguage: string;
}

/**
 * Smart Selector Generator - AI-powered CSS selector generation (Heuristic)
 */
export async function handleSmartSelectorGenerator(args: SmartSelectorGeneratorArgs) {
  const { url, description, context } = args;

  try {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    const result = await page.evaluate((desc: string, ctx: string) => {
      const elements = Array.from(document.querySelectorAll('*'));
      const scores: any[] = [];

      const keywords = desc.toLowerCase().split(/\s+/);

      elements.forEach((el: Element) => {
        let score = 0;
        const text = el.textContent?.toLowerCase() || '';
        const tag = el.tagName.toLowerCase();
        const className = el.className || '';
        const id = el.id || '';

        // Score based on text content matching
        keywords.forEach(keyword => {
          if (text.includes(keyword)) score += 10;
          if (typeof className === 'string' && className.includes(keyword)) score += 5;
          if (id.includes(keyword)) score += 5;
        });

        // Score based on context
        if (ctx) {
          const contextKeywords = ctx.toLowerCase().split(/\s+/);
          contextKeywords.forEach(keyword => {
            if (text.includes(keyword)) score += 3;
          });
        }

        // Prefer semantic elements
        const semanticTags = ['button', 'input', 'a', 'nav', 'header', 'footer', 'article', 'section'];
        if (semanticTags.includes(tag)) score += 2;

        if (score > 0) {
          // Generate selector
          let selector = tag;
          if (id) selector = `#${CSS.escape(id)}`;
          else if (typeof className === 'string' && className.trim()) selector = `${tag}.${CSS.escape(className.trim().split(/\s+/)[0])}`;

          scores.push({ selector, score, text: text.substring(0, 100), element: tag });
        }
      });

      // Sort by score
      scores.sort((a, b) => b.score - a.score);

      return {
        bestMatch: scores[0] || null,
        alternatives: scores.slice(1, 6),
        totalCandidates: scores.length
      };
    }, description, context || '');

    const resultText = `🤖 Smart Selector Generated\n\nBest Match: ${JSON.stringify(result.bestMatch, null, 2)}\nAlternatives: ${JSON.stringify(result.alternatives, null, 2)}\nTotal Candidates: ${result.totalCandidates}`;
    return { content: [{ type: 'text', text: resultText }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: `❌ Error: ${error.message}` }], isError: true };
  }
}

/**
 * Content Classification - Classify webpage content into categories
 */
export async function handleContentClassification(args: ContentClassificationArgs) {
  const { url, categories } = args;

  try {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    const content = await page.evaluate(() => {
      return {
        title: document.title,
        text: document.body.innerText,
        metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        metaKeywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent).join(' ')
      };
    });

    const allText = [content.title, content.text, content.metaDescription, content.metaKeywords, content.headings].join(' ').toLowerCase();

    // Define default categories if not provided
    const defaultCategories = [
      { name: 'E-commerce', keywords: ['shop', 'buy', 'cart', 'price', 'product', 'order', 'checkout'] },
      { name: 'News', keywords: ['news', 'article', 'breaking', 'report', 'journalist', 'story'] },
      { name: 'Blog', keywords: ['blog', 'post', 'author', 'comment', 'share', 'subscribe'] },
      { name: 'Social Media', keywords: ['follow', 'like', 'share', 'post', 'friend', 'profile'] },
      { name: 'Educational', keywords: ['learn', 'course', 'tutorial', 'education', 'study', 'lesson'] },
      { name: 'Entertainment', keywords: ['video', 'movie', 'music', 'game', 'play', 'watch'] },
      { name: 'Business', keywords: ['business', 'company', 'service', 'enterprise', 'solution'] },
      { name: 'Technology', keywords: ['tech', 'software', 'app', 'code', 'developer', 'api'] }
    ];

    const categoriesToUse = categories || defaultCategories;

    const scores = categoriesToUse.map((cat: any) => {
      const keywords = Array.isArray(cat.keywords) ? cat.keywords : cat.keywords.split(',');
      let score = 0;
      keywords.forEach((keyword: string) => {
        const regex = new RegExp(keyword.trim().toLowerCase(), 'g');
        const matches = allText.match(regex);
        score += matches ? matches.length : 0;
      });
      return { category: cat.name, score };
    });

    scores.sort((a, b) => b.score - a.score);

    const match = scores[0];
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0) || 1;
    const confidence = match.score / totalScore;

    const resultText = `✅ Content Classification\n\nPrimary Category: ${match.category} (Score: ${match.score})\nConfidence: ${(confidence * 100).toFixed(2)}%\n\nAll Categories:\n${JSON.stringify(scores.slice(0, 5), null, 2)}`;

    return {
      content: [{ type: 'text', text: resultText }]
    };
  } catch (error: any) {
    return { content: [{ type: 'text', text: `❌ Error: ${error.message}` }], isError: true };
  }
}

/**
 * Sentiment Analysis - Analyze sentiment of page content (Basic Heuristic)
 */
export async function handleSentimentAnalysis(args: SentimentAnalysisArgs) {
  try {
    let textToAnalyze = args.text || '';

    if (args.url || args.selector) {
      const page = getPageInstance();
      if (!page) throw new Error('Browser not initialized');

      if (args.url && page.url() !== args.url) {
        await page.goto(args.url, { waitUntil: 'domcontentloaded' });
      }

      if (args.selector) {
        textToAnalyze = await page.evaluate((sel: string) => document.querySelector(sel)?.textContent || '', args.selector);
      } else if (!textToAnalyze) {
        textToAnalyze = await page.evaluate(() => document.body.innerText);
      }
    }

    if (!textToAnalyze) throw new Error('No text to analyze');

    // Simple Bag of Words
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'best', 'wonderful', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'sad', 'poor', 'disappointing', 'fail'];

    const lowerText = textToAnalyze.toLowerCase();
    let score = 0;
    let matchCount = 0;

    positiveWords.forEach(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'g');
      const count = (lowerText.match(regex) || []).length;
      score += count;
      matchCount += count;
    });

    negativeWords.forEach(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'g');
      const count = (lowerText.match(regex) || []).length;
      score -= count;
      matchCount += count;
    });

    let sentiment = 'Neutral';
    if (score > 0) sentiment = 'Positive';
    if (score < 0) sentiment = 'Negative';

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ sentiment, score, matchCount, analyzedLength: textToAnalyze.length }, null, 2)
      }]
    };

  } catch (error: any) {
    return { content: [{ type: 'text', text: `❌ Error: ${error.message}` }], isError: true };
  }
}

/**
 * Summary Generator - Generate summary of page content (Basic Truncation/Extraction)
 */
export async function handleSummaryGenerator(args: SummaryGeneratorArgs) {
  try {
    let textToSummary = args.text || '';

    if (args.url || args.selector) {
      const page = getPageInstance();
      if (!page) throw new Error('Browser not initialized');

      if (args.url && page.url() !== args.url) {
        await page.goto(args.url, { waitUntil: 'domcontentloaded' });
      }

      if (args.selector) {
        textToSummary = await page.evaluate((sel: string) => document.querySelector(sel)?.textContent || '', args.selector);
      } else if (!textToSummary) {
        // Heuristic: Get paragraphs
        textToSummary = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('p')).map(p => p.textContent).join('\n\n');
        });
      }
    }

    if (!textToSummary) throw new Error('No text to summarize');

    // Basic Summary: First 5 sentences or maxLength
    const sentences = textToSummary.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 5).join('. ') + '.';

    const finalSummary = args.maxLength ? summary.slice(0, args.maxLength) : summary;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ summary: finalSummary, originalLength: textToSummary.length }, null, 2)
      }]
    };
  } catch (error: any) {
    return { content: [{ type: 'text', text: `❌ Error: ${error.message}` }], isError: true };
  }
}

/**
 * Translation Support - Placeholder
 */
export async function handleTranslationSupport(args: TranslationSupportArgs) {
  return {
    content: [{
      type: 'text',
      text: `⚠️ Translation Support requires an external API (e.g., Google Translate, DeepL). This feature is defined but currently running in 'offline' mode. To implement, valid API keys would be required.\n\nInput extracted: ${args.text ? 'Yes' : 'No'}\nTarget Language: ${args.targetLanguage}`
    }]
  };
}
