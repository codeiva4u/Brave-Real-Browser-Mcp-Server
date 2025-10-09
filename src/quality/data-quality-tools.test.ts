// Data Quality Tests
import { describe, it, expect } from 'vitest';
import { deduplicateData, handleMissingData, validateDataType, detectOutliers } from './data-quality-tools.js';

describe('Data Quality Tools', () => {
  it('deduplicates data', async () => {
    const data = [1, 2, 2, 3, 3, 3];
    const result = await deduplicateData(data);
    expect(result).toEqual([1, 2, 3]);
  });

  it('handles missing data', async () => {
    const data = [{ name: 'John', age: 30 }, { name: 'Jane' }];
    const result = await handleMissingData(data, ['name', 'age']);
    expect(result.complete.length).toBe(1);
    expect(result.incomplete.length).toBe(1);
  });

  it('validates data types', async () => {
    expect(await validateDataType('test', 'string')).toBe(true);
    expect(await validateDataType(123, 'number')).toBe(true);
    expect(await validateDataType('test', 'number')).toBe(false);
  });

  it('detects outliers', async () => {
    const data = [1, 2, 3, 4, 5, 100];
    const outliers = await detectOutliers(data);
    expect(outliers).toContain(100);
  });
});
