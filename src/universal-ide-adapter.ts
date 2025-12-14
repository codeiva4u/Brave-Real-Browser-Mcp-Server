/**
 * Universal AI IDE Adapter
 * Automatically detects and configures for all AI-powered IDEs
 *
 * Supported IDEs:
 * - Claude Desktop
 * - Cursor AI
 * - Windsurf
 * - Cline (VSCode Extension)
 * - Roo Coder
 * - Zed Editor
 * - Continue.dev
 * - Qoder AI
 * - Warp Terminal
 * - GitHub Copilot Chat
 * - Amazon CodeWhisperer
 * - Tabnine
 * - Cody (Sourcegraph)
 * - Aider
 * - Pieces for Developers
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as os from "os";
import * as path from "path";

export enum AIIDEType {
  CLAUDE_DESKTOP = "claude-desktop",
  CURSOR = "cursor",
  WINDSURF = "windsurf",
  CLINE = "cline",
  ROO_CODER = "roo-coder",
  ZED = "zed",
  CONTINUE = "continue",
  QODER = "qoder",
  WARP = "warp",
  COPILOT = "copilot",
  CODEWHISPERER = "codewhisperer",
  TABNINE = "tabnine",
  CODY = "cody",
  AIDER = "aider",
  PIECES = "pieces",
  VSCODE_GENERIC = "vscode-generic",
  UNKNOWN = "unknown",
}

export enum ProtocolType {
  MCP = "mcp", // Model Context Protocol (Claude, Cursor, Warp)
  LSP = "lsp", // Language Server Protocol (Zed, VSCode)
  HTTP = "http", // HTTP/REST API (Universal)
  WEBSOCKET = "ws", // WebSocket (Real-time)
  STDIO = "stdio", // Standard I/O (Most MCP clients)
  JSONRPC = "jsonrpc", // JSON-RPC (Some editors)
}

export interface IDECapabilities {
  type: AIIDEType;
  name: string;
  supportedProtocols: ProtocolType[];
  preferredProtocol: ProtocolType;
  configPath?: string;
  autoDetectable: boolean;
  requiresManualSetup: boolean;
}

export interface DetectionResult {
  detected: boolean;
  ide: AIIDEType;
  protocol: ProtocolType;
  capabilities: IDECapabilities;
  confidence: number; // 0-100
  detectionMethod: string;
}

/**
 * All supported AI IDEs with their capabilities
 */
