// Search & Filter Tools Module
// Keyword Search, Regex Matcher, XPath Support, Advanced CSS Selectors

type Page = any;

/**
 * Keyword Search
 * Page में specific keywords search करना
 */
export async function searchKeywords(
  page: Page,
  keywords: string | string[],
  options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    context?: number;
  }
): Promise<Array<{
  keyword: string;
  matches: number;
  locations: Array<{
    text: string;
    context: string;
    element: string;
  }>;
}>> {
  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
  const caseSensitive = options?.caseSensitive || false;
  const wholeWord = options?.wholeWord || false;
  const contextLength = options?.context || 50;
  
  return await page.evaluate((kws: any, cs: any, ww: any, ctx: any) => {
    const results: any[] = [];
    
    kws.forEach((keyword: string) => {
      const matches: any[] = [];
      const pattern = ww 
        ? new RegExp(`\\b${keyword}\\b`, cs ? 'g' : 'gi')
        : new RegExp(keyword, cs ? 'g' : 'gi');
      
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node: any;
      while (node = walker.nextNode()) {
        const text = node.textContent || '';
        const matched = text.match(pattern);
        
        if (matched) {
          matched.forEach((match: any) => {
            const index = text.indexOf(match);
            const start = Math.max(0, index - ctx);
            const end = Math.min(text.length, index + match.length + ctx);
            const context = text.substring(start, end);
            
            matches.push({
              text: match,
              context: context.trim(),
              element: (node.parentElement as any)?.tagName.toLowerCase() || 'text'
            });
          });
        }
      }
      
      results.push({
        keyword,
        matches: matches.length,
        locations: matches
      });
    });
    
    return results;
  }, keywordArray, caseSensitive, wholeWord, contextLength);
}

/**
 * Regex Pattern Matcher
 * Complex patterns के साथ data extract करना
 */
export async function matchRegexPattern(
  page: Page,
  pattern: string,
  flags?: string
): Promise<Array<{
  match: string;
  groups: string[];
  index: number;
  context: string;
}>> {
  return await page.evaluate((pat: any, flg: any) => {
    const regex = new RegExp(pat, flg || 'g');
    const text = document.body.textContent || '';
    const results: any[] = [];
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      const index = match.index;
      const contextStart = Math.max(0, index - 30);
      const contextEnd = Math.min(text.length, index + match[0].length + 30);
      
      results.push({
        match: match[0],
        groups: match.slice(1),
        index,
        context: text.substring(contextStart, contextEnd).trim()
      });
    }
    
    return results;
  }, pattern, flags);
}

/**
 * XPath Selector Support
 * XPath selectors के साथ element finding
 */
export async function findByXPath(
  page: Page,
  xpath: string
): Promise<Array<{
  tagName: string;
  text: string;
  attributes: { [key: string]: string };
  html: string;
}>> {
  return await page.evaluate((xp: any) => {
    const results: any[] = [];
    const iterator = document.evaluate(
      xp,
      document,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    );
    
    let node: any;
    while (node = iterator.iterateNext()) {
      const element = node as Element;
      const attributes: any = {};
      
      if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributes[attr.name] = attr.value;
        }
      }
      
      results.push({
        tagName: element.tagName?.toLowerCase() || 'unknown',
        text: element.textContent?.trim() || '',
        attributes,
        html: (element as any).outerHTML || ''
      });
    }
    
    return results;
  }, xpath);
}

/**
 * Advanced CSS Selector Query
 * Complex CSS queries support
 */
export async function queryAdvancedCSS(
  page: Page,
  selector: string,
  options?: {
    limit?: number;
    extractText?: boolean;
    extractAttributes?: string[];
  }
): Promise<any[]> {
  return await page.evaluate((sel: any, opts: any) => {
    const elements = Array.from(document.querySelectorAll(sel));
    const limit = opts?.limit || elements.length;
    const limitedElements = elements.slice(0, limit);
    
    return limitedElements.map((element: any) => {
      const result: any = {
        tagName: element.tagName.toLowerCase()
      };
      
      if (opts?.extractText !== false) {
        result.text = element.textContent?.trim() || '';
        result.innerText = element.innerText?.trim() || '';
      }
      
      if (opts?.extractAttributes) {
        result.attributes = {};
        opts.extractAttributes.forEach((attr: string) => {
          result.attributes[attr] = element.getAttribute(attr);
        });
      }
      
      return result;
    });
  }, selector, options);
}

/**
 * Filter Elements by Attribute
 * Attribute values के basis पर elements filter करना
 */
export async function filterByAttribute(
  page: Page,
  selector: string,
  attribute: string,
  value: string | RegExp,
  operator: 'equals' | 'contains' | 'starts' | 'ends' | 'regex' = 'equals'
): Promise<any[]> {
  return await page.evaluate((sel: any, attr: any, val: any, op: any) => {
    const elements = Array.from(document.querySelectorAll(sel));
    const filtered: any[] = [];
    
    elements.forEach((element: any) => {
      const attrValue = element.getAttribute(attr);
      if (!attrValue) return;
      
      let matches = false;
      
      switch (op) {
        case 'equals':
          matches = attrValue === val;
          break;
        case 'contains':
          matches = attrValue.includes(val);
          break;
        case 'starts':
          matches = attrValue.startsWith(val);
          break;
        case 'ends':
          matches = attrValue.endsWith(val);
          break;
        case 'regex':
          matches = new RegExp(val).test(attrValue);
          break;
      }
      
      if (matches) {
        filtered.push({
          tagName: element.tagName.toLowerCase(),
          text: element.textContent?.trim(),
          [attr]: attrValue,
          html: element.outerHTML
        });
      }
    });
    
    return filtered;
  }, selector, attribute, value, operator);
}

