import { getBrowserInstance, getPageInstance, getContentPriorityConfig } from '../browser-manager.js';
import { withErrorHandling, withTimeout } from '../system-utils.js';
import { validateWorkflow, recordExecution, workflowValidator } from '../workflow-validation.js';
import { GetContentArgs, FindSelectorArgs } from '../tool-definitions.js';

// Get content handler
export async function handleGetContent(args: GetContentArgs) {
  return await withWorkflowValidation('get_content', args, async () => {
    return await withErrorHandling(async () => {
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { type = 'html', selector } = args;

      let content: string;

      if (selector) {
        // Get content from specific element
        const element = await pageInstance.$(selector);
        if (!element) {
          throw new Error(`Element not found: ${selector}. Use find_selector to locate elements first.`);
        }

        if (type === 'text') {
          content = await pageInstance.$eval(selector, (el: any) => el.innerText || el.textContent || '');
        } else {
          content = await pageInstance.$eval(selector, (el: any) => el.outerHTML || '');
        }
      } else {
        // Get full page content
        if (type === 'text') {
          content = await pageInstance.evaluate(() => document.body?.innerText || document.documentElement?.innerText || document.body?.textContent || '');
        } else {
          content = await pageInstance.content();
        }
      }

      // Return content directly - LLM handles its own token limits
      const workflowMessage = '\n\n🔄 Workflow Status: Content analyzed\n' +
        '  • Next step: Use find_selector to locate specific elements\n' +
        '  • Then: Use interaction tools (click, type) for automation\n\n' +
        '✅ Content available for element discovery and interactions';

      return {
        content: [
          {
            type: 'text',
            text: `${content}${workflowMessage}`,
          },
        ],
      };
    }, 'Failed to get page content');
  });
}

