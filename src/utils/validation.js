/**
 * Security & Input Validation Constants & Helper Utilities
 * Enforces strict input bounding (OWASP A03:2021 & A04:2021)
 */

export const MAX_NAME_LENGTH = 70;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_TASK_TITLE_LENGTH = 150;
export const MAX_TASK_DESC_LENGTH = 2000;
export const MAX_TAGS_COUNT = 10;
export const MAX_TAG_LENGTH = 30;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/json',
];

// RFC 5322 simplified email regex with length and symbol safety
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validate email address format and length constraints
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validate that a URL is safe against XSS schemes (e.g. javascript:, vbscript:, data:)
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Allow relative URLs starting with / or ./ or #
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('#')) {
    return true;
  }

  // Check for safe absolute schemes (http://, https://, blob:)
  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
    const parsed = new URL(trimmed, base);
    const protocol = parsed.protocol.toLowerCase();
    return protocol === 'http:' || protocol === 'https:' || protocol === 'blob:';
  } catch {
    return false;
  }
}

/**
 * Validate if an uploaded file matches allowed MIME types
 * @param {File|object} file
 * @returns {boolean}
 */
export function isAllowedFileType(file) {
  if (!file) return false;
  if (!file.type) {
    // Check file extension if type is missing
    const name = file.name || '';
    const ext = name.split('.').pop()?.toLowerCase();
    const safeExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'json'];
    return safeExtensions.includes(ext);
  }
  return ALLOWED_FILE_TYPES.includes(file.type.toLowerCase());
}

/**
 * Validate if file size is within maximum allowed bytes
 * @param {File|object} file
 * @param {number} [maxBytes=MAX_FILE_SIZE_BYTES]
 * @returns {boolean}
 */
export function isAllowedFileSize(file, maxBytes = MAX_FILE_SIZE_BYTES) {
  if (!file || typeof file.size !== 'number') return false;
  return file.size <= maxBytes;
}

/**
 * Sanitize and enforce maximum length on string input
 * @param {string} str
 * @param {number} [maxLength=2000]
 * @returns {string}
 */
export function sanitizeString(str, maxLength = 2000) {
  if (typeof str !== 'string') return '';
  const trimmed = str.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
}
