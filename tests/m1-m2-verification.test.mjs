import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken, setAccessToken, clearAccessToken, hasAccessToken, subscribeToToken } from '../src/utils/tokenStorage.js';
import { sanitizeErrorMessage } from '../src/utils/errorSanitizer.js';
import {
  MAX_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_TASK_TITLE_LENGTH,
  MAX_TASK_DESC_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
  isValidEmail,
  isSafeUrl,
  isAllowedFileType,
  isAllowedFileSize,
  sanitizeString,
} from '../src/utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- Starting Milestone 1 & 2 Verification Suite (Production Clean) ---');

// 1. Verify Elimination of Mock Subsystem
console.log('1. Verifying Zero Mock Subsystems in Production Files...');
assert(!fs.existsSync(path.join(rootDir, 'src/mock')), 'src/mock directory MUST be completely eliminated');

const apiCode = fs.readFileSync(path.join(rootDir, 'src/services/api.js'), 'utf-8');
assert(!apiCode.includes('mockService'), 'api.js must NOT import mockService');
assert(!apiCode.includes('isMockEnabled'), 'api.js must NOT contain isMockEnabled check');
assert(!apiCode.includes('config.adapter'), 'api.js must NOT hijack config.adapter with mock responses');
assert(
  apiCode.includes('VITE_API_URL') &&
    (apiCode.includes('http://localhost:5000/api') || apiCode.includes('task-manager-pro-backend')),
  'api.js must point to real backend baseURL'
);
assert(apiCode.includes('Authorization = `Bearer ${token}`'), 'api.js must inject Bearer token into Authorization header');
console.log('  ✓ api.js clean production Axios instance verified');

const authCode = fs.readFileSync(path.join(rootDir, 'src/context/AuthContext.jsx'), 'utf-8');
assert(!authCode.includes('mockService'), 'AuthContext must NOT import mockService');
assert(!authCode.includes('isDemo'), 'AuthContext must NOT export isDemo');
assert(!authCode.includes('enableDemoMode'), 'AuthContext must NOT export enableDemoMode');
console.log('  ✓ AuthContext clean production auth verified');

// 2. Verify In-Memory Token Storage (OWASP A07 & XSS Defense)
console.log('2. Verifying In-Memory Token Storage...');
clearAccessToken();
assert.strictEqual(getAccessToken(), null, 'Token should initially be null');
assert.strictEqual(hasAccessToken(), false, 'hasAccessToken should be false');

setAccessToken('secure-in-memory-token-xyz');
assert.strictEqual(getAccessToken(), 'secure-in-memory-token-xyz', 'Token getter mismatch');
assert.strictEqual(hasAccessToken(), true, 'hasAccessToken should be true');

// Reactive subscription testing
let notifiedToken = null;
const unsubscribe = subscribeToToken((token) => {
  notifiedToken = token;
});
setAccessToken('updated-token-123');
assert.strictEqual(notifiedToken, 'updated-token-123', 'Subscriber should receive updated token');
unsubscribe();

clearAccessToken();
assert.strictEqual(getAccessToken(), null, 'Token should be null after clear');
assert.strictEqual(hasAccessToken(), false, 'hasAccessToken should be false after clear');
console.log('  ✓ In-memory token storage operations and subscriptions verified');

// 3. Verify Error Sanitizer (OWASP A05 Information Leakage Defense)
console.log('3. Verifying Error Sanitizer...');
const rawStackError = new Error('Database error at User.find (/var/www/server/models/User.js:45:12)');
const sanitized = sanitizeErrorMessage(rawStackError);
assert(!sanitized.includes('/var/www/'), 'Sanitizer failed to strip file paths');
assert(!sanitized.includes('User.js'), 'Sanitizer failed to strip code filename');

const axiosError = {
  response: {
    data: {
      error: 'Invalid credentials provided',
    },
  },
};
assert.strictEqual(sanitizeErrorMessage(axiosError), 'Invalid credentials provided');

const objectCrashError = { details: { code: 500 } };
const safeOutput = sanitizeErrorMessage(objectCrashError);
assert.strictEqual(typeof safeOutput, 'string', 'Sanitizer must always return string');

const mongoErr = 'MongoError: E11000 duplicate key error on index: email';
const sanitizedMongo = sanitizeErrorMessage(mongoErr);
assert(!sanitizedMongo.includes('E11000'), 'Sanitizer must strip Mongo error codes');
assert(!sanitizedMongo.includes('MongoError'), 'Sanitizer must strip MongoError');

console.log('  ✓ Error sanitizer verified against stack leakage, DB errors, and object crashes');

// 4. Verify Validation Constraints & Helpers
console.log('4. Verifying Validation Constraints & Helpers...');
assert.strictEqual(MAX_NAME_LENGTH, 70);
assert.strictEqual(MAX_EMAIL_LENGTH, 254);
assert.strictEqual(MAX_PASSWORD_LENGTH, 128);
assert.strictEqual(MIN_PASSWORD_LENGTH, 8);
assert.strictEqual(MAX_TASK_TITLE_LENGTH, 150);
assert.strictEqual(MAX_TASK_DESC_LENGTH, 2000);
assert.strictEqual(MAX_TAGS_COUNT, 10);
assert.strictEqual(MAX_TAG_LENGTH, 30);
assert.strictEqual(MAX_FILE_SIZE_BYTES, 10485760);

assert.strictEqual(isValidEmail('valid.user@company.com'), true);
assert.strictEqual(isValidEmail('invalid-email'), false);
assert.strictEqual(isValidEmail(''), false);
assert.strictEqual(isValidEmail('@nodomain.com'), false);

assert.strictEqual(isSafeUrl('https://example.com/file.pdf'), true);
assert.strictEqual(isSafeUrl('/attachments/file.pdf'), true);
assert.strictEqual(isSafeUrl('javascript:alert(1)'), false);
assert.strictEqual(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);

assert.strictEqual(isAllowedFileType({ type: 'application/pdf' }), true);
assert.strictEqual(isAllowedFileType({ type: 'image/png' }), true);
assert.strictEqual(isAllowedFileType({ type: 'application/x-msdownload' }), false);

assert.strictEqual(isAllowedFileSize({ size: 5 * 1024 * 1024 }), true);
assert.strictEqual(isAllowedFileSize({ size: 15 * 1024 * 1024 }), false);

assert.strictEqual(sanitizeString('   Clean Text   ', 50), 'Clean Text');
assert.strictEqual(sanitizeString('1234567890', 5), '12345');

console.log('  ✓ Validation constants, regex, XSS URL checks, and file constraints verified');

console.log('\n--- ALL VERIFICATIONS PASSED CLEANLY (100%) ---');
