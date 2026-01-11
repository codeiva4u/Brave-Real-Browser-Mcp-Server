/**
 * 🎭 Session Persistence Manager
 * Features: Cookie save/restore, localStorage persistence, session file management
 */

import fs from 'fs';
import path from 'path';

const SESSION_DIR = './sessions';

/**
 * Ensure sessions directory exists
 */
function ensureSessionDir() {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
}

/**
 * Get session file path
 * @param {string} sessionId
 * @returns {string}
 */
function getSessionPath(sessionId) {
    ensureSessionDir();
    return path.join(SESSION_DIR, `${sessionId}.json`);
}

/**
 * Save cookies from page
 * @param {Page} page - Puppeteer/Playwright page
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function saveCookies(page, sessionId) {
    const cookies = await page.cookies();
    const sessionPath = getSessionPath(sessionId);

    const sessionData = loadSessionFile(sessionId) || {};
    sessionData.cookies = cookies;
    sessionData.lastSaved = new Date().toISOString();

    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    console.log(`[session-manager] Saved ${cookies.length} cookies to ${sessionId}`);

    return { sessionId, cookieCount: cookies.length };
}

/**
 * Load cookies to page
 * @param {Page} page
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function loadCookies(page, sessionId) {
    const sessionData = loadSessionFile(sessionId);

    if (!sessionData?.cookies?.length) {
        console.log(`[session-manager] No cookies found for ${sessionId}`);
        return false;
    }

    await page.setCookie(...sessionData.cookies);
    console.log(`[session-manager] Loaded ${sessionData.cookies.length} cookies from ${sessionId}`);

    return true;
}

/**
 * Save localStorage from page
 * @param {Page} page
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function saveLocalStorage(page, sessionId) {
    const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            items[key] = window.localStorage.getItem(key);
        }
        return items;
    });

    const sessionPath = getSessionPath(sessionId);
    const sessionData = loadSessionFile(sessionId) || {};
    sessionData.localStorage = localStorage;
    sessionData.lastSaved = new Date().toISOString();

    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    console.log(`[session-manager] Saved localStorage (${Object.keys(localStorage).length} items) to ${sessionId}`);

    return { sessionId, itemCount: Object.keys(localStorage).length };
}

/**
 * Load localStorage to page
 * @param {Page} page
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function loadLocalStorage(page, sessionId) {
    const sessionData = loadSessionFile(sessionId);

    if (!sessionData?.localStorage) {
        console.log(`[session-manager] No localStorage found for ${sessionId}`);
        return false;
    }

    await page.evaluate((items) => {
        for (const [key, value] of Object.entries(items)) {
            window.localStorage.setItem(key, value);
        }
    }, sessionData.localStorage);

    console.log(`[session-manager] Loaded localStorage (${Object.keys(sessionData.localStorage).length} items) from ${sessionId}`);
    return true;
}

/**
 * Save sessionStorage from page
 * @param {Page} page
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function saveSessionStorage(page, sessionId) {
    const sessionStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            items[key] = window.sessionStorage.getItem(key);
        }
        return items;
    });

    const sessionPath = getSessionPath(sessionId);
    const sessionData = loadSessionFile(sessionId) || {};
    sessionData.sessionStorage = sessionStorage;
    sessionData.lastSaved = new Date().toISOString();

    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    console.log(`[session-manager] Saved sessionStorage (${Object.keys(sessionStorage).length} items) to ${sessionId}`);

    return { sessionId, itemCount: Object.keys(sessionStorage).length };
}

/**
 * Load sessionStorage to page
 * @param {Page} page
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function loadSessionStorage(page, sessionId) {
    const sessionData = loadSessionFile(sessionId);

    if (!sessionData?.sessionStorage) {
        console.log(`[session-manager] No sessionStorage found for ${sessionId}`);
        return false;
    }

    await page.evaluate((items) => {
        for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value);
        }
    }, sessionData.sessionStorage);

    console.log(`[session-manager] Loaded sessionStorage from ${sessionId}`);
    return true;
}

/**
 * Save complete session (cookies + localStorage + sessionStorage)
 * @param {Page} page
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function saveSession(page, sessionId) {
    const cookies = await saveCookies(page, sessionId);
    const localStorage = await saveLocalStorage(page, sessionId);
    const sessionStorage = await saveSessionStorage(page, sessionId);

    // Save URL and metadata
    const sessionData = loadSessionFile(sessionId);
    sessionData.url = page.url();
    sessionData.title = await page.title();
    sessionData.lastSaved = new Date().toISOString();

    fs.writeFileSync(getSessionPath(sessionId), JSON.stringify(sessionData, null, 2));

    console.log(`[session-manager] ✅ Complete session saved: ${sessionId}`);

    return {
        sessionId,
        cookies: cookies.cookieCount,
        localStorage: localStorage.itemCount,
        sessionStorage: sessionStorage.itemCount,
        url: sessionData.url
    };
}

/**
 * Load complete session
 * @param {Page} page
 * @param {string} sessionId
 * @param {boolean} [navigateToUrl] - Navigate to saved URL
 * @returns {Promise<Object>}
 */
