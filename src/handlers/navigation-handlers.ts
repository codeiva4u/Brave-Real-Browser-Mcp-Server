import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import { withErrorHandling, withTimeout } from '../system-utils.js';
import { validateWorkflow, recordExecution, workflowValidator } from '../workflow-validation.js';
import { NavigateArgs, WaitArgs } from '../tool-definitions.js';

// Navigation handler
export async function handleNavigate(args: NavigateArgs) {
  return await withWorkflowValidation('navigate', args, async () => {
    return await withErrorHandling(async () => {
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { url, waitUntil = 'domcontentloaded' } = args;

      // console.(`🔄 Navigating to: ${url}`);

      // Navigate with retry logic
      let lastError: Error | null = null;
      let success = false;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await withTimeout(async () => {
            await pageInstance.goto(url, {
              waitUntil: waitUntil as any,
              timeout: 60000
            });

            // Auto-handle Cloudflare challenges if detected
            await waitForCloudflareBypass(pageInstance);
          }, 90000, 'page-navigation');

          // console.(`✅ Navigation successful to: ${url}`);
          success = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          // console.(`❌ Navigation attempt ${attempt}/${maxRetries} failed:`, lastError.message);

          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1);
            // console.(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!success && lastError) {
        throw lastError;
      }

      const workflowMessage = '\n\n🔄 Workflow Status: Page loaded\n' +
        '  • Next step: Use get_content to analyze page content\n' +
        '  • Then: Use find_selector to locate elements\n' +
        '  • Finally: Use interaction tools (click, type)\n\n' +
        '✅ Ready for content analysis and interactions';

      return {
        content: [
          {
            type: 'text',
            text: `Successfully navigated to ${url}${workflowMessage}`,
          },
        ],
      };
    }, 'Failed to navigate');
  });
}

// Wait handler with multiple wait types
export async function handleWait(args: WaitArgs) {
  return await withWorkflowValidation('wait', args, async () => {
    return await withErrorHandling(async () => {
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { type, value, timeout = 30000 } = args;

      // Validate timeout parameter
      if (typeof timeout !== 'number' || isNaN(timeout) || timeout < 0) {
        throw new Error('Timeout parameter must be a positive number');
      }

      const startTime = Date.now();

      // console.(`⏳ Waiting for ${type}: ${value} (timeout: ${timeout}ms)`);

      try {
        switch (type) {
          case 'selector':
            await pageInstance.waitForSelector(value, {
              timeout,
              visible: true
            });
            break;

          case 'navigation':
            await pageInstance.waitForNavigation({
              timeout,
              waitUntil: 'networkidle2'
            });
            break;

          case 'timeout':
            const waitTime = parseInt(value, 10);
            if (isNaN(waitTime) || waitTime < 0) {
              throw new Error('Timeout value must be a number');
            }
            await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, timeout)));
            break;

          default:
            throw new Error(`Unsupported wait type: ${type}`);
        }

        const duration = Date.now() - startTime;
        // console.(`✅ Wait completed in ${duration}ms`);

        return {
          content: [
            {
              type: 'text',
              text: `Wait completed successfully for ${type}: ${value} (${duration}ms)`,
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        // console.(`❌ Wait failed after ${duration}ms:`, error);
        throw error;
      }
    }, 'Wait operation failed');
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

/**
 * Helper to wait for Cloudflare/Turnstile challenges to resolve
 */
async function waitForCloudflareBypass(pageInstance: any) {
  try {
    // Initial stable wait
    await new Promise(resolve => setTimeout(resolve, 2000));

    const maxWait = 60000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const isChallenge = await pageInstance.evaluate(() => {
        const bodyText = (document.body?.innerText || '').toLowerCase();
        // Strict checks to avoid false positives on normal sites
        const hasChallengeText = bodyText.includes('verifying you are human') ||
          bodyText.includes('checking your browser before accessing') ||
          bodyText.includes('just a moment');

        // Also check for challenge iframes
        const hasChallengeFrames = !!document.querySelector('iframe[src*="cloudflare"]') ||
          !!document.querySelector('iframe[src*="turnstile"]');

        return hasChallengeText && hasChallengeFrames;
      });

      if (!isChallenge) {
        // Double check state remains stable
        await new Promise(resolve => setTimeout(resolve, 1500));
        const stillChallenge = await pageInstance.evaluate(() => {
          const bodyText = (document.body?.innerText || '').toLowerCase();
          return bodyText.includes('verifying you are human');
        });

        if (!stillChallenge) return; // Not a challenge page, or passed
      }

      // Simulate human behavior: Random small mouse movements
      try {
        // Move mouse slightly to simulate presence
        await pageInstance.mouse.move(
          100 + Math.random() * 200,
          100 + Math.random() * 200,
          { steps: 5 }
        );
      } catch (e) {
        // Ignore mouse errors (e.g. if target closed)
      }

      // Still blocked, wait
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    // Ignore bypass errors, continue to result
  }
}