export const AI_IDE_REGISTRY: Record<AIIDEType, IDECapabilities> = {
  [AIIDEType.CLAUDE_DESKTOP]: {
    type: AIIDEType.CLAUDE_DESKTOP,
    name: "Claude Desktop",
    supportedProtocols: [ProtocolType.MCP, ProtocolType.STDIO],
    preferredProtocol: ProtocolType.STDIO,
    configPath:
      os.platform() === "win32"
        ? path.join(
            os.homedir(),
            "AppData",
            "Roaming",
            "Claude",
            "claude_desktop_config.json",
          )
        : path.join(
            os.homedir(),
            "Library",
            "Application Support",
            "Claude",
            "claude_desktop_config.json",
          ),
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.CURSOR]: {
    type: AIIDEType.CURSOR,
    name: "Cursor AI",
    supportedProtocols: [
      ProtocolType.MCP,
      ProtocolType.STDIO,
      ProtocolType.HTTP,
    ],
    preferredProtocol: ProtocolType.STDIO,
    configPath:
      os.platform() === "win32"
        ? path.join(
            os.homedir(),
            "AppData",
            "Roaming",
            "Cursor",
            "User",
            "globalStorage",
            "saoudrizwan.claude-dev",
            "settings",
            "cline_mcp_settings.json",
          )
        : path.join(os.homedir(), ".cursor", "mcp_settings.json"),
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.WINDSURF]: {
    type: AIIDEType.WINDSURF,
    name: "Windsurf Editor",
    supportedProtocols: [
      ProtocolType.MCP,
      ProtocolType.STDIO,
      ProtocolType.HTTP,
    ],
    preferredProtocol: ProtocolType.STDIO,
    configPath:
      os.platform() === "win32"
        ? path.join(os.homedir(), "AppData", "Roaming", "Windsurf", "mcp.json")
        : path.join(os.homedir(), ".windsurf", "mcp.json"),
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.CLINE]: {
    type: AIIDEType.CLINE,
    name: "Cline (VSCode Extension)",
    supportedProtocols: [
      ProtocolType.MCP,
      ProtocolType.STDIO,
      ProtocolType.HTTP,
    ],
    preferredProtocol: ProtocolType.STDIO,
    configPath:
      os.platform() === "win32"
        ? path.join(
            os.homedir(),
            "AppData",
            "Roaming",
            "Code",
            "User",
            "globalStorage",
            "saoudrizwan.claude-dev",
            "settings",
            "cline_mcp_settings.json",
          )
        : path.join(
            os.homedir(),
            "Library",
            "Application Support",
            "Code",
            "User",
            "globalStorage",
            "saoudrizwan.claude-dev",
            "settings",
            "cline_mcp_settings.json",
          ),
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.ROO_CODER]: {
    type: AIIDEType.ROO_CODER,
    name: "Roo Coder",
    supportedProtocols: [
      ProtocolType.MCP,
      ProtocolType.STDIO,
      ProtocolType.HTTP,
    ],
    preferredProtocol: ProtocolType.STDIO,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.ZED]: {
    type: AIIDEType.ZED,
    name: "Zed Editor",
    supportedProtocols: [ProtocolType.LSP, ProtocolType.MCP, ProtocolType.HTTP],
    preferredProtocol: ProtocolType.LSP,
    configPath:
      os.platform() === "win32"
        ? path.join(os.homedir(), "AppData", "Roaming", "Zed", "settings.json")
        : path.join(os.homedir(), ".config", "zed", "settings.json"),
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.CONTINUE]: {
    type: AIIDEType.CONTINUE,
    name: "Continue.dev",
    supportedProtocols: [
      ProtocolType.MCP,
      ProtocolType.HTTP,
      ProtocolType.STDIO,
    ],
    preferredProtocol: ProtocolType.HTTP,
    configPath: path.join(os.homedir(), ".continue", "config.json"),
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.QODER]: {
    type: AIIDEType.QODER,
    name: "Qoder AI Editor",
    supportedProtocols: [
      ProtocolType.HTTP,
      ProtocolType.WEBSOCKET,
      ProtocolType.MCP,
    ],
    preferredProtocol: ProtocolType.HTTP,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.WARP]: {
    type: AIIDEType.WARP,
    name: "Warp Terminal",
    supportedProtocols: [ProtocolType.MCP, ProtocolType.STDIO],
    preferredProtocol: ProtocolType.STDIO,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.COPILOT]: {
    type: AIIDEType.COPILOT,
    name: "GitHub Copilot Chat",
    supportedProtocols: [ProtocolType.HTTP, ProtocolType.LSP],
    preferredProtocol: ProtocolType.HTTP,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.CODEWHISPERER]: {
    type: AIIDEType.CODEWHISPERER,
    name: "Amazon CodeWhisperer",
    supportedProtocols: [ProtocolType.HTTP, ProtocolType.LSP],
    preferredProtocol: ProtocolType.HTTP,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.TABNINE]: {
    type: AIIDEType.TABNINE,
    name: "Tabnine",
    supportedProtocols: [ProtocolType.HTTP, ProtocolType.WEBSOCKET],
    preferredProtocol: ProtocolType.HTTP,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.CODY]: {
    type: AIIDEType.CODY,
    name: "Cody (Sourcegraph)",
    supportedProtocols: [ProtocolType.HTTP, ProtocolType.LSP, ProtocolType.MCP],
    preferredProtocol: ProtocolType.HTTP,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.AIDER]: {
    type: AIIDEType.AIDER,
    name: "Aider",
    supportedProtocols: [ProtocolType.STDIO, ProtocolType.HTTP],
    preferredProtocol: ProtocolType.STDIO,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.PIECES]: {
    type: AIIDEType.PIECES,
    name: "Pieces for Developers",
    supportedProtocols: [ProtocolType.HTTP, ProtocolType.WEBSOCKET],
    preferredProtocol: ProtocolType.HTTP,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.VSCODE_GENERIC]: {
    type: AIIDEType.VSCODE_GENERIC,
    name: "VSCode (Generic)",
    supportedProtocols: [ProtocolType.LSP, ProtocolType.HTTP, ProtocolType.MCP],
    preferredProtocol: ProtocolType.LSP,
    autoDetectable: true,
    requiresManualSetup: false,
  },
  [AIIDEType.UNKNOWN]: {
    type: AIIDEType.UNKNOWN,
    name: "Unknown/Generic IDE",
    supportedProtocols: [
      ProtocolType.HTTP,
      ProtocolType.STDIO,
      ProtocolType.MCP,
    ],
    preferredProtocol: ProtocolType.HTTP,
    autoDetectable: false,
    requiresManualSetup: true,
  },
};

