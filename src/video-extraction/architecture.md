# Video Extraction Architecture

## Overview
Comprehensive video extraction system for Brave-Real-Browser-Mcp-Server to extract real video sources from any streaming/download website.

## Architecture Components

### 1. Core Video Extraction Engine
- **VideoExtractor**: Main orchestrator
- **ExtractionContext**: Maintains state and configuration
- **ResultAggregator**: Combines results from all extractors

### 2. DOM-Based Extractors
- **HtmlElementsFinder**: Video tags, sources, iframe detection
- **VideoTagsExtractor**: `<video>`, `<source>`, `<embed>`, `<object>`
- **IframeResolver**: Recursive iframe chain resolution
- **EmbedPageExtractor**: Embedded player detection

### 3. Network-Based Extractors
- **NetworkRecorder**: XHR/Fetch interception
- **RequestChainTracer**: Follow redirects to final sources
- **ResponseParser**: Parse API responses for video URLs
- **HeaderTokenExtractor**: Extract authentication tokens

### 4. Script Analysis Engine
- **JSPlayerDetector**: JWPlayer, HLS.js, VideoJS, Clappr detection
- **InlineScriptScanner**: Variable/function analysis
- **APIEndpointFinder**: Discover video API endpoints
- **ObfuscationDecoder**: Simple deobfuscation patterns

### 5. Pattern Recognition System
- **RegexPatternMatcher**: M3U8, MP4, DASH, TS segments
- **URLPatternAnalyzer**: Video URL heuristics
- **TokenPatternExtractor**: Signature/expiry parameters
- **FormatNormalizer**: Standardize video formats

### 6. Hoster-Specific Extractors
- **BaseExtractor**: Common extraction interface
- **MP4Extractor**: Direct MP4 links
- **HLSExtractor**: M3U8 playlist extraction
- **DASHExtractor**: MPD manifest parsing
- **BlobURLResolver**: Blob to actual resource conversion

## Data Flow

```
Page Load → DOM Analysis → Script Analysis → Network Recording
     ↓              ↓             ↓              ↓
Pattern Match → Hoster Detection → Source Extraction → URL Resolution
     ↓                                                      ↓
Quality Analysis → Deduplication → Final Results → Playable URLs
```

## Integration Points

### MCP Tools Registration
- All tools registered in `tool-definitions.ts`
- Handlers implemented in `video-extraction-handlers.ts`
- Workflow validation integration

### Error Handling
- Circuit breaker pattern
- Retry mechanisms
- Fallback strategies
- Comprehensive logging

## Performance Considerations

- Lazy loading of extractors
- Concurrent extraction strategies
- Resource cleanup
- Memory management
- Rate limiting for API calls