/**
 * Test script to verify :has-text() selector support
 * Run with: node test-has-text.mjs
 */

async function test() {
    console.log('🧪 Testing :has-text() selector support...\n');

    try {
        // Import the compiled module
        console.log('Loading module from: ./dist/self-healing-locators.js');

        // Use dynamic import for ESM
        const module = await import('./dist/self-healing-locators.js');
        const { selfHealingLocators } = module;

        // Test 1: parseTextSelector with :has-text()
        console.log('\n📋 Test 1: Parse button:has-text("HubCloud")');
        const result1 = selfHealingLocators.parseTextSelector('button:has-text("HubCloud")');
        console.log('Result:', JSON.stringify(result1, null, 2));

        if (result1 && result1.tagName === 'button' && result1.text === 'HubCloud') {
            console.log('✅ Test 1 PASSED');
        } else {
            console.log('❌ Test 1 FAILED');
            process.exit(1);
        }

        // Test 2: parseTextSelector with :contains()
        console.log('\n📋 Test 2: Parse a:contains("Download")');
        const result2 = selfHealingLocators.parseTextSelector('a:contains("Download")');
        console.log('Result:', JSON.stringify(result2, null, 2));

        if (result2 && result2.tagName === 'a' && result2.text === 'Download') {
            console.log('✅ Test 2 PASSED');
        } else {
            console.log('❌ Test 2 FAILED');
            process.exit(1);
        }

        // Test 3: parseTextSelector with :text()
        console.log('\n📋 Test 3: Parse :text("Submit")');
        const result3 = selfHealingLocators.parseTextSelector(':text("Submit")');
        console.log('Result:', JSON.stringify(result3, null, 2));

        if (result3 && result3.text === 'Submit') {
            console.log('✅ Test 3 PASSED');
        } else {
            console.log('❌ Test 3 FAILED');
            process.exit(1);
        }

        // Test 4: Regular selector (should return null)
        console.log('\n📋 Test 4: Parse regular selector "#myButton"');
        const result4 = selfHealingLocators.parseTextSelector('#myButton');
        console.log('Result:', result4);

        if (result4 === null) {
            console.log('✅ Test 4 PASSED');
        } else {
            console.log('❌ Test 4 FAILED');
            process.exit(1);
        }

        console.log('\n🎉 All tests PASSED!');
        console.log('✅ :has-text() selector support is working correctly!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

test();
