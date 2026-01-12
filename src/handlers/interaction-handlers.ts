import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import { withErrorHandling } from '../system-utils.js';
import { validateWorkflow, recordExecution, workflowValidator } from '../workflow-validation.js';
import { selfHealingLocators } from '../self-healing-locators.js';
import { ClickArgs, TypeArgs, SolveCaptchaArgs } from '../tool-definitions.js';
import { setTimeout as sleep } from 'node:timers/promises';

// Click handler
export async function handleClick(args: ClickArgs) {
  return await withWorkflowValidation('click', args, async () => {
    return await withErrorHandling(async () => {
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { selector, waitForNavigation = false } = args;

      // Try to find element using self-healing locators
      const elementResult = await selfHealingLocators.findElementWithFallbacks(
        pageInstance,
        selector
      );

      if (!elementResult) {
        const fallbackSummary = await selfHealingLocators.getFallbackSummary(pageInstance, selector);

        throw new Error(
          `Element not found: ${selector}\n\n` +
          '🔧 Self-healing locators tried multiple fallback strategies but could not find the element.\n\n' +
          '💡 Troubleshooting suggestions:\n' +
          '  • Use find_selector to locate elements by text content\n' +
          '  • Verify the selector with get_content first\n' +
          '  • Ensure the page content has been analyzed\n' +
          '  • Check if the element is dynamically loaded\n' +
          '  • Wait for the element to appear using wait tool\n\n' +
          '🔧 Workflow validation ensures:\n' +
          '  • Content was analyzed before interaction\n' +
          '  • Selector is based on current page state\n\n' +
          fallbackSummary
        );
      }

      const { element, usedSelector, strategy } = elementResult;
      let strategyMessage = '';

      if (strategy !== 'primary') {
        strategyMessage = `\n🔄 Self-healing: Used ${strategy} fallback selector: ${usedSelector}`;
        // console.(`Self-healing click: Primary selector '${selector}' failed, used '${usedSelector}' (${strategy})`);
      }

      try {
        // Wait for element to be ready
        await pageInstance.waitForSelector(usedSelector, { timeout: 5000 });

        // Check element visibility and interaction options
        const boundingBox = await element.boundingBox();

        if (!boundingBox) {
          // console.(`Element ${usedSelector} has no bounding box, attempting JavaScript click`);
          await pageInstance.$eval(usedSelector, (el: any) => el.click());
        } else {
          if (waitForNavigation) {
            await Promise.all([
              pageInstance.waitForNavigation({ waitUntil: 'networkidle2' }),
              pageInstance.click(usedSelector),
            ]);
          } else {
            await pageInstance.click(usedSelector);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Clicked element: ${usedSelector}${strategyMessage}\n\n✅ Interaction completed successfully through validated workflow`,
            },
          ],
        };

      } catch (clickError) {
        // Final fallback: JavaScript click
        try {
          await pageInstance.$eval(usedSelector, (el: any) => el.click());
          return {
            content: [
              {
                type: 'text',
                text: `Clicked element using JavaScript fallback: ${usedSelector}${strategyMessage}\n\n✅ Interaction completed successfully through validated workflow`,
              },
            ],
          };
        } catch (jsClickError) {
          throw new Error(
            `Click failed on element found by self-healing locators: ${usedSelector}. ` +
            `Original error: ${clickError instanceof Error ? clickError.message : String(clickError)}. ` +
            `JavaScript fallback error: ${jsClickError instanceof Error ? jsClickError.message : String(jsClickError)}`
          );
        }
      }
    }, 'Failed to click element');
  });
}

// Type handler
export async function handleType(args: TypeArgs) {
  return await withWorkflowValidation('type', args, async () => {
    return await withErrorHandling(async () => {
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { selector, text, delay = 100 } = args;

      // Try to find element using self-healing locators
      const elementResult = await selfHealingLocators.findElementWithFallbacks(
        pageInstance,
        selector
      );

      if (!elementResult) {
        const fallbackSummary = await selfHealingLocators.getFallbackSummary(pageInstance, selector);

        throw new Error(
          `Input element not found: ${selector}\n\n` +
          '🔧 Self-healing locators tried multiple fallback strategies but could not find the input element.\n\n' +
          '💡 Troubleshooting suggestions:\n' +
          '  • Use find_selector to locate input elements by text content or labels\n' +
          '  • Verify the selector with get_content first\n' +
          '  • Check for input elements inside forms or containers\n' +
          '  • Ensure the input field is visible and enabled\n\n' +
          fallbackSummary
        );
      }

      const { element, usedSelector, strategy } = elementResult;
      let strategyMessage = '';

      if (strategy !== 'primary') {
        strategyMessage = `\n🔄 Self-healing: Used ${strategy} fallback selector: ${usedSelector}`;
        // console.(`Self-healing type: Primary selector '${selector}' failed, used '${usedSelector}' (${strategy})`);
      }

      try {
        // Wait for element to be ready and interactable
        await pageInstance.waitForSelector(usedSelector, { timeout: 5000 });

        // Focus on the element first
        await element.focus();

        // Clear existing content
        await pageInstance.evaluate((sel: string) => {
          const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
          if (el) {
            el.select();
            el.value = '';
          }
        }, usedSelector);

        // Type the new text
        await pageInstance.type(usedSelector, text, { delay });

        return {
          content: [
            {
              type: 'text',
              text: `Typed text into: ${usedSelector}${strategyMessage}\n\n✅ Text input completed successfully through validated workflow`,
            },
          ],
        };

      } catch (typeError) {
        // Fallback: Direct value assignment
        try {
          await pageInstance.evaluate((sel: string, inputText: string) => {
            const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
            if (el) {
              el.value = inputText;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, usedSelector, text);

          return {
            content: [
              {
                type: 'text',
                text: `Typed text using JavaScript fallback: ${usedSelector}${strategyMessage}\n\n✅ Text input completed successfully through validated workflow`,
              },
            ],
          };

        } catch (fallbackError) {
          throw new Error(
            `Type operation failed on element found by self-healing locators: ${usedSelector}. ` +
            `Original error: ${typeError instanceof Error ? typeError.message : String(typeError)}. ` +
            `JavaScript fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
          );
        }
      }
    }, 'Failed to type text');
  });
}

