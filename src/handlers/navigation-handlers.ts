import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import { withErrorHandling, withTimeout } from '../system-utils.js';
import { validateWorkflow, recordExecution, workflowValidator } from '../workflow-validation.js';
import { NavigateArgs, WaitArgs } from '../tool-definitions.js';
import { getProgressNotifier } from '../transport/progress-notifier.js';
import { getSharedEventBus } from '../transport/index.js';

// Get event bus instance
const eventBus = getSharedEventBus();

// Navigation handler with real-time progress
export async function handleNavigate(args: NavigateArgs) {
  const progressNotifier = getProgressNotifier();
  const progressToken = `navigate-${Date.now()}`;
  const tracker = progressNotifier.createTracker(progressToken);
  
  return await withWorkflowValidation('navigate', args, async () => {
    return await withErrorHandling(async () => {
      tracker.start(100, '🚀 Starting navigation...');
      
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        tracker.fail('Browser not initialized');
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { url, waitUntil = 'domcontentloaded' } = args;
      
      tracker.setProgress(10, `📍 Navigating to: ${url}`);

      // Navigate with retry logic
      let lastError: Error | null = null;
      let success = false;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          tracker.setProgress(20 + (attempt - 1) * 20, `🔄 Attempt ${attempt}/${maxRetries}...`);
          
          await withTimeout(async () => {
            await pageInstance.goto(url, {
              waitUntil: waitUntil as any,
              timeout: 60000
            });
            
            tracker.setProgress(60, '🛡️ Checking for Cloudflare...');
            // Auto-handle Cloudflare challenges if detected
            await waitForCloudflareBypass(pageInstance, tracker);
          }, 90000, 'page-navigation');

          tracker.setProgress(80, '✅ Navigation successful');
          success = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          tracker.setProgress(20 + attempt * 20, `❌ Attempt ${attempt} failed: ${lastError.message}`);

          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1);
            tracker.setProgress(25 + attempt * 20, `⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!success && lastError) {
        tracker.fail(lastError.message);
        throw lastError;
      }

      tracker.setProgress(90, '📄 Page loaded, preparing response...');

      // Publish browser state update to event bus
      try {
        eventBus.publish({
          type: 'sync:browserStateUpdated',
          data: {
            currentUrl: url,
            cookies: [],
            localStorage: {},
            viewportSize: { width: 1920, height: 1080 },
            timestamp: Date.now(),
          },
        } as any);
      } catch (error) {
        // Ignore event bus errors
      }

      const workflowMessage = '\n\n🔄 Workflow Status: Page loaded\n' +
        '  • Next step: Use get_content to analyze page content\n' +
        '  • Then: Use find_selector to locate elements\n' +
        '  • Finally: Use interaction tools (click, type)\n\n' +
        '✅ Ready for content analysis and interactions';

      tracker.complete('🎉 Navigation completed successfully');

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

// Wait handler with real-time progress
export async function handleWait(args: WaitArgs) {
  const progressNotifier = getProgressNotifier();
  const progressToken = `wait-${Date.now()}`;
  const tracker = progressNotifier.createTracker(progressToken);
  
  return await withWorkflowValidation('wait', args, async () => {
    return await withErrorHandling(async () => {
      tracker.start(100, '⏳ Starting wait operation...');
      
      const pageInstance = getPageInstance();
      if (!pageInstance) {
        tracker.fail('Browser not initialized');
        throw new Error('Browser not initialized. Call browser_init first.');
      }

      const { type, value, timeout = 30000 } = args;

      // Validate timeout parameter
      if (typeof timeout !== 'number' || isNaN(timeout) || timeout < 0) {
        tracker.fail('Invalid timeout');
        throw new Error('Timeout parameter must be a positive number');
      }

      const startTime = Date.now();
      tracker.setProgress(10, `⏳ Waiting for ${type}: ${value}`);

      try {
        switch (type) {
          case 'selector':
            tracker.setProgress(20, `🔍 Looking for selector: ${value}`);
            await pageInstance.waitForSelector(value, {
              timeout,
              visible: true
            });
            tracker.setProgress(80, '✅ Selector found');
            break;

          case 'navigation':
            tracker.setProgress(20, '🔄 Waiting for navigation...');
            await pageInstance.waitForNavigation({
              timeout,
              waitUntil: 'networkidle2'
            });
            tracker.setProgress(80, '✅ Navigation completed');
            break;

          case 'timeout':
            const waitTime = parseInt(value, 10);
            if (isNaN(waitTime) || waitTime < 0) {
              tracker.fail('Invalid wait time');
              throw new Error('Timeout value must be a number');
            }
            
            // Update progress during timeout wait
            const actualWait = Math.min(waitTime, timeout);
            const updateInterval = Math.max(100, actualWait / 20);
            let elapsed = 0;
            
            while (elapsed < actualWait) {
              await new Promise(resolve => setTimeout(resolve, updateInterval));
              elapsed += updateInterval;
              const progress = 20 + Math.round((elapsed / actualWait) * 60);
              tracker.setProgress(progress, `⏱️ Waited ${elapsed}ms / ${actualWait}ms`);
            }
            
            tracker.setProgress(80, '✅ Wait completed');
            break;

          default:
            tracker.fail(`Unknown wait type: ${type}`);
            throw new Error(`Unsupported wait type: ${type}`);
        }

        const duration = Date.now() - startTime;
        tracker.complete(`✅ Wait completed in ${duration}ms`);

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
        tracker.fail(`Wait failed after ${duration}ms`);
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
async function waitForCloudflareBypass(pageInstance: any, tracker?: any) {
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

        if (!stillChallenge) {
          tracker?.setProgress(70, '✅ No Cloudflare challenge detected');
          return; // Not a challenge page, or passed
        }
      }

      // Update progress while waiting for Cloudflare
      const elapsed = Date.now() - startTime;
      const progress = 60 + Math.round((elapsed / maxWait) * 15);
      tracker?.setProgress(progress, `🛡️ Waiting for Cloudflare... (${Math.round(elapsed/1000)}s)`);

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
    
    tracker?.setProgress(75, '⚠️ Cloudflare check timeout');
  } catch (error) {
    // Ignore bypass errors, continue to result
  }
}
