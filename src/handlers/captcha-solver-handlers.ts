import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';

/**
 * CAPTCHA Solver Handler
 * Solves text-based image CAPTCHAs using OCR (Tesseract.js)
 */

export interface CaptchaSolverConfig {
    preprocessImage?: boolean;
    language?: string;
    whitelist?: string;
    maxAttempts?: number; // Number of preprocessing strategies to try (1-3)
    minConfidence?: number; // Minimum confidence to accept result (0-100)
}

/**
 * Advanced preprocessing strategies for maximum accuracy
 */
async function preprocessImage(
    imageBuffer: Buffer, 
    strategy: 'ultra' | 'aggressive' | 'standard' | 'light' | 'adaptive' = 'standard'
): Promise<Buffer> {
    try {
        const img = sharp(imageBuffer);
        const metadata = await sharp(imageBuffer).metadata();
        
        switch (strategy) {
            case 'ultra':
                // Ultra high quality - Maximum accuracy
                return await img
                    .resize({ 
                        width: Math.max(1000, (metadata.width || 200) * 4),
                        kernel: 'lanczos3' // Best quality scaling
                    })
                    .greyscale()
                    .normalize({ lower: 1, upper: 99 }) // Aggressive normalization
                    .linear(2.0, -(128 * 1.0)) // Very high contrast
                    .median(2) // Reduce noise
                    .convolve({ // Edge enhancement
                        width: 3,
                        height: 3,
                        kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1]
                    })
                    .threshold(115, { grayscale: false }) // Optimal threshold
                    .negate({ alpha: false }) // Invert if needed
                    .negate({ alpha: false }) // Double negate for consistency
                    .sharpen({ sigma: 3, m1: 2, m2: 3 }) // Maximum sharpening
                    .toBuffer();
            
            case 'aggressive':
                // Aggressive preprocessing
                return await img
                    .resize({ width: 800, kernel: 'lanczos2' })
                    .greyscale()
                    .normalize()
                    .linear(1.8, -(128 * 0.8))
                    .threshold(120)
                    .median(3)
                    .sharpen({ sigma: 2.5 })
                    .toBuffer();
            
            case 'adaptive':
                // Adaptive based on image characteristics
                const avgWidth = metadata.width || 200;
                const scaleFactor = avgWidth < 300 ? 4 : 3;
                
                return await img
                    .resize({ width: avgWidth * scaleFactor })
                    .greyscale()
                    .normalize()
                    .linear(1.6, -(128 * 0.6))
                    .threshold(125)
                    .sharpen({ sigma: 2 })
                    .toBuffer();
            
            case 'light':
                // Light preprocessing
                return await img
                    .resize({ width: 500 })
                    .greyscale()
                    .normalize()
                    .sharpen()
                    .toBuffer();
            
            default: // 'standard'
                return await img
                    .resize({ width: 600 })
                    .greyscale()
                    .normalize()
                    .threshold(128)
                    .sharpen({ sigma: 1.5 })
                    .toBuffer();
        }
    } catch (error) {
        console.warn('Image preprocessing failed, using original:', error);
        return imageBuffer;
    }
}

/**
 * Solve text-based CAPTCHA from image selector
 */
