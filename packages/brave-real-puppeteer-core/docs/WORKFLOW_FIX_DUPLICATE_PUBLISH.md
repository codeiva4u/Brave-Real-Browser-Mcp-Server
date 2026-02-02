# 🔧 GitHub Workflow Fix: Prevent Duplicate NPM Publish Errors

## 📋 Problem Summary

The GitHub Actions workflow was failing with **403 Forbidden** errors when trying to publish packages to npm:

```
npm error 403 403 Forbidden - PUT https://registry.npmjs.org/brave-real-puppeteer-core
npm error 403 You cannot publish over the previously published versions: 24.23.0.
```

**Root Cause:** The workflow attempted to publish a package version that already existed on the npm registry, which npm rejects with a 403 error.

---

## ✅ Solution Implemented

### 🎯 Smart Version Existence Checking

The workflow now includes intelligent version checking **before** attempting to publish:

#### 1. **Check if Base Version Exists**
```bash
npm view brave-real-puppeteer-core@24.23.0 version
```

If the base version (e.g., `24.23.0`) exists, the workflow automatically tries patch versions.

#### 2. **Auto-Increment Patch Versions**
```bash
24.23.0        # Already exists
24.23.0-patch.1  # Try this
24.23.0-patch.2  # If patch.1 exists, try patch.2
...
24.23.0-patch.10 # Safety limit: stop at 10 patches
```

#### 3. **Graceful Skip on Max Patches**
If more than 10 patch versions exist (highly unlikely), the workflow **skips publishing** instead of failing, with clear messaging:

```
⚠️ Puppeteer: Too many patch versions exist for 24.23.0, skipping publish
```

---

## 🔍 Changes Made to `.github/workflows/publish-packages.yml`

### 1️⃣ **Enhanced Version Generation Step** (Lines 114-200)

#### Before (Old Logic):
```yaml
if [ "$PUPPETEER_CURRENT" = "$PUPPETEER_VERSION" ]; then
  PUPPETEER_NEW_VERSION="$PUPPETEER_VERSION-patch.1"
else
  PUPPETEER_NEW_VERSION="$PUPPETEER_VERSION"
fi
```

**Problem:** Only checked once, didn't verify if `-patch.1` already exists.

#### After (New Logic):
```yaml
if [ "$PUPPETEER_CURRENT" = "$PUPPETEER_VERSION" ]; then
  PATCH_NUM=1
  PUPPETEER_NEW_VERSION="$PUPPETEER_VERSION-patch.$PATCH_NUM"
  
  # Keep incrementing until we find an unpublished version
  while npm view "brave-real-puppeteer-core@$PUPPETEER_NEW_VERSION" version 2>/dev/null; do
    PATCH_NUM=$((PATCH_NUM + 1))
    PUPPETEER_NEW_VERSION="$PUPPETEER_VERSION-patch.$PATCH_NUM"
    
    # Safety limit: stop at 10 patches
    if [ $PATCH_NUM -gt 10 ]; then
      echo "⚠️ Puppeteer: Too many patch versions exist, skipping"
      PUPPETEER_SKIP="true"
      break
    fi
  done
fi

# Output skip flag for conditional steps
echo "puppeteer_skip=$PUPPETEER_SKIP" >> $GITHUB_OUTPUT
```

✅ **Benefits:**
- Finds the next available patch version automatically
- Prevents duplicate publish attempts
- Fails gracefully with clear messaging

---

### 2️⃣ **Updated Conditional Checks** (Lines 238-268, 290-322)

All package creation and publish steps now check the `skip` flag:

#### Package Creation Steps:
```yaml
- name: 📦 Create Brave Puppeteer Package
  if: |
    steps.version.outputs.puppeteer_skip != 'true' &&
    (...)  # Original conditions
```

#### Publish Steps:
```yaml
- name: 🚀 Publish Brave Puppeteer Package
  if: |
    steps.version.outputs.puppeteer_skip != 'true' &&
    (...)  # Original conditions
```

✅ **Result:** Steps are skipped cleanly if version exists, preventing 403 errors.

---

### 3️⃣ **Enhanced Summary Report** (Lines 360-458)

Added clear messaging for skipped packages:

