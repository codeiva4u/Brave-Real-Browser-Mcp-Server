// @ts-nocheck
import Ajv from 'ajv/dist/2020.js';
import * as crypto from 'crypto';

const ajv = new Ajv();

/**
 * Data Deduplication - Remove duplicate entries from scraped data
 */
export async function handleDataDeduplication(args: any): Promise<any> {
  const { data, uniqueKeys, fuzzyMatch = false, threshold = 0.9 } = args;

  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    const unique: any[] = [];
    const duplicates: any[] = [];
    const seen = new Set<string>();

    data.forEach((item, index) => {
      let key: string;

      if (uniqueKeys && Array.isArray(uniqueKeys)) {
        // Create composite key from specified fields
        const keyParts = uniqueKeys.map(k => {
          const value = typeof item === 'object' ? item[k] : item;
          return String(value || '');
        });
        key = keyParts.join('|');
      } else {
        // Use entire object as key
        key = JSON.stringify(item);
      }

      if (fuzzyMatch) {
        // Normalize key for fuzzy matching
        key = key.toLowerCase().replace(/\s+/g, ' ').trim();
      }

      const hash = crypto.createHash('md5').update(key).digest('hex');

      if (seen.has(hash)) {
        duplicates.push({ item, index, hash });
      } else {
        seen.add(hash);
        unique.push(item);
      }
    });

    const dedupRate = ((duplicates.length / data.length) * 100).toFixed(2);
    let summary = `Data Deduplication Results:\n\nStatistics:\n- Original Items: ${data.length}\n- Unique Items: ${unique.length}\n- Duplicates Found: ${duplicates.length}\n- Deduplication Rate: ${dedupRate}%`;

    if (uniqueKeys) {
      summary += `\n- Unique Keys Used: ${uniqueKeys.join(', ')}`;
    }

    summary += `\n- Fuzzy Matching: ${fuzzyMatch ? 'Enabled' : 'Disabled'}`;

    if (duplicates.length > 0) {
      summary += `\n\nSample Duplicates (Top 5):\n${duplicates.slice(0, 5).map((d: any, i: number) => `${i + 1}. Index ${d.index}: ${JSON.stringify(d.item).substring(0, 100)}...`).join('\n')}`;
    }

    return {
      content: [
        {
          type: "text",
          text: summary
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Data Deduplication Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Missing Data Handler - Detect and handle missing data
 */


/**
 * Data Type Validator - Validate data types against schema
 */
export async function handleDataTypeValidator(args: any): Promise<any> {
  const { data, schema } = args;

  try {
    if (!schema) {
      throw new Error('Schema is required');
    }

    const validate = ajv.compile(schema);
    const validItems: any[] = [];
    const invalidItems: any[] = [];

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const valid = validate(item);
        if (valid) {
          validItems.push(item);
        } else {
          invalidItems.push({
            item,
            index,
            errors: validate.errors
          });
        }
      });
    } else {
      const valid = validate(data);
      if (valid) {
        validItems.push(data);
      } else {
        invalidItems.push({
          item: data,
          errors: validate.errors
        });
      }
    }

    const total = Array.isArray(data) ? data.length : 1;
    const validationRate = ((validItems.length / total) * 100).toFixed(2);

    let summary = `Data Type Validation Results:\n\nStatistics:\n- Total Items: ${total}\n- Valid Items: ${validItems.length}\n- Invalid Items: ${invalidItems.length}\n- Validation Rate: ${validationRate}%`;

    if (invalidItems.length > 0) {
      summary += `\n\nInvalid Items (Top 5):\n${invalidItems.slice(0, 5).map((inv: any, i: number) => {
        const errorMsgs = inv.errors?.map((e: any) => `${e.instancePath || 'root'}: ${e.message}`).join(', ') || 'Unknown error';
        return `${i + 1}. Index ${inv.index || 'N/A'}:\n   Errors: ${errorMsgs}`;
      }).join('\n')}`;
    }

    summary += `\n\nSchema: ${JSON.stringify(schema, null, 2).substring(0, 200)}${JSON.stringify(schema).length > 200 ? '...' : ''}`;

    return {
      content: [
        {
          type: "text",
          text: summary
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Data Type Validator Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Outlier Detection - Detect outliers in numerical data
 */
export async function handleOutlierDetection(args: any): Promise<any> {
  const { data, field, method = 'iqr', threshold = 1.5 } = args;

  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    // Extract numerical values
    const values = data
      .map(item => {
        const value = field ? item[field] : item;
        return typeof value === 'number' ? value : parseFloat(value);
      })
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      throw new Error('No valid numerical values found');
    }

    let outliers: any[] = [];
    let stats: any = {};

    // Sort values
    const sorted = [...values].sort((a, b) => a - b);

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    stats = {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: mean.toFixed(2),
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: stdDev.toFixed(2),
      q1,
      q3,
      iqr: iqr.toFixed(2)
    };

    // Detect outliers based on method
    if (method === 'iqr') {
      const lowerBound = q1 - threshold * iqr;
      const upperBound = q3 + threshold * iqr;

      data.forEach((item, index) => {
        const value = field ? item[field] : item;
        const numValue = typeof value === 'number' ? value : parseFloat(value);

        if (!isNaN(numValue) && (numValue < lowerBound || numValue > upperBound)) {
          outliers.push({
            item,
            index,
            value: numValue,
            reason: numValue < lowerBound ? 'below lower bound' : 'above upper bound',
            bounds: { lower: lowerBound.toFixed(2), upper: upperBound.toFixed(2) }
          });
        }
      });
    } else if (method === 'zscore') {
      data.forEach((item, index) => {
        const value = field ? item[field] : item;
        const numValue = typeof value === 'number' ? value : parseFloat(value);

        if (!isNaN(numValue)) {
          const zscore = (numValue - mean) / stdDev;
          if (Math.abs(zscore) > threshold) {
            outliers.push({
              item,
              index,
              value: numValue,
              zscore: zscore.toFixed(2),
              reason: `zscore ${zscore > 0 ? 'above' : 'below'} threshold`
            });
          }
        }
      });
    }

    const outlierPercentage = ((outliers.length / data.length) * 100).toFixed(2);

    let summary = `Outlier Detection Results:\n\nMethod: ${method}\nThreshold: ${threshold}${field ? `\nField Analyzed: ${field}` : ''}\n\nStatistics:\n- Count: ${stats.count}\n- Min: ${stats.min}\n- Max: ${stats.max}\n- Mean: ${stats.mean}\n- Median: ${stats.median}\n- Std Dev: ${stats.stdDev}\n- Q1: ${stats.q1}\n- Q3: ${stats.q3}\n- IQR: ${stats.iqr}`;

    summary += `\n\nOutliers:\n- Count: ${outliers.length}\n- Percentage: ${outlierPercentage}%`;

    if (outliers.length > 0) {
      summary += `\n\nOutlier Samples (Top 10):\n${outliers.slice(0, 10).map((o: any, i: number) => {
        return `${i + 1}. Index ${o.index}: Value=${o.value}, Reason: ${o.reason}${o.zscore ? `, Z-score=${o.zscore}` : ''}${o.bounds ? `, Bounds=[${o.bounds.lower}, ${o.bounds.upper}]` : ''}`;
      }).join('\n')}`;
    }

    return {
      content: [
        {
          type: "text",
          text: summary
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Outlier Detection Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Consistency Checker - Check data consistency across fields
 */
export async function handleConsistencyChecker(args: any): Promise<any> {
  const { data, rules } = args;

  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    if (!rules || !Array.isArray(rules)) {
      if (!rules) return { content: [{ type: "text", text: "No rules provided. Pass." }] };
      throw new Error('Rules must be an array');
    }

    const report: any = {
      totalItems: data.length,
      passedItems: 0,
      failedItems: 0,
      failures: []
    };

    data.forEach((item, index) => {
      let itemPassed = true;
      const itemFailures: any[] = [];

      rules.forEach((rule: any) => {
        try {
          if (rule.type === 'dependency') {
            if (item[rule.field] && !item[rule.dependentField]) {
              itemPassed = false;
              itemFailures.push(`Field '${rule.field}' requires '${rule.dependentField}'`);
            }
          } else if (rule.type === 'value_match') {
            if (item[rule.field] === rule.value && item[rule.targetField] !== rule.targetValue) {
              itemPassed = false;
              itemFailures.push(`When '${rule.field}' is '${rule.value}', '${rule.targetField}' must be '${rule.targetValue}'`);
            }
          }
        } catch (e) {
          itemPassed = false;
          // @ts-ignore
          itemFailures.push(`Rule execution error: ${e.message}`);
        }
      });

      if (itemPassed) {
        report.passedItems++;
      } else {
        report.failedItems++;
        report.failures.push({
          index,
          item,
          errors: itemFailures
        });
      }
    });

    return {
      content: [
        {
          type: "text",
          text: `Consistency Check Results:\nTotal: ${report.totalItems}\nPassed: ${report.passedItems}\nFailed: ${report.failedItems}\n\nFailures:\n${JSON.stringify(report.failures, null, 2)}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Consistency Checker Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

