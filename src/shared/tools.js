/**
 * Brave Real Browser MCP Server - Shared Tool Definitions
 * 
 * OPTIMIZED: 23 tools (merged from 28)
 * 
 * Merges Applied:
 * - iframe_handler + stream_extractor + player_api_hook → media_extractor
 * - get_content + js_scrape → get_content (enhanced)
 * - search_regex + extract_json + scrape_meta_tags → extract_data
 * 
 * New Features:
 * - URL/Base64/AES Decoders built into media_extractor
 * - AI Auto-Healing Selectors
 * - Smart Retry Mechanisms
 * - Batch Operations
 */

const TOOLS = [
  // 1. Browser Init
  {
    name: 'browser_init',
    emoji: '🚀',
    description: 'Initialize Brave browser with stealth, anti-detection, and AI healing',
    descriptionHindi: 'ब्राउज़र शुरू करना (stealth + AI healing)',
    category: 'browser',
    requiresBrowser: false,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', default: false },
        proxy: {
          type: 'object',
          properties: {
            host: { type: 'string' },
            port: { type: 'number' },
            username: { type: 'string' },
            password: { type: 'string' }
          }
        },
        turnstile: { type: 'boolean', default: true, description: 'Auto-solve Cloudflare Turnstile' },
        enableBlocker: { type: 'boolean', default: true, description: 'Block ads and trackers' },
        aiHealing: { type: 'boolean', default: true, description: 'Enable AI auto-healing for broken selectors' }
      }
    }
  },

  // 2. Navigate
  {
    name: 'navigate',
    emoji: '🧭',
    description: 'Navigate to URL with smart retry, context recovery, and AI healing',
    descriptionHindi: 'URL पर जाना (smart retry + recovery)',
    category: 'navigation',
    requiresBrowser: true,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        waitUntil: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'], default: 'networkidle2' },
        timeout: { type: 'number', default: 30000 },
        retries: { type: 'number', default: 3, description: 'Auto-retry on failures' },
        smartWait: { type: 'boolean', default: true, description: 'AI-powered smart waiting' }
      },
      required: ['url']
    }
  },

  // 3. Get Content (MERGED: get_content + js_scrape)
  {
    name: 'get_content',
    emoji: '📄',
    description: 'Get page content with JS rendering, smart selectors, and AI healing',
    descriptionHindi: 'पेज का कंटेंट लेना (JS rendering + AI healing)',
    category: 'extraction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['html', 'text', 'markdown'], default: 'text' },
        selector: { type: 'string', description: 'CSS selector (AI will auto-heal if broken)' },
        waitForJS: { type: 'boolean', default: true, description: 'Wait for JavaScript to render' },
        timeout: { type: 'number', default: 10000 },
        aiHeal: { type: 'boolean', default: true, description: 'Auto-fix broken selectors' },
        extractAttributes: { type: 'boolean', default: false, description: 'Extract all element attributes' }
      }
    }
  },

  // 4. Wait
  {
    name: 'wait',
    emoji: '⏳',
    description: 'Smart wait with AI prediction for optimal timing',
    descriptionHindi: 'स्मार्ट इंतजार (AI prediction)',
    category: 'utility',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['selector', 'navigation', 'timeout', 'networkidle', 'smart'], default: 'smart' },
        value: { type: 'string', description: 'Selector or timeout value' },
        timeout: { type: 'number', default: 30000 },
        aiOptimize: { type: 'boolean', default: true, description: 'AI optimizes wait time based on page load patterns' }
      },
      required: ['value']
    }
  },

  // 5. Click
  {
    name: 'click',
    emoji: '👆',
    description: 'Human-like click with AI healing and auto-retry',
    descriptionHindi: 'क्लिक करना (AI healing + human-like)',
    category: 'interaction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector (AI auto-heals if element not found)' },
        humanLike: { type: 'boolean', default: true, description: 'Ghost cursor human movement' },
        aiHeal: { type: 'boolean', default: true, description: 'Auto-find alternative selector if broken' },
        retries: { type: 'number', default: 3 },
        clickCount: { type: 'number', default: 1 },
        delay: { type: 'number', default: 0 }
      },
      required: ['selector']
    }
  },

  // 6. Type
  {
    name: 'type',
    emoji: '⌨️',
    description: 'Type text with human speed variation and smart clearing',
    descriptionHindi: 'टेक्स्ट टाइप करना (human speed)',
    category: 'interaction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        text: { type: 'string' },
        delay: { type: 'number', default: 50, description: 'Keystroke delay with natural variation' },
        clear: { type: 'boolean', default: true },
        aiHeal: { type: 'boolean', default: true }
      },
      required: ['selector', 'text']
    }
  },

  // 7. Browser Close
  {
    name: 'browser_close',
    emoji: '🔴',
    description: 'Close browser with cleanup and session save',
    descriptionHindi: 'ब्राउज़र बंद करना',
    category: 'browser',
    requiresBrowser: true,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        force: { type: 'boolean', default: false },
        saveSession: { type: 'boolean', default: false, description: 'Save cookies and storage for next session' }
      }
    }
  },

  // 8. Solve Captcha
  {
    name: 'solve_captcha',
    emoji: '🔓',
    description: 'Auto-solve CAPTCHA with AI (Turnstile, reCAPTCHA, hCaptcha)',
    descriptionHindi: 'CAPTCHA हल करना (AI-powered)',
    category: 'interaction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['turnstile', 'recaptcha', 'hcaptcha', 'auto'], default: 'auto' },
        timeout: { type: 'number', default: 30000 },
        aiMode: { type: 'boolean', default: true, description: 'Use AI vision for complex CAPTCHAs' }
      }
    }
  },

  // 9. Random Scroll
  {
    name: 'random_scroll',
    emoji: '📜',
    description: 'Human-like scroll with AI pattern detection',
    descriptionHindi: 'स्क्रॉल करना (human-like + AI)',
    category: 'interaction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['up', 'down', 'random', 'smart'], default: 'smart' },
        amount: { type: 'number', default: 0, description: '0 = AI decides based on content' },
        smooth: { type: 'boolean', default: true },
        aiDetectLazyLoad: { type: 'boolean', default: true, description: 'Auto-detect lazy loading patterns' }
      }
    }
  },

  // 10. Find Element
  {
    name: 'find_element',
    emoji: '🔍',
    description: 'Find elements with AI-powered selector healing and smart search',
    descriptionHindi: 'एलीमेंट खोजना (AI healing)',
    category: 'extraction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector (AI heals if broken)' },
        xpath: { type: 'string', description: 'XPath alternative' },
        text: { type: 'string', description: 'Find by text content' },
        multiple: { type: 'boolean', default: false },
        aiHeal: { type: 'boolean', default: true, description: 'Auto-find alternatives if selector fails' },
        smartAttributes: { type: 'boolean', default: true, description: 'Extract smart element attributes' }
      }
    }
  },

  // 11. Save Content as Markdown
  {
    name: 'save_content_as_markdown',
    emoji: '📝',
    description: 'Save page content with AI-enhanced formatting',
    descriptionHindi: 'कंटेंट MD में सेव करना (AI-enhanced)',
    category: 'extraction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        selector: { type: 'string' },
        includeImages: { type: 'boolean', default: true },
        includeMeta: { type: 'boolean', default: true },
        aiClean: { type: 'boolean', default: true, description: 'AI removes ads and clutter' }
      },
      required: ['filename']
    }
  },

  // 12. Redirect Tracer
  {
    name: 'redirect_tracer',
    emoji: '🔀',
    description: 'Trace all redirects including JS-based and meta refreshes',
    descriptionHindi: 'रीडायरेक्ट ट्रेस करना (HTTP + JS + Meta)',
    category: 'network',
    requiresBrowser: true,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        maxRedirects: { type: 'number', default: 20 },
        includeHeaders: { type: 'boolean', default: false },
        followJS: { type: 'boolean', default: true, description: 'Track JS navigations' },
        followMeta: { type: 'boolean', default: true, description: 'Track meta refresh redirects' },
        decodeURLs: { type: 'boolean', default: true, description: 'Auto-decode encoded URLs in chain' }
      },
      required: ['url']
    }
  },

  // 13. Extract Data (MERGED: search_regex + extract_json + scrape_meta_tags)
  {
    name: 'extract_data',
    emoji: '🔎',
    description: 'Universal data extractor - regex, JSON, meta tags, structured data',
    descriptionHindi: 'डेटा निकालना (regex + JSON + meta + structured)',
    category: 'extraction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['regex', 'json', 'meta', 'structured', 'auto'], default: 'auto' },
        pattern: { type: 'string', description: 'For regex: pattern to search' },
        selector: { type: 'string', description: 'For structured: CSS selector' },
        jsonPath: { type: 'string', description: 'For JSON: path expression' },
        source: { type: 'string', enum: ['html', 'text', 'scripts', 'ld+json', 'api', 'all'], default: 'all' },
        autoDecode: { type: 'boolean', default: true, description: 'Auto-decode Base64/URL in results' },
        flags: { type: 'string', default: 'gi', description: 'Regex flags' }
      }
    }
  },

  // 14. Press Key
  {
    name: 'press_key',
    emoji: '🎹',
    description: 'Press keyboard keys with human-like timing',
    descriptionHindi: 'की प्रेस करना',
    category: 'interaction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        modifiers: { type: 'array', items: { type: 'string' } },
        count: { type: 'number', default: 1 },
        humanDelay: { type: 'boolean', default: true, description: 'Natural delay between presses' }
      },
      required: ['key']
    }
  },

  // 15. Progress Tracker
  {
    name: 'progress_tracker',
    emoji: '📈',
    description: 'Track automation progress with AI predictions',
    descriptionHindi: 'प्रोग्रेस ट्रैक करना (AI predictions)',
    category: 'utility',
    requiresBrowser: false,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'update', 'complete', 'get'], default: 'get' },
        taskName: { type: 'string' },
        progress: { type: 'number', description: '0-100' },
        aiEstimate: { type: 'boolean', default: true, description: 'AI estimates remaining time' }
      }
    }
  },

  // 16. Deep Analysis
  {
    name: 'deep_analysis',
    emoji: '🧠',
    description: 'Deep page analysis with AI insights and recommendations',
    descriptionHindi: 'गहरा विश्लेषण (AI insights)',
    category: 'analysis',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string' }, default: ['all'] },
        detailed: { type: 'boolean', default: true },
        aiInsights: { type: 'boolean', default: true, description: 'AI provides recommendations' },
        detectAntiBot: { type: 'boolean', default: true, description: 'Detect anti-bot measures' }
      }
    }
  },

  // 17. Network Recorder
  {
    name: 'network_recorder',
    emoji: '📡',
    description: 'Record network with AI media detection and stream extraction',
    descriptionHindi: 'नेटवर्क रिकॉर्ड करना (AI media detection)',
    category: 'network',
    requiresBrowser: true,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'stop', 'get', 'clear', 'get_media', 'get_navigations'], default: 'get' },
        filter: {
          type: 'object',
          properties: {
            resourceType: { type: 'string' },
            urlPattern: { type: 'string' },
            type: { type: 'string' },
            mediaOnly: { type: 'boolean' }
          }
        },
        aiDetectStreams: { type: 'boolean', default: true, description: 'AI detects video/audio streams' }
      }
    }
  },

  // 18. Link Harvester
  {
    name: 'link_harvester',
    emoji: '🔗',
    description: 'Extract all links including hidden, encoded, and obfuscated',
    descriptionHindi: 'लिंक्स निकालना (hidden + encoded + obfuscated)',
    category: 'extraction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string' }, default: ['all'] },
        selector: { type: 'string' },
        includeText: { type: 'boolean', default: true },
        includeHidden: { type: 'boolean', default: true },
        searchIframes: { type: 'boolean', default: true },
        autoDecode: { type: 'boolean', default: true, description: 'Auto-decode Base64/URL encoded links' },
        detectObfuscation: { type: 'boolean', default: true, description: 'Detect and bypass obfuscation' }
      }
    }
  },

  // 19. Cookie Manager
  {
    name: 'cookie_manager',
    emoji: '🍪',
    description: 'Smart cookie management with AI session persistence',
    descriptionHindi: 'कुकीज़ मैनेज करना (smart)',
    category: 'browser',
    requiresBrowser: true,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'delete', 'clear', 'export', 'import'], default: 'get' },
        name: { type: 'string' },
        value: { type: 'string' },
        domain: { type: 'string' },
        expires: { type: 'number' },
        aiOptimize: { type: 'boolean', default: true, description: 'AI optimizes cookie persistence' }
      }
    }
  },

  // 20. File Downloader
  {
    name: 'file_downloader',
    emoji: '⬇️',
    description: 'Download files with resume, batch, and auto-decrypt support',
    descriptionHindi: 'फाइल डाउनलोड करना (resume + batch)',
    category: 'network',
    requiresBrowser: true,
    requiresPage: false,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        filename: { type: 'string' },
        directory: { type: 'string', default: './downloads' },
        resume: { type: 'boolean', default: true, description: 'Resume interrupted downloads' },
        batch: { type: 'array', items: { type: 'string' }, description: 'Multiple URLs for batch download' },
        autoDecode: { type: 'boolean', default: true, description: 'Auto-decode Base64/URL encoded URLs' },
        decryptKey: { type: 'string', description: 'AES key for encrypted files' }
      }
    }
  },

  // 21. Media Extractor (MERGED: iframe_handler + stream_extractor + player_api_hook)
  {
    name: 'media_extractor',
    emoji: '🎬',
    description: 'Universal media extractor - streams, players, iframes, with decoders',
    descriptionHindi: 'मीडिया निकालना (streams + players + iframes + decoders)',
    category: 'extraction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['extract', 'list_iframes', 'switch_iframe', 'player_control', 'decode_url', 'batch_extract'], 
          default: 'extract' 
        },
        // For extraction
        types: { type: 'array', items: { type: 'string' }, default: ['all'], description: 'video, audio, hls, dash, download, iframes' },
        quality: { type: 'string', enum: ['best', 'worst', 'all'], default: 'best' },
        deep: { type: 'boolean', default: true, description: 'Deep scan scripts and data attributes' },
        searchIframes: { type: 'boolean', default: true },
        // For iframe control
        selector: { type: 'string', description: 'iFrame selector' },
        index: { type: 'number', description: 'iFrame index' },
        // For player control
        playerAction: { type: 'string', enum: ['info', 'play', 'pause', 'seek', 'sources'], default: 'info' },
        // For decoders
        encodedData: { type: 'string', description: 'For decode_url action' },
        decoderType: { type: 'string', enum: ['auto', 'url', 'base64', 'aes'], default: 'auto' },
        aesKey: { type: 'string', description: 'AES decryption key' },
        aesIV: { type: 'string', description: 'AES IV (optional)' },
        // Batch operations
        urls: { type: 'array', items: { type: 'string' }, description: 'Multiple URLs for batch extraction' },
        aiOptimize: { type: 'boolean', default: true, description: 'AI optimizes extraction strategy' }
      }
    }
  },

  // 22. Execute JS
  {
    name: 'execute_js',
    emoji: '💻',
    description: 'Execute custom JavaScript with async support and error handling',
    descriptionHindi: 'कस्टम JS चलाना (async + error handling)',
    category: 'interaction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        returnValue: { type: 'boolean', default: true },
        async: { type: 'boolean', default: false, description: 'Execute async code' },
        timeout: { type: 'number', default: 30000 },
        iframe: { type: 'number', description: 'Execute in specific iframe index' }
      },
      required: ['code']
    }
  },

  // 23. Form Automator
  {
    name: 'form_automator',
    emoji: '📋',
    description: 'Smart form automation with AI field detection and validation',
    descriptionHindi: 'फॉर्म भरना (AI detection)',
    category: 'interaction',
    requiresBrowser: true,
    requiresPage: true,
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Form selector (AI auto-detects if not provided)' },
        data: { type: 'object', description: 'Field data (AI matches fields if names differ)' },
        submit: { type: 'boolean', default: false },
        humanLike: { type: 'boolean', default: true },
        aiMatch: { type: 'boolean', default: true, description: 'AI matches fields even if names differ' },
        aiValidate: { type: 'boolean', default: true, description: 'AI validates form before submission' },
        captcha: { type: 'boolean', default: true, description: 'Auto-solve CAPTCHA if present' }
      },
      required: ['data']
    }
  }
];

