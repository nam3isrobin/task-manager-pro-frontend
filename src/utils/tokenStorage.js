/**
 * Secure In-Memory Access Token Storage
 * Mitigates OWASP XSS token exfiltration by maintaining JWT tokens in memory scope
 * rather than persistent unencrypted Web Storage (localStorage).
 */

let _accessToken = null;
const listeners = new Set();

/**
 * Retrieve the current in-memory access token
 * @returns {string|null}
 */
export function getAccessToken() {
  return _accessToken;
}

/**
 * Set the in-memory access token
 * @param {string|null} token
 */
export function setAccessToken(token) {
  _accessToken = token || null;
  listeners.forEach((listener) => {
    try {
      listener(_accessToken);
    } catch {
      // ignore subscriber error
    }
  });
}

/**
 * Clear the in-memory access token
 */
export function clearAccessToken() {
  setAccessToken(null);
}

/**
 * Check if an active access token is present in memory
 * @returns {boolean}
 */
export function hasAccessToken() {
  return Boolean(_accessToken);
}

/**
 * Subscribe to token state mutations
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export function subscribeToToken(callback) {
  if (typeof callback === 'function') {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }
  return () => {};
}
