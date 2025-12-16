// Data Processing & Transformation Handlers
// Text cleaning, validation, formatting utilities
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';




// HTML to Clean Text Arguments
export interface HTMLToTextArgs {
  html: string;
  preserveLinks?: boolean;
  preserveFormatting?: boolean;
}

/**
 * HTML tags intelligently remove करता है
 */
export async function handleHTMLToText(args: HTMLToTextArgs) {
  return await withErrorHandling(async () => {
    const html = args.html;
    const preserveLinks = args.preserveLinks || false;
    const preserveFormatting = args.preserveFormatting || false;

    // Simple HTML to text conversion (can be enhanced with turndown)
    let text = html;

    // Preserve links if requested
    if (preserveLinks) {
      text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)');
    }

    // Preserve basic formatting
    if (preserveFormatting) {
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<\/p>/gi, '\n\n');
      text = text.replace(/<li>/gi, '• ');
      text = text.replace(/<\/li>/gi, '\n');
    }

    // Remove all other HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Clean up whitespace
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ HTML converted to text\n\n${text}`,
        },
      ],
    };
  }, 'Failed to convert HTML to text');
}









// Duplicate Remover Arguments

