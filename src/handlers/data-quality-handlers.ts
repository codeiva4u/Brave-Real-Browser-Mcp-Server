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
export async function handleMissingDataHandler(args: any): Promise<any> {
  const { data, requiredFields, strategy = 'report' } = args;
  
  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }
    
    const results: any[] = [];
    const missingReport: any = {};
    let totalMissing = 0;
    
    data.forEach((item, index) => {
      const itemMissing: any = {};
      let hasMissing = false;
      
      if (requiredFields && Array.isArray(requiredFields)) {
        requiredFields.forEach(field => {
          const value = item[field];
          if (value === undefined || value === null || value === '') {
            itemMissing[field] = true;
            hasMissing = true;
            totalMissing++;
            
            if (!missingReport[field]) {
              missingReport[field] = { count: 0, indices: [] };
            }
            missingReport[field].count++;
            missingReport[field].indices.push(index);
          }
        });
      }
      
      // Handle missing data based on strategy
      let processedItem = { ...item };
      
      switch (strategy) {
        case 'remove':
          if (!hasMissing) results.push(processedItem);
          break;
        
        case 'fill':
          Object.keys(itemMissing).forEach(field => {
            if (typeof item[field] === 'number') {
              processedItem[field] = 0;
            } else if (typeof item[field] === 'string') {
              processedItem[field] = 'N/A';
            } else {
              processedItem[field] = null;
            }
          });
          results.push(processedItem);
          break;
        
        case 'flag':
          processedItem._hasMissingData = hasMissing;
          processedItem._missingFields = Object.keys(itemMissing);
          results.push(processedItem);
          break;
        
        case 'report':
        default:
          results.push(processedItem);
          break;
      }
    });
    
    const itemsWithMissing = Object.values(missingReport).length > 0 ? 
      [...new Set(Object.values(missingReport).flatMap((r: any) => r.indices))].length : 0;
    const missingRate = ((totalMissing / (data.length * (requiredFields?.length || 1))) * 100).toFixed(2);
    
    let summary = `Missing Data Analysis:\n\nStatistics:\n- Total Items: ${data.length}\n- Items with Missing Data: ${itemsWithMissing}\n- Total Missing Fields: ${totalMissing}\n- Missing Rate: ${missingRate}%\n- Strategy: ${strategy}`;
    
    if (Object.keys(missingReport).length > 0) {
      summary += `\n\nMissing Fields Report:\n${Object.entries(missingReport).map(([field, info]: [string, any]) => `- ${field}: ${info.count} occurrences (indices: ${info.indices.slice(0, 5).join(', ')}${info.indices.length > 5 ? '...' : ''})`).join('\n')}`;
    }
    
    summary += `\n\nProcessed Items: ${results.length}`;
    
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
          text: `Missing Data Handler Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

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
      throw new Error('Rules must be provided as an array');
    }
    
    const violations: any[] = [];
    const ruleResults: any = {};
    
    rules.forEach(rule => {
      ruleResults[rule.name] = { passed: 0, failed: 0, violations: [] };
    });
    
    data.forEach((item, index) => {
      rules.forEach(rule => {
        let passed = true;
        let reason = '';
        
        try {
          switch (rule.type) {
            case 'required':
              if (item[rule.field] === undefined || item[rule.field] === null || item[rule.field] === '') {
                passed = false;
                reason = `Field '${rule.field}' is required but missing`;
              }
              break;
            
            case 'range':
              const value = parseFloat(item[rule.field]);
              if (isNaN(value) || value < rule.min || value > rule.max) {
                passed = false;
                reason = `Field '${rule.field}' value ${value} is outside range [${rule.min}, ${rule.max}]`;
              }
              break;
            
            case 'pattern':
              const regex = new RegExp(rule.pattern);
              if (!regex.test(String(item[rule.field]))) {
                passed = false;
                reason = `Field '${rule.field}' does not match pattern ${rule.pattern}`;
              }
              break;
            
            case 'dependency':
              if (item[rule.field] && !item[rule.dependsOn]) {
                passed = false;
                reason = `Field '${rule.field}' requires '${rule.dependsOn}' to be present`;
              }
              break;
            
            case 'unique':
              // Check uniqueness within dataset
              const duplicates = data.filter(d => d[rule.field] === item[rule.field]);
              if (duplicates.length > 1) {
                passed = false;
                reason = `Field '${rule.field}' value '${item[rule.field]}' is not unique`;
              }
              break;
            
            case 'comparison':
              const val1 = parseFloat(item[rule.field1]);
              const val2 = parseFloat(item[rule.field2]);
              let comparisonPassed = false;
              
              switch (rule.operator) {
                case '>': comparisonPassed = val1 > val2; break;
                case '<': comparisonPassed = val1 < val2; break;
                case '>=': comparisonPassed = val1 >= val2; break;
                case '<=': comparisonPassed = val1 <= val2; break;
                case '==': comparisonPassed = val1 === val2; break;
                case '!=': comparisonPassed = val1 !== val2; break;
              }
              
              if (!comparisonPassed) {
                passed = false;
                reason = `Comparison failed: ${rule.field1} (${val1}) ${rule.operator} ${rule.field2} (${val2})`;
              }
              break;
          }
        } catch (err: any) {
          passed = false;
          reason = `Error checking rule: ${err.message}`;
        }
        
        if (passed) {
          ruleResults[rule.name].passed++;
        } else {
          ruleResults[rule.name].failed++;
          const violation = {
            index,
            item,
            rule: rule.name,
            reason
          };
          ruleResults[rule.name].violations.push(violation);
          violations.push(violation);
        }
      });
    });
    
    const consistencyRate = (((data.length - violations.length) / data.length) * 100).toFixed(2);
    
    let summary = `Consistency Check Results:\n\nSummary:\n- Total Items: ${data.length}\n- Rules Checked: ${rules.length}\n- Total Violations: ${violations.length}\n- Consistency Rate: ${consistencyRate}%`;
    
    summary += `\n\nRule Results:\n${Object.entries(ruleResults).map(([name, result]: [string, any]) => `- ${name}: ${result.passed} passed, ${result.failed} failed`).join('\n')}`;
    
    if (violations.length > 0) {
      summary += `\n\nViolations (Top 10):\n${violations.slice(0, 10).map((v: any, i: number) => `${i + 1}. Index ${v.index} - Rule: ${v.rule}\n   Reason: ${v.reason}`).join('\n')}`;
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
          text: `Consistency Checker Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}
