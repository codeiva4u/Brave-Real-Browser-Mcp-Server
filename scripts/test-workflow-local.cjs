#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing GitHub Actions Workflow Locally');
console.log('==========================================\n');

// Test version increment logic
function testVersionIncrement() {
    console.log('📈 Testing Version Increment Logic...\n');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    
    console.log(`📦 Current version: ${currentVersion}`);
    
    // Test commit message patterns
    const testMessages = [
        'fix: bug fix',
        'feat: new feature', 
        'BREAKING CHANGE: major update',
        '[major] breaking change',
        'minor: add new functionality',
        'docs: update readme'
    ];
    
    console.log('\n🔍 Testing commit message patterns:');
    testMessages.forEach(message => {
        let incrementType;
        if (message.match(/\[major\]|\bBREAKING CHANGE\b|\bmajor:/)) {
            incrementType = 'major';
        } else if (message.match(/\[minor\]|\bfeat\b|\bfeature\b|\bminor:/)) {
            incrementType = 'minor';
        } else {
            incrementType = 'patch';
        }
        
        console.log(`  "${message}" → ${incrementType}`);
    });
    
    // Test actual version increments
    console.log('\n🔄 Testing version increments:');
    
    const incrementTypes = ['patch', 'minor', 'major'];
    incrementTypes.forEach(incrementType => {
        try {
            const backup = JSON.stringify(packageJson, null, 2);
            
            execSync(`npm version ${incrementType} --no-git-tag-version`, { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '..')
            });
            
            const newPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const newVersion = newPackageJson.version;
            
            console.log(`  ✅ ${incrementType}: ${currentVersion} → ${newVersion}`);
            
            // Restore original version
            fs.writeFileSync(packageJsonPath, backup);
            
        } catch (error) {
            console.log(`  ❌ ${incrementType}: Error - ${error.message}`);
        }
    });
}

// Test workflow environment variables
function testWorkflowEnvironment() {
    console.log('\n🌍 Testing Workflow Environment...\n');
    
    const envFile = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envFile)) {
        console.log('❌ .env.local file not found');
        return false;
    }
    
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars = envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => {
            const [key, value] = line.split('=');
            return { key: key.trim(), value: value.trim() };
        });
    
    console.log('📋 Environment variables loaded:');
    envVars.forEach(({ key, value }) => {
        console.log(`  ${key}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    });
    
    return true;
}

// Test build process
function testBuild() {
    console.log('\n🔨 Testing Build Process...\n');
    
    try {
        console.log('  🧹 Cleaning dist folder...');
        execSync('npm run clean', { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });
        
        console.log('  🔨 Building TypeScript...');
        execSync('npm run build', { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });
        
        const distIndexPath = path.join(__dirname, '..', 'dist', 'index.js');
        if (fs.existsSync(distIndexPath)) {
            console.log('  ✅ Build successful - dist/index.js exists');
            return true;
        } else {
            console.log('  ❌ Build failed - dist/index.js not found');
            return false;
        }
    } catch (error) {
        console.log(`  ❌ Build failed: ${error.message}`);
        return false;
    }
}

// Test package.json validation
function testPackageValidation() {
    console.log('\n📋 Testing Package Validation...\n');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredFields = [
        'name',
        'version',
        'description',
        'main',
        'scripts',
        'dependencies'
    ];
    
    let valid = true;
    requiredFields.forEach(field => {
        if (packageJson[field]) {
            console.log(`  ✅ ${field}: ${typeof packageJson[field] === 'object' ? 'present' : packageJson[field]}`);
        } else {
            console.log(`  ❌ ${field}: missing`);
            valid = false;
        }
    });
    
    // Check specific fields
    if (packageJson.name === 'brave-real-browser-mcp-server') {
        console.log('  ✅ Package name is correct');
    } else {
        console.log('  ❌ Package name is incorrect');
        valid = false;
    }
    
    // Check dependencies
    const requiredDeps = ['brave-real-browser', 'brave-real-launcher', 'brave-real-puppeteer-core'];
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep]) {
            console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`  ❌ ${dep}: missing`);
            valid = false;
        }
    });
    
    return valid;
}

// Test workflow file syntax
function testWorkflowSyntax() {
    console.log('\n📄 Testing Workflow File Syntax...\n');
    
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'publish.yml');
    if (!fs.existsSync(workflowPath)) {
        console.log('  ❌ Workflow file not found');
        return false;
    }
    
    try {
        const yaml = require('js-yaml');
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        const workflow = yaml.load(workflowContent);
        
        console.log(`  ✅ Workflow name: ${workflow.name}`);
        console.log(`  ✅ Triggers: ${Object.keys(workflow.on).join(', ')}`);
        console.log(`  ✅ Jobs: ${Object.keys(workflow.jobs).join(', ')}`);
        
        return true;
    } catch (error) {
        try {
            // Try with yamllint if yaml parsing fails
            execSync('yamllint .github/workflows/publish.yml', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '..')
            });
            console.log('  ✅ YAML syntax is valid (checked with yamllint)');
            return true;
        } catch (yamlError) {
            console.log(`  ❌ YAML syntax error: ${error.message}`);
            return false;
        }
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Comprehensive Workflow Tests\n');
    
    let allPassed = true;
    
    // Run all tests
    allPassed &= testPackageValidation();
    allPassed &= testWorkflowSyntax();
    allPassed &= testWorkflowEnvironment();
    testVersionIncrement(); // This doesn't affect pass/fail
    allPassed &= testBuild();
    
    console.log('\n' + '='.repeat(50));
    
    if (allPassed) {
        console.log('✅ All workflow tests PASSED!');
        console.log('🚀 Workflow is ready for GitHub deployment');
    } else {
        console.log('❌ Some workflow tests FAILED!');
        console.log('🔧 Please fix issues before GitHub deployment');
    }
    
    console.log('='.repeat(50));
    
    return allPassed;
}

// Install js-yaml if not present
try {
    require('js-yaml');
} catch (error) {
    console.log('📦 Installing js-yaml for YAML parsing...');
    try {
        execSync('npm install js-yaml --no-save', { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });
    } catch (installError) {
        console.log('⚠️ Could not install js-yaml, will use yamllint for validation');
    }
}

// Run tests
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
});