// Tool categories
const CATEGORIES = {
  browser: { name: 'Browser', emoji: '🌐', description: 'Browser lifecycle management' },
  navigation: { name: 'Navigation', emoji: '🧭', description: 'Page navigation' },
  interaction: { name: 'Interaction', emoji: '👆', description: 'User interactions' },
  extraction: { name: 'Extraction', emoji: '📄', description: 'Content extraction and scraping' },
  network: { name: 'Network', emoji: '📡', description: 'Network operations' },
  analysis: { name: 'Analysis', emoji: '🧠', description: 'Page analysis' },
  utility: { name: 'Utility', emoji: '🛠️', description: 'Utility tools' }
};

// Helper functions
const getToolByName = (name) => TOOLS.find(t => t.name === name);
const getToolsByCategory = (category) => TOOLS.filter(t => t.category === category);
const getToolNames = () => TOOLS.map(t => t.name);
const getRequiredParams = (toolName) => {
  const tool = getToolByName(toolName);
  return tool?.inputSchema?.required || [];
};

// Export
const TOOL_DISPLAY = TOOLS.map(t => ({
  name: t.name,
  emoji: t.emoji,
  description: t.description,
  descriptionHindi: t.descriptionHindi,
  category: t.category
}));

module.exports = { 
  TOOLS, 
  TOOL_DISPLAY, 
  CATEGORIES,
  getToolByName,
  getToolsByCategory,
  getToolNames,
  getRequiredParams
};