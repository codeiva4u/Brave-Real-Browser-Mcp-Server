/**
 * Error-Aware Workflow Validation Wrapper
 * 
 * This module provides workflow validation that integrates with the centralized error system.
 */

import { validateWorkflow, recordExecution, workflowValidator } from '../workflow-validation.js';
import { 
  categorizeError, 
  createWorkflowViolationError,
  MCPError 
} from './index.js';

/**
 * Wrapper that validates workflow before executing an operation
 * and properly categorizes any errors that occur
 */
export async function withWorkflowValidation<T>(
  toolName: string,
  args: any,
  operation: () => Promise<T>
): Promise<T> {
  // Validate workflow state before execution
  const validation = validateWorkflow(toolName, args);
  
  if (!validation.isValid) {
    // Use validation error message if available, otherwise create generic error
    let errorMessage = validation.errorMessage || `Workflow violation: Cannot execute '${toolName}'`;
    
    // Add suggested action if available
    if (validation.suggestedAction) {
      errorMessage += `\n\n💡 Next Steps: ${validation.suggestedAction}`;
    }
    
    // Add workflow context
    const workflowSummary = workflowValidator.getValidationSummary();
    errorMessage += `\n\n🔍 ${workflowSummary}`;
    
    // Record failed execution
    recordExecution(toolName, args, false, errorMessage);
    
    throw new Error(errorMessage);
  }
  
  try {
    // Execute the operation
    const result = await operation();
    
    // Record successful execution
    recordExecution(toolName, args, true);
    
    return result;
  } catch (error) {
    // Categorize and record error
    const mcpError = categorizeError(error);
    recordExecution(toolName, args, false, mcpError.message);
    throw mcpError;
  }
}

/**
 * Execute an operation with error categorization but without workflow validation
 * Useful for internal operations that don't need workflow checks
 */
export async function withErrorCategorization<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const mcpError = categorizeError(error);
    
    // Add additional context if provided
    if (context && mcpError instanceof MCPError) {
      (mcpError as any).context = { 
        ...(mcpError.context || {}), 
        ...context 
      };
    }
    
    throw mcpError;
  }
}
