// @ts-nocheck
import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import Tesseract from 'tesseract.js';

/**
 * OCR Engine - Extract text from captcha images using OCR
 */
export async function handleOCREngine(args: any): Promise<any> {
  const { url, selector, imageUrl, imageBuffer, language = 'eng' } = args;
  
  try {
    let imageSource: string | Buffer;
    
    if (imageBuffer) {
      imageSource = Buffer.from(imageBuffer, 'base64');
    } else if (imageUrl) {
      imageSource = imageUrl;
    } else if (selector) {
      const page = getPageInstance();      if (!page) {        throw new Error('Browser not initialized. Call browser_init first.');      }
      
      if (url && page.url() !== url) {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      }
      
      // Get image element and take screenshot
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      const screenshot = await element.screenshot({ encoding: 'base64' });
      imageSource = Buffer.from(screenshot, 'base64');
    } else {
      throw new Error('No image source provided');
    }
    
    // Perform OCR
    const result = await Tesseract.recognize(imageSource, language, {
      logger: () => {} // Suppress logs
    });
    
    // Clean and process text
    const text = result.data.text.trim();
    const confidence = result.data.confidence;
    
    // Extract words with their confidence
    const words = result.data.words.map(word => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox
    }));
    
    return {
      success: true,
      text,
      confidence,
      words,
      lines: result.data.lines.length,
      language
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Audio Captcha Solver - Handle audio captchas
 */
export async function handleAudioCaptchaSolver(args: any): Promise<any> {
  const { url, audioSelector, audioUrl, downloadPath } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    let audioSource = audioUrl;
    
    // If selector provided, extract audio URL
    if (audioSelector && !audioUrl) {
      audioSource = await page.evaluate((sel: string) => {
        const element = document.querySelector(sel) as HTMLAudioElement | HTMLSourceElement;
        if (!element) return null;
        
        if (element.tagName === 'AUDIO') {
          return (element as HTMLAudioElement).src || (element as HTMLAudioElement).currentSrc;
        } else if (element.tagName === 'SOURCE') {
          return (element as HTMLSourceElement).src;
        }
        
        return element.getAttribute('src') || element.getAttribute('data-src');
      }, audioSelector);
    }
    
    if (!audioSource) {
      throw new Error('No audio source found');
    }
    
    // Download audio if path provided
    let downloaded = false;
    if (downloadPath) {
      const response = await page.goto(audioSource);
      if (response) {
        const fs = await import('fs/promises');
        const buffer = await response.buffer();
        await fs.writeFile(downloadPath, buffer);
        downloaded = true;
      }
    }
    
    return {
      success: true,
      audioUrl: audioSource,
      downloaded,
      downloadPath: downloaded ? downloadPath : null,
      note: 'Audio captcha solving requires external speech-to-text API (Google Speech, AWS Transcribe, etc.)'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Puzzle Captcha Handler - Handle slider and puzzle captchas
 */
export async function handlePuzzleCaptchaHandler(args: any): Promise<any> {
  const { url, puzzleSelector, sliderSelector, method = 'auto' } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    const result = await page.evaluate(async (puzzleSel: string, sliderSel: string, meth: string) => {
      const puzzleElement = puzzleSel ? document.querySelector(puzzleSel) : null;
      const sliderElement = sliderSel ? document.querySelector(sliderSel) : null;
      
      if (!puzzleElement && !sliderElement) {
        throw new Error('No puzzle or slider element found');
      }
      
      const info: any = {
        puzzleFound: !!puzzleElement,
        sliderFound: !!sliderElement
      };
      
      // Get puzzle dimensions if exists
      if (puzzleElement) {
        const rect = puzzleElement.getBoundingClientRect();
        info.puzzle = {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          visible: rect.width > 0 && rect.height > 0
        };
        
        // Check for puzzle piece
        const puzzlePiece = puzzleElement.querySelector('.puzzle-piece, [class*="piece"], [class*="puzzle"]');
        if (puzzlePiece) {
          const pieceRect = puzzlePiece.getBoundingClientRect();
          info.puzzlePiece = {
            width: pieceRect.width,
            height: pieceRect.height,
            top: pieceRect.top,
            left: pieceRect.left
          };
        }
      }
      
      // Get slider info if exists
      if (sliderElement) {
        const rect = sliderElement.getBoundingClientRect();
        info.slider = {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          visible: rect.width > 0 && rect.height > 0,
          tagName: sliderElement.tagName.toLowerCase()
        };
      }
      
      return info;
    }, puzzleSelector || '', sliderSelector || '', method);
    
    // If auto method, attempt to solve
    if (method === 'auto' && sliderSelector) {
      try {
        const sliderElement = await page.$(sliderSelector);
        if (sliderElement) {
          const box = await sliderElement.boundingBox();
          if (box) {
            // Simulate drag - this is a basic implementation
            // Real puzzle solving would need image analysis
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            
            // Move in small increments
            const targetDistance = result.puzzle?.width || 300;
            const steps = 20;
            const stepSize = targetDistance / steps;
            
            for (let i = 0; i < steps; i++) {
              await page.mouse.move(
                box.x + box.width / 2 + (stepSize * i),
                box.y + box.height / 2,
                { steps: 5 }
              );
              await page.waitForTimeout(50 + Math.random() * 50); // Random delay for human-like behavior
            }
            
            await page.mouse.up();
            
            result.attemptedSolve = true;
            result.method = 'automated_drag';
          }
        }
      } catch (solveError: any) {
        result.solveError = solveError.message;
      }
    }
    
    return {
      success: true,
      ...result,
      note: 'Advanced puzzle solving requires computer vision libraries (OpenCV, TensorFlow)'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
