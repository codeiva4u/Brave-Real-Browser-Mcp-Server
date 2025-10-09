// Screenshot & Visual Tools
import { Page } from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

export async function takeFullPageScreenshot(page: Page, outputPath: string): Promise<boolean> {
  try {
    await page.screenshot({ path: outputPath, fullPage: true });
    return true;
  } catch {
    return false;
  }
}

export async function takeElementScreenshot(page: Page, selector: string, outputPath: string): Promise<boolean> {
  try {
    const element = await page.$(selector);
    if (!element) return false;
    await element.screenshot({ path: outputPath });
    return true;
  } catch {
    return false;
  }
}

export async function generatePDF(page: Page, outputPath: string): Promise<boolean> {
  try {
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
    return true;
  } catch {
    return false;
  }
}

export async function recordVideo(page: Page, outputPath: string, duration: number = 10000): Promise<boolean> {
  // Video recording placeholder - would require additional libraries
  return false;
}

export async function compareScreenshots(path1: string, path2: string): Promise<{ different: boolean; diffPercentage: number }> {
  // Image comparison placeholder - would require image processing library
  return { different: false, diffPercentage: 0 };
}

export async function captureViewport(page: Page, outputPath: string): Promise<boolean> {
  try {
    await page.screenshot({ path: outputPath, fullPage: false });
    return true;
  } catch {
    return false;
  }
}
