/**
 * Error Handling System for Puppeteer-Core Patching Operations
 * 
 * Provides standardized error handling for all patching, validation, and stealth operations
 */

// ============================================================================
// ERROR CATEGORIES
// ============================================================================

const ErrorCategory = {
  // Patching errors
  PATCH_FAILED: 'PATCH_FAILED',
  PATCH_VALIDATION_FAILED: 'PATCH_VALIDATION_FAILED',
  PATCH_RESTORE_FAILED: 'PATCH_RESTORE_FAILED',
  BACKUP_FAILED: 'BACKUP_FAILED',
  
  // File operations
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Version errors
  VERSION_MISMATCH: 'VERSION_MISMATCH',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  VERSION_CHECK_FAILED: 'VERSION_CHECK_FAILED',
  
  // Stealth injection errors
  STEALTH_INJECTION_FAILED: 'STEALTH_INJECTION_FAILED',
  EVASION_TEST_FAILED: 'EVASION_TEST_FAILED',
  
  // Package errors
  PACKAGE_NOT_FOUND: 'PACKAGE_NOT_FOUND',
  PACKAGE_INSTALLATION_FAILED: 'PACKAGE_INSTALLATION_FAILED',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// ============================================================================
// ERROR SEVERITY LEVELS
// ============================================================================

const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

/**
 * Base error class for Puppeteer-Core operations
 */
class PuppeteerCoreError extends Error {
  constructor(
    message,
    category = ErrorCategory.UNKNOWN_ERROR,
    severity = ErrorSeverity.MEDIUM,
    isRecoverable = false,
    context = {}
  ) {
    super(message);
    this.name = 'PuppeteerCoreError';
    this.category = category;
    this.severity = severity;
    this.isRecoverable = isRecoverable;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to user-friendly message
   */
  toUserMessage() {
    let message = `❌ Puppeteer-Core Error: ${this.message}\n\n`;
    message += `📋 Category: ${this.category}\n`;
    message += `⚠️ Severity: ${this.severity}\n`;
    
    if (Object.keys(this.context).length > 0) {
      message += `\n🔍 Context:\n${JSON.stringify(this.context, null, 2)}\n`;
    }
    
    return message;
  }

  /**
   * Get suggested action for this error
   */
  getSuggestedAction() {
    switch (this.category) {
      case ErrorCategory.PATCH_FAILED:
        return 'Try restoring from backup and re-applying patches';
      
      case ErrorCategory.PATCH_VALIDATION_FAILED:
        return 'Run patch validator to identify issues';
      
      case ErrorCategory.FILE_NOT_FOUND:
        return 'Ensure puppeteer-core is installed correctly';
      
      case ErrorCategory.VERSION_MISMATCH:
        return 'Install compatible puppeteer-core version';
      
      case ErrorCategory.STEALTH_INJECTION_FAILED:
        return 'Check stealth scripts and re-run injection';
      
      case ErrorCategory.PERMISSION_DENIED:
        return 'Run with appropriate permissions';
      
      case ErrorCategory.BACKUP_FAILED:
        return 'Ensure backup directory is writable';
      
      default:
        return 'Check logs and retry operation';
    }
  }
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Create patch failed error
 */
function createPatchFailedError(filePath, originalError) {
  return new PuppeteerCoreError(
    `Failed to patch file ${filePath}: ${originalError.message}`,
    ErrorCategory.PATCH_FAILED,
    ErrorSeverity.CRITICAL,
    true,
    { filePath, originalError: originalError.message }
  );
}

/**
 * Create patch validation error
 */
function createPatchValidationError(filePath, validationIssues) {
  return new PuppeteerCoreError(
    `Patch validation failed for ${filePath}`,
    ErrorCategory.PATCH_VALIDATION_FAILED,
    ErrorSeverity.HIGH,
    true,
    { filePath, issues: validationIssues }
  );
}

/**
 * Create backup failed error
 */
function createBackupFailedError(filePath, originalError) {
  return new PuppeteerCoreError(
    `Failed to create backup for ${filePath}: ${originalError.message}`,
    ErrorCategory.BACKUP_FAILED,
    ErrorSeverity.HIGH,
    false,
    { filePath, originalError: originalError.message }
  );
}

/**
 * Create restore failed error
 */
function createRestoreFailedError(filePath, originalError) {
  return new PuppeteerCoreError(
    `Failed to restore ${filePath} from backup: ${originalError.message}`,
    ErrorCategory.PATCH_RESTORE_FAILED,
    ErrorSeverity.CRITICAL,
    false,
    { filePath, originalError: originalError.message }
  );
}

/**
 * Create file not found error
 */
function createFileNotFoundError(filePath) {
  return new PuppeteerCoreError(
    `File not found: ${filePath}`,
    ErrorCategory.FILE_NOT_FOUND,
    ErrorSeverity.CRITICAL,
    false,
    { filePath }
  );
}

/**
 * Create file read error
 */
function createFileReadError(filePath, originalError) {
  return new PuppeteerCoreError(
    `Failed to read file ${filePath}: ${originalError.message}`,
    ErrorCategory.FILE_READ_ERROR,
    ErrorSeverity.HIGH,
    true,
    { filePath, originalError: originalError.message }
  );
}

/**
 * Create file write error
 */
function createFileWriteError(filePath, originalError) {
  return new PuppeteerCoreError(
    `Failed to write file ${filePath}: ${originalError.message}`,
    ErrorCategory.FILE_WRITE_ERROR,
    ErrorSeverity.HIGH,
    true,
    { filePath, originalError: originalError.message }
  );
}

/**
 * Create permission denied error
 */
function createPermissionDeniedError(filePath, operation) {
  return new PuppeteerCoreError(
    `Permission denied: Cannot ${operation} ${filePath}`,
    ErrorCategory.PERMISSION_DENIED,
    ErrorSeverity.HIGH,
    false,
    { filePath, operation }
  );
}

/**
 * Create version mismatch error
 */
function createVersionMismatchError(expected, actual) {
  return new PuppeteerCoreError(
    `Version mismatch: Expected ${expected}, found ${actual}`,
    ErrorCategory.VERSION_MISMATCH,
    ErrorSeverity.HIGH,
    false,
    { expected, actual }
  );
}

/**
 * Create unsupported version error
 */
function createUnsupportedVersionError(version) {
  return new PuppeteerCoreError(
    `Unsupported puppeteer-core version: ${version}`,
    ErrorCategory.UNSUPPORTED_VERSION,
    ErrorSeverity.CRITICAL,
    false,
    { version }
  );
}

/**
 * Create stealth injection error
 */
function createStealthInjectionError(scriptName, originalError) {
  return new PuppeteerCoreError(
    `Failed to inject stealth script '${scriptName}': ${originalError.message}`,
    ErrorCategory.STEALTH_INJECTION_FAILED,
    ErrorSeverity.HIGH,
    true,
    { scriptName, originalError: originalError.message }
  );
}

/**
 * Create evasion test failed error
 */
function createEvasionTestFailedError(testName, reason) {
  return new PuppeteerCoreError(
    `Evasion test '${testName}' failed: ${reason}`,
    ErrorCategory.EVASION_TEST_FAILED,
    ErrorSeverity.MEDIUM,
    true,
    { testName, reason }
  );
}

/**
 * Create package not found error
 */
function createPackageNotFoundError(packageName) {
  return new PuppeteerCoreError(
    `Package not found: ${packageName}`,
    ErrorCategory.PACKAGE_NOT_FOUND,
    ErrorSeverity.CRITICAL,
    false,
    { packageName }
  );
}

/**
 * Create package installation error
 */
function createPackageInstallationError(packageName, originalError) {
  return new PuppeteerCoreError(
    `Failed to install package ${packageName}: ${originalError.message}`,
    ErrorCategory.PACKAGE_INSTALLATION_FAILED,
    ErrorSeverity.HIGH,
    true,
    { packageName, originalError: originalError.message }
  );
}

// ============================================================================
// ERROR CATEGORIZATION
// ============================================================================

/**
 * Categorize a generic error into PuppeteerCoreError
 */
function categorizeError(error, context = {}) {
  // Already a PuppeteerCoreError
  if (error instanceof PuppeteerCoreError) {
    return error;
  }
  
  // Convert to Error if not already
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();
  
  // File not found errors
  if (message.includes('enoent') || message.includes('no such file')) {
    return new PuppeteerCoreError(
      err.message,
      ErrorCategory.FILE_NOT_FOUND,
      ErrorSeverity.CRITICAL,
      false,
      { originalError: err.message, ...context }
    );
  }
  
  // Permission errors
  if (message.includes('eacces') || message.includes('permission denied')) {
    return new PuppeteerCoreError(
      err.message,
      ErrorCategory.PERMISSION_DENIED,
      ErrorSeverity.HIGH,
      false,
      { originalError: err.message, ...context }
    );
  }
  
  // Read/Write errors
  if (message.includes('read') && (message.includes('failed') || message.includes('error'))) {
    return new PuppeteerCoreError(
      err.message,
      ErrorCategory.FILE_READ_ERROR,
      ErrorSeverity.HIGH,
      true,
      { originalError: err.message, ...context }
    );
  }
  
  if (message.includes('write') && (message.includes('failed') || message.includes('error'))) {
    return new PuppeteerCoreError(
      err.message,
      ErrorCategory.FILE_WRITE_ERROR,
      ErrorSeverity.HIGH,
      true,
      { originalError: err.message, ...context }
    );
  }
  
  // Patch errors
  if (message.includes('patch') && message.includes('failed')) {
    return new PuppeteerCoreError(
      err.message,
      ErrorCategory.PATCH_FAILED,
      ErrorSeverity.CRITICAL,
      true,
      { originalError: err.message, ...context }
    );
  }
  
  // Version errors
  if (message.includes('version') && (message.includes('mismatch') || message.includes('unsupported'))) {
    return new PuppeteerCoreError(
      err.message,
      ErrorCategory.VERSION_MISMATCH,
      ErrorSeverity.HIGH,
      false,
      { originalError: err.message, ...context }
    );
  }
  
  // Package errors
  if (message.includes('module not found') || message.includes('cannot find module')) {
    return new PuppeteerCoreError(
      err.message,
      ErrorCategory.PACKAGE_NOT_FOUND,
      ErrorSeverity.CRITICAL,
      false,
      { originalError: err.message, ...context }
    );
  }
  
  // Default unknown error
  return new PuppeteerCoreError(
    err.message,
    ErrorCategory.UNKNOWN_ERROR,
    ErrorSeverity.MEDIUM,
    false,
    { originalError: err.message, stack: err.stack, ...context }
  );
}

/**
 * Check if error is recoverable
 */
function isRecoverableError(error) {
  if (error instanceof PuppeteerCoreError) {
    return error.isRecoverable;
  }
  
  const categorized = categorizeError(error);
  return categorized.isRecoverable;
}

/**
 * Execute operation with error handling
 */
async function withErrorHandling(operation, context = {}) {
  try {
    return await operation();
  } catch (error) {
    throw categorizeError(error, context);
  }
}

/**
 * Execute operation with retry on recoverable errors
 */
async function withRetry(operation, maxRetries = 3, context = {}) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = categorizeError(error, { ...context, attempt });
      
      if (!lastError.isRecoverable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retry (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ErrorCategory,
  ErrorSeverity,
  PuppeteerCoreError,
  createPatchFailedError,
  createPatchValidationError,
  createBackupFailedError,
  createRestoreFailedError,
  createFileNotFoundError,
  createFileReadError,
  createFileWriteError,
  createPermissionDeniedError,
  createVersionMismatchError,
  createUnsupportedVersionError,
  createStealthInjectionError,
  createEvasionTestFailedError,
  createPackageNotFoundError,
  createPackageInstallationError,
  categorizeError,
  isRecoverableError,
  withErrorHandling,
  withRetry,
};
