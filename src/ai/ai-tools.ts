// AI-Powered Features for Web Scraping
// Smart selector generation, classification, sentiment, summary, translation

// Use generic type instead of Puppeteer to avoid dependency
type Page = any;

/**
 * Smart Selector Generator
 * Uses AI-like algorithms to generate robust CSS selectors
 */
export async function generateSmartSelector(
  page: Page,
  elementDescription: string,
  options: {
    preferStable?: boolean;
    includeParent?: boolean;
    maxDepth?: number;
  } = {}
): Promise<{ selector: string; confidence: number; alternatives: string[] }> {
  const { preferStable = true, includeParent = false, maxDepth = 3 } = options;

  try {
    // Use page evaluation to find best selector based on description
    const result = await page.evaluate(
      ({ description, stable, parent, depth }: { description: string; stable: boolean; parent: boolean; depth: number }) => {
        // Helper to generate selector for an element
        const generateSelector = (el: Element): string[] => {
          const selectors: string[] = [];

          // ID selector (most stable)
          if (el.id) {
            selectors.push(`#${el.id}`);
          }

          // Class selectors
          if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter(c => c && !c.match(/^(ng-|_)/));
            if (classes.length > 0 && classes.length <= 3) {
              selectors.push(`.${classes.join('.')}`);
            }
          }

          // Data attributes (stable)
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('data-') && attr.value) {
              selectors.push(`[${attr.name}="${attr.value}"]`);
            }
          });

          // Name attribute
          if (el.getAttribute('name')) {
            selectors.push(`[name="${el.getAttribute('name')}"]`);
          }

          // Type + role combination
          const role = el.getAttribute('role');
          if (role) {
            selectors.push(`[role="${role}"]`);
          }

          // Tag with specific attributes
          const tag = el.tagName.toLowerCase();
          if (el.getAttribute('type')) {
            selectors.push(`${tag}[type="${el.getAttribute('type')}"]`);
          }

          return selectors;
        };

        // Search for elements matching description
        const searchText = (text: string): Element[] => {
          const elements: Element[] = [];
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );

          const textLower = text.toLowerCase();
          let node: Node | null;

          while ((node = walker.nextNode())) {
            if (node.textContent && node.textContent.toLowerCase().includes(textLower)) {
              const parent = node.parentElement;
              if (parent && !elements.includes(parent)) {
                elements.push(parent);
              }
            }
          }

          return elements;
        };

        // Find elements
        const candidates = searchText(description);
        
        if (candidates.length === 0) {
          return {
            selector: '',
            confidence: 0,
            alternatives: [],
          };
        }

        // Generate selectors for all candidates
        const allSelectors: Array<{ selector: string; element: Element }> = [];
        
        candidates.forEach(el => {
          const selectors = generateSelector(el);
          selectors.forEach(sel => {
            allSelectors.push({ selector: sel, element: el });
          });
        });

        // Score and rank selectors
        const scored = allSelectors.map(({ selector, element }) => {
          let score = 0;

          // Prefer ID selectors
          if (selector.startsWith('#')) score += 100;
          
          // Prefer data attributes
          if (selector.includes('[data-')) score += 80;
          
          // Prefer role attributes
          if (selector.includes('[role')) score += 70;
          
          // Prefer name attributes
          if (selector.includes('[name')) score += 60;
          
          // Prefer class selectors
          if (selector.startsWith('.')) score += 50;

          // Check uniqueness
          const matches = document.querySelectorAll(selector);
          if (matches.length === 1) {
            score += 50;
          } else {
            score -= matches.length * 2;
          }

          return { selector, score, element };
        });

        // Sort by score
        scored.sort((a, b) => b.score - a.score);

        // Get top selector and alternatives
        const topSelector = scored[0]?.selector || '';
        const confidence = Math.min(100, Math.max(0, scored[0]?.score || 0));
        const alternatives = scored.slice(1, 5).map(s => s.selector);

        return {
          selector: topSelector,
          confidence,
          alternatives,
        };
      },
      { description: elementDescription, stable: preferStable, parent: includeParent, depth: maxDepth }
    );

    return result;
  } catch (error) {
    throw new Error(`Smart selector generation failed: ${error}`);
  }
}

