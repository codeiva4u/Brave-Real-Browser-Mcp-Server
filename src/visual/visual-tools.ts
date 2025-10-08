// Visual & Screenshot Tools Module
// Screenshots, PDF Generation, Visual Tools

type Page = any;

/**
 * Full Page Screenshot
 * Complete page का screenshot
 */
export async function takeFullPageScreenshot(
  page: Page,
  options?: {
    path?: string;
    quality?: number;
    type?: 'png' | 'jpeg';
  }
): Promise<{ success: boolean; path?: string; buffer?: Buffer; message: string }> {
  try {
    const screenshotOptions: any = {
      fullPage: true,
      type: options?.type || 'png'
    };
    
    if (options?.quality && options.type === 'jpeg') {
      screenshotOptions.quality = options.quality;
    }
    
    if (options?.path) {
      screenshotOptions.path = options.path;
      await page.screenshot(screenshotOptions);
      return {
        success: true,
        path: options.path,
        message: 'Full page screenshot saved successfully'
      };
    } else {
      const buffer = await page.screenshot(screenshotOptions);
      return {
        success: true,
        buffer,
        message: 'Full page screenshot captured'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Screenshot failed: ${error.message}`
    };
  }
}

/**
 * Element Screenshot
 * Specific element की image
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  options?: {
    path?: string;
    padding?: number;
  }
): Promise<{ success: boolean; path?: string; buffer?: Buffer; message: string }> {
  try {
    const element = await page.$(selector);
    if (!element) {
      return {
        success: false,
        message: `Element not found: ${selector}`
      };
    }
    
    const screenshotOptions: any = {};
    
    if (options?.path) {
      screenshotOptions.path = options.path;
    }
    
    if (options?.padding) {
      // Add padding around element
      const box = await element.boundingBox();
      if (box) {
        screenshotOptions.clip = {
          x: Math.max(0, box.x - options.padding),
          y: Math.max(0, box.y - options.padding),
          width: box.width + (options.padding * 2),
          height: box.height + (options.padding * 2)
        };
      }
    }
    
    const buffer = await element.screenshot(screenshotOptions);
    
    return {
      success: true,
      path: options?.path,
      buffer: options?.path ? undefined : buffer,
      message: 'Element screenshot captured successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Element screenshot failed: ${error.message}`
    };
  }
}

/**
 * PDF Generation
 * Webpage को PDF में convert करना
 */
export async function generatePDF(
  page: Page,
  options?: {
    path?: string;
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    printBackground?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
  }
): Promise<{ success: boolean; path?: string; buffer?: Buffer; message: string }> {
  try {
    const pdfOptions: any = {
      format: options?.format || 'A4',
      landscape: options?.landscape || false,
      printBackground: options?.printBackground !== false,
      margin: options?.margin || {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    };
    
    if (options?.headerTemplate) {
      pdfOptions.headerTemplate = options.headerTemplate;
      pdfOptions.displayHeaderFooter = true;
    }
    
    if (options?.footerTemplate) {
      pdfOptions.footerTemplate = options.footerTemplate;
      pdfOptions.displayHeaderFooter = true;
    }
    
    if (options?.path) {
      pdfOptions.path = options.path;
      await page.pdf(pdfOptions);
      return {
        success: true,
        path: options.path,
        message: 'PDF generated successfully'
      };
    } else {
      const buffer = await page.pdf(pdfOptions);
      return {
        success: true,
        buffer,
        message: 'PDF generated'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `PDF generation failed: ${error.message}`
    };
  }
}

/**
 * Viewport Screenshot
 * Current viewport का screenshot
 */
export async function takeViewportScreenshot(
  page: Page,
  options?: {
    path?: string;
    quality?: number;
    type?: 'png' | 'jpeg';
  }
): Promise<{ success: boolean; path?: string; buffer?: Buffer; message: string }> {
  try {
    const screenshotOptions: any = {
      fullPage: false,
      type: options?.type || 'png'
    };
    
    if (options?.quality && options.type === 'jpeg') {
      screenshotOptions.quality = options.quality;
    }
    
    if (options?.path) {
      screenshotOptions.path = options.path;
      await page.screenshot(screenshotOptions);
      return {
        success: true,
        path: options.path,
        message: 'Viewport screenshot saved'
      };
    } else {
      const buffer = await page.screenshot(screenshotOptions);
      return {
        success: true,
        buffer,
        message: 'Viewport screenshot captured'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Screenshot failed: ${error.message}`
    };
  }
}

/**
 * Visual Comparison Helper
 * Screenshots compare करने के लिए metadata
 */
export interface ScreenshotMetadata {
  timestamp: number;
  url: string;
  viewport: {
    width: number;
    height: number;
  };
  path?: string;
}

export async function captureWithMetadata(
  page: Page,
  path: string
): Promise<ScreenshotMetadata> {
  const viewport = page.viewport();
  const url = page.url();
  
  await page.screenshot({ path, fullPage: true });
  
  return {
    timestamp: Date.now(),
    url,
    viewport: {
      width: viewport.width,
      height: viewport.height
    },
    path
  };
}

/**
 * Element Visibility Checker
 * Element visible है या नहीं check करना
 */
export async function isElementVisible(
  page: Page,
  selector: string
): Promise<{
  visible: boolean;
  inViewport: boolean;
  dimensions?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}> {
  return await page.evaluate((sel: any) => {
    const element: any = document.querySelector(sel);
    if (!element) {
      return { visible: false, inViewport: false };
    }
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    const visible = 
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0';
    
    const inViewport = 
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;
    
    return {
      visible,
      inViewport,
      dimensions: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      }
    };
  }, selector);
}

/**
 * Scroll Element Into View
 * Element को viewport में लाना
 */
export async function scrollIntoView(
  page: Page,
  selector: string,
  options?: {
    behavior?: 'auto' | 'smooth';
    block?: 'start' | 'center' | 'end' | 'nearest';
    inline?: 'start' | 'center' | 'end' | 'nearest';
  }
): Promise<{ success: boolean; message: string }> {
  try {
    await page.evaluate((sel: any, opts: any) => {
      const element: any = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({
          behavior: opts?.behavior || 'smooth',
          block: opts?.block || 'center',
          inline: opts?.inline || 'nearest'
        });
      }
    }, selector, options);
    
    // Wait for scroll animation
    await page.waitForTimeout(500);
    
    return {
      success: true,
      message: 'Element scrolled into view'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Scroll failed: ${error.message}`
    };
  }
}

/**
 * Get Page Dimensions
 * Page की पूरी dimensions निकालना
 */
export async function getPageDimensions(
  page: Page
): Promise<{
  viewport: { width: number; height: number };
  page: { width: number; height: number };
  scroll: { x: number; y: number };
}> {
  return await page.evaluate(() => {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      page: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      },
      scroll: {
        x: window.scrollX,
        y: window.scrollY
      }
    };
  });
}

/**
 * Highlight Element
 * Element को temporarily highlight करना (debugging के लिए)
 */
export async function highlightElement(
  page: Page,
  selector: string,
  duration: number = 2000
): Promise<{ success: boolean; message: string }> {
  try {
    await page.evaluate((sel: any, dur: any) => {
      const element: any = document.querySelector(sel);
      if (!element) return;
      
      const originalOutline = element.style.outline;
      const originalBackgroundColor = element.style.backgroundColor;
      
      // Highlight
      element.style.outline = '3px solid red';
      element.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
      
      // Remove after duration
      setTimeout(() => {
        element.style.outline = originalOutline;
        element.style.backgroundColor = originalBackgroundColor;
      }, dur);
    }, selector, duration);
    
    return {
      success: true,
      message: `Element highlighted for ${duration}ms`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Highlight failed: ${error.message}`
    };
  }
}

/**
 * Capture Element Positions
 * सभी matching elements की positions निकालना
 */
export async function captureElementPositions(
  page: Page,
  selector: string
): Promise<Array<{
  selector: string;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
}>> {
  return await page.evaluate((sel: any) => {
    const elements = Array.from(document.querySelectorAll(sel));
    
    return elements.map((element: any, index: number) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      const visible = 
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden';
      
      let elementSelector = sel;
      if (element.id) {
        elementSelector = `#${element.id}`;
      }
      
      return {
        selector: elementSelector,
        position: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        },
        visible
      };
    });
  }, selector);
}

