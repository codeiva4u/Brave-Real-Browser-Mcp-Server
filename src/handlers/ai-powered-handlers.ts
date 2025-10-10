// @ts-nocheck
import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import natural from 'natural';
import Sentiment from 'sentiment';
import { franc } from 'franc';
import * as cheerio from 'cheerio';

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();

/**
 * Smart Selector Generator - AI-powered CSS selector generation
 */
export async function handleSmartSelectorGenerator(args: any): Promise<any> {
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
          if (className.includes(keyword)) score += 5;
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
          if (id) selector = `#${id}`;
          else if (className) selector = `${tag}.${className.split(' ')[0]}`;
          
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
    
    return {
      success: true,
      data: result,
      description,
      context
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Content Classification - Classify webpage content into categories
 */
export async function handleContentClassification(args: any): Promise<any> {
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
    
    return {
      success: true,
      primaryCategory: scores[0],
      allScores: scores,
      confidence: scores[0].score / (scores.reduce((sum, s) => sum + s.score, 0) || 1)
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sentiment Analysis - Analyze sentiment of page content
 */
export async function handleSentimentAnalysis(args: any): Promise<any> {
  const { url, selector, text } = args;
  
  try {
    let contentToAnalyze = text;
    
    if (!contentToAnalyze && url) {
      const page = getPageInstance();
      if (!page) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }
      
      if (page.url() !== url) {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      }
      
      if (selector) {
        contentToAnalyze = await page.evaluate((sel: string) => {
          const element = document.querySelector(sel);
          return element ? element.textContent : '';
        }, selector);
      } else {
        contentToAnalyze = await page.evaluate(() => document.body.innerText);
      }
    }
    
    if (!contentToAnalyze) {
      throw new Error('No content to analyze');
    }
    
    const result = sentiment.analyze(contentToAnalyze);
    
    // Additional analysis using natural
    const tokens = tokenizer.tokenize(contentToAnalyze);
    const sentenceTokenizer = new natural.SentenceTokenizer();
    const sentences = sentenceTokenizer.tokenize(contentToAnalyze);
    
    // Classify sentiment per sentence
    const sentenceSentiments = sentences.map(sentence => {
      const s = sentiment.analyze(sentence);
      return {
        sentence: sentence.substring(0, 100),
        score: s.score,
        sentiment: s.score > 0 ? 'positive' : s.score < 0 ? 'negative' : 'neutral'
      };
    });
    
    return {
      success: true,
      overall: {
        score: result.score,
        comparative: result.comparative,
        sentiment: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral',
        tokens: result.tokens.length,
        positive: result.positive,
        negative: result.negative
      },
      sentences: sentenceSentiments,
      statistics: {
        totalSentences: sentences.length,
        positiveSentences: sentenceSentiments.filter(s => s.sentiment === 'positive').length,
        negativeSentences: sentenceSentiments.filter(s => s.sentiment === 'negative').length,
        neutralSentences: sentenceSentiments.filter(s => s.sentiment === 'neutral').length
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Summary Generator - Generate summary of page content
 */
export async function handleSummaryGenerator(args: any): Promise<any> {
  const { url, maxSentences = 5, selector } = args;
  
  try {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }
    
    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    let content: string;
    if (selector) {
      content = await page.evaluate((sel: string) => {
        const element = document.querySelector(sel);
        return element ? element.textContent : '';
      }, selector);
    } else {
      content = await page.evaluate(() => {
        // Extract main content
        const main = document.querySelector('main, article, .content, .post, #content');
        if (main) return main.textContent || '';
        return document.body.innerText;
      });
    }
    
    if (!content) {
      throw new Error('No content found');
    }
    
    // Use TF-IDF for extractive summarization
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    
    const sentenceTokenizer = new natural.SentenceTokenizer();
    const sentences = sentenceTokenizer.tokenize(content);
    
    if (sentences.length === 0) {
      throw new Error('No sentences found to summarize');
    }
    
    // Add each sentence as a document
    sentences.forEach(sentence => {
      tfidf.addDocument(sentence);
    });
    
    // Score each sentence
    const sentenceScores = sentences.map((sentence, idx) => {
      let score = 0;
      tfidf.listTerms(idx).forEach(term => {
        score += term.tfidf;
      });
      return { sentence, score, index: idx };
    });
    
    // Sort by score and take top N
    sentenceScores.sort((a, b) => b.score - a.score);
    const topSentences = sentenceScores.slice(0, maxSentences);
    
    // Sort by original order
    topSentences.sort((a, b) => a.index - b.index);
    
    const summary = topSentences.map(s => s.sentence).join(' ');
    
    return {
      success: true,
      summary,
      originalLength: content.length,
      summaryLength: summary.length,
      compressionRatio: (summary.length / content.length * 100).toFixed(2) + '%',
      sentenceCount: {
        original: sentences.length,
        summary: topSentences.length
      },
      topScoredSentences: topSentences.map(s => ({
        sentence: s.sentence,
        score: s.score.toFixed(2)
      }))
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Translation Support - Detect language and provide translation info
 */
export async function handleTranslationSupport(args: any): Promise<any> {
  const { url, selector, text, targetLanguage = 'en' } = args;
  
  try {
    let contentToTranslate = text;
    
    if (!contentToTranslate && url) {
      const page = getPageInstance();
      if (!page) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }
      
      if (page.url() !== url) {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      }
      
      if (selector) {
        contentToTranslate = await page.evaluate((sel: string) => {
          const element = document.querySelector(sel);
          return element ? element.textContent : '';
        }, selector);
      } else {
        contentToTranslate = await page.evaluate(() => document.body.innerText);
      }
    }
    
    if (!contentToTranslate) {
      throw new Error('No content to translate');
    }
    
    // Detect language using franc
    const detectedLang = franc(contentToTranslate, { minLength: 10 });
    
    // Get language name
    const langNames: any = {
      'eng': 'English',
      'spa': 'Spanish',
      'fra': 'French',
      'deu': 'German',
      'ita': 'Italian',
      'por': 'Portuguese',
      'rus': 'Russian',
      'jpn': 'Japanese',
      'kor': 'Korean',
      'cmn': 'Chinese (Mandarin)',
      'ara': 'Arabic',
      'hin': 'Hindi',
      'und': 'Undetermined'
    };
    
    const languageName = langNames[detectedLang] || detectedLang;
    
    // Extract key phrases using TF-IDF
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    tfidf.addDocument(contentToTranslate);
    
    const keyPhrases = tfidf.listTerms(0)
      .slice(0, 10)
      .map(term => term.term);
    
    return {
      success: true,
      detectedLanguage: {
        code: detectedLang,
        name: languageName
      },
      targetLanguage,
      needsTranslation: detectedLang !== targetLanguage && detectedLang !== 'und',
      contentPreview: contentToTranslate.substring(0, 200),
      contentLength: contentToTranslate.length,
      keyPhrases,
      translationNote: 'Use external translation API (Google Translate, DeepL) for actual translation'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
