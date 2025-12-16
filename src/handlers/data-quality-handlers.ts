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

