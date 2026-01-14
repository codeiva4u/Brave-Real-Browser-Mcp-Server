/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

export {
  launch,
  killAll,
  getBravePath,
  getInstallations,
  findBrave,
  Launcher as BraveLauncher,
  Options,
  LaunchedBrave,
  RemoteDebuggingPipes
} from './brave-launcher.js';

export {
  XvfbManager,
  XvfbOptions,
  detectDesktopEnvironment,
  getPlatform
} from './utils.js';

export { DEFAULT_FLAGS } from './flags.js';
export { getRandomPort } from './random-port.js';

// Extension Manager for loading extensions like uBlock Origin


// Brave Installer for auto-installing Brave browser
export { BraveInstaller, InstallerOptions, InstallResult } from './brave-installer.js';

// Stealth utilities for anti-bot-detection
export {
  STEALTH_FLAGS,
  STEALTH_SCRIPTS,
  USER_AGENTS,
  getStealthFlags,
  getStealthScript,
  getDynamicStealthFlags,
  getDynamicUserAgents,
  getLatestChromeVersion,
  generateUserAgent,
  generateUserAgentMac,
  generateUserAgentLinux,
  getUserAgentForPlatform,
  FALLBACK_VERSION
} from './stealth-utils.js';

// Chrome version utilities
export * as chromeVersion from './chrome-version.js';

// Also export everything from brave-finder for advanced usage
export * as braveFinder from './brave-finder.js';