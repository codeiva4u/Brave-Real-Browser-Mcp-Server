#! /usr/bin/env node

import { readFile, access, constants } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import {
  exec,
  fatalError,
  getPatchBaseCmd,
  getPatcherPackagePath,
  log,
  validPackagesNames,
  findBestBrowser,
  logBrowserInfo,
} from './utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enhanced validation and backup functionality
async function validatePackage(packagePath, packageName) {
  try {
    await access(packagePath, constants.F_OK);
    const packageJsonPath = resolve(packagePath, 'package.json');
    const packageJsonText = await readFile(packageJsonPath, { encoding: 'utf8' });
    const packageJson = JSON.parse(packageJsonText);
    
    if (packageName && packageJson.name !== packageName) {
      throw new Error(`Package name mismatch: found "${packageJson.name}", expected "${packageName}"`);
    }
    
    return packageJson;
  } catch (error) {
    throw new Error(`Package validation failed: ${error.message}`);
  }
}

async function createBackup(packagePath, packageName, codeTarget) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = resolve(packagePath, `backup-${packageName}-${codeTarget}-${timestamp}`);
  
  try {
    const backupCmd = process.platform === 'win32' 
      ? `xcopy "${packagePath}" "${backupPath}" /E /I /Q`
      : `cp -r "${packagePath}" "${backupPath}"`;
    
    await exec(backupCmd);
    log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    log(`⚠️ Backup creation failed: ${error.message}`);
    return null;
  }
}