// Find selector handler
export async function handleFindSelector(args: FindSelectorArgs) {
  return await withWorkflowValidation('find_selector', args, async () => {
    return await withErrorHandling(async () => {
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const {
        text,
        selector,
        xpath,
        attributes,
        description,
        exact = false,
        context
      } = args || {};

      // Ensure elementType has a fallback value
      const elementType = (args as any)?.elementType || '*';

      // Priority 1: Direct CSS selector search
      if (selector) {
        const elements = await pageInstance.$$(selector);
        if (elements.length > 0) {
          const elementInfo = await pageInstance.evaluate((sel: string) => {
            const el = document.querySelector(sel);
            return el ? {
              selector: sel,
              text: el.textContent?.trim().substring(0, 100) || '',
              tagName: el.tagName.toLowerCase()
            } : null;
          }, selector);

          if (elementInfo) {
            return {
              content: [{
                type: 'text',
                text: `Found element: ${elementInfo.selector}\nText: "${elementInfo.text}"\nConfidence: 100\n\n` +
                  '🔄 Workflow Status: Element located\n' +
                  '  • Next step: Use interaction tools (click, type) with this selector\n' +
                  '  • Selector is validated and ready for automation\n\n' +
                  '✅ Element discovery complete - ready for interactions'
              }]
            };
          }
        }
        throw new Error(`Element not found with selector: ${selector}`);
      }

      // Priority 2: XPath expression search
      if (xpath) {
        const elementInfo = await pageInstance.evaluate((xp: string) => {
          try {
            const result = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const el = result.singleNodeValue as Element | null;
            if (!el) return null;

            let selector = el.tagName.toLowerCase();
            if ((el as HTMLElement).id) {
              selector += '#' + (el as HTMLElement).id;
            } else if (el.className && typeof el.className === 'string') {
              const cls = el.className.trim().split(/\s+/)[0];
              if (cls) selector += '.' + cls;
            }

            return {
              selector: selector,
              text: el.textContent?.trim().substring(0, 100) || '',
              tagName: el.tagName?.toLowerCase() || 'unknown'
            };
          } catch (e) {
            return null;
          }
        }, xpath);

        if (elementInfo) {
          return {
            content: [{
              type: 'text',
              text: `Found element via XPath: ${xpath}\nSelector: ${elementInfo.selector}\nText: "${elementInfo.text}"\nTag: ${elementInfo.tagName}\nConfidence: 95\n\n` +
                '🔄 Workflow Status: Element located\n' +
                '  • Next step: Use interaction tools with the CSS selector above\n\n' +
                '✅ XPath element discovery complete'
            }]
          };
        }
        throw new Error(`Element not found with XPath: ${xpath}`);
      }

      // Priority 3: Attributes JSON matching
      if (attributes) {
        let attrObj: Record<string, string>;
        try {
          attrObj = JSON.parse(attributes);
        } catch {
          throw new Error(`Invalid attributes JSON: ${attributes}. Please provide valid JSON.`);
        }

        const results = await pageInstance.evaluate((attrs: Record<string, string>, elemType: string) => {
          const elements = document.querySelectorAll(elemType);
          const matches: Array<{ selector: string; text: string; tagName: string }> = [];

          elements.forEach(el => {
            let allMatch = true;
            for (const [key, value] of Object.entries(attrs)) {
              const attrValue = el.getAttribute(key);
              if (attrValue !== value && !attrValue?.includes(value)) {
                allMatch = false;
                break;
              }
            }

            if (allMatch) {
              let sel = el.tagName.toLowerCase();
              if (el.id) sel += '#' + el.id;
              else if (el.className && typeof el.className === 'string') {
                const cls = el.className.trim().split(/\s+/)[0];
                if (cls) sel += '.' + cls;
              }
              matches.push({
                selector: sel,
                text: el.textContent?.trim().substring(0, 100) || '',
                tagName: el.tagName.toLowerCase()
              });
            }
          });

          return matches.slice(0, 5);
        }, attrObj, elementType);

        if (results.length > 0) {
          const best = results[0];
          return {
            content: [{
              type: 'text',
              text: `Found element by attributes: ${best.selector}\nText: "${best.text}"\nConfidence: 90\n${results.length > 1 ? `\nAdditional matches: ${results.length - 1}` : ''}\n\n` +
                '🔄 Workflow Status: Element located\n' +
                '  • Next step: Use interaction tools (click, type) with this selector\n\n' +
                '✅ Attribute-based element discovery complete'
            }]
          };
        }
        throw new Error(`No elements found matching attributes: ${attributes}`);
      }

      // Priority 4: Natural language description search (AI-powered fuzzy matching)
      if (description) {
        // Extract keywords from description for fuzzy matching
        const keywords = description.toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'button', 'link', 'element'].includes(w));

        if (keywords.length === 0) {
          throw new Error(`Could not extract meaningful keywords from description: "${description}". Please provide more specific terms.`);
        }

        const results = await pageInstance.evaluate((kws: string[], elemType: string, ctx: string | undefined) => {
          const searchArea = ctx ? document.querySelector(ctx) || document.body : document.body;
          const elements = searchArea.querySelectorAll(elemType);
          const matches: Array<{ selector: string; text: string; tagName: string; score: number }> = [];

          elements.forEach(el => {
            const elText = (el.textContent || '').toLowerCase();
            const elAttrs = Array.from(el.attributes).map(a => a.value.toLowerCase()).join(' ');
            const combined = elText + ' ' + elAttrs;

            let score = 0;
            for (const kw of kws) {
              if (combined.includes(kw)) score++;
            }

            if (score > 0) {
              let sel = el.tagName.toLowerCase();
              if (el.id) sel += '#' + el.id;
              else if (el.className && typeof el.className === 'string') {
                const cls = el.className.trim().split(/\s+/)[0];
                if (cls) sel += '.' + cls;
              }
              matches.push({
                selector: sel,
                text: el.textContent?.trim().substring(0, 100) || '',
                tagName: el.tagName.toLowerCase(),
                score: (score / kws.length) * 100
              });
            }
          });

          // Sort by score descending
          matches.sort((a, b) => b.score - a.score);
          return matches.slice(0, 5);
        }, keywords, elementType, context);

        if (results.length > 0) {
          const best = results[0];
          const additionalMatches = results.slice(1, 3).map((r: any) =>
            `  • ${r.selector} (confidence: ${Math.round(r.score)})`
          ).join('\n');

          return {
            content: [{
              type: 'text',
              text: `Found element: ${best.selector}\nText: "${best.text}"\nConfidence: ${Math.round(best.score)}\n` +
                (additionalMatches ? `\nAlternative matches:\n${additionalMatches}` : '') +
                '\n\n🔄 Workflow Status: Element located\n' +
                '  • Next step: Use interaction tools (click, type) with this selector\n' +
                '  • Selector is validated and ready for automation\n\n' +
                '✅ Element discovery complete - ready for interactions'
            }]
          };
        }
        throw new Error(`No elements found matching description: "${description}". Keywords searched: ${keywords.join(', ')}`);
      }

      // Priority 5: Text content search (original functionality)
      if (text) {
        // Enhanced semantic element type mappings
        const semanticMappings: { [key: string]: string[] } = {
          'button': ['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]'],
          'link': ['a', '[role="link"]'],
          'input': ['input', 'textarea', '[role="textbox"]', '[contenteditable="true"]'],
          'navigation': ['nav', '[role="navigation"]', '.nav', '.navbar', '.menu'],
          'heading': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[role="heading"]'],
          'list': ['ul', 'ol', '[role="list"]', '.list'],
          'article': ['article', '[role="article"]', '.article', '.post'],
          'form': ['form', '[role="form"]'],
          'dialog': ['dialog', '[role="dialog"]', '.modal', '.popup'],
          'tab': ['[role="tab"]', '.tab'],
          'menu': ['[role="menu"]', '.menu', '.dropdown'],
          'checkbox': ['input[type="checkbox"]', '[role="checkbox"]'],
          'radio': ['input[type="radio"]', '[role="radio"]']
        };

        // Convert semantic element type to actual selectors
        let searchSelectors: string[];
        if (semanticMappings[elementType.toLowerCase()]) {
          searchSelectors = semanticMappings[elementType.toLowerCase()];
        } else {
          searchSelectors = [elementType];
        }

        // Enhanced selector finding with context support
        const results = await pageInstance.evaluate(
          (searchText: string, selectors: string[], isExact: boolean, ctx: string | undefined) => {
            const searchArea = ctx ? document.querySelector(ctx) || document.body : document.body;
            const elements: Array<{
              selector: string;
              text: string;
              tagName: string;
              confidence: number;
            }> = [];

            const lowerSearchText = searchText.toLowerCase();

            // Search through specified selectors
            for (const baseSelector of selectors) {
              const candidates = searchArea.querySelectorAll(baseSelector);

              candidates.forEach(element => {
                const elementText = element.textContent?.trim() || '';
                const lowerElementText = elementText.toLowerCase();

                let matches = false;
                if (isExact) {
                  matches = lowerElementText === lowerSearchText;
                } else {
                  matches = lowerElementText.includes(lowerSearchText);
                }

                if (matches) {
                  // Generate simple selector
                  let selector = element.tagName.toLowerCase();
                  if (element.id) {
                    selector += '#' + element.id;
                  } else if (element.className && typeof element.className === 'string') {
                    const cls = element.className.trim().split(/\s+/)[0];
                    if (cls) selector += '.' + cls;
                  }

                  // Calculate confidence based on match quality
                  let confidence = 100;
                  if (lowerElementText === lowerSearchText) confidence = 100;
                  else confidence = 80;

                  elements.push({
                    selector,
                    text: elementText.substring(0, 100),
                    tagName: element.tagName.toLowerCase(),
                    confidence
                  });
                }
              });
            }

            // Return top 10 unique
            return elements.slice(0, 10);
          },
          text,
          searchSelectors,
          exact,
          context
        );

        if (results.length === 0) {
          throw new Error(
            `No elements found containing text: "${text}"\n\n` +
            '💡 Troubleshooting suggestions:\n' +
            '  • Check if the text appears exactly as shown on the page\n' +
            '  • Try partial text search with exact=false\n' +
            '  • Use get_content to see all available text first\n' +
            '  • Verify the page has fully loaded\n' +
            '  • Check if the element is hidden or in a different frame'
          );
        }

        // Return the best match with additional options
        const bestMatch = results[0];
        const additionalMatches = results.slice(1, 3).map((r: any) =>
          `  • ${r.selector} (confidence: ${r.confidence})`
        ).join('\n');

        const workflowMessage = '\n\n🔄 Workflow Status: Element located\n' +
          '  • Next step: Use interaction tools (click, type) with this selector\n' +
          '  • Selector is validated and ready for automation\n\n' +
          '✅ Element discovery complete - ready for interactions';

        return {
          content: [
            {
              type: 'text',
              text: `Found element: ${bestMatch.selector}\n` +
                `Text: "${bestMatch.text}"\n` +
                `Confidence: ${bestMatch.confidence}\n` +
                (additionalMatches ? `\nAlternative matches:\n${additionalMatches}` : '') +
                workflowMessage,
            },
          ],
        };
      }

      // No search criteria provided
      throw new Error(
        'No search criteria provided. Please specify at least one of:\n' +
        '  • text - Text content to search for\n' +
        '  • selector - CSS selector\n' +
        '  • xpath - XPath expression\n' +
        '  • attributes - JSON string of attributes\n' +
        '  • description - Natural language description'
      );
    }, 'Failed to find selector');
  });
}

// Workflow validation wrapper
async function withWorkflowValidation<T>(
  toolName: string,
  args: any,
  operation: () => Promise<T>
): Promise<T> {
  // Validate workflow state before execution
  const validation = validateWorkflow(toolName, args);

  if (!validation.isValid) {
    let errorMessage = validation.errorMessage || `Tool '${toolName}' is not allowed in current workflow state.`;

    if (validation.suggestedAction) {
      errorMessage += `\n\n💡 Next Steps: ${validation.suggestedAction}`;
    }

    // Add workflow context for debugging
    const workflowSummary = workflowValidator.getValidationSummary();
    errorMessage += `\n\n🔍 ${workflowSummary}`;

    // Record failed execution
    recordExecution(toolName, args, false, errorMessage);

    throw new Error(errorMessage);
  }

  try {
    // Execute the operation
    const result = await operation();

    // Record successful execution
    recordExecution(toolName, args, true);

    return result;
  } catch (error) {
    // Record failed execution
    recordExecution(toolName, args, false, error instanceof Error ? error.message : String(error));
    throw error;
  }
}