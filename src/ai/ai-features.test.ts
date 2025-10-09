// AI Features Tests
import { describe, it, expect } from 'vitest';
import { classifyContent, analyzeSentiment, generateSummary } from './ai-features.js';

describe('AI Features', () => {
  it('classifies content', async () => {
    const result = await classifyContent('This is a great product with a low price');
    expect(result.category).toBe('product');
  });

  it('analyzes sentiment', async () => {
    const result = await analyzeSentiment('This is amazing and great!');
    expect(result.sentiment).toBe('positive');
  });

  it('generates summary', async () => {
    const text = 'This is sentence one. This is sentence two. This is sentence three.';
    const summary = await generateSummary(text, 50);
    expect(summary.length).toBeLessThanOrEqual(50);
  });
});