export async function handleSolveTextCaptcha(
    page: any,
    imageSelector: string,
    config: CaptchaSolverConfig = {}
): Promise<{ success: boolean; text: string; confidence: number; error?: string }> {
    try {
        if (!page) {
            throw new Error('Browser not initialized. Please call browser_init first.');
        }

        const {
            preprocessImage: shouldPreprocess = true,
            language = 'eng',
            whitelist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            maxAttempts = 5, // Use all 5 strategies for maximum accuracy
            minConfidence = 90 // High confidence threshold
        } = config;

        // Check if image element exists
        const imageExists = await page.evaluate((selector: string) => {
            const element = document.querySelector(selector);
            return element !== null;
        }, imageSelector);

        if (!imageExists) {
            throw new Error(`Image element not found with selector: ${imageSelector}`);
        }

        // Get image as base64
        const imageData = await page.evaluate(async (selector: string) => {
            const img = document.querySelector(selector) as HTMLImageElement;
            if (!img) return null;

            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.drawImage(img, 0, 0);

            // Get base64 data
            return canvas.toDataURL('image/png');
        }, imageSelector);

        if (!imageData) {
            throw new Error('Failed to extract image data from element');
        }

        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const originalBuffer = Buffer.from(base64Data, 'base64');

        // Try multiple preprocessing strategies for best result
        const allStrategies = shouldPreprocess 
            ? ['ultra', 'adaptive', 'aggressive', 'standard', 'light'] as const 
            : [null];
        const strategies = allStrategies.slice(0, Math.min(maxAttempts, 5));
        let bestResult: { text: string; confidence: number } | null = null;
        const results: Array<{ strategy: string; text: string; confidence: number }> = [];

        console.log(`🔍 Attempting OCR with ${strategies.length} strategy/strategies (minConfidence: ${minConfidence}%)...`);
        console.log(`🎯 Target: 100% accuracy mode enabled`);

        for (const strategy of strategies) {
            try {
                let imageBuffer: Buffer = originalBuffer;
                
                // Apply preprocessing strategy
                if (strategy) {
                    imageBuffer = await preprocessImage(originalBuffer, strategy) as Buffer;
                    console.log(`Trying OCR with ${strategy} preprocessing...`);
                } else {
                    console.log('Trying OCR without preprocessing...');
                }

                // Initialize Tesseract worker
                const worker = await createWorker(language);

                // Configure Tesseract with optimal settings
                await worker.setParameters({
                    tessedit_char_whitelist: whitelist,
                    tessedit_pageseg_mode: PSM.SINGLE_LINE, // Single text line
                });

                // Perform OCR
                const { data } = await worker.recognize(imageBuffer);
                await worker.terminate();

                // Clean up the result
                const cleanText = data.text
                    .replace(/\s+/g, '') // Remove all whitespace
                    .replace(/[^0-9A-Za-z]/g, '') // Remove non-alphanumeric
                    .toUpperCase() // Convert to uppercase
                    .trim();

                console.log(`📊 OCR Result (${strategy || 'no preprocessing'}):`, {
                    raw: data.text,
                    cleaned: cleanText,
                    confidence: data.confidence.toFixed(2) + '%'
                });

                // Store result for consensus analysis
                if (cleanText.length > 0) {
                    results.push({
                        strategy: strategy || 'none',
                        text: cleanText,
                        confidence: data.confidence
                    });
                    
                    // Keep the result with highest confidence
                    if (!bestResult || data.confidence > bestResult.confidence) {
                        bestResult = {
                            text: cleanText,
                            confidence: data.confidence
                        };
                    }
                }

                // If we got perfect or near-perfect confidence, stop trying
                if (data.confidence >= 95) {
                    console.log(`✅ Excellent confidence achieved (${data.confidence.toFixed(2)}%), stopping attempts`);
                    break;
                }

            } catch (strategyError) {
                console.warn(`OCR attempt with strategy ${strategy} failed:`, strategyError);
                continue;
            }
        }

        if (!bestResult || !bestResult.text) {
            throw new Error('OCR failed to recognize any text from CAPTCHA image');
        }

        // 🎯 CONSENSUS VOTING: If multiple results agree, boost confidence to 100%
        console.log(`\n🤝 Analyzing ${results.length} results for consensus...`);
        
        const textFrequency = new Map<string, number>();
        results.forEach(r => {
            textFrequency.set(r.text, (textFrequency.get(r.text) || 0) + 1);
        });

        // Find most common result
        let consensusText = bestResult.text;
        let consensusCount = 1;
        let consensusConfidence = bestResult.confidence;
        
        for (const [text, count] of textFrequency.entries()) {
            if (count > consensusCount) {
                consensusText = text;
                consensusCount = count;
                // Get average confidence for this text
                consensusConfidence = results
                    .filter(r => r.text === text)
                    .reduce((sum, r) => sum + r.confidence, 0) / count;
            }
        }

        // If multiple strategies agree on same text, boost confidence
        if (consensusCount >= 2 && results.length >= 2) {
            const agreementPercent = (consensusCount / results.length) * 100;
            console.log(`✅ CONSENSUS ACHIEVED! ${consensusCount}/${results.length} strategies agree on "${consensusText}"`);
            console.log(`📊 Agreement: ${agreementPercent.toFixed(0)}%`);
            
            // Boost confidence based on consensus
            const boostedConfidence = Math.min(100, consensusConfidence + (agreementPercent * 0.3));
            
            console.log(`🚀 Confidence boosted: ${consensusConfidence.toFixed(2)}% → ${boostedConfidence.toFixed(2)}%`);
            
            return {
                success: true,
                text: consensusText,
                confidence: boostedConfidence
            };
        }

        // Check if confidence meets minimum threshold
        if (bestResult.confidence < minConfidence) {
            console.warn(`⚠️ Low confidence warning: ${bestResult.confidence.toFixed(2)}% < ${minConfidence}% threshold`);
            console.log('Best OCR Result (Low Confidence):', bestResult);
            
            return {
                success: true,
                text: bestResult.text,
                confidence: bestResult.confidence,
                error: `⚠️ Low confidence: ${bestResult.confidence.toFixed(2)}% (threshold: ${minConfidence}%). Result may be inaccurate.`
            };
        }

        console.log('✅ Best OCR Result (High Confidence):', {
            text: bestResult.text,
            confidence: bestResult.confidence.toFixed(2) + '%'
        });

        return {
            success: true,
            text: bestResult.text,
            confidence: bestResult.confidence
        };

    } catch (error: any) {
        console.error('CAPTCHA solving error:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            error: error.message || 'Failed to solve CAPTCHA'
        };
    }
}

/**
 * Solve and auto-fill CAPTCHA
 */
export async function handleSolveAndFillCaptcha(
    page: any,
    imageSelector: string,
    inputSelector: string,
    config: CaptchaSolverConfig = {}
): Promise<{ success: boolean; text: string; confidence: number; error?: string }> {
    try {
        if (!page) {
            throw new Error('Browser not initialized. Please call browser_init first.');
        }

        // Solve CAPTCHA
        const result = await handleSolveTextCaptcha(page, imageSelector, config);

        if (!result.success || !result.text) {
            return result;
        }

        // Fill the input field
        await page.waitForSelector(inputSelector, { timeout: 5000 });
        await page.click(inputSelector);
        await page.type(inputSelector, result.text, { delay: 100 });

        console.log(`CAPTCHA text "${result.text}" filled in ${inputSelector}`);

        return result;

    } catch (error: any) {
        console.error('CAPTCHA solve and fill error:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            error: error.message || 'Failed to solve and fill CAPTCHA'
        };
    }
}
