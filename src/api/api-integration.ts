// API & Integration Layer
// REST endpoints, Webhooks, Zapier, GraphQL, Plugin System

// Use generic types instead of Puppeteer to avoid dependency
type Page = any;
type Browser = any;

/**
 * REST API Endpoint Handler
 * External HTTP APIs को call करने के लिए
 */
export interface RestEndpointOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export async function callRestEndpoint(
  page: Page,
  options: RestEndpointOptions
): Promise<{ status: number; data: any; headers: Record<string, string> }> {
  const { method, url, headers = {}, body, timeout = 30000 } = options;

  try {
    // Use page.evaluate to make fetch call from browser context
    const result = await page.evaluate(
      async ({ method, url, headers, body, timeout }: { method: string; url: string; headers: Record<string, string>; body: any; timeout: number }) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const fetchOptions: RequestInit = {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            signal: controller.signal,
          };

          if (body && method !== 'GET') {
            fetchOptions.body = JSON.stringify(body);
          }

          const response = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);

          const contentType = response.headers.get('content-type');
          let data;

          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          // Convert Headers to plain object
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          return {
            status: response.status,
            data,
            headers: responseHeaders,
          };
        } catch (error: any) {
          throw new Error(`Fetch failed: ${error.message}`);
        }
      },
      { method, url, headers, body, timeout }
    );

    return result;
  } catch (error) {
    throw new Error(`REST endpoint call failed: ${error}`);
  }
}

/**
 * Webhook Handler
 * Scraped data को webhook endpoints पर भेजना
 */
export interface WebhookConfig {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export async function sendToWebhook(
  data: any,
  config: WebhookConfig
): Promise<{ success: boolean; status?: number; error?: string }> {
  const { url, method = 'POST', headers = {}, retries = 3, retryDelay = 1000 } = config;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Use native fetch or node-fetch
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return { success: true, status: response.status };
      }

      // If not last attempt, wait and retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      return {
        success: false,
        status: response.status,
        error: `Webhook returned ${response.status}`,
      };
    } catch (error: any) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Zapier Integration
 * Zapier webhooks के साथ integration
 */
export interface ZapierTrigger {
  webhookUrl: string;
  eventType: string;
  data: Record<string, any>;
}

export async function triggerZapierWebhook(
  trigger: ZapierTrigger
): Promise<{ success: boolean; zapId?: string; error?: string }> {
  const { webhookUrl, eventType, data } = trigger;

  try {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        zapId: result.id || result.zapId,
      };
    }

    return {
      success: false,
      error: `Zapier webhook failed: ${response.status}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * GraphQL Query Executor
 * GraphQL queries execute करना
 */
export interface GraphQLQuery {
  endpoint: string;
  query: string;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
}

export async function executeGraphQL(
  page: Page,
  options: GraphQLQuery
): Promise<{ data?: any; errors?: any[]; extensions?: any }> {
  const { endpoint, query, variables = {}, headers = {} } = options;

  try {
    const result = await page.evaluate(
      async ({ endpoint, query, variables, headers }: { endpoint: string; query: string; variables: Record<string, any>; headers: Record<string, string> }) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({
            query,
            variables,
          }),
        });

        return await response.json();
      },
      { endpoint, query, variables, headers }
    );

    return result;
  } catch (error) {
    throw new Error(`GraphQL execution failed: ${error}`);
  }
}

/**
 * Plugin System
 * Custom plugins को load और execute करना
 */
export interface Plugin {
  name: string;
  version: string;
  initialize: (context: PluginContext) => Promise<void>;
  execute: (page: Page, args?: any) => Promise<any>;
  cleanup?: () => Promise<void>;
}

export interface PluginContext {
  page: Page;
  browser: Browser;
  config: Record<string, any>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private context: PluginContext | null = null;

  constructor() {}

  setContext(context: PluginContext): void {
    this.context = context;
  }

  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    if (this.context) {
      await plugin.initialize(this.context);
    }

    this.plugins.set(plugin.name, plugin);
  }

  async executePlugin(name: string, args?: any): Promise<any> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    if (!this.context) {
      throw new Error('Plugin context not set');
    }

    return await plugin.execute(this.context.page, args);
  }

  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.cleanup) {
      await plugin.cleanup();
    }
    this.plugins.delete(name);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
    }
    this.plugins.clear();
  }
}

/**
 * Data Export Helper
 * Multiple formats में data export करना
 */
export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'yaml';
  pretty?: boolean;
  compression?: boolean;
}

export function exportData(data: any, options: ExportOptions): string {
  const { format, pretty = true } = options;

  switch (format) {
    case 'json':
      return JSON.stringify(data, null, pretty ? 2 : 0);

    case 'csv':
      return convertToCSV(data);

    case 'xml':
      return convertToXML(data);

    case 'yaml':
      return convertToYAML(data);

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function convertToCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Get all unique keys
  const keys = Array.from(
    new Set(data.flatMap(obj => Object.keys(obj)))
  );

  // Create header row
  const header = keys.join(',');

  // Create data rows
  const rows = data.map(obj => {
    return keys
      .map(key => {
        const value = obj[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

function convertToXML(data: any, rootTag: string = 'root'): string {
  const xmlify = (obj: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);

    if (Array.isArray(obj)) {
      return obj.map(item => xmlify(item, indent)).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .map(([key, value]) => {
          const tag = key.replace(/[^a-zA-Z0-9_-]/g, '_');
          if (typeof value === 'object' && value !== null) {
            return `${spaces}<${tag}>\n${xmlify(value, indent + 1)}\n${spaces}</${tag}>`;
          }
          return `${spaces}<${tag}>${escapeXml(String(value))}</${tag}>`;
        })
        .join('\n');
    }

    return `${spaces}${escapeXml(String(obj))}`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${xmlify(data, 1)}\n</${rootTag}>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function convertToYAML(data: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);

  if (Array.isArray(data)) {
    return data
      .map(item => {
        if (typeof item === 'object' && item !== null) {
          const yaml = convertToYAML(item, indent + 1);
          return `${spaces}- ${yaml.substring(spaces.length + 2)}`;
        }
        return `${spaces}- ${item}`;
      })
      .join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${convertToYAML(value, indent + 1)}`;
        }
        return `${spaces}${key}: ${value}`;
      })
      .join('\n');
  }

  return `${spaces}${data}`;
}

/**
 * Batch Operations Handler
 * Multiple operations को batch में execute करना
 */
export interface BatchOperation {
  type: string;
  params: any;
}

export async function executeBatchOperations(
  page: Page,
  operations: BatchOperation[],
  options: {
    parallel?: boolean;
    stopOnError?: boolean;
  } = {}
): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
  const { parallel = false, stopOnError = false } = options;

  if (parallel) {
    // Execute all operations in parallel
    const promises = operations.map(async op => {
      try {
        // This is a placeholder - actual implementation would call appropriate handlers
        const result = await executeOperation(page, op);
        return { success: true, result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    return await Promise.all(promises);
  } else {
    // Execute sequentially
    const results: Array<{ success: boolean; result?: any; error?: string }> = [];

    for (const op of operations) {
      try {
        const result = await executeOperation(page, op);
        results.push({ success: true, result });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
        if (stopOnError) {
          break;
        }
      }
    }

    return results;
  }
}

async function executeOperation(page: Page, operation: BatchOperation): Promise<any> {
  // Placeholder - would integrate with actual tool handlers
  console.log(`Executing operation: ${operation.type}`, operation.params);
  return { executed: true, type: operation.type };
}

/**
 * Event Emitter for Integration Events
 */
export class IntegrationEventEmitter {
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