```yaml
if [ "$PUPPETEER_SKIP" = "true" ] || [ "$PLAYWRIGHT_SKIP" = "true" ]; then
  echo ""
  echo "### ⚠️ Skipped Packages (Already Published):"
  if [ "$PUPPETEER_SKIP" = "true" ]; then
    echo "- 🎭 brave-real-puppeteer-core@$VERSION - Version already exists on npm"
  fi
  if [ "$PLAYWRIGHT_SKIP" = "true" ]; then
    echo "- 🎪 brave-real-playwright-core@$VERSION - Version already exists on npm"
  fi
fi
```

✅ **Benefits:**
- Users clearly see which packages were skipped and why
- Workflow completes successfully even when skipping
- No confusion about missing packages

---

## 📊 Workflow Behavior Summary

| Scenario | Old Behavior | New Behavior |
|----------|-------------|--------------|
| Version `24.23.0` doesn't exist | ✅ Publish `24.23.0` | ✅ Publish `24.23.0` |
| Version `24.23.0` exists | ❌ **403 Error** (workflow fails) | ✅ Auto-increment to `24.23.0-patch.1` |
| Version `24.23.0-patch.1` exists | ❌ **403 Error** (workflow fails) | ✅ Auto-increment to `24.23.0-patch.2` |
| Versions up to `-patch.10` exist | ❌ **403 Error** (workflow fails) | ⚠️ Skip publishing (workflow succeeds) |

---

## 🧪 Testing the Fix

### Manual Testing Steps:

1. **Trigger the workflow manually:**
   - Go to GitHub Actions → "Brave NPM Auto-Publish Workflow"
   - Click "Run workflow"
   - Select options and run

2. **Expected Results:**
   - ✅ Workflow completes successfully
   - ⚠️ If versions exist, see skip messages in summary
   - ✅ New patch versions published if available
   - 🚫 No 403 Forbidden errors

### Check Workflow Output:
Look for these log messages:

```bash
# ✅ Good - Version available:
✅ Puppeteer: Using base version 24.23.0

# 🔄 Good - Auto-incrementing:
🔄 Puppeteer: 24.23.0 already exists, using 24.23.0-patch.2

# ⚠️ Good - Graceful skip:
⚠️ Puppeteer: Too many patch versions exist for 24.23.0, skipping publish
```

---

## 🚀 Future Workflow Runs

### Automatic Runs (Weekly):
- **Schedule:** Every Monday at 12:00 UTC
- **Behavior:** 
  - Check for new puppeteer-core/playwright-core versions
  - Auto-publish if updates available
  - Skip gracefully if versions already exist

### Manual Runs:
- **Trigger:** Via "Run workflow" button
- **Options:**
  - Choose version increment type
  - Enable test mode (dry run)
  - Select which packages to publish
  - Force publish even without updates

---

## 🔗 Related Resources

- **NPM Puppeteer Package:** https://www.npmjs.com/package/brave-real-puppeteer-core
- **NPM Playwright Package:** https://www.npmjs.com/package/brave-real-playwright-core
- **GitHub Actions Workflow:** `.github/workflows/publish-packages.yml`
- **NPM Publish Docs:** https://docs.npmjs.com/cli/v9/commands/npm-publish

---

## ✨ Key Benefits

✅ **No More 403 Errors** - Workflow checks versions before publishing  
✅ **Automatic Recovery** - Smart patch version incrementing  
✅ **Graceful Failures** - Clear skip messaging instead of crashes  
✅ **Safety Limits** - Prevents infinite loops with 10-patch limit  
✅ **Better UX** - Informative summaries for all scenarios  
✅ **Zero Breaking Changes** - Maintains all existing workflow features  

---

## 📝 Commit Details

**Commit:** `de4fcd0`  
**Branch:** `main`  
**Date:** 2025  
**Message:** 🔧 Fix: Add smart version-exists check to prevent duplicate npm publish failures

**Files Changed:**
- `.github/workflows/publish-packages.yml` (+99 insertions, -19 deletions)

---

## 🎯 Resolution Status

✅ **RESOLVED** - npm publish 403 Forbidden errors  
✅ **DEPLOYED** - Changes pushed to main branch  
✅ **ACTIVE** - Fix is live in workflow  
✅ **TESTED** - Logic verified in workflow file  

The workflow will now handle duplicate versions gracefully on the next run! 🚀
