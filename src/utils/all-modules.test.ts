// Comprehensive Test Suite for All New Modules
import { describe, it, expect } from 'vitest';
import {
  ProgressTracker,
  ErrorLogger,
  PerformanceMonitor,
  analyzeSentiment,
  classifyContent,
  summarizeText,
  deduplicateData,
  detectMissingData,
  validateDataQuality
} from './advanced-features.js';

describe('Phase 9: Monitoring & Reporting', () => {
  it('ProgressTracker should track progress correctly', () => {
    const tracker = new ProgressTracker();
    tracker.setTotal(10);
    tracker.increment();
    tracker.increment();
    
    const progress = tracker.getProgress();
    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(10);
    expect(progress.percentage).toBe(20);
  });
  
  it('ErrorLogger should log errors', () => {
    const logger = new ErrorLogger();
    logger.log('Test error', 'test context');
    
    const errors = logger.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].error).toBe('Test error');
  });
  
  it('PerformanceMonitor should record and calculate stats', () => {
    const monitor = new PerformanceMonitor();
    monitor.record('operation1', 100);
    monitor.record('operation1', 200);
    monitor.record('operation1', 300);
    
    const stats = monitor.getStats('operation1');
    expect(stats).toBeTruthy();
    expect(stats?.avg).toBe(200);
    expect(stats?.min).toBe(100);
    expect(stats?.max).toBe(300);
  });
});

describe('Phase 10: AI-Powered Features', () => {
  it('analyzeSentiment should analyze text sentiment', async () => {
    const result = await analyzeSentiment('I love this amazing product!');
    expect(result.score).toBeGreaterThan(0);
    expect(result.positive.length).toBeGreaterThan(0);
  });
  
  it('classifyContent should categorize text', () => {
    const result = classifyContent('This is about software and technology');
    expect(result).toContain('technology');
  });
  
  it('summarizeText should create summary', () => {
    const longText = 'This is a long text. ' + 'It has multiple sentences. '.repeat(20);
    const summary = summarizeText(longText, 100);
    expect(summary.length).toBeLessThanOrEqual(103); // 100 + '...'
  });
});

describe('Phase 12: Data Quality & Validation', () => {
  it('deduplicateData should remove duplicates', () => {
    const data = [1, 2, 2, 3, 3, 3];
    const result = deduplicateData(data);
    expect(result).toEqual([1, 2, 3]);
  });
  
  it('detectMissingData should find missing fields', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane' }, // missing age
    ];
    const issues = detectMissingData(data, ['name', 'age']);
    expect(issues).toHaveLength(1);
    expect(issues[0].missingFields).toContain('age');
  });
  
  it('validateDataQuality should validate data', () => {
    const data = [
      { age: 25, email: 'test@example.com' },
      { age: -5, email: 'invalid' }, // invalid age
    ];
    const result = validateDataQuality(data, {
      age: (val: number) => val > 0,
      email: (val: string) => val.includes('@')
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});

describe('All Modules Integration', () => {
  it('all modules should be importable', () => {
    expect(ProgressTracker).toBeDefined();
    expect(ErrorLogger).toBeDefined();
    expect(PerformanceMonitor).toBeDefined();
    expect(analyzeSentiment).toBeDefined();
    expect(classifyContent).toBeDefined();
  });
});
