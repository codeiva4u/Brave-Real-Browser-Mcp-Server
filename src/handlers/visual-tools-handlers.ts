// @ts-nocheck
import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Full Page Screenshot - Capture entire page
 */
export async function handleFullPageScreenshot(args: any): Promise<any> {
  const { url, outputPath, format = 'png', quality = 90, fullPage = true } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    // Ensure output directory exists
    if (outputPath) {
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
    }
    
    const screenshotOptions: any = {
      path: outputPath,
      type: format,
      fullPage
    };
    
    if (format === 'jpeg') {
      screenshotOptions.quality = quality;
    }
    
    await page.screenshot(screenshotOptions);
    
    // Get file stats if saved
    let fileSize = 0;
    if (outputPath) {
      const stats = await fs.stat(outputPath);
      fileSize = stats.size;
    }
    
    const resultText = `✅ Screenshot captured successfully\n\nPath: ${outputPath}\nFormat: ${format}\nFull Page: ${fullPage}\nFile Size: ${(fileSize / 1024).toFixed(2)} KB\nTimestamp: ${new Date().toISOString()}`;
    
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
          text: `❌ Screenshot failed: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Element Screenshot - Capture specific element
 */
export async function handleElementScreenshot(args: any): Promise<any> {
  const { url, selector, outputPath, format = 'png', padding = 0 } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
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
    
    return {
      success: true,
      path: outputPath,
      selector,
      format,
      padding,
      element: elementInfo,
      fileSize,
      fileSizeKB: (fileSize / 1024).toFixed(2),
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * PDF Generation - Convert page to PDF
 */
export async function handlePDFGeneration(args: any): Promise<any> {
  const { url, outputPath, format = 'A4', landscape = false, printBackground = true, margin } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    // Ensure output directory exists
    if (outputPath) {
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
    }
    
    const pdfOptions: any = {
      path: outputPath,
      format,
      landscape,
      printBackground
    };
    
    if (margin) {
      pdfOptions.margin = margin;
    }
    
    await page.pdf(pdfOptions);
    
    // Get file stats
    let fileSize = 0;
    if (outputPath) {
      const stats = await fs.stat(outputPath);
      fileSize = stats.size;
    }
    
    return {
      success: true,
      path: outputPath,
      format,
      landscape,
      fileSize,
      fileSizeKB: (fileSize / 1024).toFixed(2),
      fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Video Recording - Record browser session (basic implementation)
 */
export async function handleVideoRecording(args: any): Promise<any> {
  const { url, duration = 10, outputPath } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
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
        await page.waitForTimeout(frameDelay);
      }
    }
    
    return {
      success: true,
      duration,
      fps,
      frameCount: frames.length,
      frames: frames.slice(0, 5), // Show first 5 frames
      outputPath,
      note: 'For actual video file, use ffmpeg or puppeteer-screen-recorder library to combine frames'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Visual Comparison - Compare two screenshots
 */
export async function handleVisualComparison(args: any): Promise<any> {
  const { image1Path, image2Path, diffOutputPath, threshold = 0.1 } = args;
  
  try {
    if (!image1Path || !image2Path) {
      throw new Error('Both image paths are required');
    }
    
    // Read images
    const img1Data = await fs.readFile(image1Path);
    const img2Data = await fs.readFile(image2Path);
    
    const img1 = PNG.sync.read(img1Data);
    const img2 = PNG.sync.read(img2Data);
    
    // Check if dimensions match
    if (img1.width !== img2.width || img1.height !== img2.height) {
      return {
        success: false,
        error: 'Image dimensions do not match',
        image1: { width: img1.width, height: img1.height },
        image2: { width: img2.width, height: img2.height }
      };
    }
    
    // Create diff image
    const diff = new PNG({ width: img1.width, height: img1.height });
    
    // Compare images
    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      img1.width,
      img1.height,
      { threshold }
    );
    
    // Save diff image if path provided
    if (diffOutputPath) {
      const dir = path.dirname(diffOutputPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(diffOutputPath, PNG.sync.write(diff));
    }
    
    const totalPixels = img1.width * img1.height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;
    
    return {
      success: true,
      identical: numDiffPixels === 0,
      differences: {
        pixels: numDiffPixels,
        percentage: diffPercentage.toFixed(2) + '%',
        totalPixels
      },
      dimensions: {
        width: img1.width,
        height: img1.height
      },
      threshold,
      diffImagePath: diffOutputPath,
      similarity: ((1 - (numDiffPixels / totalPixels)) * 100).toFixed(2) + '%'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
