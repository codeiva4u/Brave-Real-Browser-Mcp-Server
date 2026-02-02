/**
 * 📊 Analytics Dashboard
 * Features: Test results tracking, JSON/HTML reports, performance metrics
 */

import fs from 'fs';
import path from 'path';

// Analytics data storage
let analyticsData = {
    startTime: null,
    endTime: null,
    tests: [],
    metrics: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        avgDuration: 0
    },
    performance: {
        pageLoads: [],
        networkRequests: 0,
        errors: []
    }
};

/**
 * Initialize analytics session
 * @param {string} [sessionId]
 */
export function initAnalytics(sessionId = null) {
    analyticsData = {
        sessionId: sessionId || `session_${Date.now()}`,
        startTime: new Date().toISOString(),
        endTime: null,
        tests: [],
        metrics: {
            totalTests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            avgDuration: 0
        },
        performance: {
            pageLoads: [],
            networkRequests: 0,
            errors: []
        }
    };

    console.log(`[analytics] Session started: ${analyticsData.sessionId}`);
    return analyticsData.sessionId;
}

/**
 * Record a test result
 * @param {Object} testResult
 */
export function recordTest(testResult) {
    const test = {
        name: testResult.name,
        status: testResult.status, // 'passed', 'failed', 'skipped'
        duration: testResult.duration || 0,
        timestamp: new Date().toISOString(),
        error: testResult.error || null,
        details: testResult.details || {}
    };

    analyticsData.tests.push(test);
    analyticsData.metrics.totalTests++;

    if (test.status === 'passed') analyticsData.metrics.passed++;
    else if (test.status === 'failed') analyticsData.metrics.failed++;
    else if (test.status === 'skipped') analyticsData.metrics.skipped++;

    // Update average duration
    const totalDuration = analyticsData.tests.reduce((sum, t) => sum + t.duration, 0);
    analyticsData.metrics.avgDuration = totalDuration / analyticsData.tests.length;

    console.log(`[analytics] Test recorded: ${test.name} - ${test.status} (${test.duration}ms)`);
}

/**
 * Record page load performance
 * @param {string} url
 * @param {number} loadTime
 */
export function recordPageLoad(url, loadTime) {
    analyticsData.performance.pageLoads.push({
        url,
        loadTime,
        timestamp: new Date().toISOString()
    });
}

/**
 * Record error
 * @param {string} type
 * @param {string} message
 * @param {Object} [context]
 */
export function recordError(type, message, context = {}) {
    analyticsData.performance.errors.push({
        type,
        message,
        context,
        timestamp: new Date().toISOString()
    });
}

/**
 * Finish analytics session
 * @returns {Object}
 */
export function finishSession() {
    analyticsData.endTime = new Date().toISOString();

    const start = new Date(analyticsData.startTime);
    const end = new Date(analyticsData.endTime);
    analyticsData.totalDuration = end - start;

    console.log(`[analytics] Session finished. Duration: ${analyticsData.totalDuration}ms`);
    return getAnalyticsSummary();
}

/**
 * Get analytics summary
 * @returns {Object}
 */
export function getAnalyticsSummary() {
    const successRate = analyticsData.metrics.totalTests > 0
        ? (analyticsData.metrics.passed / analyticsData.metrics.totalTests * 100).toFixed(1)
        : 0;

    const avgPageLoad = analyticsData.performance.pageLoads.length > 0
        ? analyticsData.performance.pageLoads.reduce((sum, p) => sum + p.loadTime, 0) / analyticsData.performance.pageLoads.length
        : 0;

    return {
        sessionId: analyticsData.sessionId,
        duration: analyticsData.totalDuration,
        successRate: `${successRate}%`,
        tests: {
            total: analyticsData.metrics.totalTests,
            passed: analyticsData.metrics.passed,
            failed: analyticsData.metrics.failed,
            skipped: analyticsData.metrics.skipped,
            avgDuration: `${analyticsData.metrics.avgDuration.toFixed(2)}ms`
        },
        performance: {
            avgPageLoad: `${avgPageLoad.toFixed(2)}ms`,
            errorCount: analyticsData.performance.errors.length
        }
    };
}

