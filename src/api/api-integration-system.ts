// API Integration System
import { Page } from 'puppeteer-core';

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (data: any) => Promise<any>;
}

export class APIIntegrationSystem {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private webhooks: WebhookConfig[] = [];

  registerEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.set(`${endpoint.method}:${endpoint.path}`, endpoint);
  }

  async handleRequest(method: string, path: string, data: any): Promise<any> {
    const key = `${method}:${path}`;
    const endpoint = this.endpoints.get(key);
    if (!endpoint) throw new Error(`Endpoint not found: ${key}`);
    return await endpoint.handler(data);
  }

  addWebhook(config: WebhookConfig): void {
    this.webhooks.push(config);
  }

  async triggerWebhooks(eventData: any): Promise<void> {
    for (const webhook of this.webhooks) {
      try {
        await fetch(webhook.url, {
          method: webhook.method,
          headers: { 'Content-Type': 'application/json', ...webhook.headers },
          body: JSON.stringify(eventData),
        });
      } catch (error) {
        console.error('Webhook failed:', error);
      }
    }
  }

  async zapierIntegration(zapierWebhookUrl: string, data: any): Promise<boolean> {
    try {
      const response = await fetch(zapierWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async graphqlQuery(endpoint: string, query: string, variables?: any): Promise<any> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      const result = await response.json();
      return result.data;
    } catch (error) {
      throw new Error(`GraphQL query failed: ${error}`);
    }
  }

  loadPlugin(plugin: { name: string; init: () => void; handlers: Record<string, Function> }): void {
    plugin.init();
    Object.entries(plugin.handlers).forEach(([name, handler]) => {
      this.registerEndpoint({
        path: `/plugin/${plugin.name}/${name}`,
        method: 'POST',
        handler: async (data) => handler(data),
      });
    });
  }
}