(async () => {
  // Enhanced config and preparations
  const cliArgs = yargs(hideBin(process.argv))
    .usage('Usage: <command> [options]')
    .command('patch', 'Apply stealth patches')
    .command('unpatch', 'Reverse stealth patches')
    .command('check', 'Check patch status')
    .command('patch-all', 'Patch both puppeteer-core and playwright-core')
    .command('validate', 'Validate package compatibility')
    .describe('packageName', `Target package: ${validPackagesNames.join(', ')}`)
    .describe('packagePath', 'Custom package path')
    .describe('codeTarget', 'Target code: src or lib')
    .describe('backup', 'Create backup before patching')
    .describe('force', 'Force patch even if already applied')
    .boolean('debug')
    .boolean('backup')
    .boolean('force')
    .describe('debug', 'Enable verbose debugging')
    .demandCommand(1, 1, 'Error: specify command (patch, unpatch, check, patch-all, validate)')
    .parse()

  let {
    packageName,
    packagePath,
    codeTarget = 'lib',
    debug,
    backup = false,
    force = false,
  } = cliArgs

  if (debug) {
    process.env.REBROWSER_PATCHES_DEBUG = 1
    log('🐛 Debug mode enabled')
  }

  const command = cliArgs._[0]
  let commandResult

  // Handle special commands
  if (command === 'patch-all') {
    // 🦁 AUTO-DETECT BROWSER WITH BRAVE PREFERENCE
    log('🦁 Starting Browser Auto-Detection...');
    const browserInfo = findBestBrowser();
    logBrowserInfo(browserInfo);
    
    // Set browser environment variables for stealth optimizations
    if (browserInfo.path) {
      process.env.REBROWSER_AUTO_BROWSER_PATH = browserInfo.path;
      process.env.REBROWSER_AUTO_BROWSER_TYPE = browserInfo.browser;
      process.env.REBROWSER_AUTO_BROWSER_NAME = browserInfo.name;
      process.env.REBROWSER_AUTO_BROWSER_PRIORITY = browserInfo.priority.toString();
      
      // Enable browser-specific optimizations
      if (browserInfo.browser === 'brave') {
        process.env.REBROWSER_STEALTH_BRAVE_OPTIMIZATIONS = '1';
        log('🦁 Brave browser optimizations enabled');
      } else if (browserInfo.browser === 'chrome') {
        process.env.REBROWSER_STEALTH_CHROME_OPTIMIZATIONS = '1';
        log('🔵 Chrome browser optimizations enabled');
      }
    }
    
    const packages = packageName ? [packageName] : ['puppeteer-core', 'playwright-core'];
    log(`🔄 Patching ${packageName ? packageName : 'all supported packages'} with browser auto-detection...`);
    let allSuccess = true;
    
    for (const pkg of packages) {
      const pkgPath = `${process.cwd()}/node_modules/${pkg}`;
      try {
        await validatePackage(pkgPath, pkg);
        log(`📦 Processing ${pkg}...`);
        
        for (const target of ['lib', 'src']) {
          try {
            const patchPath = resolve(getPatcherPackagePath(), `./patches/${pkg}/${target}.patch`);
            await access(patchPath, constants.F_OK);
            
            // Check if already patched first
            let patchStatus = 'unknown';
            try {
              await exec(`${getPatchBaseCmd(patchPath)} --dry-run`, { cwd: pkgPath });
              patchStatus = 'unpatched';
            } catch (e) {
              if (e.stdout && e.stdout.includes('Ignoring previously applied')) {
                patchStatus = 'patched';
              }
            }
            
            if (patchStatus === 'patched') {
              log(`✅ ${pkg}/${target} already patched`);
            } else {
              const patchCmd = getPatchBaseCmd(patchPath);
              await exec(patchCmd, { cwd: pkgPath });
              log(`✅ ${pkg}/${target} patched successfully`);
            }
          } catch (error) {
            log(`⚠️ ${pkg}/${target} patch failed: ${error.message}`);
          }
        }
      } catch (error) {
        log(`❌ ${pkg} not found or invalid: ${error.message}`);
        allSuccess = false;
      }
    }
    
    log(allSuccess ? '🎉 Patches completed!' : '⚠️ Some patches failed');
    process.exit(allSuccess ? 0 : 1);
  }
  
  if (command === 'validate') {
    if (!packagePath && !packageName) {
      fatalError('Specify packageName or packagePath for validation')
    }
    
    if (!packagePath) {
      packagePath = `${process.cwd()}/node_modules/${packageName}`
    }
    
    try {
      const packageJson = await validatePackage(packagePath, packageName);
      log(`✅ Package "${packageJson.name}" v${packageJson.version} is valid`);
      log(`📍 Location: ${packagePath}`);
      process.exit(0);
    } catch (error) {
      fatalError(`Validation failed: ${error.message}`);
    }
  }

  if (!packagePath && !packageName) {
    fatalError('You need to specify either packageName or packagePath.')
  }

  if (!packagePath) {
    packagePath = `${process.cwd()}/node_modules/${packageName}`
  }

  if (!['patch', 'unpatch', 'check'].includes(command)) {
    fatalError(`Unknown command: ${command}. Use: patch, unpatch, check, patch-all, validate`)
  }

  if (!['src', 'lib'].includes(codeTarget)) {
    fatalError(`Unknown codeTarget: ${codeTarget}. Use: src or lib`)
  }

  // 🦁 BROWSER AUTO-DETECTION FOR INDIVIDUAL COMMANDS
  const browserInfo = findBestBrowser();
  if (browserInfo.path) {
    process.env.REBROWSER_AUTO_BROWSER_PATH = browserInfo.path;
    process.env.REBROWSER_AUTO_BROWSER_TYPE = browserInfo.browser;
    process.env.REBROWSER_AUTO_BROWSER_NAME = browserInfo.name;
    process.env.REBROWSER_AUTO_BROWSER_PRIORITY = browserInfo.priority.toString();
  }
  
  log('Config:')
  log(`command = ${command}, packageName = ${packageName}, codeTarget = ${codeTarget}`)
  log(`packagePath = ${packagePath}`)
  logBrowserInfo(browserInfo);
  log('------')

  // Enhanced package validation
  let packageJson
  try {
    packageJson = await validatePackage(packagePath, packageName);
    if (!packageName) {
      packageName = packageJson.name;
    }
    log(`📦 Found package "${packageJson.name}" v${packageJson.version}`);
    log(`📍 Package path: ${packagePath}`);
  } catch (error) {
    fatalError(`Package validation failed: ${error.message}`);
  }
  
  if (!validPackagesNames.includes(packageName)) {
    fatalError(`Package "${packageName}" is not supported. Supported: ${validPackagesNames.join(', ')}`);
  }

  const patchFilePath = resolve(getPatcherPackagePath(), `./patches/${packageName}/${codeTarget}.patch`)

  // check patch status
  let patchStatus
  try {
    const { stdout, stderr } = await exec(`${getPatchBaseCmd(patchFilePath)} --dry-run`, {
      cwd: packagePath,
    })
    patchStatus = 'unpatched'
  } catch (e) {
    if (e.stdout.includes('No file to patch')) {
      fatalError('Internal error, patch command cannot find file to patch')
    } else if (e.stdout.includes('Ignoring previously applied (or reversed) patch')) {
      patchStatus = 'patched'
    } else if (e.stderr.includes('is not recognized')) {
      let message = 'patch command not found!'
      if (process.platform === 'win32') {
        message += '\nCheck README for how to install patch.exe on Windows.'
      }
      fatalError(message)
    } else {
      log('[debug] patch error:', e)
      throw e
    }
  }
  log(`Current patch status = ${patchStatus === 'patched' ? '🟩' : '🟧'} ${patchStatus}`)

  // Enhanced command execution with backup support
  let execCmd
  let backupPath
  
  if (command === 'patch') {
    if (patchStatus === 'patched' && !force) {
      log('✅ Package already patched. Use --force to reapply.')
    } else {
      if (backup) {
        backupPath = await createBackup(packagePath, packageName, codeTarget);
      }
      
      execCmd = getPatchBaseCmd(patchFilePath)
      if (force && patchStatus === 'patched') {
        log('🔄 Force patching already patched package...')
      }
    }
  } else if (command === 'unpatch') {
    if (patchStatus === 'unpatched') {
      log('✅ Package already unpatched.')
    } else {
      if (backup) {
        backupPath = await createBackup(packagePath, packageName, codeTarget);
      }
      execCmd = `${getPatchBaseCmd(patchFilePath)} --reverse`
    }
  }

  if (execCmd) {
    try {
      log(`🔧 Executing: ${command}...`);
      const { stdout, stderr } = await exec(execCmd, {
        cwd: packagePath,
      })
      
      if (stdout) log(`stdout: ${stdout}`);
      if (stderr) log(`stderr: ${stderr}`);
      
      commandResult = 'success'
      log(`✅ ${command} completed successfully`);
    } catch (e) {
      log(`❌ ${command} execution error:`, e.message);
      if (e.stdout) log(`stdout: ${e.stdout}`);
      if (e.stderr) log(`stderr: ${e.stderr}`);
      
      if (backupPath) {
        log(`📋 Backup available at: ${backupPath}`);
      }
      
      commandResult = 'error'
    }
  }

  // process results
  let exitCode = 0
  let resultText
  if (!commandResult) {
    resultText = '🟡 nothing changed'
  } else if (commandResult === 'success') {
    resultText = '🟢 success'
  } else if (commandResult === 'error') {
    resultText = '🔴 error'
    exitCode = 1
  }
  log(`Result: ${resultText}`)

  process.exit(exitCode)
})()
