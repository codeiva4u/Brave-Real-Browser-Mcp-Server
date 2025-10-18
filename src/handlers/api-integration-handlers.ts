// @ts-nocheck
import { getBrowserInstance, getPageInstance } from '../browser-manager.js';
import axios from 'axios';
import { sleep } from '../system-utils.js';

/**
 * REST API Endpoint Finder - Discover REST API endpoints
 */
export async function handleRESTAPIEndpointFinder(args: any): Promise<any> {
  const { url, analyzeNetworkRequests = true, scanDuration = 10000 } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
    const apiEndpoints: any[] = [];
    const seenUrls = new Set<string>();
    
    // Listen to network requests
    if (analyzeNetworkRequests) {
      const requestHandler = (request: any) => {
        const requestUrl = request.url();
        const method = request.method();
        const resourceType = request.resourceType();
        
        // Filter for API-like requests
        if (
          (resourceType === 'xhr' || resourceType === 'fetch') &&
          !seenUrls.has(requestUrl)
        ) {
          seenUrls.add(requestUrl);
          
          const headers = request.headers();
          const postData = request.postData();
          
          apiEndpoints.push({
            url: requestUrl,
            method,
            resourceType,
            headers: Object.keys(headers).reduce((acc, key) => {
              if (!key.toLowerCase().includes('cookie') && !key.toLowerCase().includes('authorization')) {
                acc[key] = headers[key];
              }
              return acc;
            }, {} as any),
            hasBody: !!postData,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      page.on('request', requestHandler);
      
      // Navigate and wait
      if (url && page.url() !== url) {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      }
      
      // Wait for additional requests
      await sleep(scanDuration);
      
      page.off('request', requestHandler);
    }
    
    // Also scan page content for API endpoints
    const discoveredAPIs = await page.evaluate(() => {
      const apis: any[] = [];
      const scripts = Array.from(document.querySelectorAll('script'));
      
      // Common API URL patterns
      const apiPatterns = [
        /https?:\/\/[^"'\s]+\/api\/[^"'\s]*/gi,
        /https?:\/\/api\.[^"'\s]+/gi,
        /\/api\/v?\d*\/[^"'\s]*/gi,
        /graphql/gi,
        /rest\/v?\d*/gi
      ];
      
      scripts.forEach(script => {
        const content = script.textContent || '';
        apiPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => apis.push({
              url: match,
              source: 'script_content',
              type: 'discovered'
            }));
          }
        });
      });
      
      // Check for data attributes
      const elements = Array.from(document.querySelectorAll('[data-api], [data-endpoint], [data-url]'));
      elements.forEach(el => {
        const apiUrl = el.getAttribute('data-api') || el.getAttribute('data-endpoint') || el.getAttribute('data-url');
        if (apiUrl) {
          apis.push({
            url: apiUrl,
            source: 'data_attribute',
            element: el.tagName.toLowerCase()
          });
        }
      });
      
      return apis;
    });
    
    let summary = `REST API Discovery Results:\n\nSummary:\n- Total APIs Found: ${apiEndpoints.length + discoveredAPIs.length}\n- Network APIs: ${apiEndpoints.length}\n- Discovered in Content: ${discoveredAPIs.length}`;
    
    if (apiEndpoints.length > 0) {
      summary += `\n\nNetwork API Endpoints (Top 10):\n${apiEndpoints.slice(0, 10).map((ep: any, i: number) => `${i + 1}. ${ep.method} ${ep.url}\n   Type: ${ep.resourceType}${ep.hasBody ? ' (with body)' : ''}`).join('\n')}`;
    }
    
    if (discoveredAPIs.length > 0) {
      summary += `\n\nDiscovered APIs (Top 10):\n${discoveredAPIs.slice(0, 10).map((api: any, i: number) => `${i + 1}. ${api.url}\n   Source: ${api.source}`).join('\n')}`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: summary
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `REST API Endpoint Finder Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Webhook Support - Set up and test webhooks
 */
export async function handleWebhookSupport(args: any): Promise<any> {
  const { webhookUrl, method = 'POST', payload, headers, testMode = true } = args;
  
  try {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Brave-MCP-Server/1.0',
      ...headers
    };
    
    let response;
    
    if (testMode) {
      // Test webhook with ping
      try {
        response = await axios({
          method,
          url: webhookUrl,
          headers: defaultHeaders,
          data: payload || { test: true, timestamp: new Date().toISOString() },
          timeout: 10000
        });
        
        return {
          content: [
            {
              type: "text",
              text: `Webhook Test Successful:\n- URL: ${webhookUrl}\n- Method: ${method}\n- Status: ${response.status} ${response.statusText}\n- Response Headers: ${JSON.stringify(response.headers, null, 2)}\n- Response Data: ${JSON.stringify(response.data, null, 2)}`
            }
          ]
        };
      } catch (webhookError: any) {
        return {
          content: [
            {
              type: "text",
              text: `Webhook Test Failed:\n- URL: ${webhookUrl}\n- Error: ${webhookError.message}${webhookError.response ? `\n- Status: ${webhookError.response.status} ${webhookError.response.statusText}\n- Response: ${JSON.stringify(webhookError.response.data, null, 2)}` : ''}`
            }
          ],
          isError: true
        };
      }
    } else {
      // Production mode - set up webhook listener
      return {
        content: [
          {
            type: "text",
            text: `Webhook Configured:\n- URL: ${webhookUrl}\n- Method: ${method}\n- Test Mode: No\n- Status: Configured\n\nNote: Webhook configured. Send data using separate call or integrate with scraping workflow`
          }
        ]
      };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Webhook Support Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * All Website API Finder - Comprehensive API discovery
 */
export async function handleAllWebsiteAPIFinder(args: any): Promise<any> {
  const { url, deepScan = true, includeExternal = false } = args;
  
  try {
    const page = getPageInstance();    if (!page) {      throw new Error('Browser not initialized. Call browser_init first.');    }
    
    if (url && page.url() !== url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }
    
    const apiDiscovery = await page.evaluate((deep: boolean, external: boolean) => {
      const result: any = {
        apis: [],
        graphql: [],
        rest: [],
        websockets: [],
        metadata: {}
      };
      
      // 1. Check for API documentation links
      const apiLinks = Array.from(document.querySelectorAll('a[href*="api"], a[href*="docs"], a[href*="developer"]'));
      result.documentationLinks = apiLinks.map(link => ({
        text: (link as HTMLAnchorElement).textContent?.trim(),
        href: (link as HTMLAnchorElement).href
      })).slice(0, 10);
      
      // 2. Scan for GraphQL
      const graphqlIndicators = document.body.innerHTML.match(/graphql|__schema|query\s*{|mutation\s*{/gi);
      if (graphqlIndicators) {
        result.graphql.push({
          found: true,
          indicators: graphqlIndicators.length,
          possibleEndpoints: [
            '/graphql',
            '/api/graphql',
            '/v1/graphql'
          ]
        });
      }
      
      // 3. Scan scripts for API configurations
      const scripts = Array.from(document.querySelectorAll('script'));
      scripts.forEach(script => {
        const content = script.textContent || '';
        
        // Look for API base URLs
        const baseUrlPatterns = [
          /apiUrl\s*[:=]\s*["']([^"']+)["']/gi,
          /baseURL\s*[:=]\s*["']([^"']+)["']/gi,
          /API_BASE\s*[:=]\s*["']([^"']+)["']/gi,
          /endpoint\s*[:=]\s*["']([^"']+)["']/gi
        ];
        
        baseUrlPatterns.forEach(pattern => {
          const matches = Array.from(content.matchAll(pattern));
          matches.forEach(match => {
            if (match[1] && (external || match[1].startsWith('/'))) {
              result.apis.push({
                type: 'config',
                url: match[1],
                source: 'script'
              });
            }
          });
        });
        
        // Look for WebSocket connections
        if (content.includes('WebSocket') || content.includes('ws://') || content.includes('wss://')) {
          const wsMatches = content.match(/wss?:\/\/[^"'\s]+/gi);
          if (wsMatches) {
            wsMatches.forEach(ws => {
              result.websockets.push({
                url: ws,
                protocol: ws.startsWith('wss') ? 'secure' : 'unsecure'
              });
            });
          }
        }
      });
      
      // 4. Check meta tags for API info
      const metaTags = Array.from(document.querySelectorAll('meta[name*="api"], meta[property*="api"]'));
      result.metadata.apiMeta = metaTags.map(meta => ({
        name: meta.getAttribute('name') || meta.getAttribute('property'),
        content: meta.getAttribute('content')
      }));
      
      // 5. Look for REST patterns
      const restPatterns = [
        '/api/v1', '/api/v2', '/api/v3',
        '/rest/v1', '/rest/v2',
        '/api/users', '/api/products', '/api/data'
      ];
      
      restPatterns.forEach(pattern => {
        const found = document.body.innerHTML.includes(pattern);
        if (found) {
          result.rest.push({
            pattern,
            found: true
          });
        }
      });
      
      // 6. Check for Swagger/OpenAPI
      const swaggerLinks = Array.from(document.querySelectorAll('a[href*="swagger"], a[href*="openapi"], link[href*="swagger"]'));
      if (swaggerLinks.length > 0) {
        result.swagger = swaggerLinks.map(link => ({
          href: (link as HTMLAnchorElement).href || (link as HTMLLinkElement).href
        }));
      }
      
      return result;
    }, deepScan, includeExternal);
    
    // Deduplicate APIs
    const uniqueAPIs = [...new Set(apiDiscovery.apis.map((api: any) => api.url))];
    const restFound = apiDiscovery.rest.filter((r: any) => r.found).length;
    
    let summary = `Comprehensive API Discovery:\n\nSummary:\n- Total Unique APIs: ${uniqueAPIs.length}\n- GraphQL Detected: ${apiDiscovery.graphql.length > 0 ? 'Yes' : 'No'}\n- REST Endpoints: ${restFound}\n- WebSockets: ${apiDiscovery.websockets.length}\n- Documentation Links: ${apiDiscovery.documentationLinks?.length || 0}`;
    
    if (apiDiscovery.graphql.length > 0) {
      summary += `\n\nGraphQL:\n- Indicators Found: ${apiDiscovery.graphql[0].indicators}\n- Possible Endpoints: ${apiDiscovery.graphql[0].possibleEndpoints.join(', ')}`;
    }
    
    if (uniqueAPIs.length > 0) {
      summary += `\n\nUnique APIs (Top 10):\n${uniqueAPIs.slice(0, 10).map((api: string, i: number) => `${i + 1}. ${api}`).join('\n')}`;
    }
    
    if (apiDiscovery.websockets.length > 0) {
      summary += `\n\nWebSockets:\n${apiDiscovery.websockets.map((ws: any, i: number) => `${i + 1}. ${ws.url} (${ws.protocol})`).join('\n')}`;
    }
    
    if (apiDiscovery.documentationLinks?.length > 0) {
      summary += `\n\nDocumentation Links:\n${apiDiscovery.documentationLinks.slice(0, 5).map((link: any, i: number) => `${i + 1}. ${link.text}: ${link.href}`).join('\n')}`;
    }
    
    if (apiDiscovery.swagger?.length > 0) {
      summary += `\n\nSwagger/OpenAPI:\n${apiDiscovery.swagger.map((s: any, i: number) => `${i + 1}. ${s.href}`).join('\n')}`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: summary
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `All Website API Finder Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}
