// Data Quality & Validation Tools
export async function deduplicateData<T>(items: T[], key?: keyof T): Promise<T[]> {
  if (key) {
    const seen = new Set();
    return items.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
  return Array.from(new Set(items));
}

export async function handleMissingData(data: any[], requiredFields: string[]): Promise<{ complete: any[]; incomplete: any[] }> {
  const complete = data.filter(item => requiredFields.every(field => item[field] !== undefined && item[field] !== null && item[field] !== ''));
  const incomplete = data.filter(item => !requiredFields.every(field => item[field] !== undefined && item[field] !== null && item[field] !== ''));
  return { complete, incomplete };
}

export async function validateDataType(value: any, expectedType: string): Promise<boolean> {
  switch (expectedType) {
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && !isNaN(value);
    case 'boolean': return typeof value === 'boolean';
    case 'array': return Array.isArray(value);
    case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
    default: return false;
  }
}

export async function detectOutliers(numbers: number[]): Promise<number[]> {
  const sorted = [...numbers].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return numbers.filter(n => n < lowerBound || n > upperBound);
}

export async function checkConsistency(data: any[], field: string): Promise<{ consistent: boolean; uniqueValues: any[] }> {
  const values = data.map(item => item[field]);
  const uniqueValues = Array.from(new Set(values));
  return { consistent: uniqueValues.length === 1, uniqueValues };
}
