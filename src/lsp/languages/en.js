/**
 * English Language Pack for LSP
 */

module.exports = {
  tools: {
    browser_init: {
      label: 'Initialize Browser',
      detail: 'Start Brave browser with stealth mode',
      documentation: 'Launches Brave browser with anti-detection features, ad blocker, and optional proxy support.',
      parameters: {
        headless: 'Run browser without visible window',
        proxy: 'Proxy server configuration',
        turnstile: 'Enable Cloudflare Turnstile auto-solver',
        enableBlocker: 'Enable ad/tracker blocking'
      }
    },
    navigate: { label: 'Navigate to URL', detail: 'Go to a specific webpage', documentation: 'Navigates the browser to the specified URL.', parameters: { url: 'The URL to navigate to', waitUntil: 'When to consider navigation complete', timeout: 'Maximum wait time' } },
    get_content: { label: 'Get Page Content', detail: 'Extract content from page', documentation: 'Gets the page content in specified format.', parameters: { format: 'Output format', selector: 'CSS selector' } },
    wait: { label: 'Wait', detail: 'Wait for element or timeout', documentation: 'Pauses execution until condition is met.', parameters: { type: 'Wait type', value: 'Selector or timeout', timeout: 'Maximum wait' } },
    click: { label: 'Click Element', detail: 'Click with human-like behavior', documentation: 'Clicks on an element using ghost-cursor.', parameters: { selector: 'Element selector', humanLike: 'Use realistic movement', clickCount: 'Number of clicks', delay: 'Click delay' } },
    type: { label: 'Type Text', detail: 'Type into input field', documentation: 'Types text with realistic keystroke delays.', parameters: { selector: 'Input selector', text: 'Text to type', delay: 'Keystroke delay', clear: 'Clear first' } },
    browser_close: { label: 'Close Browser', detail: 'Close and cleanup', documentation: 'Closes the browser.', parameters: { force: 'Force close' } },
    solve_captcha: { label: 'Solve CAPTCHA', detail: 'Auto-solve CAPTCHAs', documentation: 'Automatically solves Turnstile, reCAPTCHA, hCaptcha.', parameters: { type: 'CAPTCHA type', timeout: 'Max solve time' } },
    random_scroll: { label: 'Random Scroll', detail: 'Human-like scrolling', documentation: 'Scrolls with human-like behavior.', parameters: { direction: 'Scroll direction', amount: 'Scroll amount', smooth: 'Smooth scrolling' } },
    find_element: { label: 'Find Element', detail: 'Locate elements', documentation: 'Finds elements by selector/xpath/text.', parameters: { selector: 'CSS selector', xpath: 'XPath', text: 'Text content', multiple: 'Return all' } },
    save_content_as_markdown: { label: 'Save as Markdown', detail: 'Export to MD', documentation: 'Saves page as Markdown file.', parameters: { filename: 'Output filename', selector: 'Content selector', includeImages: 'Include images', includeMeta: 'Include meta' } },
    redirect_tracer: { label: 'Trace Redirects', detail: 'Follow redirects', documentation: 'Traces redirects to final destination.', parameters: { url: 'URL to trace', maxRedirects: 'Max redirects', includeHeaders: 'Include headers' } },
    search_regex: { label: 'Regex Search', detail: 'Search with patterns', documentation: 'Searches content using regex.', parameters: { pattern: 'Regex pattern', flags: 'Regex flags', source: 'Search source' } },
    extract_json: { label: 'Extract JSON', detail: 'Get JSON data', documentation: 'Extracts JSON from page/scripts.', parameters: { source: 'Data source', selector: 'CSS selector', jsonPath: 'JSONPath' } },
    scrape_meta_tags: { label: 'Scrape Meta Tags', detail: 'Get meta data', documentation: 'Extracts meta, OG, Twitter data.', parameters: { types: 'Tag types' } },
    press_key: { label: 'Press Key', detail: 'Keyboard input', documentation: 'Presses keyboard keys.', parameters: { key: 'Key to press', modifiers: 'Modifier keys', count: 'Press count' } },
    progress_tracker: { label: 'Track Progress', detail: 'Monitor automation', documentation: 'Tracks automation progress.', parameters: { action: 'Action type', taskName: 'Task name', progress: 'Progress %' } },
    deep_analysis: { label: 'Deep Analysis', detail: 'Page analysis', documentation: 'Analyzes SEO, performance, accessibility.', parameters: { types: 'Analysis types', detailed: 'Detailed info' } },
    network_recorder: { label: 'Record Network', detail: 'Capture requests', documentation: 'Records network requests.', parameters: { action: 'Action', filter: 'Request filter' } },
    link_harvester: { label: 'Harvest Links', detail: 'Extract links', documentation: 'Extracts all links from page.', parameters: { types: 'Link types', selector: 'Container', includeText: 'Include text' } },
    cookie_manager: { label: 'Manage Cookies', detail: 'Cookie operations', documentation: 'Manages browser cookies.', parameters: { action: 'Action', name: 'Cookie name', value: 'Cookie value', domain: 'Domain' } },
    file_downloader: { label: 'Download File', detail: 'Download from URL', documentation: 'Downloads files.', parameters: { url: 'File URL', filename: 'Output name', directory: 'Output dir' } },
    iframe_handler: { label: 'Handle iFrame', detail: 'iFrame operations', documentation: 'Handles iFrame content.', parameters: { action: 'Action', selector: 'iFrame selector', index: 'iFrame index' } },
    stream_extractor: { label: 'Extract Streams', detail: 'Get video/audio', documentation: 'Extracts stream URLs.', parameters: { types: 'Stream types', quality: 'Quality' } },
    js_scrape: { label: 'JS Scrape', detail: 'Scrape JS content', documentation: 'Scrapes JS-rendered content.', parameters: { selector: 'CSS selector', waitForJS: 'Wait for JS', timeout: 'Max wait' } },
    execute_js: { label: 'Execute JS', detail: 'Run JavaScript', documentation: 'Executes custom JavaScript.', parameters: { code: 'JS code', returnValue: 'Return result' } },
    player_api_hook: { label: 'Player API Hook', detail: 'Video player control', documentation: 'Hooks into video players.', parameters: { playerType: 'Player type', action: 'Action' } },
    form_automator: { label: 'Automate Form', detail: 'Fill and submit', documentation: 'Auto-fills and submits forms.', parameters: { selector: 'Form selector', data: 'Form data', submit: 'Submit', humanLike: 'Human delays' } }
  },
  diagnostics: {
    browserNotInit: 'Browser not initialized. Call browser_init first.',
    invalidSelector: 'Invalid CSS selector syntax.',
    missingUrl: 'URL is required.',
    invalidUrl: 'Invalid URL format.',
    timeoutTooLong: 'Timeout exceeds maximum.',
    missingRequired: 'Required parameter is missing.',
    invalidJson: 'Invalid JSON syntax.',
    selectorNotFound: 'Element not found.',
    unknownTool: 'Unknown tool name.',
    deprecatedTool: 'This tool is deprecated.'
  },
  snippets: {
    basicFlow: 'Basic browser automation flow',
    loginFlow: 'Login automation with form fill',
    scrapeFlow: 'Web scraping workflow',
    captchaFlow: 'CAPTCHA solving workflow',
    downloadFlow: 'File download automation'
  },
  ui: { autocompletePlaceholder: 'Type tool name...', noSuggestions: 'No suggestions', loading: 'Loading...', error: 'Error', warning: 'Warning', info: 'Info' }
};