// Solve captcha handler - Enhanced with actual detection and graceful handling
export async function handleSolveCaptcha(args: SolveCaptchaArgs) {
  return await withErrorHandling(async () => {
    const pageInstance = getPageInstance();
    if (!pageInstance) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    const { type } = args;
    const timeout = 30000; // 30 second timeout

    try {
      // Auto-detect or use provided type
      let detectedType = type;
      if (!detectedType) {
        detectedType = await pageInstance.evaluate(() => {
          if (document.querySelector('.g-recaptcha, [data-sitekey]')) return 'recaptcha';
          if (document.querySelector('.h-captcha, [data-hcaptcha-sitekey]')) return 'hCaptcha';
          if (document.querySelector('.cf-turnstile, [data-turnstile-sitekey]')) return 'turnstile';
          return 'unknown';
        });
      }

      // Turnstile - handled automatically by brave-real-browser
      if (detectedType === 'turnstile') {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          const token = await pageInstance.evaluate(() => {
            const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
            return input?.value || null;
          });
          if (token && token.length > 20) {
            return {
              content: [{
                type: 'text',
                text: `✅ Turnstile captcha solved automatically by Brave anti-detection.\nToken received (${token.length} chars)`,
              }],
            };
          }
          await sleep(1000);
        }
        return {
          content: [{
            type: 'text',
            text: `⚠️ Turnstile captcha detected but auto-solve timed out after ${timeout / 1000}s. The captcha may require manual intervention.`,
          }],
        };
      }

      // reCAPTCHA - try clicking checkbox
      if (detectedType === 'recaptcha') {
        try {
          const frames = pageInstance.frames();
          const recaptchaFrame = frames.find((f: any) => f.url().includes('recaptcha'));
          if (recaptchaFrame) {
            const checkbox = await recaptchaFrame.$('.recaptcha-checkbox-border');
            if (checkbox) {
              await checkbox.click();
              await sleep(2000);
              const checked = await recaptchaFrame.evaluate(() => {
                return document.querySelector('.recaptcha-checkbox-checked') !== null;
              });
              if (checked) {
                return {
                  content: [{
                    type: 'text',
                    text: `✅ reCAPTCHA checkbox clicked successfully. Verification may continue automatically.`,
                  }],
                };
              }
            }
          }
        } catch (frameError) {
          // Frame access failed, return graceful message
        }
        return {
          content: [{
            type: 'text',
            text: `⚠️ reCAPTCHA detected. Attempted checkbox click. Check page for challenge status.`,
          }],
        };
      }

      // hCaptcha
      if (detectedType === 'hCaptcha') {
        try {
          const frames = pageInstance.frames();
          const hcaptchaFrame = frames.find((f: any) => f.url().includes('hcaptcha'));
          if (hcaptchaFrame) {
            const checkbox = await hcaptchaFrame.$('#checkbox');
            if (checkbox) {
              await checkbox.click();
              await sleep(2000);
              return {
                content: [{
                  type: 'text',
                  text: `✅ hCaptcha checkbox clicked. Check page for challenge status.`,
                }],
              };
            }
          }
        } catch (frameError) {
          // Frame access failed
        }
        return {
          content: [{
            type: 'text',
            text: `⚠️ hCaptcha detected. Attempted interaction. Check page for status.`,
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: `ℹ️ Captcha type: ${detectedType}. Brave anti-detection features are active. Check page for captcha status.`,
        }],
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: 'text',
          text: `⚠️ Captcha handling completed with warning: ${errorMessage}\nBrave anti-detection is still active.`,
        }],
      };
    }
  }, 'Failed to solve captcha');
}


// Random scroll handler
export async function handleRandomScroll() {
  return await withErrorHandling(async () => {
    const pageInstance = getPageInstance();
    if (!pageInstance) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    await randomScroll(pageInstance);

    return {
      content: [
        {
          type: 'text',
          text: 'Performed random scrolling with natural timing',
        },
      ],
    };
  }, 'Failed to perform random scrolling');
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

/**
 * Performs random scrolling to simulate human behavior
 */
async function randomScroll(page: any) {
  try {
    await page.evaluate(async () => {
      const distance = 100 + Math.random() * 500; // Random distance
      const delay = 100 + Math.random() * 400; // Random delay

      // Scroll down
      window.scrollBy({
        top: distance,
        behavior: 'smooth'
      });

      await new Promise(resolve => setTimeout(resolve, delay));

      // Occasionally scroll up a bit
      if (Math.random() < 0.3) {
        window.scrollBy({
          top: -distance / 2,
          behavior: 'smooth'
        });
      }
    });
  } catch (error) {
    // console.('Random scroll failed (non-fatal):', error);
  }
}