/**
 * Content Classification
 * Classifies page content into predefined categories
 */
export async function classifyContent(
  page: Page,
  options: {
    categories?: string[];
    includeConfidence?: boolean;
  } = {}
): Promise<{ category: string; confidence: number; subcategories: string[] }> {
  const defaultCategories = [
    'e-commerce',
    'blog',
    'news',
    'documentation',
    'social-media',
    'forum',
    'landing-page',
    'portfolio',
    'educational',
    'entertainment',
  ];

  const categories = options.categories || defaultCategories;

  try {
    const classification = await page.evaluate((cats: string[]) => {
      const indicators: Record<string, string[]> = {
        'e-commerce': ['cart', 'price', 'product', 'buy', 'checkout', 'shop', 'add to cart'],
        'blog': ['article', 'post', 'author', 'comment', 'published', 'blog'],
        'news': ['breaking', 'latest', 'headline', 'reporter', 'press'],
        'documentation': ['api', 'reference', 'guide', 'tutorial', 'docs', 'documentation'],
        'social-media': ['profile', 'follow', 'share', 'like', 'post', 'feed'],
        'forum': ['thread', 'reply', 'user', 'topic', 'discussion', 'forum'],
        'landing-page': ['signup', 'subscribe', 'get started', 'join', 'register'],
        'portfolio': ['portfolio', 'projects', 'work', 'showcase'],
        'educational': ['course', 'lesson', 'learn', 'student', 'education'],
        'entertainment': ['video', 'play', 'watch', 'stream', 'entertainment'],
      };

      const content = document.body.innerText.toLowerCase();
      const html = document.body.innerHTML.toLowerCase();

      const scores: Record<string, number> = {};

      cats.forEach(category => {
        let score = 0;
        const words = indicators[category] || [];

        words.forEach(word => {
          // Count occurrences in text
          const regex = new RegExp(word, 'gi');
          const textMatches = (content.match(regex) || []).length;
          const htmlMatches = (html.match(regex) || []).length;

          score += textMatches * 2 + htmlMatches;
        });

        scores[category] = score;
      });

      // Find top category
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const topCategory = sorted[0]?.[0] || 'unknown';
      const maxScore = sorted[0]?.[1] || 0;
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      const confidence = totalScore > 0 ? Math.min(100, (maxScore / totalScore) * 100) : 0;

      const subcategories = sorted.slice(1, 4).map(([cat]) => cat);

      return {
        category: topCategory,
        confidence: Math.round(confidence),
        subcategories,
      };
    }, categories);

    return classification;
  } catch (error) {
    throw new Error(`Content classification failed: ${error}`);
  }
}

/**
 * Sentiment Analysis
 * Analyzes sentiment of page content
 */
export async function analyzeSentiment(
  page: Page,
  options: {
    selector?: string;
    includeScore?: boolean;
  } = {}
): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number; keywords: string[] }> {
  const { selector } = options;

  try {
    const result = await page.evaluate((sel?: string) => {
      const positiveWords = [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
        'best', 'love', 'perfect', 'happy', 'beautiful', 'awesome',
      ];

      const negativeWords = [
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
        'poor', 'sad', 'ugly', 'disappointing', 'useless', 'broken',
      ];

      let content: string;
      if (sel) {
        const element = document.querySelector(sel);
        content = element?.textContent || '';
      } else {
        content = document.body.innerText;
      }

      const contentLower = content.toLowerCase();
      const words = contentLower.split(/\s+/);

      let positiveCount = 0;
      let negativeCount = 0;
      const foundKeywords: string[] = [];

      words.forEach(word => {
        if (positiveWords.includes(word)) {
          positiveCount++;
          if (!foundKeywords.includes(word)) foundKeywords.push(word);
        }
        if (negativeWords.includes(word)) {
          negativeCount++;
          if (!foundKeywords.includes(word)) foundKeywords.push(word);
        }
      });

      const totalSentimentWords = positiveCount + negativeCount;
      let sentiment: 'positive' | 'negative' | 'neutral';
      let score: number;

      if (totalSentimentWords === 0) {
        sentiment = 'neutral';
        score = 0;
      } else if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = ((positiveCount - negativeCount) / totalSentimentWords) * 100;
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = ((negativeCount - positiveCount) / totalSentimentWords) * -100;
      } else {
        sentiment = 'neutral';
        score = 0;
      }

      return {
        sentiment,
        score: Math.round(score),
        keywords: foundKeywords.slice(0, 10),
      };
    }, selector);

    return result;
  } catch (error) {
    throw new Error(`Sentiment analysis failed: ${error}`);
  }
}

