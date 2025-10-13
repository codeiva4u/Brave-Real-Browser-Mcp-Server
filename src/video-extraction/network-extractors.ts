// Network-based video extraction tools
import { Page, HTTPRequest, HTTPResponse } from 'brave-real-puppeteer-core';
import { VideoSource, VideoFormat, ExtractionStrategy, VIDEO_URL_PATTERNS, TOKEN_PATTERNS } from './types.js';
import { withErrorHandling } from '../system-utils.js';
import { getBrowser } from '../browser-manager.js';

export interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  resourceType: string;
  response?: NetworkResponse;
  redirectChain: string[];
  timestamp: number;
}

export interface NetworkResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  body?: string;
  contentType: string;
  size: number;
}

export class NetworkRecorder {
  private page: Page | null = null;
  private requests: NetworkRequest[] = [];
  private isRecording: boolean = false;
  private maxRecords: number = 1000;
  
  async initialize(): Promise<void> {
    const browser = getBrowser();
    if (!browser) {
      throw new Error('Browser not initialized. Call browser_init first.');
    }
    this.page = browser.pages()[0] || await browser.newPage();
  }

  async startRecording(options: { 
    interceptRequests?: boolean;
    captureResponses?: boolean;
    filterResourceTypes?: string[];
    maxRecords?: number;
  } = {}): Promise<void> {
    if (!this.page) await this.initialize();
    
    return withErrorHandling(async () => {
      this.maxRecords = options.maxRecords || 1000;
      this.requests = [];
      this.isRecording = true;
      
      // Enable request interception if needed
      if (options.interceptRequests) {
        await this.page!.setRequestInterception(true);
      }
      
      // Monitor network requests
      this.page!.on('request', (request: HTTPRequest) => {
        if (!this.isRecording || this.requests.length >= this.maxRecords) return;
        
        const resourceType = request.resourceType();
        
        // Filter by resource types if specified
        if (options.filterResourceTypes && !options.filterResourceTypes.includes(resourceType)) {
          if (options.interceptRequests) request.continue();
          return;
        }
        
        const networkRequest: NetworkRequest = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
          resourceType,
          redirectChain: request.redirectChain().map(r => r.url()),
          timestamp: Date.now()
        };
        
        this.requests.push(networkRequest);
        
        if (options.interceptRequests) request.continue();
      });
      
      // Monitor responses if requested
      if (options.captureResponses) {
        this.page!.on('response', async (response: HTTPResponse) => {
          if (!this.isRecording) return;
          
          const request = this.requests.find(r => r.url === response.url());
          if (request) {
            try {
              const body = await this.getResponseBody(response);
              request.response = {
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                body,
                contentType: response.headers()['content-type'] || '',
                size: parseInt(response.headers()['content-length'] || '0', 10)
              };
            } catch (error) {
              console.error('Error capturing response body:', error);
            }
          }
        });
      }
    }, 'NetworkRecorder.startRecording');
  }

  async stopRecording(): Promise<NetworkRequest[]> {
    this.isRecording = false;
    
    // Disable request interception
    if (this.page) {
      try {
        await this.page.setRequestInterception(false);
      } catch (error) {
        console.error('Error disabling request interception:', error);
      }
    }
    
    return [...this.requests];
  }

  async getVideoRequests(): Promise<VideoSource[]> {
    return withErrorHandling(async () => {
      const videoSources: VideoSource[] = [];
      
      for (const request of this.requests) {
        // Check if URL matches video patterns
        if (this.isVideoUrl(request.url)) {
          const videoSource: VideoSource = {
            url: request.url,
            format: this.detectFormat(request.url),
            headers: this.extractVideoHeaders(request.headers),
            hoster: this.extractDomain(request.url),
            extractorUsed: 'NetworkRecorder.getVideoRequests',
            confidence: this.calculateConfidence(request),
            size: request.response?.size
          };
          
          // Add quality information if available
          const quality = this.extractQuality(request.url);
          if (quality) {
            videoSource.quality = quality;
          }
          
          // Check if it's a playlist
          if (this.isPlaylistFormat(videoSource.format)) {
            videoSource.isPlaylist = true;
            
            // Try to extract segments from response
            if (request.response?.body) {
              videoSource.segments = this.extractPlaylistSegments(request.response.body);
            }
          }
          
          videoSources.push(videoSource);
        }
      }
      
      return videoSources;
    }, 'NetworkRecorder.getVideoRequests');
  }

  async getAPIEndpoints(): Promise<string[]> {
    return withErrorHandling(async () => {
      const apiEndpoints: string[] = [];
      
      for (const request of this.requests) {
        // Check for API endpoints that might contain video data
        if (this.isAPIEndpoint(request)) {
          apiEndpoints.push(request.url);
        }
      }
      
      return [...new Set(apiEndpoints)];
    }, 'NetworkRecorder.getAPIEndpoints');
  }

  async extractTokensFromRequests(): Promise<Record<string, string[]>> {
    return withErrorHandling(async () => {
      const tokens: Record<string, string[]> = {
        signatures: [],
        authTokens: [],
        timestamps: [],
        hashes: []
      };
      
      for (const request of this.requests) {
        // Extract tokens from URL parameters
        this.extractTokensFromUrl(request.url, tokens);
        
        // Extract tokens from headers
        this.extractTokensFromHeaders(request.headers, tokens);
        
        // Extract tokens from POST data
        if (request.postData) {
          this.extractTokensFromPostData(request.postData, tokens);
        }
      }
      
      return tokens;
    }, 'NetworkRecorder.extractTokensFromRequests');
  }

  private async getResponseBody(response: HTTPResponse): Promise<string | undefined> {
    try {
      const contentType = response.headers()['content-type'] || '';
      
      // Only capture text-based responses to avoid large binary data
      if (contentType.includes('text/') || 
          contentType.includes('application/json') ||
          contentType.includes('application/xml') ||
          contentType.includes('application/x-mpegURL') ||
          contentType.includes('application/dash+xml')) {
        
        const buffer = await response.buffer();
        if (buffer.length < 1024 * 1024) { // Max 1MB
          return buffer.toString('utf8');
        }
      }
    } catch (error) {
      console.error('Error getting response body:', error);
    }
    
    return undefined;
  }

  private isVideoUrl(url: string): boolean {
    // Check for direct video file extensions
    for (const pattern of Object.values(VIDEO_URL_PATTERNS)) {
      if (pattern.test && pattern.test(url)) {
        return true;
      }
    }
    
    // Check for streaming keywords
    const streamingKeywords = [
      'stream', 'video', 'media', 'playlist', 'manifest',
      'hls', 'dash', 'mp4', 'webm', 'avi', 'mkv', 'ts'
    ];
    
    return streamingKeywords.some(keyword => 
      url.toLowerCase().includes(keyword)
    );
  }

  private isAPIEndpoint(request: NetworkRequest): boolean {
    const url = request.url.toLowerCase();
    const headers = request.headers;
    
    // Common API patterns
    const apiPatterns = [
      '/api/', '/v1/', '/v2/', '/v3/', '/rest/', '/graphql',
      'api.', 'player.', 'video.', 'stream.', 'media.'
    ];
    
    // Check URL patterns
    if (apiPatterns.some(pattern => url.includes(pattern))) {
      return true;
    }
    
    // Check content type
    const contentType = headers['content-type'] || '';
    if (contentType.includes('application/json') || 
        contentType.includes('application/xml')) {
      return true;
    }
    
    // Check for AJAX requests
    const xRequestedWith = headers['x-requested-with'];
    if (xRequestedWith === 'XMLHttpRequest') {
      return true;
    }
    
    return false;
  }

  private detectFormat(url: string): VideoFormat {
    if (VIDEO_URL_PATTERNS.MP4.test(url)) return VideoFormat.MP4;
    if (VIDEO_URL_PATTERNS.WEBM.test(url)) return VideoFormat.WEBM;
    if (VIDEO_URL_PATTERNS.HLS.test(url)) return VideoFormat.HLS;
    if (VIDEO_URL_PATTERNS.DASH.test(url)) return VideoFormat.DASH;
    if (VIDEO_URL_PATTERNS.TS.test(url)) return VideoFormat.TS;
    if (VIDEO_URL_PATTERNS.FLV.test(url)) return VideoFormat.FLV;
    if (VIDEO_URL_PATTERNS.AVI.test(url)) return VideoFormat.AVI;
    if (VIDEO_URL_PATTERNS.MKV.test(url)) return VideoFormat.MKV;
    if (VIDEO_URL_PATTERNS.BLOB.test(url)) return VideoFormat.BLOB;
    
    return VideoFormat.UNKNOWN;
  }

  private isPlaylistFormat(format: VideoFormat): boolean {
    return format === VideoFormat.HLS || format === VideoFormat.DASH;
  }

  private extractPlaylistSegments(responseBody: string): string[] {
    const segments: string[] = [];
    
    if (responseBody.includes('#EXTM3U')) {
      // HLS playlist
      const lines = responseBody.split('\n');
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          segments.push(line.trim());
        }
      }
    } else if (responseBody.includes('<MPD')) {
      // DASH manifest - extract segment URLs
      const urlMatches = responseBody.match(/media="([^"]+)"/g);
      if (urlMatches) {
        for (const match of urlMatches) {
          const url = match.replace(/media="([^"]+)"/, '$1');
          segments.push(url);
        }
      }
    }
    
    return segments;
  }

  private extractVideoHeaders(headers: Record<string, string>): Record<string, string> {
    const videoHeaders: Record<string, string> = {};
    
    const relevantHeaders = [
      'authorization', 'cookie', 'referer', 'user-agent',
      'x-forwarded-for', 'x-real-ip', 'origin', 'accept',
      'range', 'if-range', 'content-range'
    ];
    
    for (const header of relevantHeaders) {
      if (headers[header]) {
        videoHeaders[header] = headers[header];
      }
    }
    
    return videoHeaders;
  }

  private extractQuality(url: string): string | undefined {
    const qualityMatch = url.match(VIDEO_URL_PATTERNS.QUALITY_INDICATORS);
    if (qualityMatch) {
      return qualityMatch[0];
    }
    
    // Check for quality in file name
    const qualityPatterns = [
      /(\d+)p/i, /(\d+x\d+)/i, /(4K|HD|FHD|UHD)/i
    ];
    
    for (const pattern of qualityPatterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return undefined;
  }

  private calculateConfidence(request: NetworkRequest): number {
    let confidence = 0.5;
    
    // Higher confidence for direct video URLs
    if (this.detectFormat(request.url) !== VideoFormat.UNKNOWN) {
      confidence += 0.3;
    }
    
    // Higher confidence for streaming domains
    if (VIDEO_URL_PATTERNS.CDN_DOMAINS.test(request.url)) {
      confidence += 0.2;
    }
    
    // Higher confidence for successful responses
    if (request.response && request.response.status >= 200 && request.response.status < 300) {
      confidence += 0.1;
    }
    
    // Lower confidence for redirects
    if (request.redirectChain.length > 0) {
      confidence -= 0.1;
    }
    
    return Math.min(1, Math.max(0, confidence));
  }

  private extractTokensFromUrl(url: string, tokens: Record<string, string[]>): void {
    const patterns = {
      signatures: TOKEN_PATTERNS.SIGNATURE,
      authTokens: TOKEN_PATTERNS.TOKEN,
      timestamps: TOKEN_PATTERNS.TIMESTAMP,
      hashes: TOKEN_PATTERNS.HASH
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = url.match(pattern);
      if (match && match[1]) {
        tokens[key].push(match[1]);
      }
    }
  }

  private extractTokensFromHeaders(headers: Record<string, string>, tokens: Record<string, string[]>): void {
    // Extract authorization tokens
    const authorization = headers['authorization'];
    if (authorization) {
      tokens.authTokens.push(authorization);
    }
    
    // Extract cookies with token-like names
    const cookies = headers['cookie'];
    if (cookies) {
      const tokenCookies = cookies.match(/(?:token|auth|session|key)=([^;]+)/gi);
      if (tokenCookies) {
        tokens.authTokens.push(...tokenCookies);
      }
    }
  }

  private extractTokensFromPostData(postData: string, tokens: Record<string, string[]>): void {
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(postData);
      this.extractTokensFromObject(jsonData, tokens);
    } catch {
      // Try to parse as URL-encoded data
      const urlEncoded = new URLSearchParams(postData);
      for (const [key, value] of urlEncoded.entries()) {
        if (key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('signature')) {
          tokens.authTokens.push(value);
        }
      }
    }
  }

  private extractTokensFromObject(obj: any, tokens: Record<string, string[]>): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('signature')) {
          tokens.authTokens.push(value);
        }
      } else if (typeof value === 'object') {
        this.extractTokensFromObject(value, tokens);
      }
    }
  }

  private extractDomain(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch {
      return 'unknown';
    }
  }
}

