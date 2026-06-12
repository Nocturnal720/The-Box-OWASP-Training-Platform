// In-memory disabled set + SSE client registry for real-time popup delivery.
// Resets on server restart — keeps the lab reusable.

const { AsyncLocalStorage } = require("async_hooks");

const disabled = new Set();
const clients  = new Set(); // SSE response objects
const recentVulns = []; // Fallback: recent vulns for polling
const requestContext = new AsyncLocalStorage();

const runWithRequestContext = (context, fn) => requestContext.run(context || {}, fn);

const getScopeFromSource = (scopeSource) => {
  if (!scopeSource) return null;

  if (typeof scopeSource === "string" || typeof scopeSource === "number") {
    const value = String(scopeSource).trim();
    return value || null;
  }

  if (typeof scopeSource !== "object") return null;

  if (scopeSource.scope) {
    const scoped = String(scopeSource.scope).trim();
    if (scoped) return scoped;
  }

  const headers = scopeSource.headers || {};
  const labTokenHeader =
    headers["x-lab-token"] ||
    headers["X-Lab-Token"] ||
    null;

  if (labTokenHeader) {
    const labToken = String(labTokenHeader).trim();
    if (labToken) return labToken;
  }

  const authHeader =
    headers.authorization ||
    headers.Authorization ||
    null;

  if (authHeader) {
    const auth = String(authHeader).trim();
    if (auth) return auth;
  }

  const userIdHeader =
    headers["x-user-id"] ||
    headers["X-User-Id"] ||
    scopeSource.userId ||
    null;

  if (userIdHeader !== null && userIdHeader !== undefined) {
    const userId = String(userIdHeader).trim();
    if (userId) return userId;
  }

  return null;
};

const getScopedType = (type, scopeSource) => {
  if (!type || typeof type !== "string") return type;
  if (type.includes(":")) return type;

  const providedScope = getScopeFromSource(scopeSource);
  if (providedScope) return `${type}:${providedScope}`;

  const store = requestContext.getStore();
  const scope = store && store.scope ? store.scope : null;
  return scope ? `${type}:${scope}` : type;
};

const isDisabled = (type, scopeSource) => disabled.has(getScopedType(type, scopeSource));

// Immediately disable a vulnerability to prevent race conditions
// Call this FIRST when exploitation is detected, before any async operations
const disableImmediate = (type, scopeSource) => {
  const scopedType = getScopedType(type, scopeSource);
  if (!disabled.has(scopedType)) {
    disabled.add(scopedType);
    console.log(`🔒 [DISABLE-IMMEDIATE] ${scopedType} - locked to prevent duplicates`);
  }
};

const disable = (type, info, scopeSource) => {
  const scopedType = getScopedType(type, scopeSource);

  if (disabled.has(scopedType)) {
    console.log(`⚠️  [DISABLE] ${scopedType} already disabled - skipping broadcast`);
    return;
  }
  disabled.add(scopedType);
  
  // Add to recent vulns (fallback mechanism)
  recentVulns.push({ type: scopedType, info, timestamp: Date.now() });
  if (recentVulns.length > 50) recentVulns.shift(); // Keep last 50
  
  // Push to every connected SSE client (React app, regardless of how exploit was triggered)
  const payload = `data: ${JSON.stringify(info)}\n\n`;
  console.log(`📡 [DISABLE] Broadcasting ${scopedType} to ${clients.size} connected clients`);
  if (clients.size === 0) {
    console.warn(`⚠️  [DISABLE] No SSE clients connected! Using fallback polling.`);
  }
  for (const res of clients) {
    try { 
      res.write(payload);
      console.log(`✅ [DISABLE] Sent to client`);
    } catch (e) { 
      console.error(`❌ [DISABLE] Failed to send to client:`, e.message);
      clients.delete(res);
    }
  }
};

const addClient    = (res) => {
  clients.add(res);
  console.log(`✅ [SSE-CLIENTS] Added client - Total: ${clients.size}`);
};
const removeClient = (res) => {
  clients.delete(res);
  console.log(`❌ [SSE-CLIENTS] Removed client - Total: ${clients.size}`);
};
const getClients   = () => clients;
const getRecentVulns = (since) => {
  // Return vulns triggered since the given timestamp (for polling)
  return recentVulns.filter(v => v.timestamp > since);
};
const clearRecentVulns = () => recentVulns.length = 0;

const clearDisabledForScope = (scopeSource) => {
  const scope = getScopeFromSource(scopeSource);
  if (!scope) return 0;

  let removed = 0;
  for (const key of [...disabled]) {
    if (key.endsWith(`:${scope}`)) {
      disabled.delete(key);
      removed += 1;
    }
  }

  if (removed > 0) {
    console.log(`♻️  [DISABLE-CLEAR] Removed ${removed} disabled vulns for scope ${scope}`);
  }

  return removed;
};

module.exports = { isDisabled, disable, disableImmediate, addClient, removeClient, getClients, getRecentVulns, clearRecentVulns, clearDisabledForScope, runWithRequestContext };
