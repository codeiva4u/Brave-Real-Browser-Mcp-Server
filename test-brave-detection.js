// Quick test to verify Brave detection works in real environment
import { detectBravePath } from './dist/browser-manager.js';

console.log('🔍 Testing Brave Detection in Real Environment...\n');
console.log('Platform:', process.platform);
console.log('Environment Variables:');
console.log('  BRAVE_PATH:', process.env.BRAVE_PATH || 'not set');
console.log('  PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH || 'not set');
console.log('\n' + '='.repeat(60) + '\n');

const detectedPath = detectBravePath();

console.log('\n' + '='.repeat(60));
if (detectedPath) {
  console.log('\n✅ SUCCESS! Brave detected at:');
  console.log('   ', detectedPath);
  console.log('\n💡 Auto-detection is working properly!');
} else {
  console.log('\n❌ Brave NOT detected');
  console.log('\n💡 Solutions:');
  console.log('   1. Set environment variable:');
  console.log('      $env:BRAVE_PATH="C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"');
  console.log('   2. Or reinstall Brave from: https://brave.com/download/');
}
console.log('='.repeat(60) + '\n');
