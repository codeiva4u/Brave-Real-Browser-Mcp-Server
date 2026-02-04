import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'es2015', // ES5/ES6 compatible
    outDir: 'dist',
    shims: true, // Add shims for Node.js compatibility
    treeshake: true,
    minify: false,
    external: [
        'puppeteer-core',
        'playwright-core',
        'brave-real-launcher'
    ],
    banner: {
        js: '/* brave-real-puppeteer-core - Ecosystem Chain Browser Automation */'
    },
    esbuildOptions(options) {
        options.footer = {
            js: '/* Built with tsup */'
        };
    }
});
