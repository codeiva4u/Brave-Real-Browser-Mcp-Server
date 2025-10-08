// Monitoring & Reporting Tools Module
// Progress Tracker, Error Logger, Success Reporter, Data Quality Metrics

/**
 * Progress Tracker
 * Scraping progress को real-time monitor करना
 */
export class ProgressTracker {
  private total: number = 0;
  private completed: number = 0;
  private failed: number = 0;
  private startTime: number = 0;
  private currentTask: string = '';
  
  start(totalItems: number, taskName: string = 'Scraping'): void {
    this.total = totalItems;
    this.completed = 0;
    this.failed = 0;
    this.startTime = Date.now();
    this.currentTask = taskName;
  }
  
  increment(success: boolean = true): void {
    this.completed++;
    if (!success) {
      this.failed++;
    }
  }
  
  getProgress(): {
    total: number;
    completed: number;
    failed: number;
    successful: number;
    percentage: number;
    elapsedTime: number;
    estimatedTimeRemaining: number;
    currentTask: string;
  } {
    const successful = this.completed - this.failed;
    const percentage = this.total > 0 ? (this.completed / this.total) * 100 : 0;
    const elapsedTime = Date.now() - this.startTime;
    
    // Estimate time remaining
    const avgTimePerItem = this.completed > 0 ? elapsedTime / this.completed : 0;
    const itemsRemaining = this.total - this.completed;
    const estimatedTimeRemaining = avgTimePerItem * itemsRemaining;
    
    return {
      total: this.total,
      completed: this.completed,
      failed: this.failed,
      successful,
      percentage: Math.round(percentage * 100) / 100,
      elapsedTime,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
      currentTask: this.currentTask
    };
  }
  
  getProgressBar(width: number = 50): string {
    const progress = this.getProgress();
    const filled = Math.round((progress.percentage / 100) * width);
    const empty = width - filled;
    
    return `[${'='.repeat(filled)}${' '.repeat(empty)}] ${progress.percentage}% (${progress.completed}/${progress.total})`;
  }
  
  reset(): void {
    this.total = 0;
    this.completed = 0;
    this.failed = 0;
    this.startTime = 0;
    this.currentTask = '';
  }
}

/**
 * Error Logger
 * Failed requests और errors को log करना
 */
export class ErrorLogger {
  private errors: Array<{
    timestamp: number;
    url?: string;
    error: string;
    stackTrace?: string;
    context?: any;
  }> = [];
  
  private maxErrors: number = 1000;
  
  log(error: Error | string, context?: { url?: string; [key: string]: any }): void {
    const errorEntry = {
      timestamp: Date.now(),
      url: context?.url,
      error: error instanceof Error ? error.message : error,
      stackTrace: error instanceof Error ? error.stack : undefined,
      context
    };
    
    this.errors.push(errorEntry);
    
    // Keep only last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }
  
  getErrors(limit?: number): typeof this.errors {
    if (limit) {
      return this.errors.slice(-limit);
    }
    return [...this.errors];
  }
  
  getErrorCount(): number {
    return this.errors.length;
  }
  
  getErrorsByUrl(url: string): typeof this.errors {
    return this.errors.filter(e => e.url === url);
  }
  
  getRecentErrors(minutes: number = 5): typeof this.errors {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.errors.filter(e => e.timestamp >= cutoff);
  }
  
  clearErrors(): void {
    this.errors = [];
  }
  
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
  
  getErrorSummary(): {
    totalErrors: number;
    uniqueUrls: number;
    errorTypes: { [key: string]: number };
    recentErrors: number;
  } {
    const uniqueUrls = new Set(this.errors.map(e => e.url).filter(Boolean)).size;
    const errorTypes: { [key: string]: number } = {};
    
    this.errors.forEach(e => {
      const errorMsg = e.error.split(':')[0];
      errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
    });
    
    const recentErrors = this.getRecentErrors(5).length;
    
    return {
      totalErrors: this.errors.length,
      uniqueUrls,
      errorTypes,
      recentErrors
    };
  }
}

/**
 * Success Reporter
 * Scraping success/failure statistics
 */
export class SuccessReporter {
  private stats = {
    total: 0,
    successful: 0,
    failed: 0,
    startTime: 0,
    endTime: 0,
    urls: new Map<string, { success: boolean; time: number }>()
  };
  
  start(): void {
    this.stats.startTime = Date.now();
  }
  
  recordSuccess(url?: string, responseTime?: number): void {
    this.stats.total++;
    this.stats.successful++;
    
    if (url) {
      this.stats.urls.set(url, {
        success: true,
        time: responseTime || 0
      });
    }
  }
  
  recordFailure(url?: string): void {
    this.stats.total++;
    this.stats.failed++;
    
    if (url) {
      this.stats.urls.set(url, {
        success: false,
        time: 0
      });
    }
  }
  
  end(): void {
    this.stats.endTime = Date.now();
  }
  
  getReport(): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    failureRate: number;
    duration: number;
    avgResponseTime: number;
    urlCount: number;
  } {
    const successRate = this.stats.total > 0 
      ? (this.stats.successful / this.stats.total) * 100 
      : 0;
    
    const failureRate = 100 - successRate;
    
    const duration = this.stats.endTime > 0 
      ? this.stats.endTime - this.stats.startTime 
      : Date.now() - this.stats.startTime;
    
    const responseTimes = Array.from(this.stats.urls.values())
      .filter(u => u.success && u.time > 0)
      .map(u => u.time);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    return {
      total: this.stats.total,
      successful: this.stats.successful,
      failed: this.stats.failed,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      duration,
      avgResponseTime: Math.round(avgResponseTime),
      urlCount: this.stats.urls.size
    };
  }
  
