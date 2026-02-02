/**
 * Brave Real Browser MCP Server - Tool Definitions
 * 
 * 28 Browser Automation Tools for AI Agents
 * Supports: Claude, Cursor, Copilot, and other MCP-compatible AI assistants
 */

const TOOLS = [
  // 1. Browser Init
  {
    name: 'browser_init',
    emoji: '🚀',
    description: 'Initialize and start the Brave browser with stealth mode',
    descriptionHindi: 'ब्राउज़र शुरू करना',
    inputSchema: {
      type: 'object',
      properties: {
        headless: {
          type: 'boolean',
          description: 'Run browser in headless mode',
          default: false
        },
        proxy: {
          type: 'object',
          description: 'Proxy configuration',
          properties: {
            host: { type: 'string' },
            port: { type: 'number' },
            username: { type: 'string' },
            password: { type: 'string' }
          }
        },
        turnstile: {
          type: 'boolean',
          description: 'Enable Cloudflare Turnstile auto-solver',
          default: false
        },
        enableBlocker: {
          type: 'boolean',
          description: 'Enable ad/tracker blocker',
          default: true
        }
      }
    }
  },

  // 2. Navigate
  {
    name: 'navigate',
    emoji: '🧭',
    description: 'Navigate to a URL',
    descriptionHindi: 'URL पर जाना',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to navigate to'
        },
        waitUntil: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
          default: 'networkidle2'
        },
        timeout: {
          type: 'number',
          description: 'Navigation timeout in milliseconds',
          default: 30000
        }
      },
      required: ['url']
    }
  },

  // 3. Get Content
  {
    name: 'get_content',
    emoji: '📄',
    description: 'Get page content (HTML, text, or structured)',
    descriptionHindi: 'पेज का कंटेंट लेना',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['html', 'text', 'markdown'],
          default: 'text'
        },
        selector: {
          type: 'string',
          description: 'Optional CSS selector to get specific content'
        }
      }
    }
  },

  // 4. Wait
  {
    name: 'wait',
    emoji: '⏳',
    description: 'Wait for element, navigation, or timeout',
    descriptionHindi: 'किसी चीज़ का इंतजार करना',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['selector', 'navigation', 'timeout', 'networkidle'],
          default: 'timeout'
        },
        value: {
          type: 'string',
          description: 'Selector or timeout value'
        },
        timeout: {
          type: 'number',
          default: 30000
        }
      },
      required: ['value']
    }
  },

  // 5. Click
  {
    name: 'click',
    emoji: '👆',
    description: 'Click on an element with human-like behavior',
    descriptionHindi: 'क्लिक करना',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of element to click'
        },
        humanLike: {
          type: 'boolean',
          description: 'Use ghost-cursor for human-like movement',
          default: true
        },
        clickCount: {
          type: 'number',
          default: 1
        },
        delay: {
          type: 'number',
          description: 'Delay between clicks in ms',
          default: 0
        }
      },
      required: ['selector']
    }
  },

  // 6. Type
  {
    name: 'type',
    emoji: '⌨️',
    description: 'Type text into an input field',
    descriptionHindi: 'टेक्स्ट टाइप करना',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of input element'
        },
        text: {
          type: 'string',
          description: 'Text to type'
        },
        delay: {
          type: 'number',
          description: 'Delay between keystrokes in ms',
          default: 50
        },
        clear: {
          type: 'boolean',
          description: 'Clear existing text before typing',
          default: false
        }
      },
      required: ['selector', 'text']
    }
  },

  // 7. Browser Close
  {
    name: 'browser_close',
    emoji: '🔴',
    description: 'Close the browser and cleanup resources',
    descriptionHindi: 'ब्राउज़र बंद करना',
    inputSchema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force close even if operations pending',
          default: false
        }
      }
    }
  },

  // 8. Solve Captcha
  {
    name: 'solve_captcha',
    emoji: '🔓',
    description: 'Solve CAPTCHA challenges (Turnstile, reCAPTCHA)',
    descriptionHindi: 'CAPTCHA हल करना',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['turnstile', 'recaptcha', 'hcaptcha', 'auto'],
          default: 'auto'
        },
        timeout: {
          type: 'number',
          default: 30000
        }
      }
    }
  },

  // 9. Random Scroll
  {
    name: 'random_scroll',
    emoji: '📜',
    description: 'Scroll the page randomly like a human',
    descriptionHindi: 'स्क्रॉल करना',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['up', 'down', 'random'],
          default: 'down'
        },
        amount: {
          type: 'number',
          description: 'Scroll amount in pixels (0 for random)',
          default: 0
        },
        smooth: {
          type: 'boolean',
          default: true
        }
      }
    }
  },

  // 10. Find Element
  {
    name: 'find_element',
    emoji: '🔍',
    description: 'Find element(s) on the page',
    descriptionHindi: 'एलीमेंट खोजना',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector'
        },
        xpath: {
          type: 'string',
          description: 'XPath selector (alternative to CSS)'
        },
        text: {
          type: 'string',
          description: 'Find by text content'
        },
        multiple: {
          type: 'boolean',
          description: 'Return multiple elements',
          default: false
        }
      }
    }
  },

  // 11. Save Content as Markdown
  {
    name: 'save_content_as_markdown',
    emoji: '📝',
    description: 'Save page content as Markdown file',
    descriptionHindi: 'कंटेंट MD में सेव करना',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Output filename'
        },
        selector: {
          type: 'string',
          description: 'Optional selector for specific content'
        },
        includeImages: {
          type: 'boolean',
          default: true
        },
        includeMeta: {
          type: 'boolean',
          default: true
        }
      },
      required: ['filename']
    }
  },

  // 12. Redirect Tracer
  {
    name: 'redirect_tracer',
    emoji: '🔀',
    description: 'Trace URL redirects and get final destination',
    descriptionHindi: 'रीडायरेक्ट ट्रेस करना',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to trace'
        },
        maxRedirects: {
          type: 'number',
          default: 10
        },
        includeHeaders: {
          type: 'boolean',
          default: false
        }
      },
      required: ['url']
    }
  },

  // 13. Search Regex
  {
    name: 'search_regex',
    emoji: '🔎',
    description: 'Search page content using regex patterns',
    descriptionHindi: 'Regex सर्च',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Regex pattern'
        },
        flags: {
          type: 'string',
          description: 'Regex flags (g, i, m)',
          default: 'gi'
        },
        source: {
          type: 'string',
          enum: ['html', 'text', 'scripts'],
          default: 'html'
        }
      },
      required: ['pattern']
    }
  },

  // 14. Extract JSON
  {
    name: 'extract_json',
    emoji: '📊',
    description: 'Extract JSON data from page or scripts',
    descriptionHindi: 'JSON निकालना',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['page', 'scripts', 'ld+json', 'api'],
          default: 'page'
        },
        selector: {
          type: 'string',
          description: 'CSS selector for specific element'
        },
        jsonPath: {
          type: 'string',
          description: 'JSONPath expression to extract specific data'
        }
      }
    }
  },

  // 15. Scrape Meta Tags
  {
    name: 'scrape_meta_tags',
    emoji: '🏷️',
    description: 'Extract meta tags, Open Graph, and Twitter cards',
    descriptionHindi: 'Meta tags निकालना',
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types: meta, og, twitter, all',
          default: ['all']
        }
      }
    }
  },

  // 16. Press Key
  {
    name: 'press_key',
    emoji: '🎹',
    description: 'Press keyboard key(s)',
    descriptionHindi: 'की प्रेस करना',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Key to press (Enter, Escape, Tab, etc.)'
        },
        modifiers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Modifier keys (Ctrl, Alt, Shift, Meta)'
        },
        count: {
          type: 'number',
          default: 1
        }
      },
      required: ['key']
    }
  },

  // 17. Progress Tracker
  {
    name: 'progress_tracker',
    emoji: '📈',
    description: 'Track automation progress and stats',
    descriptionHindi: 'प्रोग्रेस ट्रैक करना',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['start', 'update', 'complete', 'get'],
          default: 'get'
        },
        taskName: {
          type: 'string'
        },
        progress: {
          type: 'number',
          description: 'Progress percentage (0-100)'
        }
      }
    }
  },

  // 18. Deep Analysis
  {
    name: 'deep_analysis',
    emoji: '🧠',
    description: 'Deep analysis of page structure, performance, and content',
    descriptionHindi: 'गहरा विश्लेषण',
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Analysis types: seo, performance, accessibility, security',
          default: ['all']
        },
        detailed: {
          type: 'boolean',
          default: true
        }
      }
    }
  },

  // 19. Network Recorder
  {
    name: 'network_recorder',
    emoji: '📡',
    description: 'Record and analyze network requests',
    descriptionHindi: 'नेटवर्क रिकॉर्ड करना',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['start', 'stop', 'get', 'clear'],
          default: 'get'
        },
        filter: {
          type: 'object',
          properties: {
            resourceType: { type: 'string' },
            urlPattern: { type: 'string' },
            method: { type: 'string' }
          }
        }
      }
    }
  },

  // 20. Link Harvester
  {
    name: 'link_harvester',
    emoji: '🔗',
    description: 'Extract all links from the page',
    descriptionHindi: 'लिंक्स निकालना',
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Link types: internal, external, media, all',
          default: ['all']
        },
        selector: {
          type: 'string',
          description: 'Limit to specific container'
        },
        includeText: {
          type: 'boolean',
          default: true
        }
      }
    }
  },

  // 21. Cookie Manager
  {
    name: 'cookie_manager',
    emoji: '🍪',
    description: 'Manage browser cookies',
    descriptionHindi: 'कुकीज़ मैनेज करना',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'set', 'delete', 'clear'],
          default: 'get'
        },
        name: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        domain: {
          type: 'string'
        },
        expires: {
          type: 'number'
        }
      }
    }
  },

  // 22. File Downloader
  {
    name: 'file_downloader',
    emoji: '⬇️',
    description: 'Download files from URLs',
    descriptionHindi: 'फाइल डाउनलोड करना',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'File URL to download'
        },
        filename: {
          type: 'string',
          description: 'Output filename'
        },
        directory: {
          type: 'string',
          description: 'Output directory',
          default: './downloads'
        }
      },
      required: ['url']
    }
  },

  // 23. iFrame Handler
  {
    name: 'iframe_handler',
    emoji: '🖼️',
    description: 'Handle iFrame content and interactions',
    descriptionHindi: 'iFrame हैंडल करना',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'switch', 'content', 'exit'],
          default: 'list'
        },
        selector: {
          type: 'string',
          description: 'iFrame selector'
        },
        index: {
          type: 'number',
          description: 'iFrame index'
        }
      }
    }
  },

  // 24. Stream Extractor
  {
    name: 'stream_extractor',
    emoji: '🎬',
    description: 'Extract video/audio stream URLs',
    descriptionHindi: 'स्ट्रीम URL निकालना',
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stream types: video, audio, hls, dash, all',
          default: ['all']
        },
        quality: {
          type: 'string',
          enum: ['best', 'worst', 'all'],
          default: 'best'
        }
      }
    }
  },

  // 25. JS Scrape
  {
    name: 'js_scrape',
    emoji: '⚡',
    description: 'Scrape JavaScript-rendered content',
    descriptionHindi: 'JS-rendered कंटेंट स्क्रैप करना',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector'
        },
        waitForJS: {
          type: 'boolean',
          description: 'Wait for JS to fully render',
          default: true
        },
        timeout: {
          type: 'number',
          default: 10000
        }
      },
      required: ['selector']
    }
  },

  // 26. Execute JS
  {
    name: 'execute_js',
    emoji: '💻',
    description: 'Execute custom JavaScript in page context',
    descriptionHindi: 'कस्टम JS चलाना',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'JavaScript code to execute'
        },
        returnValue: {
          type: 'boolean',
          description: 'Return the result of execution',
          default: true
        }
      },
      required: ['code']
    }
  },

  // 27. Player API Hook
  {
    name: 'player_api_hook',
    emoji: '🎮',
    description: 'Hook into video player APIs to extract data',
    descriptionHindi: 'वीडियो प्लेयर से डेटा निकालना',
    inputSchema: {
      type: 'object',
      properties: {
        playerType: {
          type: 'string',
          enum: ['youtube', 'vimeo', 'jwplayer', 'videojs', 'auto'],
          default: 'auto'
        },
        action: {
          type: 'string',
          enum: ['info', 'sources', 'play', 'pause', 'seek'],
          default: 'info'
        }
      }
    }
  },

  // 28. Form Automator
  {
    name: 'form_automator',
    emoji: '📋',
    description: 'Automatically fill and submit forms',
    descriptionHindi: 'फॉर्म भरना',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Form selector'
        },
        data: {
          type: 'object',
          description: 'Form data as key-value pairs'
        },
        submit: {
          type: 'boolean',
          description: 'Submit form after filling',
          default: false
        },
        humanLike: {
          type: 'boolean',
          description: 'Fill with human-like delays',
          default: true
        }
      },
      required: ['data']
    }
  }
];

// Export tool names with emojis for logging
const TOOL_DISPLAY = TOOLS.map(t => ({
  name: t.name,
  emoji: t.emoji,
  description: t.description,
  descriptionHindi: t.descriptionHindi
}));

module.exports = { TOOLS, TOOL_DISPLAY };