/**
 * Export analytics to JSON file
 * @param {string} [filePath]
 * @returns {string} File path
 */
export function exportToJSON(filePath = null) {
    const outputPath = filePath || `analytics_${analyticsData.sessionId}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(analyticsData, null, 2));
    console.log(`[analytics] Exported to JSON: ${outputPath}`);
    return outputPath;
}

/**
 * Export analytics to HTML dashboard
 * @param {string} [filePath]
 * @returns {string} File path
 */
export function exportToHTML(filePath = null) {
    const summary = getAnalyticsSummary();
    const outputPath = filePath || `analytics_${analyticsData.sessionId}.html`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦁 Brave Stealth Analytics Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; min-height: 100vh; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 30px; font-size: 2.5rem; }
        h1 span { color: #ff6b35; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 25px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .card h3 { font-size: 0.9rem; opacity: 0.7; margin-bottom: 10px; text-transform: uppercase; }
        .card .value { font-size: 2.5rem; font-weight: bold; }
        .card.success .value { color: #4ade80; }
        .card.danger .value { color: #f87171; }
        .card.warning .value { color: #fbbf24; }
        .card.info .value { color: #60a5fa; }
        .tests-table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
        .tests-table th, .tests-table td { padding: 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .tests-table th { background: rgba(255,255,255,0.1); }
        .status-passed { color: #4ade80; }
        .status-failed { color: #f87171; }
        .status-skipped { color: #fbbf24; }
        .footer { text-align: center; margin-top: 30px; opacity: 0.5; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🦁 <span>Brave Stealth</span> Analytics</h1>
        
        <div class="cards">
            <div class="card success">
                <h3>Success Rate</h3>
                <div class="value">${summary.successRate}</div>
            </div>
            <div class="card info">
                <h3>Total Tests</h3>
                <div class="value">${summary.tests.total}</div>
            </div>
            <div class="card success">
                <h3>Passed</h3>
                <div class="value">${summary.tests.passed}</div>
            </div>
            <div class="card danger">
                <h3>Failed</h3>
                <div class="value">${summary.tests.failed}</div>
            </div>
            <div class="card info">
                <h3>Avg Duration</h3>
                <div class="value">${summary.tests.avgDuration}</div>
            </div>
            <div class="card warning">
                <h3>Avg Page Load</h3>
                <div class="value">${summary.performance.avgPageLoad}</div>
            </div>
        </div>
        
        <h2 style="margin-bottom: 20px;">📋 Test Results</h2>
        <table class="tests-table">
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                ${analyticsData.tests.map(t => `
                <tr>
                    <td>${t.name}</td>
                    <td class="status-${t.status}">${t.status.toUpperCase()}</td>
                    <td>${t.duration}ms</td>
                    <td>${new Date(t.timestamp).toLocaleString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="footer">
            <p>Session: ${analyticsData.sessionId} | Duration: ${analyticsData.totalDuration || 'In Progress'}ms</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    console.log(`[analytics] Exported to HTML: ${outputPath}`);
    return outputPath;
}

/**
 * Get raw analytics data
 * @returns {Object}
 */
export function getRawData() {
    return { ...analyticsData };
}

/**
 * Create console summary
 */
export function printSummary() {
    const summary = getAnalyticsSummary();
    console.log('\n📊 ANALYTICS SUMMARY');
    console.log('═'.repeat(40));
    console.log(`📋 Session: ${summary.sessionId}`);
    console.log(`⏱️  Duration: ${summary.duration}ms`);
    console.log(`✅ Success Rate: ${summary.successRate}`);
    console.log(`📝 Tests: ${summary.tests.passed}/${summary.tests.total} passed`);
    console.log(`⚡ Avg Duration: ${summary.tests.avgDuration}`);
    console.log(`🌐 Avg Page Load: ${summary.performance.avgPageLoad}`);
    console.log(`❌ Errors: ${summary.performance.errorCount}`);
    console.log('═'.repeat(40) + '\n');
}

// Default export
export default {
    initAnalytics,
    recordTest,
    recordPageLoad,
    recordError,
    finishSession,
    getAnalyticsSummary,
    exportToJSON,
    exportToHTML,
    getRawData,
    printSummary
};
