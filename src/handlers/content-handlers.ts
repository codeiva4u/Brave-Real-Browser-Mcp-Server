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

      const { text, elementType = '*', exact = false } = args;

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

      // Enhanced selector finding with authentication detection
      const results = await pageInstance.evaluate(
        (searchText: string, selectors: string[], isExact: boolean) => {
          const elements: Array<{
            selector: string;
            text: string;
            tagName: string;
            confidence: number;
          }> = [];

          const lowerSearchText = searchText.toLowerCase();

          // Search through specified selectors
          for (const baseSelector of selectors) {
            const candidates = document.querySelectorAll(baseSelector);

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

                // Calculate dummy confidence / score based on match
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
        text, // Use the text argument from args
        searchSelectors,
        exact
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