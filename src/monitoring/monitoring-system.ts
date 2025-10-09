// Monitoring & Reporting System
export interface ProgressData {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
}

export interface ErrorLog {
  timestamp: number;
  error: string;
  context: string;
  stack?: string;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export class MonitoringSystem {
  private progressData: ProgressData = { total: 0, completed: 0, failed: 0, percentage: 0 };
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private dataQualityMetrics: Map<string, number> = new Map();

  trackProgress(total: number, completed: number, failed: number): ProgressData {
    this.progressData = { total, completed, failed, percentage: (completed / total) * 100 };
    return this.progressData;
  }

  getProgress(): ProgressData {
    return this.progressData;
  }

  logError(error: string, context: string, stack?: string): void {
    this.errorLogs.push({ timestamp: Date.now(), error, context, stack });
  }

  getErrors(): ErrorLog[] {
    return this.errorLogs;
  }

  recordPerformance(operation: string, duration: number, success: boolean): void {
    this.performanceMetrics.push({ operation, duration, timestamp: Date.now(), success });
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return this.performanceMetrics;
  }

  getSuccessRate(): number {
    const total = this.performanceMetrics.length;
    if (total === 0) return 100;
    const successful = this.performanceMetrics.filter(m => m.success).length;
    return (successful / total) * 100;
  }

  recordDataQuality(metric: string, value: number): void {
    this.dataQualityMetrics.set(metric, value);
  }

  getDataQualityMetrics(): Record<string, number> {
    return Object.fromEntries(this.dataQualityMetrics);
  }

  generateReport(): string {
    return JSON.stringify({
      progress: this.progressData,
      successRate: this.getSuccessRate(),
      errorCount: this.errorLogs.length,
      performanceAvg: this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length || 0,
      dataQuality: this.getDataQualityMetrics(),
    }, null, 2);
  }

  reset(): void {
    this.progressData = { total: 0, completed: 0, failed: 0, percentage: 0 };
    this.errorLogs = [];
    this.performanceMetrics = [];
    this.dataQualityMetrics.clear();
  }
}
