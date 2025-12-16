# Test Examples and URL Constants

यह folder example tests और URL usage patterns contain करता है जो developers को test लिखने में help करते हैं।

## 📋 Available Test URLs

### 1. **NopeCHA Demo** 🔐
```typescript
TEST_URLS.NOPECHA_DEMO
// https://nopecha.com/demo
```

**Purpose**: Multiple CAPTCHA types को test करने के लिए
**Features**:
- ✅ Arkose FunCAPTCHA
- ✅ AWS WAF CAPTCHA
- ✅ Cloudflare Interstitial CAPTCHA
- ✅ hCaptcha
- ✅ GeeTest
- ✅ Google reCAPTCHA v2 (Easy, Moderate, Hard)
- ✅ Google reCAPTCHA v3 (Invisible)
- ✅ Lemin CAPTCHA
- ✅ Cloudflare Turnstile

**Usage Example**:
```typescript
import { TEST_URLS, TEST_TIMEOUTS } from '../helpers/test-constants.js';

// Navigate to NopeCHA demo
await handleNavigate({ 
  url: TEST_URLS.NOPECHA_DEMO,
  waitUntil: 'networkidle2'
});

// Use longer timeout for CAPTCHA pages
await handleWait({ 
  type: 'timeout', 
  value: TEST_TIMEOUTS.LONG.toString() 
});
```

### 2. **eCourts India Case Status** ⚖️
```typescript
TEST_URLS.ECOURTS_CASE_STATUS
// https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&app_token=...
```

**Purpose**: Government website with complex forms and CAPTCHA testing
**Features**:
- ✅ Case status search functionality
- ✅ FIR number search
- ✅ Advocate name/Bar Registration search
- ✅ Text-based CAPTCHA (5 alphanumeric characters)
- ✅ Multiple form fields and validations
- ✅ Real-world government website testing

**Usage Example**:
```typescript
// Navigate to eCourts
await handleNavigate({ 
  url: TEST_URLS.ECOURTS_CASE_STATUS,
  waitUntil: 'domcontentloaded'
});

// Wait for CAPTCHA to load
await handleWait({ 
  type: 'selector', 
  value: 'img[alt*="captcha"]',
  timeout: TEST_TIMEOUTS.LONG 
});

// Get page content
const content = await handleGetContent({ type: 'text' });
expect(content).toContain('Case Status');
expect(content).toContain('Captcha');
```

### 3. **Other Available URLs**

```typescript
// Basic testing
TEST_URLS.BASIC                // https://example.com
TEST_URLS.HTTPBIN_HTML         // https://httpbin.org/html
TEST_URLS.HTTPBIN_FORM         // https://httpbin.org/forms/post

// CAPTCHA testing
TEST_URLS.CLOUDFLARE_DEMO      // https://nopecha.com/demo/cloudflare

// Generic test page
TEST_URLS.TEST_PAGE            // https://httpbin.org/html
```

## ⏱️ Timeout Constants

```typescript
TEST_TIMEOUTS.SHORT   // 1000ms  - Quick operations
TEST_TIMEOUTS.MEDIUM  // 5000ms  - Standard operations
TEST_TIMEOUTS.LONG    // 30000ms - CAPTCHA & slow pages
```

## 📝 Example Test File

`captcha-urls.test.ts` में 10 example tests हैं जो demonstrate करते हैं:

1. **URL Validation Tests** - URLs properly defined हैं
2. **Parameter Checking** - Query parameters valid हैं
3. **Timeout Recommendations** - Appropriate timeouts for different scenarios
4. **Usage Examples** - Real-world usage patterns
5. **URL Catalog** - All available URLs की comprehensive list

## 🚀 Running Examples

```bash
# Run all tests including examples
npm test

# Run only example tests
npm test test/examples

# Run specific example file
npm test test/examples/captcha-urls.test.ts
```

## 📊 Test Results

```
✅ Test Files: 12 passed (12)
✅ Tests: 256 passed (256)
```

## 🎯 Use Cases

### 1. CAPTCHA Testing
```typescript
// Test different CAPTCHA types on NopeCHA demo
await handleNavigate({ url: TEST_URLS.NOPECHA_DEMO });
await handleSolveCaptcha({ type: 'recaptcha' });
```

### 2. Form Automation
```typescript
// Test complex government forms
await handleNavigate({ url: TEST_URLS.ECOURTS_CASE_STATUS });
await handleType({ selector: '#fir_number', text: '12345' });
```

### 3. Content Analysis
```typescript
// Analyze page content
const content = await handleGetContent({ type: 'html' });
expect(content).toContain('expected text');
```

## 📚 Documentation

- **Test Constants**: `test/helpers/test-constants.ts`
- **Example Tests**: `test/examples/captcha-urls.test.ts`
- **Integration Examples**: Commented code in example files

## 🔧 Best Practices

1. **Always use constants** instead of hardcoded URLs
2. **Use appropriate timeouts** for different page types
3. **Add comments** explaining complex test scenarios
4. **Follow AAA pattern** (Arrange-Act-Assert)
5. **Clean up resources** after tests (close browser, etc.)

## 🆘 Troubleshooting

### Common Issues

**Issue**: CAPTCHA not loading
```typescript
// Solution: Use longer timeout
await handleWait({ 
  type: 'timeout', 
  value: TEST_TIMEOUTS.LONG.toString() 
});
```

**Issue**: Form submission failing
```typescript
// Solution: Wait for elements before interaction
await handleWait({ 
  type: 'selector', 
  value: 'button[type="submit"]' 
});
```

**Issue**: Page not fully loaded
```typescript
// Solution: Use networkidle2 wait condition
await handleNavigate({ 
  url: TEST_URLS.ECOURTS_CASE_STATUS,
  waitUntil: 'networkidle2'
});
```

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues
- Documentation: Check README.md in root directory

## 🎓 Learning Resources

1. **Getting Started**: Read `test/examples/captcha-urls.test.ts`
2. **Integration Tests**: Check `test/integration/server.test.ts`
3. **E2E Tests**: See `test/e2e/visual-browser.test.ts`
4. **Handler Tests**: Explore `src/handlers/*.test.ts`

---

**Note**: Real CAPTCHA solving requires additional services or extensions. These examples demonstrate URL usage and navigation patterns only.
