
import { getPageInstance } from '../browser-manager.js';

export interface KeywordSearchArgs {
  url?: string;
  keywords: string[] | string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  context?: number;
}

export interface RegexPatternMatcherArgs {
  url?: string;
  pattern: string;
  flags?: string;
  selector?: string;
}

export interface XPathSupportArgs {
  url?: string;
  xpath: string;
  returnType?: 'elements' | 'html';
}

export interface AdvancedCSSSelectorsArgs {
  url?: string;
  selector: string;
  operation?: 'query' | 'closest' | 'matches';
  returnType?: 'elements' | 'styles' | 'html';
}

export interface VisualElementFinderArgs {
  url?: string;
  criteria: {
    visible?: boolean;
    color?: string;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    position?: string;
    hasText?: boolean;
    inViewport?: boolean;
  };
}

/**
 * Keyword Search - Advanced keyword search in page content
 */
export async function handleKeywordSearch(args: KeywordSearchArgs) {
  const { url, keywords, caseSensitive = false, wholeWord = false, context = 50 } = args;

  try {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    const results = await page.evaluate((kws: string[], caseSens: boolean, whole: boolean, ctx: number) => {
      const allMatches: any[] = [];
      const keywordList = Array.isArray(kws) ? kws : [kws];

      keywordList.forEach(keyword => {
        const flags = caseSens ? 'g' : 'gi';
        const pattern = whole ? `\\b${keyword}\\b` : keyword;
        //const regex = new RegExp(pattern, flags);

        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent || '';
          let match;
          const nodeRegex = new RegExp(pattern, flags);

          while ((match = nodeRegex.exec(text)) !== null) {
            const start = Math.max(0, match.index - ctx);
            const end = Math.min(text.length, match.index + match[0].length + ctx);
            const contextText = text.substring(start, end);

            // Get element info
            const element = node.parentElement;
            const tagName = element?.tagName.toLowerCase() || 'text';
            const className = element?.className || '';
            const id = element?.id || '';

            allMatches.push({
              keyword,
              match: match[0],
              position: match.index,
              context: contextText,
              element: {
                tag: tagName,
                class: className,
                id: id
              }
            });
          }
        }
      });

      // Group by keyword
      const grouped: any = {};
      allMatches.forEach(m => {
        if (!grouped[m.keyword]) grouped[m.keyword] = [];
        grouped[m.keyword].push(m);
      });

      return {
        totalMatches: allMatches.length,
        matchesByKeyword: grouped,
        allMatches: allMatches.slice(0, 100) // Limit to first 100
      };
    }, Array.isArray(keywords) ? keywords : [keywords], caseSensitive, wholeWord, context);

    const resultText = `✅ Keyword Search Results\n\nTotal Matches: ${results.totalMatches}\n\nKeywords searched: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}\n\nMatches by keyword:\n${JSON.stringify(results.matchesByKeyword, null, 2)}\n\nFirst 100 matches:\n${JSON.stringify(results.allMatches, null, 2)}`;

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `❌ Keyword search failed: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Regex Pattern Matcher - Search using regular expressions
 */
export async function handleRegexPatternMatcher(args: RegexPatternMatcherArgs) {
  const { url, pattern, flags = 'g', selector } = args;

  try {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    const results = await page.evaluate((pat: string, flgs: string, sel: string) => {
      let content: string;

      if (sel) {
        const element = document.querySelector(sel);
        content = element ? element.textContent || '' : '';
      } else {
        content = document.body.innerText;
      }

      const regex = new RegExp(pat, flgs);
      const matches: any[] = [];
      let match;

      // Safety check for infinite loop
      let count = 0;
      while ((match = regex.exec(content)) !== null && count < 1000) {
        count++;
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          context: content.substring(Math.max(0, match.index - 50), Math.min(content.length, match.index + match[0].length + 50))
        });

        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      return {
        totalMatches: matches.length,
        matches: matches.slice(0, 100),
        pattern: pat,
        flags: flgs
      };
    }, pattern, flags, selector || '');

    const resultText = `✅ Regex Pattern Matcher Results\n\nPattern: ${results.pattern}\nFlags: ${results.flags}\nTotal Matches: ${results.totalMatches}\n\nMatches (first 100):\n${JSON.stringify(results.matches, null, 2)}`;

    return {
      content: [{ type: 'text', text: resultText }],
    };
  } catch (error: any) {
    return { content: [{ type: 'text', text: `❌ Regex pattern matcher failed: ${error.message}` }], isError: true };
  }
}

/**
 * XPath Support - Query elements using XPath
 */
export async function handleXPathSupport(args: XPathSupportArgs) {
  const { url, xpath, returnType = 'elements' } = args;

  try {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    const results = await page.evaluate((xp: string, type: string) => {
      const xpathResult = document.evaluate(
        xp,
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      );

      const elements: any[] = [];
      let node = xpathResult.iterateNext();

      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          elements.push({
            tagName: element.tagName.toLowerCase(),
            id: element.id,
            className: element.className,
            text: element.textContent?.substring(0, 200),
            attributes: Array.from(element.attributes).reduce((acc: any, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {}),
            innerHTML: type === 'html' ? element.innerHTML.substring(0, 500) : undefined
          });
        } else if (node.nodeType === Node.TEXT_NODE) {
          elements.push({
            type: 'text',
            content: node.textContent?.trim()
          });
        } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
          const attr = node as Attr;
          elements.push({
            type: 'attribute',
            name: attr.name,
            value: attr.value
          });
        }

        node = xpathResult.iterateNext();
      }

      return {
        count: elements.length,
        elements
      };
    }, xpath, returnType);

    const resultText = `✅ XPath Query Results\n\nXPath: ${xpath}\nElements Found: ${results.count}\n\nElements:\n${JSON.stringify(results.elements, null, 2)}`;

    return {
      content: [{ type: 'text', text: resultText }],
    };
  } catch (error: any) {
    return { content: [{ type: 'text', text: `❌ XPath query failed: ${error.message}` }], isError: true };
  }
}

/**
 * Advanced CSS Selectors - Support for complex CSS selectors
 */
export async function handleAdvancedCSSSelectors(args: AdvancedCSSSelectorsArgs) {
  const { url, selector, operation = 'query', returnType = 'elements' } = args;

  try {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    const results = await page.evaluate((sel: string, op: string, type: string) => {
      let elements: Element[];

      switch (op) {
        case 'query':
          elements = Array.from(document.querySelectorAll(sel));
          break;
        case 'closest':
          const firstEl = document.querySelector(sel);
          elements = firstEl ? [firstEl.closest(sel) as Element].filter(Boolean) : [];
          break;
        case 'matches':
          elements = Array.from(document.querySelectorAll('*')).filter(el => el.matches(sel));
          break;
        default:
          elements = Array.from(document.querySelectorAll(sel));
      }

      const results = elements.map(element => {
        const computed = window.getComputedStyle(element);

        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id,
          className: element.className,
          text: element.textContent?.substring(0, 200),
          attributes: Array.from(element.attributes).reduce((acc: any, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          computedStyles: type === 'styles' ? {
            display: computed.display,
            visibility: computed.visibility,
            position: computed.position,
            width: computed.width,
            height: computed.height,
            color: computed.color,
            backgroundColor: computed.backgroundColor
          } : undefined,
          innerHTML: type === 'html' ? element.innerHTML.substring(0, 500) : undefined,
          boundingRect: element.getBoundingClientRect()
        };
      });

      return {
        count: results.length,
        elements: results
      };
    }, selector, operation, returnType);

    const resultText = `✅ Advanced CSS Selector Results\n\nSelector: ${selector}\nOperation: ${operation}\nElements Found: ${results.count}\n\nElements (first 10):\n${JSON.stringify(results.elements.slice(0, 10), null, 2)}`;

    return {
      content: [{ type: 'text', text: resultText }],
    };
  } catch (error: any) {
    return { content: [{ type: 'text', text: `❌ CSS selector query failed: ${error.message}` }], isError: true };
  }
}