/**
 * Universal AI IDE Detector
 */
export class UniversalIDEDetector {
  /**
   * Detect from command line arguments
   */
  private static async detectFromCommandLineArgs(): Promise<DetectionResult> {
    const args = process.argv.join(" ").toLowerCase();
    const cwd = process.cwd().toLowerCase();

    // Check for IDE-specific paths in arguments
    if (
      args.includes("claude") &&
      (args.includes("desktop") || cwd.includes("claude"))
    ) {
      return {
        detected: true,
        ide: AIIDEType.CLAUDE_DESKTOP,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CLAUDE_DESKTOP],
        confidence: 95,
        detectionMethod: "command-line-args",
      };
    }

    if (args.includes("cursor") || cwd.includes("cursor")) {
      return {
        detected: true,
        ide: AIIDEType.CURSOR,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CURSOR],
        confidence: 95,
        detectionMethod: "command-line-args",
      };
    }

    if (args.includes("windsurf") || cwd.includes("windsurf")) {
      return {
        detected: true,
        ide: AIIDEType.WINDSURF,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.WINDSURF],
        confidence: 95,
        detectionMethod: "command-line-args",
      };
    }

    if (
      args.includes("cline") ||
      args.includes("claude-dev") ||
      cwd.includes("claude-dev")
    ) {
      return {
        detected: true,
        ide: AIIDEType.CLINE,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CLINE],
        confidence: 90,
        detectionMethod: "command-line-args",
      };
    }

    return { detected: false } as any;
  }

  /**
   * Detect from working directory
   */
  private static async detectFromWorkingDirectory(): Promise<DetectionResult> {
    const cwd = process.cwd().toLowerCase();
    const homeDir = os.homedir().toLowerCase();

    // Check for IDE-specific directories
    if (cwd.includes(".claude") || cwd.includes("claude")) {
      return {
        detected: true,
        ide: AIIDEType.CLAUDE_DESKTOP,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CLAUDE_DESKTOP],
        confidence: 80,
        detectionMethod: "working-directory",
      };
    }

    if (cwd.includes(".cursor") || cwd.includes("cursor")) {
      return {
        detected: true,
        ide: AIIDEType.CURSOR,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CURSOR],
        confidence: 80,
        detectionMethod: "working-directory",
      };
    }

    if (cwd.includes(".windsurf") || cwd.includes("windsurf")) {
      return {
        detected: true,
        ide: AIIDEType.WINDSURF,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.WINDSURF],
        confidence: 80,
        detectionMethod: "working-directory",
      };
    }

    return { detected: false } as any;
  }

  /**
   * Detect which AI IDE is currently running this server
   */
  static async detectIDE(): Promise<DetectionResult> {
    console.error("🔍 [Universal Adapter] Starting AI IDE detection...");

    // Detection strategies (in order of priority)
    const detectionStrategies = [
      this.detectFromCommandLineArgs.bind(this),
      this.detectFromEnvironment.bind(this),
      this.detectFromParentProcess.bind(this),
      this.detectFromWorkingDirectory.bind(this),
      this.detectFromStdio.bind(this),
      this.detectFromConfigFiles.bind(this),
      this.detectFromNetworkPorts.bind(this),
    ];

    for (const strategy of detectionStrategies) {
      const result = await strategy();
      if (result.detected) {
        console.error(
          `✅ [Universal Adapter] Detected: ${result.capabilities.name} (${result.confidence}% confidence)`,
        );
        console.error(
          `📡 [Universal Adapter] Using protocol: ${result.protocol}`,
        );
        return result;
      }
    }

    // Fallback to HTTP (universal protocol)
    console.error(
      "⚠️  [Universal Adapter] Could not detect specific IDE, using universal HTTP protocol",
    );
    return {
      detected: true,
      ide: AIIDEType.UNKNOWN,
      protocol: ProtocolType.HTTP,
      capabilities: AI_IDE_REGISTRY[AIIDEType.UNKNOWN],
      confidence: 50,
      detectionMethod: "fallback",
    };
  }

  /**
   * Detect from environment variables
   */
  private static async detectFromEnvironment(): Promise<DetectionResult> {
    const env = process.env;

    // Claude Desktop
    if (env.CLAUDE_DESKTOP || env.ANTHROPIC_API_KEY || env.CLAUDE_APP) {
      return {
        detected: true,
        ide: AIIDEType.CLAUDE_DESKTOP,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CLAUDE_DESKTOP],
        confidence: 90,
        detectionMethod: "environment-variables",
      };
    }

    // Cursor AI
    if (env.CURSOR_IDE || env.CURSOR_SESSION || env.CURSOR_USER_DATA) {
      return {
        detected: true,
        ide: AIIDEType.CURSOR,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CURSOR],
        confidence: 90,
        detectionMethod: "environment-variables",
      };
    }

    // Windsurf
    if (env.WINDSURF_IDE || env.WINDSURF_SESSION || env.WINDSURF_CONFIG) {
      return {
        detected: true,
        ide: AIIDEType.WINDSURF,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.WINDSURF],
        confidence: 90,
        detectionMethod: "environment-variables",
      };
    }

    // Cline
    if (env.CLINE_MODE || env.CLAUDE_DEV || env.CLINE_MCP_SERVER) {
      return {
        detected: true,
        ide: AIIDEType.CLINE,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.CLINE],
        confidence: 90,
        detectionMethod: "environment-variables",
      };
    }

    // Warp Terminal
    if (
      env.WARP ||
      env.TERM_PROGRAM === "WarpTerminal" ||
      env.TERM === "warp"
    ) {
      return {
        detected: true,
        ide: AIIDEType.WARP,
        protocol: ProtocolType.STDIO,
        capabilities: AI_IDE_REGISTRY[AIIDEType.WARP],
        confidence: 85,
        detectionMethod: "environment-variables",
      };
    }

    // Zed Editor
    if (env.ZED_EDITOR || env.ZED || env.ZED_TERM) {
      return {
        detected: true,
        ide: AIIDEType.ZED,
        protocol: ProtocolType.LSP,
        capabilities: AI_IDE_REGISTRY[AIIDEType.ZED],
        confidence: 85,
        detectionMethod: "environment-variables",
      };
    }

    // VSCode (generic)
    if (env.VSCODE_PID || env.VSCODE_IPC_HOOK || env.VSCODE_CWD) {
      return {
        detected: true,
        ide: AIIDEType.VSCODE_GENERIC,
        protocol: ProtocolType.LSP,
        capabilities: AI_IDE_REGISTRY[AIIDEType.VSCODE_GENERIC],
        confidence: 80,
        detectionMethod: "environment-variables",
      };
    }

    return { detected: false } as any;
  }

  /**
   * Detect from parent process
   */
  private static async detectFromParentProcess(): Promise<DetectionResult> {
    try {
      const ppid = process.ppid;
      if (!ppid) return { detected: false } as any;

      // Try to get parent process name and full command line
      let parentName = "";
      let commandLine = "";

      if (os.platform() === "win32") {
        try {
          const { execSync } = await import("child_process");
          const output = execSync(
            `wmic process where processid=${ppid} get name,commandline`,
            { encoding: "utf8" },
          );
          const lines = output.split("\n").filter((line) => line.trim());
          if (lines.length > 1) {
            commandLine = lines[1].trim().toLowerCase();
            parentName = commandLine.split(/\s+/)[0].toLowerCase();
          }
        } catch {
          // Ignore errors
        }
      } else {
        try {
          const { execSync } = await import("child_process");
          commandLine = execSync(`ps -p ${ppid} -o command=`, {
            encoding: "utf8",
          })
            .trim()
            .toLowerCase();
          parentName = execSync(`ps -p ${ppid} -o comm=`, { encoding: "utf8" })
            .trim()
            .toLowerCase();
        } catch {
          // Ignore errors
        }
      }

      // Match command line first (more accurate)
      if (commandLine) {
        if (commandLine.includes("claude") && commandLine.includes("desktop")) {
          return {
            detected: true,
            ide: AIIDEType.CLAUDE_DESKTOP,
            protocol: ProtocolType.STDIO,
            capabilities: AI_IDE_REGISTRY[AIIDEType.CLAUDE_DESKTOP],
            confidence: 90,
            detectionMethod: "parent-process-cmdline",
          };
        }

        if (commandLine.includes("cursor")) {
          return {
            detected: true,
            ide: AIIDEType.CURSOR,
            protocol: ProtocolType.STDIO,
            capabilities: AI_IDE_REGISTRY[AIIDEType.CURSOR],
            confidence: 90,
            detectionMethod: "parent-process-cmdline",
          };
        }

        if (commandLine.includes("windsurf")) {
          return {
            detected: true,
            ide: AIIDEType.WINDSURF,
            protocol: ProtocolType.STDIO,
            capabilities: AI_IDE_REGISTRY[AIIDEType.WINDSURF],
            confidence: 90,
            detectionMethod: "parent-process-cmdline",
          };
        }

        if (
          commandLine.includes("cline") ||
          commandLine.includes("claude-dev")
        ) {
          return {
            detected: true,
            ide: AIIDEType.CLINE,
            protocol: ProtocolType.STDIO,
            capabilities: AI_IDE_REGISTRY[AIIDEType.CLINE],
            confidence: 85,
            detectionMethod: "parent-process-cmdline",
          };
        }
      }

      // Match parent process name to IDE
      if (parentName.includes("claude")) {
        return {
          detected: true,
          ide: AIIDEType.CLAUDE_DESKTOP,
          protocol: ProtocolType.STDIO,
          capabilities: AI_IDE_REGISTRY[AIIDEType.CLAUDE_DESKTOP],
          confidence: 85,
          detectionMethod: "parent-process",
        };
      }

      if (parentName.includes("cursor")) {
        return {
          detected: true,
          ide: AIIDEType.CURSOR,
          protocol: ProtocolType.STDIO,
          capabilities: AI_IDE_REGISTRY[AIIDEType.CURSOR],
          confidence: 85,
          detectionMethod: "parent-process",
        };
      }

      if (parentName.includes("windsurf")) {
        return {
          detected: true,
          ide: AIIDEType.WINDSURF,
          protocol: ProtocolType.STDIO,
          capabilities: AI_IDE_REGISTRY[AIIDEType.WINDSURF],
          confidence: 85,
          detectionMethod: "parent-process",
        };
      }

      if (parentName.includes("zed")) {
        return {
          detected: true,
          ide: AIIDEType.ZED,
          protocol: ProtocolType.LSP,
          capabilities: AI_IDE_REGISTRY[AIIDEType.ZED],
          confidence: 85,
          detectionMethod: "parent-process",
        };
      }

      if (parentName.includes("code") || parentName.includes("vscode")) {
        return {
          detected: true,
          ide: AIIDEType.VSCODE_GENERIC,
          protocol: ProtocolType.LSP,
          capabilities: AI_IDE_REGISTRY[AIIDEType.VSCODE_GENERIC],
          confidence: 80,
          detectionMethod: "parent-process",
        };
      }

      if (parentName.includes("warp")) {
        return {
          detected: true,
          ide: AIIDEType.WARP,
          protocol: ProtocolType.STDIO,
          capabilities: AI_IDE_REGISTRY[AIIDEType.WARP],
          confidence: 85,
          detectionMethod: "parent-process",
        };
      }
    } catch (error) {
      // Ignore errors in process detection
    }

    return { detected: false } as any;
  }

  /**
   * Detect from stdio characteristics
   */
  private static async detectFromStdio(): Promise<DetectionResult> {
    // Check if stdin/stdout are TTY or pipes
    const isStdinPiped = !process.stdin.isTTY;
    const isStdoutPiped = !process.stdout.isTTY;

    // MCP servers typically use piped stdio
    if (isStdinPiped && isStdoutPiped) {
      // This is likely an MCP client, but we can't determine which one
      // Default to generic MCP with STDIO protocol
      return {
        detected: true,
        ide: AIIDEType.UNKNOWN,
        protocol: ProtocolType.STDIO,
        capabilities: {
          ...AI_IDE_REGISTRY[AIIDEType.UNKNOWN],
          supportedProtocols: [ProtocolType.STDIO, ProtocolType.MCP],
          preferredProtocol: ProtocolType.STDIO,
        },
        confidence: 70,
        detectionMethod: "stdio-analysis",
      };
    }

    return { detected: false } as any;
  }

  /**
   * Detect from configuration files
   */
  private static async detectFromConfigFiles(): Promise<DetectionResult> {
    try {
      const fs = await import("fs");
      const { promisify } = await import("util");
      const readFile = promisify(fs.readFile);
      const exists = promisify(fs.exists);

      // Check for Claude Desktop config and verify it contains our server
      const claudeConfigPath =
        AI_IDE_REGISTRY[AIIDEType.CLAUDE_DESKTOP].configPath;
      if (claudeConfigPath) {
        try {
          const configContent = await readFile(claudeConfigPath, "utf8");
          if (
            configContent.includes("brave-real-browser-mcp-server") ||
            configContent.includes("brave-browser")
          ) {
            return {
              detected: true,
              ide: AIIDEType.CLAUDE_DESKTOP,
              protocol: ProtocolType.STDIO,
              capabilities: AI_IDE_REGISTRY[AIIDEType.CLAUDE_DESKTOP],
              confidence: 85,
              detectionMethod: "config-file-content",
            };
          }
        } catch {
          // File might not exist or not readable
        }
      }

      // Check for Cursor config and verify it contains our server
      const cursorConfigPath = AI_IDE_REGISTRY[AIIDEType.CURSOR].configPath;
      if (cursorConfigPath) {
        try {
          const configContent = await readFile(cursorConfigPath, "utf8");
          if (
            configContent.includes("brave-real-browser-mcp-server") ||
            configContent.includes("brave-browser")
          ) {
            return {
              detected: true,
              ide: AIIDEType.CURSOR,
              protocol: ProtocolType.STDIO,
              capabilities: AI_IDE_REGISTRY[AIIDEType.CURSOR],
              confidence: 85,
              detectionMethod: "config-file-content",
            };
          }
        } catch {
          // File might not exist or not readable
        }
      }

      // Check for Windsurf config
      const windsurfConfigPath = AI_IDE_REGISTRY[AIIDEType.WINDSURF].configPath;
      if (windsurfConfigPath) {
        try {
          const configContent = await readFile(windsurfConfigPath, "utf8");
          if (
            configContent.includes("brave-real-browser-mcp-server") ||
            configContent.includes("brave-browser")
          ) {
            return {
              detected: true,
              ide: AIIDEType.WINDSURF,
              protocol: ProtocolType.STDIO,
              capabilities: AI_IDE_REGISTRY[AIIDEType.WINDSURF],
              confidence: 85,
              detectionMethod: "config-file-content",
            };
          }
        } catch {
          // File might not exist or not readable
        }
      }

      // Check for Cline config
      const clineConfigPath = AI_IDE_REGISTRY[AIIDEType.CLINE].configPath;
      if (clineConfigPath) {
        try {
          const configContent = await readFile(clineConfigPath, "utf8");
          if (
            configContent.includes("brave-real-browser-mcp-server") ||
            configContent.includes("brave-browser")
          ) {
            return {
              detected: true,
              ide: AIIDEType.CLINE,
              protocol: ProtocolType.STDIO,
              capabilities: AI_IDE_REGISTRY[AIIDEType.CLINE],
              confidence: 85,
              detectionMethod: "config-file-content",
            };
          }
        } catch {
          // File might not exist or not readable
        }
      }
    } catch (error) {
      // Ignore errors in config file detection
    }

    return { detected: false } as any;
  }

  /**
   * Detect from network ports (if HTTP/WebSocket mode)
   */
  private static async detectFromNetworkPorts(): Promise<DetectionResult> {
    // Check if we're listening on a port (HTTP mode)
    // This would mean we're being used as an HTTP API server
    return { detected: false } as any;
  }

  /**
   * Get recommended protocol for detected IDE
   */
  static getRecommendedProtocol(ideType: AIIDEType): ProtocolType {
    return AI_IDE_REGISTRY[ideType].preferredProtocol;
  }

  /**
   * Check if IDE supports a specific protocol
   */
  static supportsProtocol(ideType: AIIDEType, protocol: ProtocolType): boolean {
    return AI_IDE_REGISTRY[ideType].supportedProtocols.includes(protocol);
  }
}

