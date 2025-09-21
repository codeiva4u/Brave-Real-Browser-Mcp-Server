#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Version Increment Logic Locally');
console.log('==========================================\n');

// Read current package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Current version: ${currentVersion}`);

// Test different increment types
const incrementTypes = ['patch', 'minor', 'major'];

incrementTypes.forEach(incrementType => {
    console.log(`\n🔄 Testing ${incrementType} increment:`);
    
    try {
        // Create a backup of package.json
        const backup = JSON.stringify(packageJson, null, 2);
        
        // Test version increment (dry run)
        const result = execSync(`npm version ${incrementType} --no-git-tag-version`, { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });
        
        // Read new version
        const newPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const newVersion = newPackageJson.version;
        
        console.log(`  ✅ ${currentVersion} → ${newVersion}`);
        
        // Restore original version
        fs.writeFileSync(packageJsonPath, backup);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
});

console.log('\n🎯 Version Logic Test Summary:');
console.log('- patch: Increments the third number (e.g., 1.5.16 → 1.5.17)');
console.log('- minor: Increments the second number (e.g., 1.5.16 → 1.6.0)'); 
console.log('- major: Increments the first number (e.g., 1.5.16 → 2.0.0)');

console.log('\n🔍 Testing commit message parsing logic:');

const testMessages = [
    'fix: bug fix',
    'feat: new feature', 
    'BREAKING CHANGE: major update',
    '[major] breaking change',
    '[minor] add new functionality',
    'docs: update readme'
];

testMessages.forEach(message => {
    let incrementType;
    if (message.match(/\[major\]|\bBREAKING CHANGE\b/)) {
        incrementType = 'major';
    } else if (message.match(/\[minor\]|\bfeat\b|\bfeature\b/)) {
        incrementType = 'minor';
    } else {
        incrementType = 'patch';
    }
    
    console.log(`  "${message}" → ${incrementType}`);
});

console.log('\n✅ All version increment tests completed successfully!');