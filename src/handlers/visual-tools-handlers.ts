// @ts-nocheck
import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { sleep } from '../system-utils.js';

/**
 * Full Page Screenshot - Capture entire page
 */


/**
 * Element Screenshot - Capture specific element
 */
export async function handleElementScreenshot(args: any): Promise<any> {
  const { url, selector, outputPath, format = 'png', padding = 0 } = args;

  try {
    const page = getPageInstance(); if (!page) { throw new Error('Browser not initialized. Call browser_init first.'); }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Ensure output directory exists
    if (outputPath) {
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
    }

    // Apply padding if specified
    let screenshotOptions: any = {
      path: outputPath,
      type: format
    };

    if (padding > 0) {
      const box = await element.boundingBox();
      if (box) {
        screenshotOptions = {
          ...screenshotOptions,
          clip: {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + (padding * 2),
            height: box.height + (padding * 2)
          }
        };
        await page.screenshot(screenshotOptions);
      } else {
        await element.screenshot(screenshotOptions);
      }
    } else {
      await element.screenshot(screenshotOptions);
    }

    // Get element info
    const elementInfo = await page.evaluate((sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        tagName: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        width: rect.width,
        height: rect.height
      };
    }, selector);

    // Get file stats
    let fileSize = 0;
    if (outputPath) {
      const stats = await fs.stat(outputPath);
      fileSize = stats.size;
    }

    const resultText = `✅ Element screenshot captured successfully\n\nPath: ${outputPath}\nSelector: ${selector}\nFormat: ${format}\nPadding: ${padding}px\nElement: ${elementInfo?.tagName || 'unknown'}\nFile Size: ${(fileSize / 1024).toFixed(2)} KB\nTimestamp: ${new Date().toISOString()}`;

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Element screenshot failed: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}



/**
 * Video Recording - Record browser session (basic implementation)
 */
export async function handleVideoRecording(args: any): Promise<any> {
  const { url, duration = 10, outputPath } = args;

  try {
    const page = getPageInstance(); if (!page) { throw new Error('Browser not initialized. Call browser_init first.'); }

    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    // Note: Full video recording requires additional libraries like puppeteer-screen-recorder
    // This is a simplified implementation using screenshot frames

    const frames: string[] = [];
    const fps = 10;
    const frameCount = duration * fps;
    const frameDelay = 1000 / fps;

    // Ensure output directory exists
    if (outputPath) {
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      // Create frames directory
      const framesDir = path.join(dir, 'frames');
      await fs.mkdir(framesDir, { recursive: true });

      // Capture frames
      for (let i = 0; i < frameCount; i++) {
        const framePath = path.join(framesDir, `frame_${i.toString().padStart(4, '0')}.png`);
        await page.screenshot({ path: framePath });
        frames.push(framePath);
        await sleep(frameDelay);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Video Recording Complete:\n- Duration: ${duration} seconds\n- FPS: ${fps}\n- Frames Captured: ${frames.length}\n- Output Path: ${outputPath}\n- Sample Frames:\n${frames.slice(0, 5).map((f: string, i: number) => `  ${i + 1}. ${f}`).join('\n')}\n\nNote: For actual video file, use ffmpeg or puppeteer-screen-recorder library to combine frames`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Video Recording Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}