/**
 * Universal Adapter Configuration
 */
export interface UniversalAdapterConfig {
  enableAutoDetection: boolean;
  fallbackToHttp: boolean;
  httpPort?: number;
  logDetectionDetails: boolean;
}

/**
 * Universal AI IDE Adapter
 * Automatically adapts to any AI IDE
 */
export class UniversalIDEAdapter {
  private config: UniversalAdapterConfig;
  private detectionResult?: DetectionResult;

  constructor(config: Partial<UniversalAdapterConfig> = {}) {
    this.config = {
      enableAutoDetection: config.enableAutoDetection !== false,
      fallbackToHttp: config.fallbackToHttp !== false,
      httpPort: config.httpPort || 3000,
      logDetectionDetails: config.logDetectionDetails !== false,
    };
  }

  /**
   * Initialize and detect IDE
   */
  async initialize(): Promise<DetectionResult> {
    if (!this.config.enableAutoDetection) {
      // Use default fallback
      this.detectionResult = {
        detected: true,
        ide: AIIDEType.UNKNOWN,
        protocol: ProtocolType.HTTP,
        capabilities: AI_IDE_REGISTRY[AIIDEType.UNKNOWN],
        confidence: 50,
        detectionMethod: "disabled",
      };
      return this.detectionResult;
    }

    this.detectionResult = await UniversalIDEDetector.detectIDE();

    if (this.config.logDetectionDetails) {
      this.logDetectionInfo(this.detectionResult);
    }

    return this.detectionResult;
  }

