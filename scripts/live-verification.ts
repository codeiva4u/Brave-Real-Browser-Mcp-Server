
import { handleBrowserInit, handleBrowserClose } from '../src/handlers/browser-handlers.js';
import { handleNavigate } from '../src/handlers/navigation-handlers.js';
import { handleGetContent } from '../src/handlers/content-handlers.js';
import { handleBreadcrumbNavigator } from '../src/handlers/navigation-handlers.js';
import { handleLinkHarvester } from '../src/handlers/multi-element-handlers.js';
import { handleScrapeMetaTags } from '../src/handlers/data-extraction-handlers.js';

async function runVerification() {
    console.log('🚀 Starting Verification on Live Sites...');

    try {
        // 1. Initialize Browser
        console.log('\n🔵 Initializing Browser...');
        await handleBrowserInit({ headless: true });

        const sites = [
            'https://moviesdrive.forum/',
            'https://multimovies.golf/'
        ];

        for (const url of sites) {
            console.log(`\n--------------------------------------------------`);
            console.log(`🔍 Testing Site: ${url}`);
            console.log(`--------------------------------------------------`);

            // 2. Navigate
            console.log(`\n➡️ Navigating to ${url}...`);
            await handleNavigate({ url });

            // 3. Get Content (HTML preview)
            console.log(`\n📄 Fetching Content (Preview)...`);
            const contentRes = await handleGetContent({ type: 'text' });
            console.log(`   Result: ${contentRes.content[0].text.substring(0, 100)}...`);

            // 4. Test Breadcrumb Navigator (Newly moved)
            console.log(`\nnav Testing Breadcrumb Navigator...`);
            const breadcrumbRes = await handleBreadcrumbNavigator({});
            console.log(`   Result: ${breadcrumbRes.content[0].text.substring(0, 200)}...`);

            // 5. Test Link Harvester (Existing tool)
            console.log(`\n🔗 Testing Link Harvester (First 5 links)...`);
            const linksRes = await handleLinkHarvester({ maxElements: 5 });
            console.log(`   Result: ${linksRes.content[0].text.substring(0, 200)}...`);

            // 6. Test Meta Tags (Data extraction)
            console.log(`\n🏷️ Testing Meta Tag Scraper...`);
            const metaRes = await handleScrapeMetaTags({});
            console.log(`   Result: ${metaRes.content[0].text.substring(0, 200)}...`);
        }

    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
    } finally {
        // 7. Cleanup
        console.log('\n🔴 Closing Browser...');
        await handleBrowserClose({});
    }
}

runVerification();
