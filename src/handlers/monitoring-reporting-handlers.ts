// Monitoring & Reporting Module
// Progress tracking, error logging, success rate reporting, metrics
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';

// Global monitoring state
const monitoringState: any = {
  operations: [],
  errors: [],
  metrics: {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalDuration: 0,
    averageDuration: 0,
  },
  startTime: Date.now(),
};

/**
 * Progress Tracker - Track operation progress
 */
export async function handleProgressTracker(args: any) {
  return await withErrorHandling(async () => {
    const action = args.action || 'status'; // status, start, complete, reset
    
    if (action === 'status') {
      const totalOperations = monitoringState.operations.length;
      const completed = monitoringState.operations.filter((op: any) => op.status === 'completed').length;
      const failed = monitoringState.operations.filter((op: any) => op.status === 'failed').length;
      const inProgress = monitoringState.operations.filter((op: any) => op.status === 'in_progress').length;
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Progress Status\n\nTotal Operations: ${totalOperations}\nCompleted: ${completed}\nFailed: ${failed}\nIn Progress: ${inProgress}\nSuccess Rate: ${totalOperations > 0 ? ((completed / totalOperations) * 100).toFixed(2) : 0}%\n\nRecent Operations:\n${JSON.stringify(monitoringState.operations.slice(-5), null, 2)}`,
        }],
      };
    }
    
    if (action === 'start') {
      const operationId = args.operationId || `op_${Date.now()}`;
      const operationName = args.operationName || 'unnamed_operation';
      
      monitoringState.operations.push({
        id: operationId,
        name: operationName,
        status: 'in_progress',
        startTime: Date.now(),
        metadata: args.metadata || {},
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Operation started: ${operationName} (ID: ${operationId})`,
        }],
      };
    }
    
    if (action === 'complete') {
      const operationId = args.operationId;
      const success = args.success !== false;
      
      if (!operationId) {
        throw new Error('Operation ID is required');
      }
      
      const operation = monitoringState.operations.find((op: any) => op.id === operationId);
      
      if (operation) {
        operation.status = success ? 'completed' : 'failed';
        operation.endTime = Date.now();
        operation.duration = operation.endTime - operation.startTime;
        operation.result = args.result;
        
        // Update metrics
        monitoringState.metrics.totalOperations++;
        if (success) {
          monitoringState.metrics.successfulOperations++;
        } else {
          monitoringState.metrics.failedOperations++;
        }
        monitoringState.metrics.totalDuration += operation.duration;
        monitoringState.metrics.averageDuration = 
          monitoringState.metrics.totalDuration / monitoringState.metrics.totalOperations;
        
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Operation ${success ? 'completed' : 'failed'}: ${operation.name}\n\nDuration: ${operation.duration}ms\nResult: ${JSON.stringify(operation.result || {}, null, 2)}`,
          }],
        };
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: `⚠️ Operation not found: ${operationId}`,
        }],
      };
    }
    
    if (action === 'reset') {
      monitoringState.operations = [];
      monitoringState.errors = [];
      monitoringState.metrics = {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        totalDuration: 0,
        averageDuration: 0,
      };
      monitoringState.startTime = Date.now();
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Monitoring state reset`,
        }],
      };
    }

    throw new Error(`Unknown action: ${action}`);
  }, 'Failed progress tracker');
}

/**
 * Error Logger - Log and track errors
 */