export async function loadSession(page, sessionId, navigateToUrl = false) {
    const sessionData = loadSessionFile(sessionId);

    if (!sessionData) {
        console.log(`[session-manager] Session not found: ${sessionId}`);
        return { success: false, error: 'Session not found' };
    }

    // Load cookies first
    await loadCookies(page, sessionId);

    // Navigate to URL if requested
    if (navigateToUrl && sessionData.url) {
        await page.goto(sessionData.url, { waitUntil: 'networkidle0' });
    }

    // Load storage after navigation
    await loadLocalStorage(page, sessionId);
    await loadSessionStorage(page, sessionId);

    console.log(`[session-manager] ✅ Session loaded: ${sessionId}`);

    return {
        success: true,
        sessionId,
        url: sessionData.url,
        lastSaved: sessionData.lastSaved
    };
}

/**
 * Load session file from disk
 * @param {string} sessionId
 * @returns {Object|null}
 */
function loadSessionFile(sessionId) {
    const sessionPath = getSessionPath(sessionId);

    if (!fs.existsSync(sessionPath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    } catch (err) {
        console.log(`[session-manager] Error reading session: ${err.message}`);
        return null;
    }
}

/**
 * List all saved sessions
 * @returns {Array<Object>}
 */
export function listSessions() {
    ensureSessionDir();

    const files = fs.readdirSync(SESSION_DIR).filter(f => f.endsWith('.json'));

    return files.map(file => {
        const sessionId = path.basename(file, '.json');
        const sessionData = loadSessionFile(sessionId);
        return {
            sessionId,
            url: sessionData?.url,
            lastSaved: sessionData?.lastSaved,
            cookieCount: sessionData?.cookies?.length || 0
        };
    });
}

/**
 * Delete a session
 * @param {string} sessionId
 * @returns {boolean}
 */
export function deleteSession(sessionId) {
    const sessionPath = getSessionPath(sessionId);

    if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        console.log(`[session-manager] Deleted session: ${sessionId}`);
        return true;
    }

    return false;
}

/**
 * Clear all sessions
 * @returns {number} Number of sessions deleted
 */
export function clearAllSessions() {
    ensureSessionDir();

    const files = fs.readdirSync(SESSION_DIR).filter(f => f.endsWith('.json'));
    files.forEach(file => fs.unlinkSync(path.join(SESSION_DIR, file)));

    console.log(`[session-manager] Cleared ${files.length} sessions`);
    return files.length;
}

/**
 * Check if session exists
 * @param {string} sessionId
 * @returns {boolean}
 */
export function sessionExists(sessionId) {
    return fs.existsSync(getSessionPath(sessionId));
}

/**
 * Get session info without loading
 * @param {string} sessionId
 * @returns {Object|null}
 */
export function getSessionInfo(sessionId) {
    const sessionData = loadSessionFile(sessionId);

    if (!sessionData) return null;

    return {
        sessionId,
        url: sessionData.url,
        title: sessionData.title,
        lastSaved: sessionData.lastSaved,
        cookieCount: sessionData.cookies?.length || 0,
        localStorageCount: sessionData.localStorage ? Object.keys(sessionData.localStorage).length : 0
    };
}

// Default export
export default {
    saveCookies,
    loadCookies,
    saveLocalStorage,
    loadLocalStorage,
    saveSessionStorage,
    loadSessionStorage,
    saveSession,
    loadSession,
    listSessions,
    deleteSession,
    clearAllSessions,
    sessionExists,
    getSessionInfo
};
