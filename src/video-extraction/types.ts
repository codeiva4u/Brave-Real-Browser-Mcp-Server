// Core types and interfaces for video extraction system

export interface VideoSource {
  url: string;
  quality?: string;
  format: VideoFormat;
  headers?: Record<string, string>;
  isPlaylist?: boolean;
  segments?: string[];
  duration?: number;
  size?: number;
  hoster?: string;
  extractorUsed?: string;
  confidence: number; // 0-1 confidence score
}

export enum VideoFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  AVI = 'avi',
  MKV = 'mkv',
  HLS = 'hls', // .m3u8
  DASH = 'dash', // .mpd
  TS = 'ts', // Transport Stream
  FLV = 'flv',
  BLOB = 'blob',
  UNKNOWN = 'unknown'
}

export enum ExtractionStrategy {
  DOM_ANALYSIS = 'dom_analysis',
  NETWORK_RECORDING = 'network_recording',
  SCRIPT_ANALYSIS = 'script_analysis',
  PATTERN_MATCHING = 'pattern_matching',
  API_DISCOVERY = 'api_discovery'
}

export interface ExtractionContext {
  pageUrl: string;
  userAgent: string;
  cookies: string[];
  referer?: string;
  strategies: ExtractionStrategy[];
  maxDepth: number;
  timeout: number;
  followRedirects: boolean;
  includeHeaders: boolean;
}

export interface ExtractionResult {
  sources: VideoSource[];
  metadata: {
    title?: string;
    thumbnail?: string;
    description?: string;
    duration?: number;
    extractionTime: number;
    strategiesUsed: ExtractionStrategy[];
    hostersFound: string[];
  };
  errors: ExtractionError[];
  warnings: string[];
}

export interface ExtractionError {
  strategy: ExtractionStrategy;
  message: string;
  details?: any;
  isFatal: boolean;
}

export interface VideoExtractorConfig {
  enableDOMAnalysis: boolean;
  enableNetworkRecording: boolean;
  enableScriptAnalysis: boolean;
  enablePatternMatching: boolean;
  enableAPIDiscovery: boolean;
  
  // Timeouts and limits
  maxExtractionTime: number;
  maxRedirectDepth: number;
  maxSourcesPerHoster: number;
  
  // Quality filtering
  minQuality?: string;
  preferredFormats: VideoFormat[];
  
  // Network settings
  userAgent: string;
  customHeaders: Record<string, string>;
}

export interface VideoHoster {
  name: string;
  domains: string[];
  patterns: RegExp[];
  extractorClass: string;
  priority: number;
  isActive: boolean;
}

export interface HosterDetectionResult {
  hoster: VideoHoster;
  confidence: number;
  matchedPatterns: string[];
  extractorReady: boolean;
}

// Common video URL patterns
export const VIDEO_URL_PATTERNS = {
  // Direct video files
  MP4: /\.mp4(\?[^?]*)?$/i,
  WEBM: /\.webm(\?[^?]*)?$/i,
  AVI: /\.avi(\?[^?]*)?$/i,
  MKV: /\.mkv(\?[^?]*)?$/i,
  FLV: /\.flv(\?[^?]*)?$/i,
  
  // Streaming formats
  HLS: /\.m3u8(\?[^?]*)?$/i,
  DASH: /\.mpd(\?[^?]*)?$/i,
  TS: /\.ts(\?[^?]*)?$/i,
  
  // Blob URLs
  BLOB: /^blob:/i,
  
  // Common streaming domains
  CDN_DOMAINS: /(?:cloudfront\.net|amazonaws\.com|googlevideo\.com|vimeocdn\.com)/i,
  
  // Video parameters in URLs
  VIDEO_PARAMS: /[?&](?:video|stream|source|url|file|media)=/i,
  
  // Quality indicators
  QUALITY_INDICATORS: /(?:1080p?|720p?|480p?|360p?|240p?|144p?|4K|HD|FHD|UHD)/i
};

// Common video player patterns
export const PLAYER_PATTERNS = {
  JWPLAYER: /jwplayer|jw\.setup|jwConfig/i,
  VIDEOJS: /video\.js|videojs|vjs-/i,
  CLAPPR: /clappr|new Clappr/i,
  PLYR: /plyr\.js|new Plyr/i,
  FLOWPLAYER: /flowplayer|fp-/i,
  HLS_JS: /hls\.js|new Hls/i,
  DASH_JS: /dash\.js|dashjs/i
};

// Token and parameter patterns
export const TOKEN_PATTERNS = {
  SIGNATURE: /[?&](?:sig|signature|s)=([^&]+)/i,
  TOKEN: /[?&](?:token|auth|key|access_token)=([^&]+)/i,
  EXPIRES: /[?&](?:expires?|exp|ttl)=([^&]+)/i,
  TIMESTAMP: /[?&](?:ts|timestamp|time)=([^&]+)/i,
  HASH: /[?&](?:hash|md5|checksum)=([^&]+)/i
};