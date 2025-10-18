/**
 * MCP Response Validator
 * Ensures all tool responses conform to MCP SDK standards
 */

export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface MCPResponse {
  content: MCPContent[];
  isError?: boolean;
}

/**
 * Validates and ensures response is in proper MCP format
 */
export function validateMCPResponse(response: any, toolName: string): MCPResponse {
  // If response is null or undefined
  if (!response) {
    console.error(`⚠️ Tool ${toolName} returned null/undefined`);
    return {
      content: [{
        type: 'text',
        text: `⚠️ Tool ${toolName} returned no data. This might indicate:
• The tool completed but found no results
• An internal error occurred
• The page state doesn't support this operation

💡 Try: Refresh the page or navigate to the target URL first.`
      }]
    };
  }

  // If response is empty object
  if (typeof response === 'object' && Object.keys(response).length === 0) {
    console.error(`⚠️ Tool ${toolName} returned empty object {}`);
    return {
      content: [{
        type: 'text',
        text: `⚠️ Tool ${toolName} returned empty result. This typically means:
• No data was found matching the criteria
• The page needs to be freshly loaded for monitoring tools
• Network events have already completed

💡 Suggestion: For network monitoring tools, start monitoring before navigating to the page.`
      }]
    };
  }

  // If response has content array, validate it
  if (response.content && Array.isArray(response.content)) {
    // Check if content array is empty
    if (response.content.length === 0) {
      console.warn(`⚠️ Tool ${toolName} has empty content array`);
      return {
        content: [{
          type: 'text',
          text: `ℹ️ Tool ${toolName} executed successfully but returned no content.`
        }],
        isError: response.isError
      };
    }

    // Validate each content item
    const validContent = response.content.filter((item: any) => {
      return item && typeof item === 'object' && item.type && (item.text || item.data);
    });

    if (validContent.length === 0) {
      console.error(`❌ Tool ${toolName} has invalid content items`);
      return {
        content: [{
          type: 'text',
          text: `❌ Tool ${toolName} returned malformed content. Please report this issue.`
        }],
        isError: true
      };
    }

    return {
      content: validContent,
      isError: response.isError
    };
  }

  // If response is a string, wrap it
  if (typeof response === 'string') {
    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  }

  // If response is in unexpected format
  console.error(`❌ Tool ${toolName} returned unexpected format:`, typeof response);
  return {
    content: [{
      type: 'text',
      text: `❌ Tool ${toolName} returned unexpected format: ${typeof response}

Result: ${JSON.stringify(response, null, 2).substring(0, 500)}`
    }],
    isError: true
  };
}

/**
 * Wraps tool execution with response validation
 */
export async function executeWithValidation<T>(
  toolName: string,
  handler: () => Promise<T>
): Promise<MCPResponse> {
  try {
    const result = await handler();
    return validateMCPResponse(result, toolName);
  } catch (error) {
    console.error(`❌ Tool ${toolName} threw error:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [{
        type: 'text',
        text: `❌ Tool execution failed: ${toolName}

Error: ${errorMessage}

${error instanceof Error && error.stack ? `Stack:\n${error.stack.substring(0, 500)}` : ''}`
      }],
      isError: true
    };
  }
}

/**
 * Creates a "no data" response with helpful message
 */
export function createNoDataResponse(toolName: string, dataType: string, suggestions: string[] = []): MCPResponse {
  let message = `ℹ️ ${toolName}: No ${dataType} found.`;
  
  if (suggestions.length > 0) {
    message += `\n\n💡 Suggestions:\n${suggestions.map(s => `  • ${s}`).join('\n')}`;
  }
  
  return {
    content: [{
      type: 'text',
      text: message
    }]
  };
}

/**
 * Creates a success response with data
 */
export function createSuccessResponse(toolName: string, message: string, data?: any): MCPResponse {
  let text = `✅ ${message}`;
  
  if (data) {
    text += `\n\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`;
  }
  
  return {
    content: [{
      type: 'text',
      text
    }]
  };
}
