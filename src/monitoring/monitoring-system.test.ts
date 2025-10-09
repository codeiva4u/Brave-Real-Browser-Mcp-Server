// Monitoring System Tests
import { describe, it, expect } from 'vitest';
import { MonitoringSystem } from './monitoring-system.js';

describe('Monitoring System', () => {
  it('tracks progress', () => {
    const monitor = new MonitoringSystem();
    const progress = monitor.trackProgress(100, 50, 5);
    expect(progress.percentage).toBe(50);
  });

  it('logs errors', () => {
    const monitor = new MonitoringSystem();
    monitor.logError('Test error', 'Test context');
    expect(monitor.getErrors().length).toBe(1);
  });

  it('records performance', () => {
    const monitor = new MonitoringSystem();
    monitor.recordPerformance('test', 100, true);
    expect(monitor.getPerformanceMetrics().length).toBe(1);
  });

  it('calculates success rate', () => {
    const monitor = new MonitoringSystem();
    monitor.recordPerformance('op1', 100, true);
    monitor.recordPerformance('op2', 100, false);
    expect(monitor.getSuccessRate()).toBe(50);
  });
});