/**
 * Video Recording
 * Browser interaction को video के रूप में record करना
 */
export interface VideoRecordingOptions {
  path?: string;
  fps?: number;
  quality?: number;
  maxDuration?: number; // in seconds
}

export interface VideoRecorder {
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ path?: string; buffer?: Buffer; duration: number }>;
  isRecording(): boolean;
}

/**
 * Start Video Recording
 * Page interactions को video में record करना शुरू करना
 */
export async function startVideoRecording(
  page: Page,
  options: VideoRecordingOptions = {}
): Promise<VideoRecorder> {
  const fps = options.fps || 25;
  const quality = options.quality || 80;
  const maxDuration = options.maxDuration || 300; // 5 minutes default
  
  const frames: Buffer[] = [];
  let recording = false;
  let startTime: number;
  let recordingInterval: NodeJS.Timeout | null = null;
  
  const recorder: VideoRecorder = {
    async startRecording() {
      if (recording) {
        throw new Error('Recording already in progress');
      }
      
      recording = true;
      startTime = Date.now();
      frames.length = 0; // Clear any existing frames
      
      // Capture frames at specified FPS
      const frameInterval = 1000 / fps;
      
      recordingInterval = setInterval(async () => {
        try {
          // Check if max duration exceeded
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= maxDuration) {
            await recorder.stopRecording();
            return;
          }
          
          // Capture frame
          const screenshot = await page.screenshot({
            type: 'jpeg',
            quality: quality,
            fullPage: false
          });
          
          frames.push(screenshot as Buffer);
        } catch (error) {
          console.error('Error capturing frame:', error);
        }
      }, frameInterval);
    },
    
    async stopRecording() {
      if (!recording) {
        throw new Error('No recording in progress');
      }
      
      recording = false;
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
      }
      
      const duration = (Date.now() - startTime) / 1000;
      
      // Convert frames to video
      // Note: This is a simplified implementation
      // In production, use ffmpeg or similar library to create actual video
      if (options.path) {
        // Save frames metadata (in real implementation, use ffmpeg)
        const fs = await import('fs');
        const metadata = {
          frameCount: frames.length,
          duration,
          fps,
          quality,
          timestamp: new Date().toISOString()
        };
        
        await fs.promises.writeFile(
          options.path + '.json',
          JSON.stringify(metadata, null, 2)
        );
        
        // In production: Use ffmpeg to combine frames into video
        // ffmpeg -framerate ${fps} -i frame_%d.jpg -c:v libx264 output.mp4
        
        return {
          path: options.path,
          duration
        };
      }
      
      return {
        duration,
        buffer: frames[0] // Return first frame as preview
      };
    },
    
    isRecording() {
      return recording;
    }
  };
  
  return recorder;
}