/**
 * Smart Content Summary
 * Generates intelligent summary of page content
 */
export async function generateSummary(
  page: Page,
  options: {
    maxLength?: number;
    includeKeywords?: boolean;
  } = {}
): Promise<{ summary: string; keywords: string[]; readingTime: number }> {
  const { maxLength = 200, includeKeywords = true } = options;

  try {
    const result = await page.evaluate((max: number, keywords: boolean) => {
      // Get main content
      const mainSelectors = ['main', 'article', '[role="main"]', '#content', '.content'];
      let mainContent: string = '';

      for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          mainContent = element.textContent;
          break;
        }
      }

      if (!mainContent) {
        mainContent = document.body.innerText;
      }

      // Clean content
      const cleaned = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim();

      // Get first N characters for summary
      let summary = cleaned.substring(0, max);
      
      // Try to end at sentence
      const lastPeriod = summary.lastIndexOf('.');
      if (lastPeriod > max * 0.7) {
        summary = summary.substring(0, lastPeriod + 1);
      } else {
        summary += '...';
      }

      // Extract keywords (basic frequency analysis)
      const words = cleaned.toLowerCase().split(/\s+/);
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
      
      const wordFreq: Record<string, number> = {};
      words.forEach(word => {
        const clean = word.replace(/[^a-z]/g, '');
        if (clean.length > 3 && !stopWords.has(clean)) {
          wordFreq[clean] = (wordFreq[clean] || 0) + 1;
        }
      });

      const keywordList = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);

      // Calculate reading time (average 200 words per minute)
      const wordCount = words.length;
      const readingTime = Math.ceil(wordCount / 200);

      return {
        summary,
        keywords: keywords ? keywordList : [],
        readingTime,
      };
    }, maxLength, includeKeywords);

    return result;
  } catch (error) {
    throw new Error(`Summary generation failed: ${error}`);
  }
}

/**
 * Language Detection and Translation Helper
 * Detects language and provides translation markers
 */
export async function detectLanguage(
  page: Page
): Promise<{ language: string; confidence: number; alternateLanguages: string[] }> {
  try {
    const result = await page.evaluate(() => {
      // Check HTML lang attribute
      const htmlLang = document.documentElement.lang;
      
      // Check meta tags
      const metaLang = document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content');
      
      // Check Open Graph locale
      const ogLocale = document.querySelector('meta[property="og:locale"]')?.getAttribute('content');

      // Basic text analysis for language detection
      const text = document.body.innerText.substring(0, 1000);
      
      // Simple heuristics (can be enhanced)
      const hasLatin = /[a-zA-Z]/.test(text);
      const hasCyrillic = /[а-яА-Я]/.test(text);
      const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(text);
      const hasArabic = /[\u0600-\u06ff]/.test(text);

      let detectedLang = htmlLang || metaLang || ogLocale || 'en';
      let confidence = 80;

      // Override with text analysis if no metadata
      if (!htmlLang && !metaLang) {
        if (hasCJK) {
          detectedLang = 'zh';
          confidence = 60;
        } else if (hasCyrillic) {
          detectedLang = 'ru';
          confidence = 60;
        } else if (hasArabic) {
          detectedLang = 'ar';
          confidence = 60;
        } else if (hasLatin) {
          detectedLang = 'en';
          confidence = 50;
        }
      }

      // Find alternate language links
      const alternates: string[] = [];
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => {
        const lang = link.getAttribute('hreflang');
        if (lang && lang !== detectedLang) {
          alternates.push(lang);
        }
      });

      return {
        language: detectedLang,
        confidence,
        alternateLanguages: alternates,
      };
    });

    return result;
  } catch (error) {
    throw new Error(`Language detection failed: ${error}`);
  }
}
