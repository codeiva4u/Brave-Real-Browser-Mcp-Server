# GitHub Actions Workflow Documentation

## Overview
This project uses a GitHub Actions workflow for automatic version increment and NPM publishing.

## Workflow Features

### 🚀 Auto Version Increment & NPM Publish

**File:** `.github/workflows/publish.yml`

**Triggers:**
1. **Manual (workflow_dispatch):** Manual trigger with options
2. **Automatic (push):** On push to main/master branch
3. **Automatic (PR merge):** When pull requests are merged

### 🎛️ Manual Trigger Options

When manually triggering the workflow, you can specify:

- **increment_type:** 
  - `patch` (1.5.16 → 1.5.17) - Default
  - `minor` (1.5.16 → 1.6.0) 
  - `major` (1.5.16 → 2.0.0)

- **dry_run:** 
  - `true` - Test run without publishing
  - `false` - Actual publish (Default)

### 🤖 Automatic Version Detection

For automatic triggers, version increment is determined by commit messages:

| Commit Message Pattern | Version Increment |
|------------------------|-------------------|
| `[major]`, `BREAKING CHANGE` | Major (2.0.0) |
| `[minor]`, `feat`, `feature` | Minor (1.6.0) |
| Everything else | Patch (1.5.17) |

### 📋 Workflow Steps

1. **🏁 Checkout repository** - Get source code
2. **🔧 Setup Node.js** - Install Node.js 20 with NPM cache
3. **📦 Install dependencies** - Install and update packages
4. **🔨 Build project** - Compile TypeScript
5. **🧪 Run tests** - Execute test suites
6. **🔍 Configure Git** - Setup Git credentials
7. **📈 Increment version** - Auto-increment version number
8. **📝 Commit version bump** - Commit new version to Git
9. **🚀 Publish to NPM** - Publish package to NPM registry
10. **🔄 Push changes to GitHub** - Push commits and tags
11. **📋 Create GitHub Release** - Create release with notes
12. **📊 Summary** - Display workflow summary

### 🔐 Required Secrets

Set these secrets in your GitHub repository:

- `GH_TOKEN`: GitHub Personal Access Token (for repository access)
- `NPM_TOKEN`: NPM Access Token (for package publishing)

### 🛠️ Local Testing

Test version increment logic locally:

```bash
npm run test:version-increment
```

### 🚫 Skip CI

To skip the workflow, include `[skip ci]` in your commit message:

```bash
git commit -m "docs: update readme [skip ci]"
```

### 📦 Published Package

The workflow publishes to: `https://www.npmjs.com/package/brave-real-browser-mcp-server`

### 🔄 Installation

After publishing, users can install with:

```bash
npm install brave-real-browser-mcp-server@latest
```

## Workflow Examples

### Manual Release (Patch)
1. Go to GitHub Actions
2. Click "Run workflow"
3. Select "patch" 
4. Click "Run workflow"

Result: `1.5.16` → `1.5.17`

### Manual Release (Minor with Dry Run)
1. Go to GitHub Actions
2. Click "Run workflow"
3. Select "minor" and check "dry_run"
4. Click "Run workflow"

Result: Test run without publishing

### Automatic Release via Commit
```bash
git commit -m "feat: add new browser initialization options"
git push origin main
```

Result: `1.5.16` → `1.6.0` (minor increment due to "feat")

## Troubleshooting

### Common Issues

1. **NPM_TOKEN expired:** Update the secret in GitHub
2. **Build fails:** Check TypeScript compilation errors
3. **Tests fail:** Fix failing tests before publishing
4. **Git conflicts:** Ensure clean working directory

### Debugging

- Check workflow logs in GitHub Actions tab
- Use dry_run mode to test without publishing
- Run local tests: `npm run test:version-increment`

## Version History

The workflow maintains version history through:
- Git tags (e.g., `v1.5.17`)
- GitHub Releases
- NPM package versions
- Commit messages with version bumps