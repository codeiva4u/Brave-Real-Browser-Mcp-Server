// Handlers for all new features
import { getCurrentPage } from '../browser-manager.js';
import { cleanText, parsePrice, normalizeDate, extractContactInfo } from '../processors/data-transformation.js';
import { waitForAjaxContent, extractFromShadowDom, extractFromIFrame, detectModal, closeModal } from '../advanced/advanced-content-extraction.js';
import { SessionManager } from '../auth/session-manager.js';
import { keywordSearch, regexSearch, xpathQuery, visualElementFinder } from '../search/advanced-search-tools.js';
import { takeFullPageScreenshot, takeElementScreenshot, generatePDF } from '../visual/screenshot-tools.js';
import { classifyContent, analyzeSentiment, generateSummary, generateSmartSelector } from '../ai/ai-features.js';

const sessionManager = new SessionManager();

export async function handleCleanText(args: { text: string; options?: any }): Promise<any> {
  try {
    const cleaned = await cleanText(args.text, args.options || {});
    return { content: [{ type: 'text', text: `Cleaned text: ${cleaned}` }] };
  } catch (error: any) {
    throw new Error(`Failed to clean text: ${error.message}`);
  }
}

export async function handleParsePrice(args: { text: string }): Promise<any> {
  try {
    const parsed = await parsePrice(args.text);
    return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Failed to parse price: ${error.message}`);
  }
}

export async function handleNormalizeDate(args: { text: string }): Promise<any> {
  try {
    const normalized = await normalizeDate(args.text);
    return { content: [{ type: 'text', text: JSON.stringify(normalized, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Failed to normalize date: ${error.message}`);
  }
}

export async function handleWaitForAjax(args: any): Promise<any> {
  try {
    const page = getCurrentPage();
    const result = await waitForAjaxContent(page, args);
    return { content: [{ type: 'text', text: result.message }] };
  } catch (error: any) {
    throw new Error(`Failed to wait for AJAX: ${error.message}`);
  }
}

export async function handleExtractShadowDom(args: { selector: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const result = await extractFromShadowDom(page, args.selector);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Failed to extract shadow DOM: ${error.message}`);
  }
}

export async function handleExtractIFrame(args: { selector: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const result = await extractFromIFrame(page, args.selector);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Failed to extract iframe: ${error.message}`);
  }
}

export async function handleDetectModal(): Promise<any> {
  try {
    const page = getCurrentPage();
    const modal = await detectModal(page);
    return { content: [{ type: 'text', text: JSON.stringify(modal, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Failed to detect modal: ${error.message}`);
  }
}

export async function handleCloseModal(): Promise<any> {
  try {
    const page = getCurrentPage();
    const result = await closeModal(page);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Failed to close modal: ${error.message}`);
  }
}

export async function handleLogin(args: any): Promise<any> {
  try {
    const page = getCurrentPage();
    const success = await sessionManager.login(page, args);
    return { content: [{ type: 'text', text: success ? 'Login successful' : 'Login failed' }] };
  } catch (error: any) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

export async function handleSaveSession(args: { name: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    await sessionManager.saveSession(page, args.name);
    return { content: [{ type: 'text', text: `Session "${args.name}" saved successfully` }] };
  } catch (error: any) {
    throw new Error(`Failed to save session: ${error.message}`);
  }
}

export async function handleLoadSession(args: { name: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const success = await sessionManager.loadSession(page, args.name);
    return { content: [{ type: 'text', text: success ? 'Session loaded' : 'Session not found' }] };
  } catch (error: any) {
    throw new Error(`Failed to load session: ${error.message}`);
  }
}

export async function handleKeywordSearch(args: { keyword: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const results = await keywordSearch(page, args.keyword);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Keyword search failed: ${error.message}`);
  }
}

export async function handleRegexSearch(args: { pattern: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const results = await regexSearch(page, args.pattern);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Regex search failed: ${error.message}`);
  }
}

export async function handleXpathQuery(args: { xpath: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const results = await xpathQuery(page, args.xpath);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  } catch (error: any) {
    throw new Error(`XPath query failed: ${error.message}`);
  }
}

export async function handleTakeScreenshot(args: { path: string; fullPage?: boolean; selector?: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    let success = false;
    if (args.selector) {
      success = await takeElementScreenshot(page, args.selector, args.path);
    } else {
      success = await takeFullPageScreenshot(page, args.path);
    }
    return { content: [{ type: 'text', text: success ? `Screenshot saved to ${args.path}` : 'Screenshot failed' }] };
  } catch (error: any) {
    throw new Error(`Screenshot failed: ${error.message}`);
  }
}

export async function handleGeneratePDF(args: { path: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const success = await generatePDF(page, args.path);
    return { content: [{ type: 'text', text: success ? `PDF saved to ${args.path}` : 'PDF generation failed' }] };
  } catch (error: any) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

export async function handleClassifyContent(args: { text: string }): Promise<any> {
  try {
    const result = await classifyContent(args.text);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Content classification failed: ${error.message}`);
  }
}

export async function handleAnalyzeSentiment(args: { text: string }): Promise<any> {
  try {
    const result = await analyzeSentiment(args.text);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Sentiment analysis failed: ${error.message}`);
  }
}

export async function handleGenerateSummary(args: { text: string; maxLength?: number }): Promise<any> {
  try {
    const summary = await generateSummary(args.text, args.maxLength);
    return { content: [{ type: 'text', text: summary }] };
  } catch (error: any) {
    throw new Error(`Summary generation failed: ${error.message}`);
  }
}

export async function handleGenerateSmartSelector(args: { description: string }): Promise<any> {
  try {
    const page = getCurrentPage();
    const result = await generateSmartSelector(page, args.description);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Smart selector generation failed: ${error.message}`);
  }
}
