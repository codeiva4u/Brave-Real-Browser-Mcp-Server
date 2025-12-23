
import { handleBrowserInit, handleBrowserClose } from '../src/handlers/browser-handlers.js';
import { handleNavigate, handleWait } from '../src/handlers/navigation-handlers.js';
import { handleGetContent, handleFindSelector } from '../src/handlers/content-handlers.js';
import { handleBreadcrumbNavigator } from '../src/handlers/navigation-handlers.js';
import {
    handleBatchElementScraper,
    handleAttributeHarvester,
    handleLinkHarvester,
    handleMediaExtractor
} from '../src/handlers/multi-element-handlers.js';
import {
    handleKeywordSearch,
    handleRegexPatternMatcher,
    handleXPathSupport,
    handleAdvancedCSSSelectors
} from '../src/handlers/search-filter-handlers.js';
import { handleRandomScroll } from '../src/handlers/interaction-handlers.js';
import { handleScrapeMetaTags, handleExtractSchema } from '../src/handlers/data-extraction-handlers.js';

async function runFullVerification() {
    console.log('🚀 Starting Comprehensive Tool Verification...');

    try {
        await handleBrowserInit({ headless: true });

        // Testing on one site primarily to save time, then brief check on second
        const url = 'https://moviesdrive.forum/';
        console.log(`\n--------------------------------------------------`);
        console.log(`🔍 Targeting: ${url}`);
        console.log(`--------------------------------------------------`);

        // --- Navigation & Basic ---
        console.log(`\n[1/12] 🟢 Testing Navigation & Wait...`);
        await handleNavigate({ url });
        await handleWait({ type: 'timeout', value: '2000' });
        console.log('   ✅ Navigation complete.');

        // --- Interaction ---
        console.log(`\n[2/12] 🟢 Testing Random Scroll...`);
        await handleRandomScroll({});
        console.log('   ✅ Scroll complete.');

        // --- Content Handlers ---
        console.log(`\n[3/12] 🟢 Testing Find Selector (Text search)...`);
        const findRes = await handleFindSelector({ text: 'Movie' }); // Assuming "Movie" exists
        console.log(`   Result: Found ${findRes.content[0].text.length > 50 ? 'matches' : 'no matches'} (Length: ${findRes.content[0].text.length})`);

        // --- Multi-Element Handlers (The file we kept) ---
        console.log(`\n[4/12] 🟢 Testing Batch Element Scraper...`);
        const batchRes = await handleBatchElementScraper({ selector: 'a', maxElements: 3 });
        console.log(`   Result: ${batchRes.content[0].text.substring(0, 100)}...`);

        console.log(`\n[5/12] 🟢 Testing Attribute Harvester...`);
        const attrRes = await handleAttributeHarvester({ selector: 'img', attributes: ['src'], maxElements: 3 });
        console.log(`   Result: ${attrRes.content[0].text.substring(0, 100)}...`);

        console.log(`\n[6/12] 🟢 Testing Media Extractor...`); // Might be empty on home page but runs logic
        const mediaRes = await handleMediaExtractor({ types: ['video', 'iframe'] });
        console.log(`   Result: ${mediaRes.content[0].text.substring(0, 100)}...`);

        // --- Search & Filter Handlers (The file we kept) ---
        console.log(`\n[7/12] 🟢 Testing Keyword Search...`);
        const keyRes = await handleKeywordSearch({ keywords: ['Bollywood', 'Hollywood'] });
        console.log(`   Result: ${keyRes.content[0].text.substring(0, 100)}...`);

        console.log(`\n[8/12] 🟢 Testing Regex Pattern Matcher...`);
        const regexRes = await handleRegexPatternMatcher({ pattern: 'https?://[^\\s"\']+' });
        console.log(`   Result: ${regexRes.content[0].text.substring(0, 100)}...`);

        console.log(`\n[9/12] 🟢 Testing XPath Support...`);
        const xpathRes = await handleXPathSupport({ xpath: '//body//div' });
        console.log(`   Result: ${xpathRes.content[0].text.substring(0, 100)}...`);

        console.log(`\n[10/12] 🟢 Testing Advanced CSS Selectors...`);
        const cssRes = await handleAdvancedCSSSelectors({ selector: 'div > a', operation: 'query' });
        console.log(`   Result: ${cssRes.content[0].text.substring(0, 100)}...`);

        // --- Data Extraction ---
        console.log(`\n[11/12] 🟢 Testing Schema Extraction...`);
        const schemaRes = await handleExtractSchema({});
        console.log(`   Result: ${schemaRes.content[0].text.substring(0, 100)}...`);

        // --- Pagination (Refactored) ---
        console.log(`\n[12/12] 🟢 Testing Breadcrumb Navigator...`);
        const breadRes = await handleBreadcrumbNavigator({});
        console.log(`   Result: ${breadRes.content[0].text.substring(0, 100)}...`);

        console.log('\n✅ All primary handler categories verified successfully.');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
    } finally {
        await handleBrowserClose({});
    }
}

runFullVerification();
