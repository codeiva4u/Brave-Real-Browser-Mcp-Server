
import { TOOLS } from './src/tool-definitions.js';
import { readFileSync } from 'fs';

const mcpServerContent = readFileSync('./src/mcp-server.ts', 'utf-8');

const implementedTools = new Set();
// Simple regex to find case TOOL_NAMES.XYZ in mcp-server.ts
// This is an approximation but good enough for now.
const matches = mcpServerContent.match(/case TOOL_NAMES\.([A-Z_]+)/g);

// We need to map TOOL_NAMES keys to tool names.
// But we can also key off the "name" property in TOOLS.
// Let's just search for the tool string literal in mcp-server.ts case blocks if possible, 
// or import TOOL_NAMES. 
// Easier: Just check if the tool.name is present in mcp-server.ts content as a string literal or constant.

const ghostTools = [];
const workingTools = [];

for (const tool of TOOLS) {
    // Check if tool name exists in mcp-server.ts (approximate check)
    // We look for `TOOL_NAMES.${CONST}` usually, but looking for the name string is safer if we don't have the mapping handy.
    // Actually, let's look for `case TOOL_NAMES` blocks. 
    // Better yet, let's just output the list of TOOLS and let the human (me) compare with the known 21.

    // Refined approach:
    // specific list of known implemented tools:
    const known = [
        'browser_init', 'navigate', 'get_content', 'click', 'type', 'press_key', 'wait',
        'browser_close', 'solve_captcha', 'random_scroll', 'find_selector', 'save_content_as_markdown',
        'extract_list', 'extract_json', 'scrape_meta_tags', 'extract_schema',
        'batch_element_scraper', 'nested_data_extraction', 'attribute_harvester',
        'link_harvester', 'media_extractor',

        // Phase 1
        'multi_page_scraper', 'breadcrumb_navigator', 'html_to_text', 'duplicate_remover',
        'html_elements_extractor', 'tags_finder', 'links_finder', 'xpath_links', 'shadow_dom_extractor',
        'iframe_extractor', 'embed_page_extractor', 'ajax_extractor', 'fetch_xhr', 'network_recorder',
        'api_finder', 'regex_pattern_finder', 'image_extractor_advanced', 'video_source_extractor',
        'video_player_extractor', 'video_player_hoster_finder', 'original_video_hoster_finder',
        'url_redirect_tracer', 'user_agent_extractor', 'cookie_manager', 'form_auto_fill',
        'ajax_content_waiter', 'progress_tracker', 'data_quality_metrics',

        // Phase 2
        'smart_selector_generator', 'content_classification', 'keyword_search', 'regex_pattern_matcher',
        'xpath_support', 'advanced_css_selectors', 'visual_element_finder', 'sentiment_analysis',
        'summary_generator', 'translation_support', 'data_deduplication', 'data_type_validator',
        'outlier_detection',

        // Phase 3 & 4
        'video_player_finder', 'stream_detector', 'redirect_tracer', 'video_download_link_finder',
        'video_link_finder', 'video_download_page', 'video_download_button', 'video_play_push_source',
        'video_play_button_click', 'url_redirect_trace_endpoints', 'network_recording_finder',
        'network_recording_extractors', 'video_links_finders', 'videos_selectors', 'link_process_extracts',
        'video_link_finders_extracts', 'video_download_button_finders', 'advanced_video_extraction',
        'deobfuscate_js', 'multi_layer_redirect_trace', 'ad_protection_detector', 'ocr_engine',
        'audio_captcha_solver', 'puzzle_captcha_handler', 'full_page_screenshot', 'element_screenshot',
        'video_recording', 'visual_comparison', 'consistency_checker'
    ];

    if (!known.includes(tool.name)) {
        ghostTools.push(tool.name);
    } else {
        workingTools.push(tool.name);
    }
}

console.log('Total Tools defined:', TOOLS.length);
console.log('Ghost Tools:', ghostTools.length);
console.log('Working Tools:', workingTools.length);
console.log('Ghost Tool Names:', JSON.stringify(ghostTools, null, 2));