export async function handleErrorLogger(args: any) {
  return await withErrorHandling(async () => {
    const action = args.action || 'log'; // log, get, clear
    
    if (action === 'log') {
      const error = {
        id: `err_${Date.now()}`,
        message: args.message || 'Unknown error',
        type: args.type || 'error',
        timestamp: new Date().toISOString(),
        context: args.context || {},
        stackTrace: args.stackTrace || null,
      };
      
      monitoringState.errors.push(error);
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Error logged: ${error.message}\n\n${JSON.stringify(error, null, 2)}`,
        }],
      };
    }
    
    if (action === 'get') {
      const limit = args.limit || 10;
      const errorType = args.type;
      
      let filteredErrors = monitoringState.errors;
      if (errorType) {
        filteredErrors = filteredErrors.filter((err: any) => err.type === errorType);
      }
      
      const recentErrors = filteredErrors.slice(-limit);
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Retrieved ${recentErrors.length} error(s)\n\nTotal Errors: ${monitoringState.errors.length}\n\n${JSON.stringify(recentErrors, null, 2)}`,
        }],
      };
    }
    
    if (action === 'clear') {
      const count = monitoringState.errors.length;
      monitoringState.errors = [];
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Cleared ${count} error(s)`,
        }],
      };
    }

    throw new Error(`Unknown action: ${action}`);
  }, 'Failed error logger');
}

/**
 * Success Rate Reporter - Report success metrics
 */
export async function handleSuccessRateReporter(args: any) {
  return await withErrorHandling(async () => {
    const timeRange = args.timeRange || 'all'; // all, last_hour, last_day
    
    let operations = monitoringState.operations;
    
    if (timeRange === 'last_hour') {
      const hourAgo = Date.now() - (60 * 60 * 1000);
      operations = operations.filter((op: any) => op.startTime >= hourAgo);
    } else if (timeRange === 'last_day') {
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      operations = operations.filter((op: any) => op.startTime >= dayAgo);
    }
    
    const total = operations.length;
    const completed = operations.filter((op: any) => op.status === 'completed').length;
    const failed = operations.filter((op: any) => op.status === 'failed').length;
    const inProgress = operations.filter((op: any) => op.status === 'in_progress').length;
    
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;
    const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;
    
    // Calculate average duration
    const completedOps = operations.filter((op: any) => op.duration !== undefined);
    const avgDuration = completedOps.length > 0 
      ? (completedOps.reduce((sum: number, op: any) => sum + op.duration, 0) / completedOps.length).toFixed(2)
      : 0;
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Success Rate Report (${timeRange})\n\nTotal Operations: ${total}\nCompleted: ${completed}\nFailed: ${failed}\nIn Progress: ${inProgress}\n\nSuccess Rate: ${successRate}%\nFailure Rate: ${failureRate}%\nAverage Duration: ${avgDuration}ms\n\nUptime: ${((Date.now() - monitoringState.startTime) / 1000 / 60).toFixed(2)} minutes`,
      }],
    };
  }, 'Failed success rate reporter');
}

/**
 * Data Quality Metrics - Report data quality metrics
 */
