/**
 * Session Manager for Auto-sync and Session Persistence
 * Manages browser sessions, state synchronization, and reconnection handling
 */

import { randomUUID } from 'crypto';

// Session states
export type SessionState = 'active' | 'paused' | 'disconnected' | 'expired';

// Session data structure
export interface SessionData {
  sessionId: string;
  clientId: string;
  createdAt: number;
  lastActivityAt: number;
  state: SessionState;
  browserState: BrowserSessionState | null;
  metadata: Record<string, unknown>;
}

// Browser state for persistence
export interface BrowserSessionState {
  isInitialized: boolean;
  currentUrl: string | null;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
  }>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  viewportSize: { width: number; height: number } | null;
  userAgent: string | null;
}

// Session event types
export type SessionEventType = 
  | 'session:created'
  | 'session:updated'
  | 'session:expired'
  | 'session:reconnected'
  | 'session:destroyed'
  | 'state:synced'
  | 'browser:stateChanged';

export interface SessionEvent {
  type: SessionEventType;
  sessionId: string;
  timestamp: number;
  data?: unknown;
}

// Session event listener
export type SessionEventListener = (event: SessionEvent) => void;

/**
 * SessionManager - Handles session lifecycle and auto-sync
 */
export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private sessionsByClient: Map<string, Set<string>> = new Map();
  private eventListeners: Set<SessionEventListener> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private readonly sessionTimeout: number;
  private readonly maxSessionsPerClient: number;
  private readonly cleanupIntervalMs: number;
  private readonly autoSyncEnabled: boolean;

  constructor(options: {
    sessionTimeout?: number;
    maxSessionsPerClient?: number;
    cleanupIntervalMs?: number;
    autoSyncEnabled?: boolean;
  } = {}) {
    this.sessionTimeout = options.sessionTimeout || 30 * 60 * 1000; // 30 minutes
    this.maxSessionsPerClient = options.maxSessionsPerClient || 5;
    this.cleanupIntervalMs = options.cleanupIntervalMs || 60 * 1000; // 1 minute
    this.autoSyncEnabled = options.autoSyncEnabled ?? true;

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Create a new session
   */
  createSession(clientId: string, metadata: Record<string, unknown> = {}): SessionData {
    // Cleanup old sessions for this client if limit exceeded
    this.enforceSessionLimit(clientId);

    const sessionId = randomUUID();
    const now = Date.now();

    const session: SessionData = {
      sessionId,
      clientId,
      createdAt: now,
      lastActivityAt: now,
      state: 'active',
      browserState: null,
      metadata,
    };

    this.sessions.set(sessionId, session);

    // Track session by client
    if (!this.sessionsByClient.has(clientId)) {
      this.sessionsByClient.set(clientId, new Set());
    }
    this.sessionsByClient.get(clientId)!.add(sessionId);

    this.emit({
      type: 'session:created',
      sessionId,
      timestamp: now,
      data: { clientId, metadata },
    });

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions for a client
   */
  getClientSessions(clientId: string): SessionData[] {
    const sessionIds = this.sessionsByClient.get(clientId);
    if (!sessionIds) return [];
    
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter((s): s is SessionData => s !== undefined);
  }

  /**
   * Update session activity timestamp
   */
  touch(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.lastActivityAt = Date.now();
    session.state = 'active';
    return true;
  }

  /**
   * Update browser state for session
   */
  updateBrowserState(sessionId: string, state: Partial<BrowserSessionState>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.browserState = {
      ...session.browserState,
      ...state,
    } as BrowserSessionState;
    
    session.lastActivityAt = Date.now();

    if (this.autoSyncEnabled) {
      this.emit({
        type: 'browser:stateChanged',
        sessionId,
        timestamp: Date.now(),
        data: state,
      });
    }

    return true;
  }

  /**
   * Sync full browser state
   */
  syncState(sessionId: string, fullState: BrowserSessionState): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.browserState = fullState;
    session.lastActivityAt = Date.now();

    this.emit({
      type: 'state:synced',
      sessionId,
      timestamp: Date.now(),
      data: fullState,
    });

    return true;
  }

  /**
   * Handle client reconnection
   */
  reconnect(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if session is still valid
    if (this.isSessionExpired(session)) {
      this.destroySession(sessionId);
      return null;
    }

    session.state = 'active';
    session.lastActivityAt = Date.now();

    this.emit({
      type: 'session:reconnected',
      sessionId,
      timestamp: Date.now(),
      data: { browserState: session.browserState },
    });

    return session;
  }

  /**
   * Pause session (client disconnected but may reconnect)
   */
  pauseSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.state = 'paused';
    return true;
  }

  /**
   * Mark session as disconnected
   */
  disconnectSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.state = 'disconnected';
    return true;
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Remove from client tracking
    const clientSessions = this.sessionsByClient.get(session.clientId);
    if (clientSessions) {
      clientSessions.delete(sessionId);
      if (clientSessions.size === 0) {
        this.sessionsByClient.delete(session.clientId);
      }
    }

    this.sessions.delete(sessionId);

    this.emit({
      type: 'session:destroyed',
      sessionId,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Export session state for persistence
   */
  exportSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return JSON.stringify({
      ...session,
      exportedAt: Date.now(),
    });
  }

  /**
   * Import session from exported state
   */
  importSession(exportedState: string): SessionData | null {
    try {
      const parsed = JSON.parse(exportedState);
      
      // Validate required fields
      if (!parsed.sessionId || !parsed.clientId) {
        return null;
      }

      // Check if session already exists
      if (this.sessions.has(parsed.sessionId)) {
        return this.sessions.get(parsed.sessionId)!;
      }

      const session: SessionData = {
        sessionId: parsed.sessionId,
        clientId: parsed.clientId,
        createdAt: parsed.createdAt || Date.now(),
        lastActivityAt: Date.now(),
        state: 'active',
        browserState: parsed.browserState || null,
        metadata: parsed.metadata || {},
      };

      this.sessions.set(session.sessionId, session);

      if (!this.sessionsByClient.has(session.clientId)) {
        this.sessionsByClient.set(session.clientId, new Set());
      }
      this.sessionsByClient.get(session.clientId)!.add(session.sessionId);

      return session;
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to session events
   */
  subscribe(listener: SessionEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Get all active sessions
   */
  getAllActiveSessions(): SessionData[] {
    return Array.from(this.sessions.values())
      .filter(s => s.state === 'active');
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    pausedSessions: number;
    disconnectedSessions: number;
    clientCount: number;
  } {
    const sessions = Array.from(this.sessions.values());
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.state === 'active').length,
      pausedSessions: sessions.filter(s => s.state === 'paused').length,
      disconnectedSessions: sessions.filter(s => s.state === 'disconnected').length,
      clientCount: this.sessionsByClient.size,
    };
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
    this.sessionsByClient.clear();
    this.eventListeners.clear();
  }

  // Private methods

  private emit(event: SessionEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Session event listener error:', error);
      }
    }
  }

  private isSessionExpired(session: SessionData): boolean {
    return Date.now() - session.lastActivityAt > this.sessionTimeout;
  }

  private enforceSessionLimit(clientId: string): void {
    const sessions = this.getClientSessions(clientId);
    if (sessions.length >= this.maxSessionsPerClient) {
      // Remove oldest sessions
      const sorted = sessions.sort((a, b) => a.lastActivityAt - b.lastActivityAt);
      const toRemove = sorted.slice(0, sessions.length - this.maxSessionsPerClient + 1);
      
      for (const session of toRemove) {
        this.destroySession(session.sessionId);
      }
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupIntervalMs);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions) {
      if (this.isSessionExpired(session)) {
        session.state = 'expired';
        
        this.emit({
          type: 'session:expired',
          sessionId,
          timestamp: now,
        });

        this.destroySession(sessionId);
      }
    }
  }
}

// Singleton instance
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(options?: ConstructorParameters<typeof SessionManager>[0]): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(options);
  }
  return sessionManagerInstance;
}

export function resetSessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.shutdown();
    sessionManagerInstance = null;
  }
}