/**
 * Text Content Filter
 * Text content के basis पर elements filter करना
 */
export async function filterByText(
  page: Page,
  selector: string,
  text: string,
  options?: {
    caseSensitive?: boolean;
    exact?: boolean;
    regex?: boolean;
  }
): Promise<any[]> {
  return await page.evaluate((sel: any, txt: any, opts: any) => {
    const elements = Array.from(document.querySelectorAll(sel));
    const filtered: any[] = [];
    
    elements.forEach((element: any) => {
      const elementText = element.textContent?.trim() || '';
      let matches = false;
      
      if (opts?.regex) {
        const pattern = new RegExp(txt, opts.caseSensitive ? '' : 'i');
        matches = pattern.test(elementText);
      } else if (opts?.exact) {
        matches = opts.caseSensitive 
          ? elementText === txt 
          : elementText.toLowerCase() === txt.toLowerCase();
      } else {
        matches = opts?.caseSensitive 
          ? elementText.includes(txt) 
          : elementText.toLowerCase().includes(txt.toLowerCase());
      }
      
      if (matches) {
        filtered.push({
          tagName: element.tagName.toLowerCase(),
          text: elementText,
          html: element.outerHTML
        });
      }
    });
    
    return filtered;
  }, selector, text, options);
}

/**
 * Visual Element Finder
 * Screen coordinates से elements locate करना
 */
export async function findElementAtPosition(
  page: Page,
  x: number,
  y: number
): Promise<{
  tagName: string;
  text: string;
  attributes: { [key: string]: string };
  position: { x: number; y: number; width: number; height: number };
  selector: string;
} | null> {
  return await page.evaluate((posX: any, posY: any) => {
    const element: any = document.elementFromPoint(posX, posY);
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    const attributes: any = {};
    
    if (element.attributes) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
      }
    }
    
    // Generate selector
    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector = `#${element.id}`;
    } else if (element.className) {
      const classes = element.className.split(' ').filter((c: string) => c);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    return {
      tagName: element.tagName.toLowerCase(),
      text: element.textContent?.trim() || '',
      attributes,
      position: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      selector
    };
  }, x, y);
}

/**
 * Get All Visible Elements
 * Visible elements को filter करना
 */
export async function getVisibleElements(
  page: Page,
  selector: string = '*'
): Promise<Array<{
  tagName: string;
  text: string;
  selector: string;
  position: { x: number; y: number; width: number; height: number };
}>> {
  return await page.evaluate((sel: any) => {
    const elements = Array.from(document.querySelectorAll(sel));
    const visible: any[] = [];
    
    elements.forEach((element: any) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      // Check if element is visible
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      ) {
        let selector = element.tagName.toLowerCase();
        if (element.id) {
          selector = `#${element.id}`;
        } else if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ').filter((c: string) => c);
          if (classes.length > 0) {
            selector += `.${classes.join('.')}`;
          }
        }
        
        visible.push({
          tagName: element.tagName.toLowerCase(),
          text: element.textContent?.trim().substring(0, 100) || '',
          selector,
          position: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        });
      }
    });
    
    return visible;
  }, selector);
}

/**
 * Complex Query Builder
 * Multiple filters को combine करना
 */
export interface QueryFilter {
  type: 'tag' | 'class' | 'id' | 'attribute' | 'text' | 'visible';
  value: string;
  operator?: 'equals' | 'contains' | 'starts' | 'ends';
}

export async function complexQuery(
  page: Page,
  filters: QueryFilter[]
): Promise<any[]> {
  return await page.evaluate((flts: any) => {
    let elements: any = Array.from(document.body.getElementsByTagName('*'));
    
    flts.forEach((filter: any) => {
      elements = elements.filter((element: any) => {
        switch (filter.type) {
          case 'tag':
            return element.tagName.toLowerCase() === filter.value.toLowerCase();
          
          case 'class':
            return element.classList.contains(filter.value);
          
          case 'id':
            return element.id === filter.value;
          
          case 'attribute':
            const [attr, val] = filter.value.split('=');
            const attrValue = element.getAttribute(attr);
            if (!attrValue) return false;
            
            switch (filter.operator) {
              case 'contains': return attrValue.includes(val);
              case 'starts': return attrValue.startsWith(val);
              case 'ends': return attrValue.endsWith(val);
              default: return attrValue === val;
            }
          
          case 'text':
            const text = element.textContent?.trim() || '';
            switch (filter.operator) {
              case 'contains': return text.includes(filter.value);
              case 'starts': return text.startsWith(filter.value);
              case 'ends': return text.endsWith(filter.value);
              default: return text === filter.value;
            }
          
          case 'visible':
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && 
                   rect.height > 0 && 
                   style.display !== 'none' &&
                   style.visibility !== 'hidden';
          
          default:
            return true;
        }
      });
    });
    
    return elements.map((el: any) => ({
      tagName: el.tagName.toLowerCase(),
      text: el.textContent?.trim().substring(0, 100),
      id: el.id,
      classes: Array.from(el.classList)
    }));
  }, filters);
}