  /**
   * Get detection result
   */
  getDetectionResult(): DetectionResult | undefined {
    return this.detectionResult;
  }

  /**
   * Check if adapter is ready
   */
  isReady(): boolean {
    return !!this.detectionResult;
  }

  /**
   * Log detection information
   */
  private logDetectionInfo(result: DetectionResult): void {
    console.error("");
    console.error(
      "═══════════════════════════════════════════════════════════",
    );
    console.error("🤖 Universal AI IDE Adapter - Detection Results");
    console.error(
      "═══════════════════════════════════════════════════════════",
    );
    console.error(`✓ IDE: ${result.capabilities.name}`);
    console.error(`✓ Type: ${result.ide}`);
    console.error(`✓ Protocol: ${result.protocol.toUpperCase()}`);
    console.error(`✓ Confidence: ${result.confidence}%`);
    console.error(`✓ Method: ${result.detectionMethod}`);
    console.error(
      `✓ Supported Protocols: ${result.capabilities.supportedProtocols.join(", ")}`,
    );
    console.error(
      `✓ Auto-detectable: ${result.capabilities.autoDetectable ? "Yes" : "No"}`,
    );

    if (result.confidence >= 85) {
      console.error(
        "✓ Status: ✅ HIGH CONFIDENCE - Auto-detected successfully",
      );
    } else if (result.confidence >= 70) {
      console.error(
        "✓ Status: ⚠️  MEDIUM CONFIDENCE - Likely detected correctly",
      );
    } else {
      console.error("✓ Status: ℹ️  LOW CONFIDENCE - Using fallback protocol");
    }

    console.error(
      "═══════════════════════════════════════════════════════════",
    );
    console.error("");
  }

  /**
   * Get supported IDEs list
   */
  static getSupportedIDEs(): string[] {
    return Object.values(AI_IDE_REGISTRY)
      .filter((ide) => ide.type !== AIIDEType.UNKNOWN)
      .map((ide) => ide.name);
  }

  /**
   * Print supported IDEs
   */
  static printSupportedIDEs(): void {
    console.error("");
    console.error(
      "═══════════════════════════════════════════════════════════",
    );
    console.error("🌐 Supported AI IDEs (Universal Compatibility)");
    console.error(
      "═══════════════════════════════════════════════════════════",
    );

    Object.values(AI_IDE_REGISTRY)
      .filter((ide) => ide.type !== AIIDEType.UNKNOWN)
      .forEach((ide) => {
        console.error(
          `✓ ${ide.name.padEnd(30)} [${ide.supportedProtocols.join(", ")}]`,
        );
      });

    console.error(
      "═══════════════════════════════════════════════════════════",
    );
    console.error("💡 All IDEs supported with automatic protocol detection!");
    console.error(
      "═══════════════════════════════════════════════════════════",
    );
    console.error("");
  }
}

// Export for use in other modules
export default UniversalIDEAdapter;
