
// CRITICAL: This file must be imported BEFORE any other imports in index.ts
// to ensure we patch console and stdout before other modules capture them.

const originalConsoleLog = console.log;
const originalStdoutWrite = process.stdout.write.bind(process.stdout);

// Redirect console.log to stderr
console.log = function (...args) {
    console.error(...args);
};

// Patch process.stdout.write to filter non-JSON content
// @ts-ignore
process.stdout.write = function (chunk: any, encoding?: any, callback?: any) {
    // If arguments match the signature (chunk, encoding, cb) or (chunk, cb)
    if (typeof encoding === 'function') {
        callback = encoding;
        encoding = undefined;
    }

    const str = String(chunk);

    // Heuristic: valid MCP messages are JSON objects starting with '{'
    // Logs usually start with text, brackets like [INFO], dates, etc.
    if (str.trim().startsWith('{')) {
        return originalStdoutWrite(chunk, encoding as BufferEncoding, callback);
    } else {
        // Redirect everything else to stderr
        process.stderr.write(chunk, encoding as BufferEncoding, callback);
        return true;
    }
};

console.error('✅ Console and Stdout patched successfully');
