// Search Tools Tests
import { describe, it, expect } from 'vitest';
import { advancedFilter } from './advanced-search-tools.js';

describe('Search Tools', () => {
  it('filters data', async () => {
    const data = [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }];
    const result = await advancedFilter(data, { age: 30 });
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('John');
  });
});
