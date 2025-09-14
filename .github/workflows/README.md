# GitHub Actions Workflows

यह फोल्डर में दो मुख्य workflows हैं:

## 🚀 Workflows

### 1. `publish-npm.yml` - NPM Publication
यह workflow सभी packages को NPM पर publish करती है।

**Triggers:**
- जब भी कोई tag push होता है जो `v*` pattern से match करता है
- Manual trigger (workflow_dispatch) से भी चला सकते हैं

**Features:**
- दोनों packages को publish करता है: `brave-real-browser-mcp-server` और `mcp-server-tests`
- Automatically tests run करता है publish से पहले
- Version duplication को check करता है
- GitHub release भी बनाता है
- Matrix strategy use करता है parallel publishing के लिए

### 2. `test-packages.yml` - Package Testing
यह workflow packages को test करती है।

**Triggers:**
- Push to main/master/develop branches
- Pull requests
- Manual trigger

**Features:**
- Multiple Node.js versions (18, 20) पर testing
- Security audit
- Package structure validation
- TypeScript compilation check

## 🔑 Required Secrets

आपको GitHub repository settings में ये secrets add करने होंगे:

### GH_TOKEN
```
Settings → Secrets and variables → Actions → New repository secret
Name: GH_TOKEN
Value: [Your GitHub Personal Access Token]
```

**GitHub Token बनाने के लिए:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" पर click करें
3. ये permissions select करें:
   - `repo` (Full control of private repositories)
   - `write:packages` (Write packages to GitHub Package Registry)
   - `read:packages` (Read packages from GitHub Package Registry)

### NPM_TOKEN
```
Settings → Secrets and variables → Actions → New repository secret
Name: NPM_TOKEN
Value: [Your NPM Access Token]
```

**NPM Token बनाने के लिए:**
1. NPM website पर login करें
2. Profile → Access Tokens → Generate New Token
3. "Automation" type select करें
4. Token copy करके GitHub secrets में add करें

## 📦 Usage

### Automatic Publishing (Recommended)
1. अपने code में changes करें
2. Version update करें (optional - workflow भी कर सकती है)
3. Git tag create करें:
   ```bash
   git tag v1.5.17
   git push origin v1.5.17
   ```
4. GitHub Actions automatically workflow run करेगी

### Manual Publishing
1. GitHub → Actions tab में जाएं
2. "Publish to NPM" workflow select करें
3. "Run workflow" button click करें
4. Version type select करें (patch/minor/major)
5. "Run workflow" confirm करें

## 🔄 Workflow Process

### Publishing Process:
1. **Checkout** - Code को download करता है
2. **Setup Node.js** - Node.js environment setup करता है
3. **Cache Dependencies** - Dependencies को cache करता है
4. **Install Dependencies** - npm ci run करता है
5. **Build** - Main package को build करता है (TypeScript)
6. **Test** - सभी tests run करता है
7. **Version Check** - NPM पर version already exist तो skip करता है
8. **Publish** - NPM पर publish करता है
9. **GitHub Release** - GitHub पर release create करता है

### Testing Process:
1. **Multi-Node Testing** - Node.js 18 और 20 पर test करता है
2. **Package Structure Validation** - Files और directories check करता है
3. **Security Audit** - npm audit run करता है
4. **TypeScript Compilation** - Build process verify करता है

## 🛠️ Customization

### Adding More Packages
अगर आपके पास और packages हैं तो `publish-npm.yml` में matrix में add करें:

```yaml
strategy:
  matrix:
    package:
      - name: "brave-real-browser-mcp-server"
        path: "."
      - name: "mcp-server-tests"
        path: "tests/mcp-testing"
      - name: "your-new-package"
        path: "path/to/your/package"
```

### Changing Node.js Versions
`test-packages.yml` में Node.js versions modify कर सकते हैं:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 21]  # Add more versions
```

## 🚨 Important Notes

1. **Secrets को safe रखें** - कभी भी code में hardcode न करें
2. **NPM Access** - Package names unique होने चाहिए
3. **Version Management** - Semantic versioning follow करें
4. **Testing** - हमेशा tests pass होने के बाद ही publish करें
5. **Dependencies** - पहले dependencies install होना जरूरी है

## 🔍 Troubleshooting

### Common Issues:

1. **NPM_TOKEN Invalid**
   - Token regenerate करें
   - Automation type select करना जरूरी है

2. **Version Already Exists**
   - Version number increment करें
   - या नया tag बनाएं

3. **Tests Failing**
   - Local में tests run करें
   - Dependencies check करें

4. **Build Failing**
   - TypeScript errors fix करें
   - tsconfig.json verify करें

### Debug करने के लिए:
1. GitHub Actions logs check करें
2. Local में same commands run करें
3. Package.json scripts verify करें

## 📞 Support

अगर कोई issue आती है तो GitHub Issues में report करें या workflow logs check करें detailed error messages के लिए।