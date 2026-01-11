#!/usr/bin/env node

/**
 * 🦁 Brave Real MCP Server - Ordered Build Script
 * 
 * Builds all workspace packages in dependency order:
 * 1. brave-real-launcher (base)
 * 2. brave-real-puppeteer-core (depends on launcher)
 * 3. brave-real-browser (depends on core)
 */

import { spawn } from 'child_process';
import { existsSync, promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Build order (mcp-server is built separately via tsc)
const BUILD_ORDER = [
  { name: 'brave-real-launcher', path: 'packages/brave-real-launcher' },
  { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core' },
  { name: 'brave-real-browser', path: 'packages/brave-real-browser' }
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });

    proc.on('error', reject);
  });
}

async function buildPackage(pkg) {
  const pkgPath = join(rootDir, pkg.path);
  const pkgJsonPath = join(pkgPath, 'package.json');

  if (!existsSync(pkgJsonPath)) {
    log(`⚠️  Skipping ${pkg.name} - not found`, 'yellow');
    return;
  }

  const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));

  if (!pkgJson.scripts?.build) {
    log(`⏭️  Skipping ${pkg.name} - no build script`, 'yellow');
    return;
  }

  log(`\n🔨 Building ${pkg.name}...`, 'cyan');

  try {
    await runCommand('npm', ['run', 'build'], pkgPath);
    log(`✅ ${pkg.name} built!`, 'green');
  } catch (error) {
    log(`❌ ${pkg.name} build failed!`, 'red');
    throw error;
  }
}

async function main() {
  log('\n🦁 Building Dependencies in Order', 'bright');
  log('=' .repeat(40), 'cyan');
  
  const startTime = Date.now();

  for (const pkg of BUILD_ORDER) {
    await buildPackage(pkg);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log('\n' + '=' .repeat(40), 'cyan');
  log(`🎉 Done in ${duration}s!`, 'green');
}

main().catch((error) => {
  log(`\n💥 Build failed: ${error.message}`, 'red');
  process.exit(1);
});