export class RequestChainTracer {
  private recorder: NetworkRecorder;
  
  constructor(recorder: NetworkRecorder) {
    this.recorder = recorder;
  }

  async traceRedirects(targetUrl: string): Promise<string[]> {
    return withErrorHandling(async () => {
      const requests = await this.recorder.stopRecording();
      const redirectChain: string[] = [];
      
      // Find requests that match the target URL or lead to it
      for (const request of requests) {
        if (request.url === targetUrl || request.redirectChain.includes(targetUrl)) {
          redirectChain.push(...request.redirectChain, request.url);
        }
      }
      
      return [...new Set(redirectChain)];
    }, 'RequestChainTracer.traceRedirects');
  }

  async getFinalUrls(): Promise<Record<string, string>> {
    return withErrorHandling(async () => {
      const requests = await this.recorder.stopRecording();
      const finalUrls: Record<string, string> = {};
      
      for (const request of requests) {
        if (request.redirectChain.length > 0) {
          const originalUrl = request.redirectChain[0];
          finalUrls[originalUrl] = request.url;
        }
      }
      
      return finalUrls;
    }, 'RequestChainTracer.getFinalUrls');
  }
}

// Export initialized instances
export const networkRecorder = new NetworkRecorder();
export const requestChainTracer = new RequestChainTracer(networkRecorder);