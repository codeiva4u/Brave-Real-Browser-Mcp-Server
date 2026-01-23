import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import { withErrorHandling, withTimeout } from '../system-utils.js';
import { validateWorkflow, recordExecution, workflowValidator } from '../workflow-validation.js';
import { NavigateArgs, WaitArgs } from '../tool-definitions.js';
import { getProgressNotifier } from '../transport/progress-notifier.js';
import { getSharedEventBus } from '../transport/index.js';

// Get event bus instance
const eventBus = getSharedEventBus();

// Helper to detect API endpoints
function isApiEndpoint(url: string): boolean {
  return /\/api\/|\.json(\?|$)|\?.*=.*&|\/v\d+\//.test(url);
}

// Interface for API response
interface ApiResponse {
  status: number;
  contentType: string | null;
  data: string;
}

// Navigation handler with real-time progress and advanced features
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

      const { 
        url, 
        waitUntil = 'domcontentloaded',
        blockResources,
        customHeaders,
        referrer,
        waitForSelector,
        waitForContent,
        scrollToBottom,
        randomDelay,
        bypassCSP,
        timeout = 60000,
        retries = 3
      } = args;

      tracker.setProgress(5, `📍 Preparing to navigate to: ${url}`);

      // ============================================================
      // STEP 1: Setup request interception for resource blocking
      // ============================================================
      let interceptorEnabled = false;
      const blockedTypes = new Set(blockResources || []);
      
      if (blockedTypes.size > 0) {
        tracker.setProgress(8, `🚫 Setting up resource blocking: ${Array.from(blockedTypes).join(', ')}`);
        try {
          await pageInstance.setRequestInterception(true);
          interceptorEnabled = true;
          
          pageInstance.on('request', (request: any) => {
            const resourceType = request.resourceType();
            if (blockedTypes.has(resourceType)) {
              request.abort();
            } else {
              request.continue();
            }
          });
        } catch (e) {
          // Interception already enabled or not supported
        }
      }

      // ============================================================
      // STEP 2: Set custom headers if provided
      // ============================================================
      if (customHeaders && Object.keys(customHeaders).length > 0) {
        tracker.setProgress(10, '📝 Setting custom headers...');
        try {
          await pageInstance.setExtraHTTPHeaders(customHeaders);
        } catch (e) {
          // Ignore header setting errors
        }
      }

      // ============================================================
      // STEP 3: Bypass CSP if requested
      // ============================================================
      if (bypassCSP) {
        tracker.setProgress(12, '🔓 Bypassing Content Security Policy...');
        try {
          await pageInstance.setBypassCSP(true);
        } catch (e) {
          // CSP bypass not supported
        }
      }

      // ============================================================
      // STEP 4: Add random human-like delay
      // ============================================================
      if (randomDelay) {
        const delay = 100 + Math.random() * 400; // 100-500ms
        tracker.setProgress(14, `⏳ Human-like delay: ${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
      }

      tracker.setProgress(15, `📍 Navigating to: ${url}`);

      // ============================================================
      // STEP 5: Navigate with retry logic
      // ============================================================
      let lastError: Error | null = null;
      let success = false;
      const maxRetries = retries;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          tracker.setProgress(15 + (attempt - 1) * 15, `🔄 Attempt ${attempt}/${maxRetries}...`);

          await withTimeout(async () => {
            const navigationOptions: any = {
              waitUntil: waitUntil as any,
              timeout: timeout
            };
            
            // Add referrer if provided
            if (referrer) {
              navigationOptions.referer = referrer;
            }

            await pageInstance.goto(url, navigationOptions);

            tracker.setProgress(50, '🛡️ Checking for Cloudflare...');
            // Auto-handle Cloudflare challenges if detected
            await waitForCloudflareBypass(pageInstance, tracker);
          }, timeout + 30000, 'page-navigation');

          tracker.setProgress(60, '✅ Navigation successful');
          success = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Check if this is an API endpoint that failed with ERR_ABORTED
          const isAborted = lastError.message.includes('ERR_ABORTED') || 
                           lastError.message.includes('net::ERR_');
          
          if (isAborted && isApiEndpoint(url)) {
            // Fallback: Use fetch to get API response directly
            tracker.setProgress(50, '📡 Detected API endpoint, using fetch fallback...');
            try {
              const apiResponse = await pageInstance.evaluate(async (apiUrl: string) => {
                const response = await fetch(apiUrl);
                const text = await response.text();
                return {
                  status: response.status,
                  contentType: response.headers.get('content-type'),
                  data: text
                };
              }, url) as ApiResponse;
              
              // Cleanup interception
              if (interceptorEnabled) {
                try { await pageInstance.setRequestInterception(false); } catch {}
              }
              
              tracker.complete('📡 API endpoint fetched successfully');
              
              return {
                content: [
                  {
                    type: 'text',
                    text: `API Response from ${url}\n\nStatus: ${apiResponse.status}\nContent-Type: ${apiResponse.contentType}\n\nData:\n${apiResponse.data}`,
                  },
                ],
              };
            } catch (fetchError) {
              // Fetch also failed, continue with normal retry
              tracker.setProgress(55, '❌ Fetch fallback failed, retrying navigation...');
            }
          }
          
          tracker.setProgress(15 + attempt * 15, `❌ Attempt ${attempt} failed: ${lastError.message}`);

          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1);
            tracker.setProgress(20 + attempt * 15, `⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!success && lastError) {
        // Cleanup interception
        if (interceptorEnabled) {
          try { await pageInstance.setRequestInterception(false); } catch {}
        }
        tracker.fail(lastError.message);
        throw lastError;
      }

      // ============================================================
      // STEP 6: Wait for specific selector if requested
      // ============================================================
      if (waitForSelector) {
        tracker.setProgress(65, `🔍 Waiting for selector: ${waitForSelector}`);
        try {
          await pageInstance.waitForSelector(waitForSelector, { timeout: 10000, visible: true });
          tracker.setProgress(70, '✅ Selector found');
        } catch (e) {
          tracker.setProgress(70, `⚠️ Selector not found: ${waitForSelector}`);
        }
      }

      // ============================================================
      // STEP 7: Wait for specific content if requested
      // ============================================================
      if (waitForContent) {
        tracker.setProgress(72, `📝 Waiting for content: "${waitForContent.substring(0, 30)}..."`);
        try {
          await pageInstance.waitForFunction(
            (text: string) => document.body?.innerText?.includes(text),
            { timeout: 10000 },
            waitForContent
          );
          tracker.setProgress(75, '✅ Content found');
        } catch (e) {
          tracker.setProgress(75, `⚠️ Content not found: "${waitForContent.substring(0, 30)}..."`);
        }
      }

      // ============================================================
      // STEP 8: Auto-scroll to trigger lazy loading
      // ============================================================
      if (scrollToBottom) {
        tracker.setProgress(77, '📜 Auto-scrolling to trigger lazy loading...');
        try {
          await pageInstance.evaluate(async () => {
            const scrollStep = window.innerHeight;
            const scrollDelay = 200;
            let totalScrolled = 0;
            const maxScroll = Math.min(document.body.scrollHeight, 10000);

            while (totalScrolled < maxScroll) {
              window.scrollBy(0, scrollStep);
              totalScrolled += scrollStep;
              await new Promise(r => setTimeout(r, scrollDelay));
            }

            // Scroll back to top
            window.scrollTo(0, 0);
          });
          
          // Wait for lazy content to load
          await new Promise(r => setTimeout(r, 1000));
          tracker.setProgress(82, '✅ Auto-scroll completed');
        } catch (e) {
          tracker.setProgress(82, '⚠️ Auto-scroll failed');
        }
      }

      // ============================================================
      // STEP 9: Cleanup and prepare response
      // ============================================================
      
      // Disable request interception if it was enabled
      if (interceptorEnabled) {
        try {
          await pageInstance.setRequestInterception(false);
        } catch {}
      }

      tracker.setProgress(85, '📄 Page loaded, preparing response...');

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

      // Get page info for response
      let pageInfo = '';
      try {
        const title = await pageInstance.title();
        const finalUrl = pageInstance.url();
        pageInfo = `\n📄 Title: ${title}\n🔗 Final URL: ${finalUrl}`;
      } catch {}

      const advancedOptionsUsed: string[] = [];
      if (blockResources?.length) advancedOptionsUsed.push(`Blocked: ${blockResources.join(', ')}`);
      if (customHeaders) advancedOptionsUsed.push('Custom headers set');
      if (referrer) advancedOptionsUsed.push(`Referrer: ${referrer}`);
      if (waitForSelector) advancedOptionsUsed.push(`Waited for: ${waitForSelector}`);
      if (waitForContent) advancedOptionsUsed.push(`Waited for content`);
      if (scrollToBottom) advancedOptionsUsed.push('Auto-scrolled');
      if (randomDelay) advancedOptionsUsed.push('Human delay added');
      if (bypassCSP) advancedOptionsUsed.push('CSP bypassed');

      const advancedInfo = advancedOptionsUsed.length > 0 
        ? `\n\n⚡ Advanced options: ${advancedOptionsUsed.join(' | ')}`
        : '';

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
            text: `Successfully navigated to ${url}${pageInfo}${advancedInfo}${workflowMessage}`,
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
      tracker?.setProgress(progress, `🛡️ Waiting for Cloudflare... (${Math.round(elapsed / 1000)}s)`);

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