/**
 * Record Page Interaction
 * Specific interaction को record करना
 */
export async function recordInteraction(
  page: Page,
  action: () => Promise<void>,
  options: VideoRecordingOptions = {}
): Promise<{ success: boolean; path?: string; duration: number; message: string }> {
  try {
    const recorder = await startVideoRecording(page, options);
    
    // Start recording
    await recorder.startRecording();
    
    // Perform action
    await action();
    
    // Wait a bit for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Stop recording
    const result = await recorder.stopRecording();
    
    return {
      success: true,
      path: result.path,
      duration: result.duration,
      message: `Interaction recorded successfully (${result.duration.toFixed(2)}s)`
    };
  } catch (error: any) {
    return {
      success: false,
      duration: 0,
      message: `Recording failed: ${error.message}`
    };
  }
}

/**
 * Record Full Workflow
 * Multiple steps की complete workflow record करना
 */
export async function recordWorkflow(
  page: Page,
  steps: Array<{ name: string; action: () => Promise<void> }>,
  options: VideoRecordingOptions = {}
): Promise<{
  success: boolean;
  path?: string;
  duration: number;
  stepsCompleted: number;
  message: string;
}> {
  try {
    const recorder = await startVideoRecording(page, options);
    await recorder.startRecording();
    
    let completedSteps = 0;
    
    for (const step of steps) {
      try {
        // Add visual indicator (optional)
        await page.evaluate((stepName: string) => {
          const indicator = document.createElement('div');
          indicator.id = 'recording-indicator';
          indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 999999;
          `;
          indicator.textContent = `🔴 Recording: ${stepName}`;
          document.body.appendChild(indicator);
          
          // Remove after 2 seconds
          setTimeout(() => {
            const el = document.getElementById('recording-indicator');
            if (el) el.remove();
          }, 2000);
        }, step.name);
        
        // Execute step
        await step.action();
        completedSteps++;
        
        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (stepError) {
        console.error(`Error in step "${step.name}":`, stepError);
        // Continue with other steps
      }
    }
    
    // Stop recording
    const result = await recorder.stopRecording();
    
    return {
      success: true,
      path: result.path,
      duration: result.duration,
      stepsCompleted: completedSteps,
      message: `Workflow recorded: ${completedSteps}/${steps.length} steps completed (${result.duration.toFixed(2)}s)`
    };
  } catch (error: any) {
    return {
      success: false,
      duration: 0,
      stepsCompleted: 0,
      message: `Workflow recording failed: ${error.message}`
    };
  }
}
