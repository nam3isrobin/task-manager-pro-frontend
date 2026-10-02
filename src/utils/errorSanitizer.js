/**
 * Error Sanitization Utility
 * Prevents information disclosure and stack trace leakage to the DOM (OWASP A05:2021)
 * while ensuring React children rendering safety.
 */

const MAX_ERROR_LENGTH = 200;

const SENSITIVE_PATTERNS = [
  /at\s+[\w$./\\-]+\s+\([\w$./\\:-]+\)/gi, // Stack trace frames: at foo (/path/to/file.js:12:34)
  /(?:file|https?):\/\/[^\s]+/gi,          // File or internal URLs
  /\/[a-z0-9_.-]+(?:\/[a-z0-9_.-]+)+/gi,   // Unix file paths
  /[a-z]:\\[a-z0-9_.-]+(?:\\[a-z0-9_.-]+)+/gi, // Windows file paths
  /MongoError|MongooseError|CastError|E11000/gi, // Database internals
  /SQLSTATE|syntax error at|SELECT|INSERT|UPDATE|DELETE/gi, // SQL syntax
  /TypeError:|ReferenceError:|SyntaxError:/gi, // Raw JS error names
];

/**
 * Sanitize an error into a user-friendly, safe string suitable for DOM rendering.
 * @param {any} error - The caught error (string, Error instance, Axios response error, or unknown object)
 * @param {string} [fallback='An unexpected error occurred. Please try again.'] - Safe default message
 * @returns {string} Sanitized error message string
 */
export function sanitizeErrorMessage(error, fallback = 'An unexpected error occurred. Please try again.') {
  if (!error) return fallback;

  let rawMessage = '';

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (typeof error === 'object') {
    // Check Axios response body fields
    const apiError =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.msg ||
      error.message;

    if (typeof apiError === 'string') {
      rawMessage = apiError;
    } else if (typeof apiError === 'object' && apiError !== null) {
      rawMessage = apiError.message || apiError.error || fallback;
    } else if (typeof error.message === 'string') {
      rawMessage = error.message;
    } else {
      return fallback;
    }
  } else {
    return fallback;
  }

  // Strip known sensitive or technical patterns
  let cleaned = rawMessage;
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
  }

  // If cleaning stripped everything or left broken punctuation, fallback
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  if (!cleaned || cleaned.length < 3) {
    return fallback;
  }

  // Enforce maximum length
  if (cleaned.length > MAX_ERROR_LENGTH) {
    cleaned = `${cleaned.substring(0, MAX_ERROR_LENGTH).trim()}...`;
  }

  return cleaned;
}
