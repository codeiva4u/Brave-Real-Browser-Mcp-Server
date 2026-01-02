
const { BraveInstaller } = require('../dist/brave-installer.js');

console.log('Checking BraveInstaller module...');

if (typeof BraveInstaller.install === 'function') {
    console.log('✅ PASS: BraveInstaller.install is a function');
} else {
    console.error('❌ FAIL: BraveInstaller.install is NOT a function');
    process.exit(1);
}

console.log('Module structure verified.');
