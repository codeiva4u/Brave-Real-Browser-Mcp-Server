import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import { withErrorHandling } from '../system-utils.js';
import { validateWorkflow, recordExecution, workflowValidator } from '../workflow-validation.js';
import { selfHealingLocators } from '../self-healing-locators.js';
import { ClickArgs, TypeArgs, SolveCaptchaArgs } from '../tool-definitions.js';
import { setTimeout as sleep } from 'node:timers/promises';
import { getProgressNotifier } from '../transport/progress-notifier.js';

// Click handler with real-time progress
export async function handleClick(args: ClickArgs) {
  const progressNotifier = getProgressNotifier();
  const progressToken = `click-${Date.now()}`;
  const tracker = progressNotifier.createTracker(progressToken);

  return await withWorkflowValidation('click', args, async () => {
    return await withErrorHandling(async () => {
      tracker.start(100, '🖱️ Starting click operation...');

      const pageInstance = getPageInstance();
      if (!pageInstance) {
        tracker.fail('Browser not initialized');
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { selector, waitForNavigation = false } = args;

      tracker.setProgress(10, `🔍 Finding element: ${selector}`);

      // Try to find element using self-healing locators
      const elementResult = await selfHealingLocators.findElementWithFallbacks(
        pageInstance,
        selector
      );

      if (!elementResult) {
        tracker.fail('Element not found');
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

      tracker.setProgress(40, '✅ Element found, preparing to click...');

      const { element, usedSelector, strategy } = elementResult;
      let strategyMessage = '';

      if (strategy !== 'primary') {
        strategyMessage = `\n🔄 Self-healing: Used ${strategy} fallback selector: ${usedSelector}`;
        tracker.setProgress(50, `🔄 Using fallback selector: ${usedSelector}`);
      }

      // Text-based strategies have special __TEXT__: prefix or are strategy-identified
      // These have invalid CSS selectors, so we skip waitForSelector and use element directly
      const isTextBasedStrategy = ['text-content', 'implicit-text-match', 'text', 'text-exact', 'text-partial', 'tag-text'].includes(strategy) ||
        usedSelector.startsWith('__TEXT__:');

      // Clean display selector for output (remove __TEXT__: prefix)
      const displaySelector = usedSelector.startsWith('__TEXT__:')
        ? usedSelector.replace('__TEXT__:', 'text:')
        : usedSelector;


      try {
        tracker.setProgress(60, '⏳ Waiting for element to be ready...');

        // Only wait for selector if it's a valid CSS selector (not text-based)
        if (!isTextBasedStrategy) {
          await pageInstance.waitForSelector(usedSelector, { timeout: 5000 });
        }

        // Check element visibility and interaction options
        const boundingBox = await element.boundingBox();

        if (!boundingBox) {
          tracker.setProgress(70, '🔧 No bounding box, using JavaScript click...');
          // For text-based strategies, use element.evaluate to click
          if (isTextBasedStrategy) {
            await element.evaluate((el: any) => el.click());
          } else {
            await pageInstance.$eval(usedSelector, (el: any) => el.click());
          }
        } else {
          tracker.setProgress(70, '🖱️ Clicking element...');
          if (waitForNavigation) {
            tracker.setProgress(75, '🔄 Clicking and waiting for navigation...');
            await Promise.all([
              pageInstance.waitForNavigation({ waitUntil: 'networkidle2' }),
              element.click(), // Use element.click() for all strategies
            ]);
            tracker.setProgress(90, '✅ Navigation completed');
          } else {
            // Use element.click() directly - works for all strategies
            await element.click();
          }
        }

        tracker.complete('🎉 Click completed successfully');


        return {
          content: [
            {
              type: 'text',
              text: `Clicked element: ${usedSelector}${strategyMessage}\n\n✅ Interaction completed successfully through validated workflow`,
            },
          ],
        };

      } catch (clickError) {
        tracker.setProgress(85, '⚠️ Click failed, trying JavaScript fallback...');
        // Final fallback: JavaScript click
        try {
          // For text-based strategies, use element.evaluate instead of $eval
          if (isTextBasedStrategy) {
            await element.evaluate((el: any) => el.click());
          } else {
            await pageInstance.$eval(usedSelector, (el: any) => el.click());
          }
          tracker.complete('🎉 Click completed via JavaScript fallback');

          return {
            content: [
              {
                type: 'text',
                text: `Clicked element using JavaScript fallback: ${usedSelector}${strategyMessage}\n\n✅ Interaction completed successfully through validated workflow`,
              },
            ],
          };
        } catch (jsClickError) {
          tracker.fail('Click failed completely');
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

// Type handler with real-time progress
export async function handleType(args: TypeArgs) {
  const progressNotifier = getProgressNotifier();
  const progressToken = `type-${Date.now()}`;
  const tracker = progressNotifier.createTracker(progressToken);

  return await withWorkflowValidation('type', args, async () => {
    return await withErrorHandling(async () => {
      tracker.start(100, '⌨️ Starting type operation...');

      const pageInstance = getPageInstance();
      if (!pageInstance) {
        tracker.fail('Browser not initialized');
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { selector, text, delay = 100 } = args;

      tracker.setProgress(10, `🔍 Finding input element: ${selector}`);

      // Try to find element using self-healing locators
      const elementResult = await selfHealingLocators.findElementWithFallbacks(
        pageInstance,
        selector
      );

      if (!elementResult) {
        tracker.fail('Input element not found');
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

      tracker.setProgress(30, '✅ Input element found');

      const { element, usedSelector, strategy } = elementResult;
      let strategyMessage = '';

      if (strategy !== 'primary') {
        strategyMessage = `\n🔄 Self-healing: Used ${strategy} fallback selector: ${usedSelector}`;
        tracker.setProgress(35, `🔄 Using fallback selector: ${usedSelector}`);
      }

      try {
        tracker.setProgress(40, '⏳ Waiting for element to be ready...');
        // Wait for element to be ready and interactable
        await pageInstance.waitForSelector(usedSelector, { timeout: 5000 });

        tracker.setProgress(50, '🎯 Focusing on element...');
        // Focus on the element first
        await element.focus();

        tracker.setProgress(55, '🗑️ Clearing existing content...');
        // Clear existing content
        await pageInstance.evaluate((sel: string) => {
          const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
          if (el) {
            el.select();
            el.value = '';
          }
        }, usedSelector);

        tracker.setProgress(60, `⌨️ Typing ${text.length} characters...`);

        // Type with progress updates
        const totalChars = text.length;
        for (let i = 0; i < totalChars; i++) {
          await pageInstance.type(usedSelector, text[i], { delay });

          // Update progress every 10 characters
          if (i % 10 === 0 || i === totalChars - 1) {
            const typeProgress = 60 + Math.round((i / totalChars) * 30);
            tracker.setProgress(typeProgress, `⌨️ Typed ${i + 1}/${totalChars} characters`);
          }
        }

        tracker.complete('🎉 Text input completed successfully');

        return {
          content: [
            {
              type: 'text',
              text: `Typed text into: ${usedSelector}${strategyMessage}\n\n✅ Text input completed successfully through validated workflow`,
            },
          ],
        };

      } catch (typeError) {
        tracker.setProgress(85, '⚠️ Type failed, trying JavaScript fallback...');
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

          tracker.complete('🎉 Text input completed via JavaScript fallback');

          return {
            content: [
              {
                type: 'text',
                text: `Typed text using JavaScript fallback: ${usedSelector}${strategyMessage}\n\n✅ Text input completed successfully through validated workflow`,
              },
            ],
          };

        } catch (fallbackError) {
          tracker.fail('Type operation failed completely');
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

// Solve captcha handler with real-time progress
export async function handleSolveCaptcha(args: SolveCaptchaArgs) {
  const progressNotifier = getProgressNotifier();
  const progressToken = `captcha-${Date.now()}`;
  const tracker = progressNotifier.createTracker(progressToken);

  return await withErrorHandling(async () => {
    tracker.start(100, '🔐 Starting captcha detection...');

    const pageInstance = getPageInstance();
    if (!pageInstance) {
      tracker.fail('Browser not initialized');
      throw new Error('Browser not initialized. Call browser_init first.');
    }

    const { type } = args;
    const timeout = 30000; // 30 second timeout

    try {
      tracker.setProgress(10, '🔍 Detecting captcha type...');

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

      tracker.setProgress(20, `🎯 Detected captcha: ${detectedType}`);

      // Turnstile - handled automatically by brave-real-browser
      if (detectedType === 'turnstile') {
        tracker.setProgress(30, '🛡️ Solving Turnstile captcha...');
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          const elapsed = Date.now() - startTime;
          const progress = 30 + Math.round((elapsed / timeout) * 50);
          tracker.setProgress(progress, `⏳ Waiting for Turnstile... (${Math.round(elapsed / 1000)}s)`);

          const token = await pageInstance.evaluate(() => {
            const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
            return input?.value || null;
          });
          if (token && token.length > 20) {
            tracker.complete('🎉 Turnstile captcha solved!');
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
 * Performs ADVANCED random scrolling with human-like behavior
 * Features: Bezier curves, variable speeds, micro-pauses, overshoot correction
 */
async function randomScroll(page: any) {
  try {
    await page.evaluate(async () => {
      // Human-like scroll with bezier curve easing
      const bezierEase = (t: number): number => {
        // Cubic bezier approximation of natural human deceleration
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const scrollWithBezier = async (distance: number, duration: number) => {
        const start = window.scrollY;
        const startTime = performance.now();

        return new Promise<void>((resolve) => {
          const step = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = bezierEase(progress);

            window.scrollTo(0, start + distance * eased);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(step);
        });
      };

      // Variable scroll parameters (human-like variation)
      const baseDistance = 150 + Math.random() * 400;
      const baseDuration = 400 + Math.random() * 600;

      // Main scroll with natural timing
      await scrollWithBezier(baseDistance, baseDuration);

      // Micro-pause (humans pause briefly after scrolling)
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

      // 40% chance: Small overshoot correction (very human)
      if (Math.random() < 0.4) {
        const overshoot = 20 + Math.random() * 50;
        await scrollWithBezier(-overshoot, 200 + Math.random() * 200);
      }

      // 30% chance: Scroll back up slightly (reading behavior)
      if (Math.random() < 0.3) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        await scrollWithBezier(-baseDistance * (0.2 + Math.random() * 0.3), 300 + Math.random() * 300);
      }

      // 20% chance: Multiple small scrolls (scanning behavior)
      if (Math.random() < 0.2) {
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
          await scrollWithBezier(50 + Math.random() * 100, 200 + Math.random() * 200);
        }
      }
    });
  } catch (error) {
    // Random scroll failed (non-fatal)
  }
}
