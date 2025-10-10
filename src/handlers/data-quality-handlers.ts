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
    
    return {
      success: true,
      statistics: {
        original: data.length,
        unique: unique.length,
        duplicates: duplicates.length,
        deduplicationRate: ((duplicates.length / data.length) * 100).toFixed(2) + '%'
      },
      uniqueData: unique,
      duplicateItems: duplicates.slice(0, 10) // Show first 10 duplicates
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
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
    
    return {
      success: true,
      statistics: {
        totalItems: data.length,
        itemsWithMissing: Object.values(missingReport).length > 0 ? 
          [...new Set(Object.values(missingReport).flatMap((r: any) => r.indices))].length : 0,
        totalMissingFields: totalMissing,
        missingRate: ((totalMissing / (data.length * (requiredFields?.length || 1))) * 100).toFixed(2) + '%'
      },
      missingReport,
      processedData: results,
      strategy
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
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
    
    return {
      success: true,
      validation: {
        total: Array.isArray(data) ? data.length : 1,
        valid: validItems.length,
        invalid: invalidItems.length,
        validationRate: ((validItems.length / (Array.isArray(data) ? data.length : 1)) * 100).toFixed(2) + '%'
      },
      validData: validItems,
      invalidData: invalidItems.slice(0, 10), // Show first 10 invalid items
      schema
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
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
    
    return {
      success: true,
      method,
      threshold,
      statistics: stats,
      outliers: {
        count: outliers.length,
        percentage: ((outliers.length / data.length) * 100).toFixed(2) + '%',
        items: outliers.slice(0, 20) // Show first 20 outliers
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
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
    
    return {
      success: true,
      summary: {
        totalItems: data.length,
        totalViolations: violations.length,
        rulesChecked: rules.length,
        consistencyRate: (((data.length - violations.length) / data.length) * 100).toFixed(2) + '%'
      },
      ruleResults,
      violations: violations.slice(0, 20) // Show first 20 violations
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