  getDetailedReport(): string {
    const report = this.getReport();
    
    return `
📊 Scraping Statistics Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Requests: ${report.total}
✅ Successful: ${report.successful}
❌ Failed: ${report.failed}

Success Rate: ${report.successRate}%
Failure Rate: ${report.failureRate}%

Duration: ${(report.duration / 1000).toFixed(2)}s
Average Response Time: ${report.avgResponseTime}ms
Unique URLs: ${report.urlCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
  
  reset(): void {
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      startTime: 0,
      endTime: 0,
      urls: new Map()
    };
  }
}

/**
 * Data Quality Metrics
 * Extracted data की quality measure करना
 */
export class DataQualityMetrics {
  private metrics = {
    totalRecords: 0,
    completeRecords: 0,
    incompleteRecords: 0,
    duplicateRecords: 0,
    fieldCompleteness: new Map<string, { total: number; filled: number }>()
  };
  
  analyze(data: any[], requiredFields?: string[]): {
    totalRecords: number;
    completeRecords: number;
    incompleteRecords: number;
    duplicateRecords: number;
    completenessRate: number;
    duplicateRate: number;
    fieldCompleteness: { [key: string]: number };
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    this.reset();
    this.metrics.totalRecords = data.length;
    
    // Track seen records for duplicate detection
    const seen = new Set<string>();
    
    data.forEach(record => {
      // Check for duplicates
      const recordKey = JSON.stringify(record);
      if (seen.has(recordKey)) {
        this.metrics.duplicateRecords++;
      } else {
        seen.add(recordKey);
      }
      
      // Check completeness
      const fields = requiredFields || Object.keys(record);
      let isComplete = true;
      
      fields.forEach(field => {
        if (!this.metrics.fieldCompleteness.has(field)) {
          this.metrics.fieldCompleteness.set(field, { total: 0, filled: 0 });
        }
        
        const stats = this.metrics.fieldCompleteness.get(field)!;
        stats.total++;
        
        if (record[field] !== null && 
            record[field] !== undefined && 
            record[field] !== '') {
          stats.filled++;
        } else {
          isComplete = false;
        }
      });
      
      if (isComplete) {
        this.metrics.completeRecords++;
      } else {
        this.metrics.incompleteRecords++;
      }
    });
    
    const completenessRate = this.metrics.totalRecords > 0
      ? (this.metrics.completeRecords / this.metrics.totalRecords) * 100
      : 0;
    
    const duplicateRate = this.metrics.totalRecords > 0
      ? (this.metrics.duplicateRecords / this.metrics.totalRecords) * 100
      : 0;
    
    const fieldCompleteness: { [key: string]: number } = {};
    this.metrics.fieldCompleteness.forEach((value, key) => {
      fieldCompleteness[key] = value.total > 0
        ? Math.round((value.filled / value.total) * 100 * 100) / 100
        : 0;
    });
    
    // Determine overall quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (completenessRate >= 95 && duplicateRate < 5) {
      quality = 'excellent';
    } else if (completenessRate >= 80 && duplicateRate < 10) {
      quality = 'good';
    } else if (completenessRate >= 60 && duplicateRate < 20) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }
    
    return {
      totalRecords: this.metrics.totalRecords,
      completeRecords: this.metrics.completeRecords,
      incompleteRecords: this.metrics.incompleteRecords,
      duplicateRecords: this.metrics.duplicateRecords,
      completenessRate: Math.round(completenessRate * 100) / 100,
      duplicateRate: Math.round(duplicateRate * 100) / 100,
      fieldCompleteness,
      quality
    };
  }
  
  reset(): void {
    this.metrics = {
      totalRecords: 0,
      completeRecords: 0,
      incompleteRecords: 0,
      duplicateRecords: 0,
      fieldCompleteness: new Map()
    };
  }
}

/**
 * Performance Monitor
 * Scraping speed और efficiency track करना
 */
export class PerformanceMonitor {
  private metrics: Array<{
    timestamp: number;
    operation: string;
    duration: number;
    success: boolean;
  }> = [];
  
  private startTimes: Map<string, number> = new Map();
  
  startOperation(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }
  
  endOperation(operationId: string, operationName: string, success: boolean = true): void {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) return;
    
    const duration = Date.now() - startTime;
    
    this.metrics.push({
      timestamp: Date.now(),
      operation: operationName,
      duration,
      success
    });
    
    this.startTimes.delete(operationId);
  }
  
  getMetrics(): {
    totalOperations: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    successfulOperations: number;
    failedOperations: number;
    operationsPerSecond: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successfulOperations: 0,
        failedOperations: 0,
        operationsPerSecond: 0
      };
    }
    
    const durations = this.metrics.map(m => m.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    const successfulOperations = this.metrics.filter(m => m.success).length;
    const failedOperations = this.metrics.length - successfulOperations;
    
    const timeRange = this.metrics[this.metrics.length - 1].timestamp - this.metrics[0].timestamp;
    const operationsPerSecond = timeRange > 0 
      ? (this.metrics.length / timeRange) * 1000 
      : 0;
    
    return {
      totalOperations: this.metrics.length,
      avgDuration: Math.round(avgDuration),
      minDuration,
      maxDuration,
      successfulOperations,
      failedOperations,
      operationsPerSecond: Math.round(operationsPerSecond * 100) / 100
    };
  }
}

// Global instances
export const globalProgressTracker = new ProgressTracker();
export const globalErrorLogger = new ErrorLogger();
export const globalSuccessReporter = new SuccessReporter();
export const globalDataQualityMetrics = new DataQualityMetrics();
export const globalPerformanceMonitor = new PerformanceMonitor();