export async function handleDataQualityMetrics(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('data_quality_metrics', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const data = args.data || [];
    
    // Calculate metrics
    const metrics = {
      totalRecords: data.length,
      completeRecords: 0,
      incompleteRecords: 0,
      emptyFields: 0,
      duplicates: 0,
      dataTypes: {} as any,
      fieldCompleteness: {} as any,
    };
    
    if (data.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: `ℹ️ No data provided for quality metrics`,
        }],
      };
    }
    
    // Analyze data quality
    const seenRecords = new Set();
    const allFields = new Set<string>();
    
    data.forEach((record: any) => {
      const recordStr = JSON.stringify(record);
      
      // Check for duplicates
      if (seenRecords.has(recordStr)) {
        metrics.duplicates++;
      } else {
        seenRecords.add(recordStr);
      }
      
      // Collect all fields
      Object.keys(record).forEach(key => allFields.add(key));
      
      // Check completeness
      let hasAllFields = true;
      Object.values(record).forEach(value => {
        if (value === null || value === undefined || value === '') {
          metrics.emptyFields++;
          hasAllFields = false;
        }
      });
      
      if (hasAllFields) {
        metrics.completeRecords++;
      } else {
        metrics.incompleteRecords++;
      }
    });
    
    // Field completeness
    allFields.forEach(field => {
      const nonEmptyCount = data.filter((record: any) => {
        const value = record[field];
        return value !== null && value !== undefined && value !== '';
      }).length;
      
      metrics.fieldCompleteness[field] = ((nonEmptyCount / data.length) * 100).toFixed(2) + '%';
    });
    
    // Data type analysis
    allFields.forEach(field => {
      const types = new Set();
      data.forEach((record: any) => {
        const value = record[field];
        types.add(typeof value);
      });
      metrics.dataTypes[field] = Array.from(types).join(', ');
    });
    
    const qualityScore = ((metrics.completeRecords / metrics.totalRecords) * 100).toFixed(2);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Data Quality Metrics\n\nTotal Records: ${metrics.totalRecords}\nComplete Records: ${metrics.completeRecords}\nIncomplete Records: ${metrics.incompleteRecords}\nDuplicates: ${metrics.duplicates}\nEmpty Fields: ${metrics.emptyFields}\n\nQuality Score: ${qualityScore}%\n\nField Completeness:\n${JSON.stringify(metrics.fieldCompleteness, null, 2)}\n\nData Types:\n${JSON.stringify(metrics.dataTypes, null, 2)}`,
      }],
    };
  }, 'Failed data quality metrics');
}

/**
 * Performance Monitor - Monitor browser and page performance
 */
export async function handlePerformanceMonitor(args: any) {
  return await withErrorHandling(async () => {
    validateWorkflow('performance_monitor', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    
    const performanceData = await page.evaluate(() => {
      const perfData: any = {
        navigation: {},
        resources: [],
        memory: {},
        timing: {},
      };
      
      // Navigation timing
      if (performance.timing) {
        const timing = performance.timing;
        perfData.navigation = {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart,
          firstPaint: timing.responseEnd - timing.requestStart,
        };
      }
      
      // Resource timing
      if (performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource');
        perfData.resources = resources.slice(0, 20).map((resource: any) => ({
          name: resource.name.substring(0, 100),
          type: resource.initiatorType,
          duration: Math.round(resource.duration),
          size: resource.transferSize || 0,
        }));
      }
      
      // Memory (if available)
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        perfData.memory = {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
        };
      }
      
      // Performance marks and measures
      if (performance.getEntriesByType) {
        const marks = performance.getEntriesByType('mark');
        const measures = performance.getEntriesByType('measure');
        
        perfData.timing.marks = marks.length;
        perfData.timing.measures = measures.length;
      }
      
      return perfData;
    });
    
    // Calculate summary
    const resourceCount = performanceData.resources.length;
    const totalResourceDuration = performanceData.resources.reduce((sum: number, r: any) => sum + r.duration, 0);
    const avgResourceDuration = resourceCount > 0 ? (totalResourceDuration / resourceCount).toFixed(2) : 0;
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Performance Monitor\n\nPage Load Metrics:\n${JSON.stringify(performanceData.navigation, null, 2)}\n\nResources (showing ${resourceCount}):\nAverage Load Time: ${avgResourceDuration}ms\n\nMemory Usage:\n${JSON.stringify(performanceData.memory, null, 2)}\n\nTop Resources:\n${JSON.stringify(performanceData.resources.slice(0, 10), null, 2)}`,
      }],
    };
  }, 'Failed performance monitor');
}

/**
 * Get Monitoring Summary - Get overall monitoring summary
 */
export async function handleGetMonitoringSummary(args: any) {
  return await withErrorHandling(async () => {
    const summary = {
      uptime: ((Date.now() - monitoringState.startTime) / 1000 / 60).toFixed(2) + ' minutes',
      operations: {
        total: monitoringState.operations.length,
        completed: monitoringState.operations.filter((op: any) => op.status === 'completed').length,
        failed: monitoringState.operations.filter((op: any) => op.status === 'failed').length,
        inProgress: monitoringState.operations.filter((op: any) => op.status === 'in_progress').length,
      },
      errors: {
        total: monitoringState.errors.length,
        recent: monitoringState.errors.slice(-5),
      },
      metrics: monitoringState.metrics,
    };
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Monitoring Summary\n\n${JSON.stringify(summary, null, 2)}`,
      }],
    };
  }, 'Failed to get monitoring summary');
}
